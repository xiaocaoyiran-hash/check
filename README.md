# AI 工具检查台

研选家风格的静态工具页，公开入口为 [GitHub Pages](https://xiaocaoyiran-hash.github.io/check/)。

支持 ChatGPT、Gemini、Claude、DeepSeek 切换。检测浏览器当前报告的在线状态、安全上下文、存储、Cookie 设置、Fetch 和文件选择及剪贴板能力。ChatGPT 和 Claude 使用各自公开的官方状态组件，Gemini 读取 Google Workspace 的 Gemini 通报，AI Studio 和 DeepSeek 提供官方状态页直达入口。所有检测由浏览器发起，无需填写账号或 API 密钥。

页面逐项展示 10 个本机环境信号，包括时区、语言、字体样本、WebRTC 接口、浏览器、设备、区域设置、UTC 偏移和 Emoji 样例。圆环统计 6 项基础浏览器条件的通过数。研选家工匠随检测进度换动作，也可以点击轮换 10 个姿势。

GitHub Pages 从 `main` 分支根目录发布。项目无需构建，使用静态服务器打开 `index.html` 即可预览。

## 设计来源

- 检测流程参考 [原工具](https://fuck-claude.vercel.app/zh/)。
- 页面配色和留白参考 [研选家运营知识库](https://xiaocaoyiran-hash.github.io/knowledge-base/) 与提供的品牌规范，Logo 与工匠图用于页面视觉。
- 通过 Framesbase MCP 浏览 [Smart Home](https://framesbase.app/motionsites/sections/motionsites-sections-smart-home) 的浮层面板，以及 [Border Glow](https://framesbase.app/reactbits/components/border-glow) 的边缘反馈。本站以原生 CSS 独立实现相关视觉。
