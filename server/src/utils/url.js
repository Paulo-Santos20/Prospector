export const normalizeUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const url = new URL(candidate);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    url.protocol = url.protocol.toLowerCase();
    url.hostname = url.hostname.toLowerCase();
    return url.toString();
  } catch {
    return '';
  }
};
