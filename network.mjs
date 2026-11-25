export const ipFlags = [
  ['proxy', '代理'],
  ['vpn', 'VPN'],
  ['tor', 'Tor'],
  ['hosting', '机房'],
  ['abuse', '滥用'],
];

const usageLabels = { residential: '住宅网络', datacenter: '机房网络', mobile: '移动网络' };
const join = (...parts) => [...new Set(parts.filter((part) => typeof part === 'string' && part.trim()))].join(' · ');

export async function checkPublicIp() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch('https://ipfastcheck.com/check', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      cache: 'no-store',
    });
    if (response.status === 429) return { error: 'IP 数据源已限流，稍后可重新查询。' };
    if (!response.ok) throw new Error('IP lookup unavailable');
    const { ok, data } = await response.json();
    if (ok !== true || typeof data?.ip !== 'string' || !data.ip.trim()) {
      throw new Error('Unexpected IP response');
    }
    const flags = Object.fromEntries(ipFlags.map(([key]) => {
      const value = data.flags?.[key];
      if (key === 'abuse' && value === false && !Number.isFinite(data.extra?.abuse_score)) return [key, null];
      return [key, typeof value === 'boolean' ? value : null];
    }));
    const risk = Number.isInteger(data.risk) && data.risk >= 0 && data.risk <= 100 ? data.risk : null;
    const usage = data.usage?.key;
    return {
      ip: data.ip,
      location: join(data.geo?.country, data.geo?.region, data.geo?.city),
      network: join(data.net?.asn, data.net?.isp || data.net?.org),
      type: Object.hasOwn(usageLabels, usage) ? usageLabels[usage] : '网络类型未知',
      flags,
      risk,
      purity: risk === null ? null : 100 - risk,
    };
  } catch {
    return { error: '本次无法读取 IP 数据源，结果暂不可用。' };
  } finally {
    clearTimeout(timeout);
  }
}
