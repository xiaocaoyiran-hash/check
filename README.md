# AI 工具检查台

研选家风格的静态工具页，公开入口为 [GitHub Pages](https://xiaocaoyiran-hash.github.io/check/)。

支持 ChatGPT、Gemini、Claude 切换。检测浏览器当前报告的在线状态、安全上下文、存储、Cookie 设置、Fetch 和文件选择及剪贴板能力。ChatGPT 和 Claude 使用各自公开的官方状态组件，Gemini 读取 Google Workspace 的 Gemini 通报，并提供 AI Studio 状态页入口。所有检测由浏览器发起，无需填写账号或 API 密钥。

圆环展示 10 个本机环境信号的计分总和。每项显示规则、读值、命中状态和得分，6 项基础浏览器条件在结果卡单独显示。WebRTC 检查只收集本机候选，无 STUN 或远端连接。研选家工匠随检测进度换动作，也可以点击轮换 10 个姿势。

点击「检测当前出口 IP」才会向 [IPfastcheck](https://ipfastcheck.com/api) 提交普通 HTTPS 请求。IP 纯净度等于 100 减数据源风险值，出口 IP、估计位置、ASN 及网络标记来自数据源。缺项保持未知。环境信号分和 IP 纯净度均为页面诊断结果。

GitHub Pages 从 `main` 分支根目录发布。项目无需构建，使用静态服务器打开 `index.html` 即可预览。

## 设计来源

- 检测流程参考 [原工具](https://fuck-claude.vercel.app/zh/)。
- 页面配色参考研选家品牌规范，使用品牌 Logo 和工匠形象，搭配暖橙计分标识。
- 通过 Framesbase MCP 浏览 [Smart Home](https://framesbase.app/motionsites/sections/motionsites-sections-smart-home) 的浮层面板，以及 [Border Glow](https://framesbase.app/reactbits/components/border-glow) 的边缘反馈。本站以原生 CSS 独立实现相关视觉。
