const providers = {
  chatgpt: {
    name: 'ChatGPT', mark: 'G', scope: 'OpenAI · ChatGPT 网页相关组件',
    source: 'OpenAI 官方状态',
    feed: 'https://status.openai.com/api/v2/summary.json',
    components: ['Conversations', 'Search', 'File uploads', 'Voice mode', 'GPTs', 'Image Generation', 'Deep Research'],
    links: [
      ['打开 ChatGPT', 'https://chatgpt.com/'],
      ['查看 OpenAI 状态', 'https://status.openai.com/'],
      ['查看支持的国家和地区', 'https://help.openai.com/en/articles/7947663-chatgpt-supported-countries'],
    ],
  },
  gemini: {
    name: 'Gemini', mark: '✦', scope: 'Google · Workspace 状态中的 Gemini',
    source: 'Google Workspace 状态',
    feed: 'https://www.google.com/appsstatus/dashboard/incidents.json',
    links: [
      ['打开 Gemini', 'https://gemini.google.com/'],
      ['查看 Workspace 状态', 'https://www.google.com/appsstatus/dashboard/'],
      ['查看 AI Studio / Gemini API 状态', 'https://aistudio.google.com/status'],
    ],
  },
  claude: {
    name: 'Claude', mark: '✳', scope: 'Anthropic · claude.ai 网页服务',
    source: 'Claude 官方状态',
    feed: 'https://status.claude.com/api/v2/summary.json',
    components: ['claude.ai'],
    links: [
      ['打开 Claude', 'https://claude.ai/'],
      ['查看 Claude 状态', 'https://status.claude.com/'],
      ['查看支持的国家和地区', 'https://www.anthropic.com/supported-countries'],
    ],
  },
  deepseek: {
    name: 'DeepSeek', mark: 'D', scope: 'DeepSeek · 网页对话',
    links: [
      ['打开 DeepSeek', 'https://chat.deepseek.com/'],
      ['查看 DeepSeek 状态', 'https://status.deepseek.com/'],
    ],
  },
};

const browserChecks = [
  {
    title: '设备在线提示',
    idle: '读取浏览器报告的连接状态。联网提示不能确认目标网站能否访问。',
    evaluate: () => typeof navigator.onLine === 'boolean'
      ? outcome(navigator.onLine, navigator.onLine ? '浏览器报告设备在线。' : '浏览器报告设备离线，请检查设备的网络连接。')
      : unknown('当前浏览器未提供在线状态。'),
  },
  {
    title: '安全上下文',
    idle: '检查此页面是否运行在 HTTPS 等安全上下文中。',
    evaluate: () => outcome(isSecureContext, isSecureContext ? '当前页面为安全上下文。' : '请从正式的 HTTPS 网址打开此页面。'),
  },
  {
    title: '本地存储',
    idle: '尝试在本页写入并删除一个临时值。各工具自身的存储权限需在其页面确认。',
    evaluate: () => {
      const key = 'ai-check-temp-' + Math.random().toString(36).slice(2);
      try {
        localStorage.setItem(key, 'ok');
        const written = localStorage.getItem(key) === 'ok';
        localStorage.removeItem(key);
        return outcome(written, written ? '本页可以写入、读取并清理临时存储。' : '本页无法读取写入的存储。');
      } catch {
        return outcome(false, '本页无法访问本地存储，请检查当前浏览器的站点设置。');
      }
    },
  },
  {
    title: 'Cookie 设置提示',
    idle: '读取浏览器报告的 Cookie 开关，不读取任何 Cookie 内容。',
    evaluate: () => typeof navigator.cookieEnabled === 'boolean'
      ? outcome(navigator.cookieEnabled, navigator.cookieEnabled ? '浏览器报告允许 Cookie。具体站点规则取决于浏览器设置。' : '浏览器报告 Cookie 被禁用，可能影响登录。')
      : unknown('当前浏览器未提供 Cookie 设置。'),
  },
  {
    title: '网页请求能力',
    idle: '检查浏览器是否提供 Fetch。检测范围为接口支持情况。',
    evaluate: () => outcome(typeof fetch === 'function', typeof fetch === 'function' ? '当前浏览器支持 Fetch。' : '当前浏览器不支持 Fetch，请更新浏览器。'),
  },
  {
    title: '文件与剪贴板',
    idle: '检查浏览器能否识别文件选择控件，以及是否提供剪贴板写入接口。无需读取文件或剪贴板。',
    evaluate: () => {
      const input = document.createElement('input');
      input.type = 'file';
      const file = input.type === 'file' && 'files' in input;
      const clip = typeof navigator.clipboard?.writeText === 'function';
      return outcome(file && clip, `文件选择控件${file ? '可识别' : '不可用'}，剪贴板写入接口${clip ? '可识别' : '不可用'}。实际操作还取决于权限。`);
    },
  },
];

const environmentSignals = [
  {
    title: '系统时区',
    note: '读取浏览器使用的时区名称。',
    read: () => Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
  {
    title: '浏览器语言',
    note: '读取浏览器报告的语言偏好顺序。',
    read: () => navigator.languages?.slice(0, 5).join('、') || navigator.language,
  },
  {
    title: '中文字体样本',
    note: '用少量字符测试中文字体的渲染差异。结果受字体替换和浏览器限制影响。',
    read: () => fontSamples(['Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC'], '研选家字体样本'),
  },
  {
    title: '厂商字体样本',
    note: '观察常见界面字体的渲染，需要实际字体列表时请查看系统设置。',
    read: () => fontSamples(['Segoe UI', 'Helvetica Neue', 'Roboto'], 'Browser 0123'),
  },
  {
    title: 'WebRTC 能力',
    note: '仅查看实时通信接口是否可用。IP 地址未检测。',
    read: () => typeof RTCPeerConnection === 'function' ? '实时通信接口可用' : '实时通信接口不可用',
  },
  {
    title: '浏览器与网页容器',
    note: '根据浏览器公开标记识别常见浏览器或应用内网页。',
    read: () => {
      const name = [
        [/WxWork/i, '企业微信内置网页'],
        [/MicroMessenger/i, '微信内置网页'],
        [/\bEdg(?:A|iOS)?\//i, 'Microsoft Edge'],
        [/\bOPR\//i, 'Opera'],
        [/\b(?:Chrome|CriOS)\//i, 'Chrome 或 Chromium 浏览器'],
        [/\b(?:Firefox|FxiOS)\//i, 'Firefox'],
        [/\bSafari\//i, 'Safari'],
      ].find(([pattern]) => pattern.test(navigator.userAgent));
      return name?.[1] ?? '未识别到已知的浏览器标记';
    },
  },
  {
    title: '设备类型',
    note: '展示浏览器报告的平台和移动设备提示。',
    read: () => {
      const info = navigator.userAgentData;
      const platform = info?.platform || navigator.platform;
      const mobile = info?.mobile ?? /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
      return `${platform || '平台未提供'} · ${mobile ? '移动设备标记' : '未报告移动设备标记'}`;
    },
  },
  {
    title: 'Intl 区域设置',
    note: '读取浏览器用于日期和数字格式化的默认区域标记。',
    read: () => {
      const date = Intl.DateTimeFormat().resolvedOptions().locale;
      const number = Intl.NumberFormat().resolvedOptions().locale;
      return `日期 ${date} · 数字 ${number}`;
    },
  },
  {
    title: 'UTC 时区偏移',
    note: '查看当前本地时间与 UTC 的偏移，数值可能随夏令时变化。',
    read: () => {
      const offset = -new Date().getTimezoneOffset();
      const hour = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
      const minute = String(Math.abs(offset) % 60).padStart(2, '0');
      return `UTC${offset < 0 ? '−' : '+'}${hour}:${minute}`;
    },
  },
  {
    title: 'Emoji 渲染',
    note: '在本页展示表情样例，方便观察是否显示异常。',
    read: () => '显示样例 🧰 👷 👍 🏆',
  },
];

const poses = [
  ['toolbox', '拿工具箱'],
  ['introduce', '介绍'],
  ['question', '疑问'],
  ['call', '打电话'],
  ['thumbs-up', '点赞'],
  ['okay', 'OK 手势'],
  ['trophy', '拿奖杯'],
  ['build', '搬砖'],
  ['announce', '宣传'],
  ['paint', '刷墙'],
];

const $ = (id) => document.getElementById(id);
const checks = $('checks');
const start = $('run');
const copy = $('copy');
const mascot = $('mascot');
const poseImages = new Map();
let poseIndex = 0;
let poseChange = 0;
const initialHash = location.hash.slice(1).toLowerCase();
let current = Object.hasOwn(providers, initialHash) ? initialHash : 'chatgpt';
let request;
let report;

function outcome(passed, text) {
  return { state: passed ? 'pass' : 'attention', label: passed ? '通过' : '留意', text };
}

function unknown(text) {
  return { state: 'unknown', label: '未知', text };
}

function fontSamples(fonts, sample) {
  const canvas = document.createElement('canvas').getContext('2d');
  if (!canvas) return '浏览器未开放字体样本测量';
  const matching = fonts.filter((font) => ['monospace', 'serif'].some((fallback) => {
    canvas.font = `32px ${fallback}`;
    const baseline = canvas.measureText(sample).width;
    canvas.font = `32px "${font}", ${fallback}`;
    return Math.abs(canvas.measureText(sample).width - baseline) > 0.1;
  }));
  return matching.length ? '有渲染差异：' + matching.join('、') : '未测到所选字体的独立渲染';
}

function renderSignals(scanned = false) {
  const rows = environmentSignals.map(({ title, note, read }) => {
    const item = document.createElement('li');
    const header = document.createElement('div');
    header.className = 'signal-head';
    const name = document.createElement('h3');
    name.textContent = title;
    const description = document.createElement('p');
    description.className = 'signal-note';
    description.textContent = note;
    const value = document.createElement('p');
    value.className = 'signal-value';
    value.textContent = '待检查';
    if (scanned) {
      try { value.textContent = read() || '浏览器未提供'; }
      catch { value.textContent = '当前浏览器无法读取'; }
    }
    header.append(name);
    item.append(header, description, value);
    return item;
  });
  $('signals').replaceChildren(...rows);
}

function loadPose(index) {
  if (!poseImages.has(index)) {
    const image = new Image();
    image.alt = '';
    image.id = 'mascot-art';
    image.src = new URL(`./assets/mascot/${poses[index][0]}.webp`, import.meta.url).href;
    const ready = image.decode().then(() => image).catch(() => {
      poseImages.delete(index);
      return null;
    });
    poseImages.set(index, ready);
  }
  return poseImages.get(index);
}

async function showPose(index) {
  poseIndex = index;
  const change = ++poseChange;
  const image = await loadPose(index);
  if (poseChange !== change || !image) return;
  $('mascot-art').replaceWith(image);
  $('mascot-pose').textContent = poses[index][1];
  mascot.classList.remove('mascot-pop');
  requestAnimationFrame(() => {
    if (poseChange === change) mascot.classList.add('mascot-pop');
  });
  void loadPose((index + 1) % poses.length);
}

function updateDial(passed) {
  $('dial-number').textContent = passed ?? '–';
  $('dial').style.setProperty('--dial-value', `${(passed ?? 0) / browserChecks.length * 100}%`);
}

function mark(key) {
  const icon = document.createElement('span');
  icon.className = 'provider-mark';
  icon.dataset.provider = key;
  icon.textContent = providers[key].mark;
  icon.setAttribute('aria-hidden', 'true');
  return icon;
}

function buildSelector() {
  for (const [key, provider] of Object.entries(providers)) {
    const button = document.createElement('input');
    button.type = 'radio';
    button.name = 'provider';
    button.id = 'provider-' + key;
    button.value = key;
    button.checked = key === current;
    const label = document.createElement('label');
    label.htmlFor = button.id;
    label.append(mark(key), document.createTextNode(provider.name));
    $('providers').append(button, label);
    button.addEventListener('change', () => {
      if (button.checked) selectProvider(key);
    });
  }
}

function renderChecks(results) {
  const rows = browserChecks.map((check, i) => {
    const test = results?.[i];
    const item = document.createElement('li');
    const details = document.createElement('details');
    const title = document.createElement('summary');
    const status = document.createElement('span');
    status.className = 'badge';
    status.dataset.state = test?.state ?? 'idle';
    status.textContent = test?.label ?? '待检查';
    title.append(document.createTextNode(check.title), status);
    const description = document.createElement('p');
    description.textContent = test?.text ?? check.idle;
    details.append(title, description);
    item.append(details);
    return item;
  });
  checks.replaceChildren(...rows);
}

function setMetric(id, label, state, caption) {
  $(id + '-summary').textContent = label;
  $(id + '-summary').dataset.state = state;
  $(id + '-caption').textContent = caption;
}

function selectProvider(key) {
  request?.abort();
  request = undefined;
  report = undefined;
  if (current !== key) void showPose(1);
  current = key;
  const provider = providers[key];
  document.getElementById('provider-' + key).checked = true;
  $('active-icon').replaceWith(Object.assign(mark(key), { id: 'active-icon' }));
  $('active-name').textContent = provider.name;
  $('headline-provider').textContent = provider.name;
  $('active-scope').textContent = provider.scope;
  const items = provider.links.map(([label, url]) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    const arrow = document.createElement('span');
    arrow.textContent = '↗';
    arrow.setAttribute('aria-hidden', 'true');
    a.append(document.createTextNode(label), arrow);
    li.append(a);
    return li;
  });
  $('provider-links').replaceChildren(...items);
  setMetric('local', '待检查', 'idle', '在线提示 · HTTPS · 存储等');
  setMetric('service', '待查看', 'idle', provider.source || '从官方状态页确认');
  $('feedback').textContent = '点击「开始检查」查看结果。';
  $('checked-at').textContent = '';
  mascot.dataset.scanning = 'false';
  updateDial();
  renderSignals();
  renderChecks();
  start.disabled = false;
  start.innerHTML = '开始检查 <span aria-hidden="true">→</span>';
  copy.disabled = true;
}

function parseGoogle(incidents) {
  if (!Array.isArray(incidents)) throw new Error('Unexpected Google status schema');
  const gemini = 'npdyhgECDJ6tB66MxXyo';
  const active = incidents.filter((incident) => (
    !incident.end &&
    (incident.service_key === gemini || incident.affected_products?.some((product) => product.id === gemini))
  ));
  if (active.some((incident) => ['SERVICE_OUTAGE', 'SERVICE_DISRUPTION'].includes(incident.status_impact))) {
    return { state: 'attention', label: '有故障通报', text: 'Workspace 中的 Gemini 有未结束的故障通报。' };
  }
  if (active.length) return { state: 'attention', label: '有服务动态', text: 'Workspace 中的 Gemini 有未结束的官方通报。' };
  return { state: 'pass', label: '未见进行中通报', text: '限 Workspace 状态中的 Gemini。' };
}

function parseStatusPage(provider, data) {
  const registered = data.components?.filter((component) => provider.components.includes(component.name)) ?? [];
  if (registered.length === 0) return unknown('官方状态源暂未列出此工具的检查组件。');
  const reports = registered.filter((component) => component.status && component.status !== 'operational');
  if (reports.length) {
    return { state: 'attention', label: '有服务动态', text: '需关注：' + reports.map((entry) => entry.name).join('、') + '。' };
  }
  if (registered.some((component) => !component.status)) return unknown('官方状态源未提供完整组件状态。');
  return { state: 'pass', label: '已列组件正常', text: `官方报告所查的 ${registered.length} 项组件运作正常。` };
}

async function fetchService(key, controller) {
  const provider = providers[key];
  if (!provider.feed) return unknown('请打开 DeepSeek 官方状态页查看实时通报。');
  const timer = setTimeout(() => controller.abort(), 7500);
  try {
    const response = await fetch(provider.feed, {
      signal: controller.signal, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer',
    });
    if (!response.ok) throw new Error('Status feed unavailable');
    const data = await response.json();
    return key === 'gemini' ? parseGoogle(data) : parseStatusPage(provider, data);
  } catch {
    return unknown('本次无法读取官方状态，请打开官方状态页复核。');
  } finally {
    clearTimeout(timer);
  }
}

async function run() {
  const key = current;
  const activeRequest = new AbortController();
  request = activeRequest;
  report = undefined;
  copy.disabled = true;
  start.disabled = true;
  start.textContent = '检查中…';
  mascot.dataset.scanning = 'true';
  void showPose(2);
  setMetric('service', '读取中', 'idle', providers[key].source || '核对官方状态入口');
  $('feedback').textContent = '正在检查浏览器条件和官方状态。';
  const results = browserChecks.map((check) => {
    try { return check.evaluate(); }
    catch { return unknown('此项暂无法读取。'); }
  });
  const passed = results.filter((item) => item.state === 'pass').length;
  renderChecks(results);
  renderSignals(true);
  updateDial(passed);
  setMetric('local', `${passed} / ${results.length} 通过`, passed === results.length ? 'pass' : 'attention', '展开下方项目查看细节');
  const [service] = await Promise.all([
    fetchService(key, activeRequest),
    new Promise((resolve) => setTimeout(resolve, 460)),
  ]);
  if (request !== activeRequest) return;
  mascot.dataset.scanning = 'false';
  void showPose(passed === results.length && service.state === 'pass' ? 4 : 3);
  setMetric('service', service.label, service.state, service.text);
  const time = new Date();
  $('checked-at').textContent = '本次检查 ' + time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  $('feedback').textContent = '检查完成。实际访问请从官方入口打开确认。';
  report = [providers[key].name + ' · 检查结果', time.toLocaleString('zh-CN'), '浏览器条件 ' + passed + '/' + results.length + ' 通过',
    '官方服务状态：' + service.label + '。' + service.text,
    ...results.map((result, i) => browserChecks[i].title + '：' + result.label + ' · ' + result.text),
  ].join('\n');
  copy.disabled = false;
  start.disabled = false;
  start.innerHTML = '重新检查 <span aria-hidden="true">→</span>';
  request = undefined;
}

copy.addEventListener('click', async () => {
  const currentReport = report;
  if (!currentReport) return;
  try {
    await navigator.clipboard.writeText(currentReport);
    if (report === currentReport) $('feedback').textContent = '已复制检查结果。';
  } catch {
    if (report !== currentReport) return;
    const download = document.createElement('a');
    const url = URL.createObjectURL(new Blob([currentReport], { type: 'text/plain;charset=utf-8' }));
    download.href = url;
    download.download = 'AI工具检查结果.txt';
    download.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('feedback').textContent = '剪贴板不可用，已发起结果文件下载。';
  }
});

start.addEventListener('click', run);
mascot.addEventListener('click', () => void showPose((poseIndex + 1) % poses.length));
$('back-top').addEventListener('click', (event) => {
  event.preventDefault();
  window.scrollTo({ top: 0 });
});
buildSelector();
selectProvider(current);
window.addEventListener('load', () => {
  void loadPose(1);
  void loadPose(2);
}, { once: true });
