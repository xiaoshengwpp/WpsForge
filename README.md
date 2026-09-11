# WpsForge

<p align="center">
  <img src="images/ai.svg" width="68" height="68" alt="WpsForge Logo" />
</p>

<p align="center">
  <strong>WPS 表格「工具箱 + AI」混合效率加载项</strong><br>
  Hybrid "Toolbox + AI Copilot" Add-in for WPS Spreadsheets<br>
  常用高阶操作一键化，长尾复杂需求对话化 · 纯原生矢量 SVG 驱动 · 100% 开源<br>
  One-click Operations & Conversational AI Workflows · Pure Vector SVG · 100% Open Source
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/Platform-WPS%20Office%20(Windows%20%7C%20macOS)-0052cc.svg" alt="Platform">
  <img src="https://img.shields.io/badge/Node.js-%E2%89%A518.0.0-green.svg" alt="Node.js">
  <img src="https://img.shields.io/badge/Icons-Pure%20Vector%20SVG-orange.svg" alt="Vector SVG">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
</p>

<p align="center">
  <a href="#english"><strong>English</strong></a> • <a href="#简体中文"><strong>简体中文</strong></a>
</p>

---

<a name="english"></a>
## English

### Overview & The Problem We Solve

Traditional spreadsheet productivity toolboxes often clutter the interface with dozens of nested menus that are difficult for beginners to navigate. Meanwhile, standard AI chat bots cannot directly access or manipulate the active spreadsheet's Document Object Model (DOM), leaving users with half-baked solutions like "copy-paste this formula".

**WpsForge** seamlessly fuses both paradigms:
1. **Deterministic High-frequency Tasks → One-click Ribbon Actions**: Instant execution for data cleaning, styling, zebra striping, and auto-numbering.
2. **Complex Long-tail Workflows → Conversational AI Taskpane**: Describe your intent in natural language (e.g., *"Calculate 3% commission for rows where sales exceed 10k, write to column G, sort descending, and apply zebra striping"*). The AI reads actual cell values, creates a plan, and executes built-in spreadsheet tools sequentially.
3. **Shared Tool Engine**: Both the ribbon buttons and the AI assistant share the exact same underlying spreadsheet engine (`js/tools.js`), ensuring transparency and reliability.

---

### Key Features

#### 1. WpsForge Ribbon Tab
Every action is accompanied by a dedicated, crisp 32x32 vector SVG icon tailored for WPS Office:

- **Data Cleaning**
  - **Delete Empty Rows**: Accurately scans selection or full sheet to remove all blank rows.
  - **Delete Empty Columns**: Detects unused column ranges and cleans them in batch.
  - **Remove Duplicates**: Compares row contents, keeps initial entries, and purges duplicate rows.
  - **Trim Spaces**: Cleans leading and trailing half-width/full-width spaces and invisible control characters.
- **Formatting & Beautification**
  - **Auto Beautify**: Applies professional dark blue headers, elegant borders, and optimal row/column sizing.
  - **Zebra Stripes**: Alternating subtle row colors for enhanced data readability.
  - **Freeze Header**: Locks the top header row so it stays pinned during scrolling.
  - **Batch Serial Numbers**: Generates auto-incrementing vertical serial numbers.
- **AI Assistant**
  - **AI Taskpane**: Opens the modern AI sidebar.

#### 2. AI Autonomous Copilot & Productivity Suite
- **Multi-Module Tabbed Architecture**: Divided into four dedicated modules — **💬 AI Chat**, **⚡ Scenario Library**, **🛠️ Direct Toolbox**, and **⚙️ Model Settings**.
- **Real-time Selection Awareness**: Automatically detects and displays active spreadsheet selections (e.g., `Sheet1!B2:F15`), enabling one-click context injection into prompts.
- **Expanded 20 Built-in AI Tools (Function Calling)**: AI directly executes cell highlighting, merge/center, row/column insertion & deletion, matrix transposition, instant statistics, auto-fitting, chart generation, and more.
- **Formula One-Click Fill**: Detects spreadsheet formulas in AI answers and provides instant "Fill into Sheet" buttons.
- **Stop & Regenerate**: Supports generation aborting via `AbortController`, one-click response copying, and persistent local chat history.
- **Zero-Token Direct Toolbox**: Run high-frequency spreadsheet utilities (stats, transpose, export Markdown/JSON, fill blank cells) offline without consuming API tokens.
- **Broad Model Support**: Built-in presets for DeepSeek, SiliconFlow, Moonshot Kimi, Zhipu GLM, OpenAI, local Ollama, and custom OpenAI-compatible endpoints.
- **Pure Vector SVG Interface**: 100% vector SVG rendering across all icons, pills, badges, and controls.
- **Clipboard Shield & Proxy Fallback**: Custom context menu and same-origin proxy fallback to bypass WPS webview CORS and shortcut hijacking.

---

### Quick Start (Development & Debugging)

#### Prerequisites
- **Node.js** ≥ 18.0.0
- **WPS Office** (Personal or 365, on Windows or macOS)

#### Setup & Launch

```bash
# 1. Clone repository
git clone https://github.com/xiaoshengwpp/WpsForge.git
cd WpsForge

# 2. Install dependencies (includes wps-jsapi type definitions)
npm install

# 3. Start local development server (port 3889)
npm run dev

# 4. Register add-in and launch WPS for live debugging (Recommended)
wpsjs debug
```

> **Note**: After your first `wpsjs debug` run, restart WPS Office (the `ribbon.xml` specification is loaded during WPS startup). The **WpsForge** tab will appear in the top ribbon.

#### Configuring the AI Taskpane

1. Click **AI Assistant** → **AI Taskpane** on the ribbon.
2. Click the **Settings** icon on the top-right of the taskpane.
3. Enter your provider API Key (e.g., DeepSeek).
4. Click **Test Connection** to verify connectivity and Function Calling capabilities.
5. Click **Save Settings** to begin interacting.

---

### Distribution & Team Deployment

```bash
# Build production bundle
wpsjs publish
```

This generates `wps-addon-build/` and `wps-addon-publish/`:
1. **Online Installation (Recommended for teams)**: Upload the build assets to any HTTPS server or object storage. Users open `publish.html` and click "Install". WPS automatically updates on launch.
2. **Offline Portable Installation**: Copy the build directory directly to the local WPS add-in folder:
   - **Windows**: `%APPDATA%\kingsoft\wps\jsaddons\`
   - **macOS**: `~/Library/Containers/com.kingsoft.wpsoffice.mac/Data/.kingsoft/wps/jsaddons/`

---

### Architecture & Engineering Design

```
ribbon.xml (Ribbon XML Layout)
    │ OnAction
    ▼
js/ribbon.js ──► window.ForgeActions (17 actions) ──┐
                                                    ├── js/tools/ (core, clean, format, advanced, schema)
ui/taskpane.html (214 lines lightweight UI)          │   └── Shared WPS JSAPI (window.Application)
    │ Tool-use loop (20 AI tools) ──────────────────►┘
js/taskpane/ (data, tabs, orchestrator, ui...)
```

- **Official Standards**: Built strictly on the official Kingsoft WPS JS Add-in framework (`wpsjs`), cross-platform without legacy VBA dependencies.
- **Modular & Componentized Architecture**:
  - `ui/css/`: Decoupled CSS design system modules (`base`, `layout`, `chat`, `scenarios`, `toolbox`, `settings`).
  - `js/tools/`: Layered spreadsheet operations engine (`core` foundation, `clean` data cleaning, `format` styling/beautification, `advanced` calculus/charts/matrices, `schema` AI Function Calling specs).
  - `js/taskpane/`: Componentized sidebar architecture (`constants`, `utils`, `state`, `selection`, `llm`, `ui`, `orchestrator`, `data`, `tabs`).
- **Declarative & Data-Driven UI (v-for style)**: Repetitive cards (Quick Prompts, Scenario Library, Direct Toolbox) are extracted into `js/taskpane/data.js` and rendered via declarative template functions with unified event delegation, slashing `ui/taskpane.html` from 1541 lines down to just 214 lines (13KB).
- **Client-Side Autonomous Execution**: The tool-use loop runs locally in the sidebar. The LLM emits `tool_calls` → executed via WPS JSAPI → output fed back to LLM until final response.
- **Native DOM Access**: Directly reads and writes through WPS native objects (`Range`, `Worksheet`), supporting `Ctrl+Z` undo.

---

### Data Privacy & Security

- **Zero Cloud Storage**: WpsForge is a **100% serverless, client-only add-in**. Apart from encrypted HTTPS calls to your configured model provider, no telemetry, user data, or API Keys are stored or forwarded to third-party servers.
- **Local Storage Isolation**: Your API Key is stored solely in the local browser cache (`localStorage`).
- **On-Demand Access**: The AI only reads cell data when necessary for the user query (limited to 200 rows × 30 columns per read by default).
- **Offline Reliability**: If you choose not to use AI, simply leave the API Key unconfigured. All ribbon toolbox features remain **100% functional offline**.

---

### Contributing

Contributions, bug reports, and suggestions are warmly welcome!
1. Fork the repository and create a branch (`git checkout -b feature/amazing-feature`).
2. Follow project conventions:
   - Use pure vector SVG icons only (no character/emoji icons).
   - Any spreadsheet action should be implemented in the appropriate module under `js/tools/` (`clean`, `format`, or `advanced`), registered in `js/tools/schema.js` for AI use, and exported via `js/tools.js`.
   - Maintain cross-platform (Windows & macOS) compatibility.
3. Commit your changes (`git commit -m 'feat: add amazing feature'`).
4. Push to your branch and submit a Pull Request.

---

### License & Legal Disclaimers

#### 1. Open Source License
Distributed under the [MIT License](LICENSE). You are free to use, modify, and distribute this software, provided original copyright notices are retained.

#### 2. Non-Affiliation & Trademark Disclaimer
- **WPS** and **WPS Office** are registered trademarks of **Kingsoft Office Software Co., Ltd.**
- **WpsForge** is an independent community project developed by individual open-source contributors and is **not affiliated with, sponsored by, authorized by, or associated with Kingsoft Office**.
- This project utilizes Kingsoft's publicly available WPS JS Add-in Developer API strictly for technical extension and interoperability.

#### 3. As-Is Warranty & Data Disclaimer
- This software is provided "AS IS", without warranty of any kind, express or implied.
- While operations support `Ctrl+Z` undo, generative AI outputs carry non-deterministic behavior. **Users must back up critical spreadsheets before performing automated modifications or batch cleaning**.
- In no event shall the authors or contributors be liable for any data loss, business disruption, or damages arising from the use of this software.

---

<a name="简体中文"></a>
## 简体中文

### 项目定位与解决的问题

传统的 Excel / WPS 高阶插件（如方方格子等）往往把各种功能做成密密麻麻的菜单，初学者找功能困难；而单纯的通用 AI 聊天机器人又无法直接触达当前打开的工作簿底层对象，只能提供“复制公式”这种半成品方案。

**WpsForge** 将这两者深度融合：
1. **确定性高频需求 → 工具箱一键操作**：数据清洗、格式美化、智能序号，一键秒级执行。
2. **模糊长尾复合需求 → AI 侧边栏对话化**：“把销售额大于 1 万的行算 3% 提成写到 G 列，并按降序排好添加斑马纹”。AI 先真实读取单元格数据，再自主规划、连续调用内置工具直接改写工作表。
3. **同源架构**：按钮与 AI 共享同一套底层表格操作引擎（`js/tools.js`），工具箱能做的 AI 都能做，透明可靠。

---

### 核心功能特性

#### 1. 顶部功能区选项卡（WpsForge Ribbon）
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

#### 2. AI 全功能侧边栏与效率套件（Taskpane）
- **多模块选项卡架构**：划分为四大功能模块 —— **💬 智能对话**、**⚡ 场景指令库**、**🛠️ 快捷工具箱**、**⚙️ 模型设置中心**。
- **实时选区感知**：自动监听并展示当前表格选区坐标（如 `Sheet1!B2:F15`），支持一键将选区上下文一键注入提问提示词。
- **扩展 20 个内置 AI 深度操作工具（Function Calling）**：AI 支持直接调用单元格着色高亮、合并居中/取消、行列插入删除、行列转置、选区统计、自适应列宽、图表生成等高阶操作。
- **公式一键填入**：智能提取模型回复中的 Excel/WPS 函数公式，提供一键写入当前活动单元格的直达按钮。
- **停止与重试机制**：原生支持 `AbortController` 随时停止生成、回答一键复制与本地对话历史持久化。
- **免 Token 快捷工具箱**：无需消耗 API 额度，离线一键完成选区测算统计、行列转置、导出 Markdown/JSON 及批量填充。
- **广泛模型生态**：预设 DeepSeek、硅基流动、月之暗面 Kimi、智谱 GLM、OpenAI、本地 Ollama 及自定义兼容端点。
- **纯原生矢量 SVG 驱动**：全界面 100% 采用矢量 SVG 渲染，无任何字符表情符号。
- **剪贴板防护与代理容错**：内置专用右键菜单与同源代理自适应回退，杜绝 Webview 快捷键劫持与跨域拦截。

---

### 快速开始（开发调试）

#### 环境要求
- **Node.js** ≥ 18.0.0
- **WPS Office** 个人版 / 365（Windows 或 macOS 均可正常运行）

#### 安装与运行

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

#### 配置与使用 AI 侧边栏

1. 点击顶部功能区「**AI 助手**」→「**AI 侧边栏**」。
2. 点击侧边栏右上角「**设置**」图标，填入您自有服务商的 API Key（如 DeepSeek）。
3. 点击「**测试连接**」，侧边栏将向模型发送 Function Calling 探测包进行握手验证。
4. 验证通过后点击「**保存配置**」，即可开始在对话框输入自然语言指令。

---

### 分发与安装（团队部署）

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

### 系统架构与工程化设计

```
ribbon.xml (功能区 XML 布局)
    │ OnAction
    ▼
js/ribbon.js ──► window.ForgeActions (17 个动作) ───┐
                                                    ├── js/tools/ (core, clean, format, advanced, schema)
ui/taskpane.html (214 行轻量化骨架)                 │   └── 共享原生 WPS JSAPI (window.Application)
    │ Agent 工具调用闭环 (20 个 AI 工具) ────────────►┘
js/taskpane/ (data, tabs, orchestrator, ui...)
```

- **基于官方技术栈**：严格基于金山官方 WPS 加载项（JS Add-in）规范，使用现代 JavaScript 开发，不依赖任何已淘汰的 VBA 运行时。
- **清晰的工程化与组件化分层**：
  - `ui/css/`：抽离解耦的 CSS 样式系统子模块（`base` 基础变量、`layout` 布局骨架、`chat` 消息对话、`scenarios` 场景库、`toolbox` 工具箱、`settings` 设置中心）。
  - `js/tools/`：分层的底层表格操作引擎（`core` 基础设施、`clean` 数据清洗、`format` 格式美化、`advanced` 高阶算力与图表、`schema` AI 规格定义）。
  - `js/taskpane/`：组件化的侧边栏业务与交互层（`constants` 常量图标、`utils` 基础工具、`state` 状态持久化、`selection` 选区感知、`llm` 网络通信、`ui` 视图卡片、`orchestrator` Agent 调度闭环、`data` 声明式配置项、`tabs` 数据驱动渲染与标签页控制）。
- **声明式数据驱动与极简 DOM（类似 v-for）**：场景指令卡片、离线工具箱按钮与快捷胶囊完全解耦为 `data.js` 纯数据，结合轻量模板生成与统一事件委托，使 `ui/taskpane.html` 从初始 1541 行锐减至 **214 行（13KB）**，大幅提升可维护性与加载性能。
- **纯前端自治执行**：AI 调度引擎运行在本地，模型返回 `tool_calls` → 本地调用 WPS JSAPI 执行 → 结果回传模型，形成闭环。
- **高保真操作**：底层通过 WPS 原生对象模型（`Range`、`Worksheet`）直接批量读写，非模拟鼠标键盘点击，稳定高效且支持 `Ctrl+Z` 撤销。

---

### 数据安全与隐私声明

- **零云端存储**：本项目为**无服务器（Serverless）纯客户端插件**。除与您自行配置的模型服务商进行加密 API 通信外，本项目没有任何中间收集服务器，**绝不存储、中转或上传任何个人数据或 API Key**。
- **密钥本地加密留存**：API Key 仅留存在您本机的浏览器本地缓存（`localStorage`）中，不落盘至远程文件。
- **数据按需读取**：AI 仅在用户下达需要识别表格内容的指令时，才调用 `read_range` 工具读取上下文（默认单次限制读取不超过 200 行 × 30 列）。
- **离线能力保障**：如果您不希望任何表格数据接入云端模型，只需不配置 API Key，工具箱全部一键操作功能（清洗、美化、去重、序号等）均**100% 离线可用**。

---

### 参与贡献

欢迎对 WpsForge 进行功能扩充、问题修复或提交设计改进！
1. Fork 本仓库并新建特性分支（`git checkout -b feature/amazing-feature`）。
2. 遵循现有的设计规范：
   - 必须使用纯矢量 SVG 图标，杜绝引入字符/Emoji 图标；
   - 新增表格操作请按分类归入 `js/tools/` 对应子模块（`clean`/`format`/`advanced`），并在 `js/tools/schema.js` 中补充 AI 工具规格，通过 `js/tools.js` 统一汇出保持同源；
   - 保持跨平台（Windows / macOS）与标准 JSAPI 语法兼容。
3. 提交修改（`git commit -m 'feat: add some amazing feature'`）。
4. 推送分支并向 `main` 分支发起 Pull Request。

---

### 开源许可证与法律免责声明

#### 1. 开源许可证
本项目基于 [MIT License](LICENSE) 协议完全开源。您可以自由使用、修改、分发甚至用于商业学习，但需在衍生版本中保留原作者的版权声明与许可条款。

#### 2. 非官方商标免责声明 (Trademark Disclaimer)
- **WPS**、**WPS Office** 及相关徽标为**北京金山办公软件股份有限公司（Kingsoft Office）**的注册商标。
- **WpsForge** 是由独立开源社区开发者发起的第三方效率扩展项目，**与金山办公软件（Kingsoft）无任何官方隶属、赞助、授权、合资或直接商业关联**。
- 本项目仅遵循金山办公官方开放的“WPS 加载项技术规范”进行合规的功能拓展与技术探索。

#### 3. 数据与使用免责条款 (As-Is Disclaimer)
- 本软件按“现状 (AS IS)”提供，作者不对软件的适用性、稳定性或大模型生成内容的绝对准确性做任何明示或暗示的保证。
- 尽管本插件对表格操作提供了 `Ctrl+Z` 撤销支持，但大模型针对复杂数据清洗和单元格改写存在一定随机性。**用户在对重要生产表格执行任何批量清洗、删除或覆写操作前，请务必自行做好原文件备份**。
- 在任何情况下，开发者均不对因使用本软件或模型工具执行所引起的任何直接、间接、偶然或连带的数据损失或业务偏差承担法律责任。
