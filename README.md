# WpsForge

<p align="center">
  <img src="images/ai.svg" width="68" height="68" alt="WpsForge Logo" />
</p>

<p align="center">
  <strong>WPS 表格「工具箱 + AI」混合效率加载项</strong><br>
  常用高阶操作一键化，长尾复杂需求对话化 · 纯原生矢量 SVG 驱动 · 100% 开源
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/Platform-WPS%20Office%20(Windows%20%7C%20macOS)-0052cc.svg" alt="Platform">
  <img src="https://img.shields.io/badge/Node.js-%E2%89%A518.0.0-green.svg" alt="Node.js">
  <img src="https://img.shields.io/badge/Icon-Pure%20Vector%20SVG-orange.svg" alt="Vector SVG">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
</p>

---

## 项目定位与解决的问题

传统的 Excel / WPS 高阶插件（如方方格子等）往往把各种功能做成密密麻麻的菜单，初学者找功能困难；而单纯的通用 AI 聊天机器人又无法直接触达当前打开的工作簿底层对象，只能提供“复制公式”这种半成品方案。

**WpsForge** 将这两者深度融合：
1. **确定性高频需求 → 工具箱一键操作**：数据清洗、格式美化、智能序号，一键秒级执行。
2. **模糊长尾复合需求 → AI 侧边栏对话化**：“把销售额大于 1 万的行算 3% 提成写到 G 列，并按降序排好添加斑马纹”。AI 先真实读取单元格数据，再自主规划、连续调用内置工具直接改写工作表。
3. **同源架构**：按钮与 AI 共享同一套底层表格操作引擎（`js/tools.js`），工具箱能做的 AI 都能做，透明可靠。

---

## 核心功能特性

### 1. 顶部功能区选项卡（WpsForge Ribbon）
所有按钮均配备独立的 32×32 纯矢量 SVG 高清图标，与 WPS 原生设计语言无缝融合：

- **数据清洗**
  - **删除空行**：精准扫描选区或整表，一键剔除全部纯空行。
  - **删除空列**：按列检测无数据区域，一键批量清除空列。
  - **整行去重**：对比整行内容，保留首条记录，过滤重复行。
  - **清除空格**：自动清理单元格首尾的半角空格、全角空格及不可见控制符。
- **格式美化**
  - **一键美化**：深蓝商务表头、双线边框、自动适配最优行高列宽。
  - **斑马纹**：交替浅色底纹，提升宽表浏览可读性。
  - **冻结首行**：自动锁定表头行，滚动时表头常驻。
  - **批量序号**：快速纵向生成自增连续数字序号。
- **AI 助手**
  - **AI 侧边栏**：点击拉起现代化智能对话侧边栏。

### 2. AI 侧边栏对话引擎（Taskpane）
- **工具调用可视化（Tool Cards）**：每次 Function Calling 均展示调用名称、入参、执行动画、结果摘要与折叠详情，过程全透明。
- **多模型支持**：内置 DeepSeek（推荐 · 极高性价比）、硅基流动 SiliconFlow、月之暗面 Kimi、智谱 GLM、OpenAI 及自定义 OpenAI 兼容接口。
- **全矢量图形设计**：界面杜绝使用字符表情，交互按钮、状态徽章、快捷胶囊均由轻量级矢量 SVG 渲染。
- **剪贴板防护**：内置原生右键菜单，彻底解决 WPS 内嵌 Webview 抢占系统复制/粘贴快捷键的痛点。
- **多级代理网络容错**：自动探测并提供同源代理转发，解决直连模型的 CORS 跨域拦截问题。

---

## 快速开始（开发调试）

### 环境要求
- **Node.js** ≥ 18.0.0
- **WPS Office** 个人版 / 365（Windows 或 macOS 均可正常运行）

### 安装与运行

```bash
# 1. 克隆代码仓库
git clone https://github.com/xiaoshengwpp/WpsForge.git
cd WpsForge

# 2. 安装依赖（含 wps-jsapi 类型定义）
npm install

# 3. 启动本地开发服务（端口 3889）
npm run dev

# 4. 自动注册加载项并拉起 WPS 调试（推荐）
wpsjs debug
```

> **提示**：首次运行 `wpsjs debug` 后请重启一次 WPS（功能区 `ribbon.xml` 仅在 WPS 启动初始化时加载）。在顶部菜单看到 **WpsForge** 选项卡即表示安装成功。

### 配置与使用 AI 侧边栏

1. 点击顶部功能区「**AI 助手**」→「**AI 侧边栏**」。
2. 点击侧边栏右上角「**设置**」图标，填入您自有服务商的 API Key（如 DeepSeek）。
3. 点击「**测试连接**」，侧边栏将向模型发送 Function Calling 探测包进行握手验证。
4. 验证通过后点击「**保存配置**」，即可开始在对话框输入自然语言指令。

---

## 分发与安装（团队部署）

```bash
# 构建正式发布包
wpsjs publish
```

执行后将生成 `wps-addon-build/` 与 `wps-addon-publish/`：
1. **在线安装（企业/团队推荐）**：将构建文件上传至任何支持 HTTPS 的服务器或对象存储，同事只需在浏览器中打开 `publish.html` 点击“安装”即可，WPS 启动时会自动检查版本更新。
2. **离线便携安装**：直接将生成的加载项目录复制到用户的本机目录：
   - **Windows**: `%APPDATA%\kingsoft\wps\jsaddons\`
   - **macOS**: `~/Library/Containers/com.kingsoft.wpsoffice.mac/Data/.kingsoft/wps/jsaddons/`

---

## 系统架构与工作原理

```
ribbon.xml (功能区 XML 布局)
    │ OnAction
    ▼
js/ribbon.js ──► window.ForgeActions ─┐
                                      ├── js/tools.js  ← WPS JSAPI (window.Application)
ui/taskpane.html (侧边栏界面)          │      完全同源的底层表格操作实现
    │ 工具调用循环 (Tool-use loop) ────►┘
js/taskpane.js
```

- **基于官方技术栈**：严格基于金山官方 WPS 加载项（JS Add-in）规范，使用现代 JavaScript 开发，不依赖任何已淘汰的 VBA 运行时。
- **纯前端自治执行**：AI 调度引擎运行在本地，模型返回 `tool_calls` → 本地调用 WPS JSAPI 执行 → 结果回传模型，形成闭环。
- **高保真操作**：底层通过 WPS 原生对象模型（`Range`、`Worksheet`）直接批量读写，非模拟鼠标键盘点击，稳定高效且支持 `Ctrl+Z` 撤销。

---

## 数据安全与隐私声明

- **零云端存储**：本项目为**无服务器（Serverless）纯客户端插件**。除与您自行配置的模型服务商进行加密 API 通信外，本项目没有任何中间收集服务器，**绝不存储、中转或上传任何个人数据或 API Key**。
- **密钥本地加密留存**：API Key 仅留存在您本机的浏览器本地缓存（`localStorage`）中，不落盘至远程文件。
- **数据按需读取**：AI 仅在用户下达需要识别表格内容的指令时，才调用 `read_range` 工具读取上下文（默认单次限制读取不超过 200 行 × 30 列）。
- **离线能力保障**：如果您不希望任何表格数据接入云端模型，只需不配置 API Key，工具箱全部一键操作功能（清洗、美化、去重、序号等）均**100% 离线可用**。

---

## 参与贡献

欢迎对 WpsForge 进行功能扩充、问题修复或提交设计改进！
1. Fork 本仓库并新建特性分支（`git checkout -b feature/amazing-feature`）。
2. 遵循现有的设计规范：
   - 必须使用纯矢量 SVG 图标，杜绝引入字符/Emoji 图标；
   - 新增表格操作需同时在 `js/tools.js` 中封装，并同步注册至 AI `toolsSchema` 中保持同源；
   - 保持跨平台（Windows / macOS）与标准 JSAPI 语法兼容。
3. 提交修改（`git commit -m 'feat: add some amazing feature'`）。
4. 推送分支并向 `main` 分支发起 Pull Request。

---

## 开源许可证与法律免责声明

### 1. 开源许可证
本项目基于 [MIT License](LICENSE) 协议完全开源。您可以自由使用、修改、分发甚至用于商业学习，但需在衍生版本中保留原作者的版权声明与许可条款。

### 2. 非官方商标免责声明 (Trademark Disclaimer)
- **WPS**、**WPS Office** 及相关徽标为**北京金山办公软件股份有限公司（Kingsoft Office）**的注册商标。
- **WpsForge** 是由独立开源社区开发者发起的第三方效率扩展项目，**与金山办公软件（Kingsoft）无任何官方隶属、赞助、授权、合资或直接商业关联**。
- 本项目仅遵循金山办公官方开放的“WPS 加载项技术规范”进行合规的功能拓展与技术探索。

### 3. 数据与使用免责条款 (As-Is Disclaimer)
- 本软件按“现状 (AS IS)”提供，作者不对软件的适用性、稳定性或大模型生成内容的绝对准确性做任何明示或暗示的保证。
- 尽管本插件对表格操作提供了 `Ctrl+Z` 撤销支持，但大模型针对复杂数据清洗和单元格改写存在一定随机性。**用户在对重要生产表格执行任何批量清洗、删除或覆写操作前，请务必自行做好原文件备份**。
- 在任何情况下，开发者均不对因使用本软件或模型工具执行所引起的任何直接、间接、偶然或连带的数据损失或业务偏差承担法律责任。
