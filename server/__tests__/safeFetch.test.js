import { assertPublicUrl, isPrivateIp, safeFetch } from '../src/services/safeFetch.js';

describe('safeFetch', () => {
  test.each([
    '127.0.0.1',
    '10.0.0.1',
    '172.16.0.1',
    '192.168.1.1',
    '169.254.169.254',
    '0.0.0.0',
    '::1',
    'fe80::1',
    'fc00::1',
    '::ffff:127.0.0.1',
  ])('blocks private IP %s', (ip) => {
    expect(isPrivateIp(ip)).toBe(true);
  });

  test.each(['8.8.8.8', '1.1.1.1', '2001:4860:4860::8888'])(
    'allows public IP %s',
    (ip) => {
      expect(isPrivateIp(ip)).toBe(false);
    }
  );

  test('blocks localhost by hostname before DNS', async () => {
    await expect(assertPublicUrl('http://localhost')).rejects.toThrow('Host bloqueado');
  });

  test('blocks metadata service', async () => {
    await expect(
      assertPublicUrl('http://169.254.169.254/latest/meta-data')
    ).rejects.toThrow('Endereço IP privado bloqueado');
  });

  test('blocks non-http protocols', async () => {
    await expect(assertPublicUrl('file:///etc/passwd')).rejects.toThrow('Protocolo não permitido');
    await expect(assertPublicUrl('ftp://example.com')).rejects.toThrow('Protocolo não permitido');
  });

  test('blocks unusual ports', async () => {
    await expect(assertPublicUrl('http://example.com:6379')).rejects.toThrow('Porta não permitida');
  });

  test('safeFetch refuses loopback before making a request', async () => {
    await expect(safeFetch('http://127.0.0.1')).rejects.toThrow();
  });
});
