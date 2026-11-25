const chineseFonts = ['Microsoft YaHei', 'Microsoft YaHei UI', 'PingFang SC', 'SimSun', 'Noto Sans CJK SC'];
const vendorFonts = ['MiSans', 'HarmonyOS Sans SC', 'OPPO Sans', 'vivo Sans'];
const cnZones = new Set(['Asia/Shanghai', 'Asia/Urumqi', 'Asia/Chongqing', 'Asia/Chungking', 'Asia/Harbin', 'Asia/Kashgar', 'PRC']);
const isChinese = (tag) => /^zh(?:-|$)/i.test(tag);
const isSimplified = (tag) => /^zh(?:-Hans(?:-|$)|-CN(?:-|$)|-SG(?:-|$))/i.test(tag);
const reading = (value, points) => ({ value, points });

function matchFonts(fonts) {
  const canvas = document.createElement('canvas').getContext('2d');
  if (!canvas) throw new Error('Canvas unavailable');
  const samples = ['研选家 WwmIli 0123', '检测平台 M@# 浏览器'];
  return fonts.filter((font) => ['monospace', 'serif', 'sans-serif'].some((fallback) =>
    samples.some((sample) => {
      canvas.font = `32px ${fallback}`;
      const baseline = canvas.measureText(sample).width;
      canvas.font = `32px "${font}", ${fallback}`;
      return Math.abs(canvas.measureText(sample).width - baseline) > 0.1;
    })));
}

function fontReading(fonts, score) {
  const matches = matchFonts(fonts);
  return reading(matches.length ? matches.join('、') : '未测到独立渲染差异', score(matches.length));
}

// Gather host candidates in the current browser. No STUN, signaling, or remote peer.
async function webRtcReading(signal) {
  if (typeof RTCPeerConnection !== 'function') return reading('此环境未提供 WebRTC 接口', 0);
  if (signal.aborted) return reading('检查已取消', null);
  const peer = new RTCPeerConnection({ iceServers: [] });
  try {
    const candidates = new Set();
    const done = await new Promise((resolve) => {
      const finish = (state) => {
        clearTimeout(timer);
        signal.removeEventListener('abort', cancel);
        resolve(state);
      };
      const cancel = () => finish('aborted');
      const timer = setTimeout(() => finish('timeout'), 1600);
      signal.addEventListener('abort', cancel, { once: true });
      peer.onicecandidate = ({ candidate }) => {
        if (!candidate) return finish('complete');
        const fields = candidate.candidate.split(/\s+/);
        if ((candidate.type || fields[7]) !== 'host') return;
        const address = candidate.address || fields[4];
        if (address) candidates.add(address);
      };
      Promise.resolve().then(() => {
        peer.createDataChannel('local-check');
        return peer.createOffer();
      }).then((offer) => peer.setLocalDescription(offer)).catch(() => finish('error'));
    });
    if (done === 'aborted' || done === 'error') return reading('未能完成本机候选收集', null);
    const addresses = [...candidates];
    const ipv4 = addresses.some((address) => /^\d{1,3}(?:\.\d{1,3}){3}$/.test(address));
    const ipv6 = addresses.some((address) => address.includes(':'));
    const points = Number(ipv4) * 5 + Number(ipv6) * 5;
    const exposed = [ipv4 && 'IPv4', ipv6 && 'IPv6'].filter(Boolean).join('、');
    if (exposed) return reading(`网页可见 ${exposed} 字面地址${done === 'timeout' ? '（收集超时）' : ''}`, points);
    if (done === 'timeout' || !addresses.length) return reading('本次未收集到可判断的候选地址', null);
    return reading('只见混淆候选名，未见字面地址', 0);
  } finally {
    peer.close();
  }
}

function browserReading() {
  const ua = navigator.userAgent;
  if (!ua) return reading('浏览器未提供识别标记', null);
  const candidates = [
    [/WxWork/i, '企业微信内置网页', 8],
    [/MicroMessenger/i, '微信内置网页', 8],
    [/DingTalk/i, '钉钉内置网页', 8],
    [/\bEdg(?:A|iOS)?\//i, 'Microsoft Edge', 0],
    [/\bOPR\//i, 'Opera', 0],
    [/\b(?:Chrome|CriOS)\//i, 'Chrome 或 Chromium', 0],
    [/\b(?:Firefox|FxiOS)\//i, 'Firefox', 0],
    [/\bSafari\//i, 'Safari', 0],
  ];
  const [, name, points] = candidates.find(([pattern]) => pattern.test(ua)) ?? [null, '未匹配已知容器标记', 0];
  return reading(name, points);
}

function emojiReading() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas unavailable');
  context.font = '42px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
  context.fillStyle = '#000';
  const samples = ['🧰', '👍'];
  const colors = samples.filter((sample) => {
    context.clearRect(0, 0, 64, 64);
    context.fillText(sample, 3, 50);
    const pixels = context.getImageData(0, 0, 64, 64).data;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] > 128 && Math.max(pixels[i], pixels[i + 1], pixels[i + 2]) -
        Math.min(pixels[i], pixels[i + 1], pixels[i + 2]) > 24) return true;
    }
    return false;
  });
  return reading(`${samples.join(' ')} · ${colors.length} / ${samples.length} 个样例有彩色像素`, colors.length);
}

export const environmentSignals = [
  {
    title: '系统时区', weight: 24,
    note: '读取 Intl.DateTimeFormat 的时区名称。命中 Asia/Shanghai、Asia/Urumqi 或其历史别名得 24 分。',
    read: () => {
      const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return zone ? reading(zone, cnZones.has(zone) ? 24 : 0) : reading('时区名称未提供', null);
    },
  },
  {
    title: '浏览器语言', weight: 18,
    note: '读取 navigator.languages。首选简体中文得 18 分，其他任一中文偏好得 9 分。',
    read: () => {
      const tags = navigator.languages?.length ? [...navigator.languages] : [navigator.language].filter(Boolean);
      if (!tags.length) return reading('语言偏好未提供', null);
      return reading(tags.join('、'), isSimplified(tags[0]) ? 18 : tags.some(isChinese) ? 9 : 0);
    },
  },
  {
    title: '中文字体样本', weight: 14,
    note: '用 Canvas 比较样本文字与默认字体的宽度。样本包括微软雅黑、宋体、苹方简体和 Noto Sans CJK SC。测到 1 款得 7 分，至少 2 款得 14 分。字体替换和隐私设置会影响结果。',
    read: () => fontReading(chineseFonts, (count) => Math.min(count, 2) * 7),
  },
  {
    title: '厂商字体样本', weight: 10,
    note: '按相同宽度差方法测试 MiSans、HarmonyOS Sans SC、OPPO Sans、vivo Sans。任一命中得 10 分。',
    read: () => fontReading(vendorFonts, (count) => count ? 10 : 0),
  },
  {
    title: 'WebRTC 地址暴露', weight: 10,
    note: '在本机观察 ICE 主机候选。网页可见 IPv4 或 IPv6 字面地址各得 5 分。检查只在本机建立候选，范围为本地地址可见性。',
    read: webRtcReading,
  },
  {
    title: '浏览器与网页容器', weight: 8,
    note: '读取 User-Agent 中的公开标记。命中企业微信、微信或钉钉内置网页得 8 分。',
    read: browserReading,
  },
  {
    title: '设备类型', weight: 8,
    note: '读取浏览器在 UA Client Hints 或 User-Agent 中提供的移动标记。报告移动设备得 8 分。',
    read: () => {
      const info = navigator.userAgentData;
      const ua = navigator.userAgent;
      if (!info && !ua) return reading('浏览器未提供设备信息', null);
      const mobile = info?.mobile ?? /Android|iPhone|iPad|Mobile/i.test(ua);
      return reading(`${info?.platform || navigator.platform || '平台未提供'} · ${mobile ? '移动设备标记' : '未见移动设备标记'}`, mobile ? 8 : 0);
    },
  },
  {
    title: 'Intl 区域设置', weight: 4,
    note: '读取 Intl 的日期和数字格式默认区域。每个中文标记得 2 分。',
    read: () => {
      const date = Intl.DateTimeFormat().resolvedOptions().locale;
      const number = Intl.NumberFormat().resolvedOptions().locale;
      return reading(`日期 ${date} · 数字 ${number}`, [date, number].filter(isChinese).length * 2);
    },
  },
  {
    title: 'UTC 时区偏移', weight: 2,
    note: '通过 getTimezoneOffset 读取此时本地与 UTC 的差值。UTC+08:00 得 2 分，多个地区共用该偏移。',
    read: () => {
      const offset = -new Date().getTimezoneOffset();
      const hour = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
      const minute = String(Math.abs(offset) % 60).padStart(2, '0');
      return reading(`UTC${offset < 0 ? '−' : '+'}${hour}:${minute}`, offset === 480 ? 2 : 0);
    },
  },
  {
    title: 'Emoji 渲染', weight: 2,
    note: '用 Canvas 绘制两种 Emoji 并检测彩色像素。每个彩色样例得 1 分，结果反映渲染特征。',
    read: emojiReading,
  },
];

export async function readSignals(signal) {
  return Promise.all(environmentSignals.map(async ({ read }) => {
    try { return await read(signal); }
    catch { return reading('当前浏览器无法读取', null); }
  }));
}
