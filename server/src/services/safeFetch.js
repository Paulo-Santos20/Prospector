import dns from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import axios from 'axios';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata',
  'metadata.google.internal',
  'instance-data',
]);

const ALLOWED_PORTS = new Set(['', '80', '443']);
const MAX_REDIRECTS = 3;
const DNS_TIMEOUT_MS = 5_000;

const lookupAll = (hostname, options = {}) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Tempo esgotado ao resolver DNS')),
      DNS_TIMEOUT_MS
    );

    dns.lookup(hostname, { ...options, all: true, verbatim: true }, (error, addresses) => {
      clearTimeout(timer);
      if (error) {
        reject(error);
        return;
      }

      resolve(Array.isArray(addresses) ? addresses : [addresses]);
    });
  });

const blocked = (message) => {
  const error = new Error(message);
  error.status = 400;
  return error;
};

export const isPrivateIp = (value) => {
  if (!net.isIP(value)) return false;

  let ip = String(value).trim().toLowerCase();

  if (ip.includes(':')) {
    if (ip === '::' || ip === '::1') return true;

    if (ip.startsWith('::ffff:')) {
      const mapped = ip.slice(7);
      if (net.isIPv4(mapped)) return isPrivateIp(mapped);

      const hex = mapped.match(/^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
      if (hex) {
        const high = parseInt(hex[1], 16);
        const low = parseInt(hex[2], 16);
        return isPrivateIp(`${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`);
      }
    }

    const first = Number.parseInt(ip.split(':')[0], 16);
    if (!Number.isFinite(first)) return true;
    if ((first & 0xfe00) === 0xfc00) return true;
    if ((first & 0xffc0) === 0xfe80) return true;
    if ((first & 0xff00) === 0xff00) return true;
    if (ip.startsWith('2001:db8')) return true;
    if (ip.startsWith('64:ff9b:')) return true;
    return false;
  }

  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }

  const [a, b, c] = parts;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && (c === 0 || c === 2)) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
};

export const normalizeRequestUrl = (raw) => {
  const value = String(raw || '').trim();
  if (!value) throw blocked('URL vazia');

  const hasProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(value);
  if (hasProtocol && !/^https?:\/\//i.test(value)) {
    throw blocked('Protocolo não permitido');
  }

  const candidate = hasProtocol ? value : `https://${value}`;
  let url;

  try {
    url = new URL(candidate);
  } catch {
    throw blocked('URL inválida');
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw blocked('Protocolo não permitido');
  }

  if (!ALLOWED_PORTS.has(url.port)) {
    throw blocked('Porta não permitida');
  }

  return url;
};

export const assertPublicUrl = async (raw) => {
  const url = normalizeRequestUrl(raw);
  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();

  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw blocked('Host bloqueado');
  }

  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) throw blocked('Endereço IP privado bloqueado');
    return url;
  }

  let addresses;
  try {
    addresses = await lookupAll(hostname);
  } catch {
    throw blocked('Não foi possível resolver o domínio');
  }

  if (!addresses.length) throw blocked('Domínio sem endereço DNS');
  if (addresses.some((entry) => isPrivateIp(entry.address))) {
    throw blocked('Domínio resolve para endereço privado');
  }

  return url;
};

const safeLookup = (hostname, options, callback) => {
  const lookupOptions = typeof options === 'object' && options ? options : { family: options };

  lookupAll(hostname, lookupOptions)
    .then((list) => {
      if (!list.length) return callback(new Error('Domínio sem endereço DNS'));

      if (list.some((entry) => isPrivateIp(entry.address))) {
        return callback(blocked('Conexão para endereço privado bloqueada'));
      }

      if (lookupOptions.all) return callback(null, list);

      return callback(null, list[0].address, list[0].family);
    })
    .catch((error) => callback(error));
};

const httpAgent = new http.Agent({ lookup: safeLookup, keepAlive: false });
const httpsAgent = new https.Agent({ lookup: safeLookup, keepAlive: false });

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (compatible; ProspectorBot/1.0; +https://github.com/prospector-ai)',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
};

export const safeFetch = async (
  rawUrl,
  { timeoutMs = 10_000, maxBytes = 2 * 1024 * 1024, headers = {} } = {}
) => {
  let current = rawUrl;

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    const url = await assertPublicUrl(current);

    const response = await axios.get(url.toString(), {
      timeout: timeoutMs,
      maxContentLength: maxBytes,
      maxBodyLength: maxBytes,
      maxRedirects: 0,
      responseType: 'text',
      transformResponse: [(data) => data],
      decompress: true,
      proxy: false,
      validateStatus: () => true,
      headers: { ...DEFAULT_HEADERS, ...headers },
      httpAgent,
      httpsAgent,
    });

    if (response.status >= 300 && response.status < 400 && response.headers.location) {
      if (redirects === MAX_REDIRECTS) throw blocked('Muitos redirecionamentos');
      current = new URL(response.headers.location, url).toString();
      continue;
    }

    if (response.status < 200 || response.status >= 400) {
      const error = new Error(`HTTP ${response.status}`);
      error.status = 502;
      throw error;
    }

    return {
      text: typeof response.data === 'string' ? response.data : String(response.data ?? ''),
      finalUrl: url.toString(),
      status: response.status,
      headers: response.headers,
    };
  }

  throw blocked('Falha ao buscar URL');
};
