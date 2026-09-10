# WpsForge ⚒️

**WPS 表格「工具箱 + AI」混合效率加载项** —— 常用高阶操作一键化，长尾需求对话化。

装进 WPS 表格后顶部多出一个 `WpsForge` 选项卡：

- **数据清洗**：删除空行 / 删除空列 / 整行去重 / 清除首尾空格（含全角空格）
- **格式美化**：一键美化（边框+表头+行列宽）/ 斑马纹 / 冻结首行 / 批量序号
- **AI 侧边栏**：说人话直接操作表格 —— "把销售额大于1万的行算 3% 提成写到 G 列"，
  AI 会先读取数据核实，再调用与按钮完全同源的工具函数完成操作

工具箱是确定性的一键按钮，AI 负责理解模糊需求；两者共享同一套实现（`js/tools.js`），
按钮能做的 AI 都能做，且可组合成多步任务。

## 它解决什么问题

以前玩 Excel 的高阶技巧（批量清洗、区域操作、宏）门槛高、分布零散。
WpsForge 把高频操作做成按钮，把低频复杂需求交给 AI —— 相当于
"方方格子式工具箱" 与 "Copilot 式对话操作" 的结合体，并且**完全开源**。

## 快速开始（开发调试）

环境要求：Node.js ≥ 18、本机安装 WPS 个人版/365（Mac 或 Windows 均可）。

```bash
npm install          # 安装依赖（含 wps-jsapi 类型提示）
npm run dev          # 启动本地开发服务（端口 3889）
# 或
wpsjs debug          # 自动注册调试加载项并拉起 WPS，改代码热更新
```

首次 `wpsjs debug` 后重启一次 WPS（功能区 `ribbon.xml` 只在启动时读取）。
在 WPS 表格里看到 **WpsForge** 选项卡即成功。

### 启用 AI 侧边栏

点工具栏「AI 侧边栏」→ 右上角 ⚙ 填 API Key → 点「测试连接」验证 → 保存。
支持任意 **OpenAI 兼容 + function-calling** 的服务，内置预设：DeepSeek（推荐，便宜）、Kimi、智谱 GLM、OpenAI。
Key 只保存在本机 WPS 网页缓存里，直连你选的模型服务商，不经过任何第三方（包括本项目作者）。

**网络兜底**：WPS 侧边栏是 webview，直连某些模型服务（尤其 api.openai.com）会被 CORS 拦截。
此时插件会自动改走本地代理——另开一个终端运行：

```bash
npm run proxy    # 只监听 127.0.0.1:3890，原样转发并补 CORS 头，不落盘任何数据
```

输入框内的复制/粘贴：若系统快捷键被 WPS 宿主抢占，用**右键菜单**（剪切/复制/粘贴/全选）。

## 安装给同事/朋友用

```bash
wpsjs publish        # 生成 wps-addon-build/ 与 wps-addon-publish/
```

把 `wps-addon-build/` 部署到任意 HTTPS 静态目录（GitHub Pages / 对象存储 / 内网服务器），
让对方打开 `wps-addon-publish/publish.html` 的线上地址，点击安装即可，之后 WPS 启动自动检查更新。

没有服务器时的土办法（离线安装，适合当面帮朋友装）：
把构建产物文件夹整个拷到对方的 WPS 加载项目录并写入 publish.xml：

- Windows: `%APPDATA%\kingsoft\wps\jsaddons\`
- macOS: `~/Library/Containers/com.kingsoft.wpsoffice.mac/Data/.kingsoft/wps/jsaddons/`

## 工作原理

```
ribbon.xml (功能区定义)
    │ OnAction
    ▼
js/ribbon.js ──► window.ForgeActions ─┐
                                      ├── js/tools.js  ← WPS jsapi (window.Application)
ui/taskpane.html (AI 侧边栏)           │      同一套表格操作实现
    │ chat + function-calling loop ───►┘
js/taskpane.js
```

- 基于 WPS 官方 **JS 加载项**体系（`wpsjs` 工具包），跨 Windows/Mac，无需 VBA。
- AI 引擎是一个纯前端的 tool-use 循环：模型返回 `tool_calls` → 本地执行 jsapi → 结果回传 → 直到模型给出最终回答。
- 表格读写通过官方对象模型（`ActiveSheet.UsedRange` 等），**不是**模拟点击，速度快且不误触。

## 数据安全声明

- 表格数据只在需要时被 AI 读取（`read_range` 单次最多 200 行 × 30 列），随对话发送给你配置的那个模型服务商。
- 对不放心把数据交给云端模型的用户：AI 功能可以不启用，工具箱部分完全离线可用。
- 插件发起的删除类操作支持 `Ctrl+Z` 撤销，但**保存前请自行备份**，重要表格请先"另存为"。

## 路线图

- [x] MVP：8 个一键工具 + 12 个 AI 工具 + 对话执行引擎
- [ ] 聚光灯（选区十字高亮，条件格式实现避免破坏原有底色）
- [ ] 多工作簿汇总 / 按列拆分工作表（汇总大师类）
- [ ] 图片批量导入导出、区域截图
- [ ] AI 结果预览确认模式（先生成方案 diff，用户点"执行"再落表）
- [ ] 自定义函数库（@customfunction 批量注册常用公式）
- [ ] 多语言 & 安装包一键分发

## 常见问题

**Q: 选项卡没出现？**
A: 重启 WPS（ribbon 只在启动时加载）；检查 `wpsjs debug` 输出的加载项注册是否成功。

**Q: 个人版 WPS 提示加载项被限制？**
A: 个人版 12.1.0.16910 起 `jsplugins.xml` 模式受限，请使用 `publish` 模式或新版 `wpsjs`（本工程已按此设计）。

**Q: 支持微软 Excel 吗？**
A: 不支持。jsapi 是 WPS 特有体系。若做 Excel 版需要迁移到 Office JS Add-in / VSTO，
对象模型高度同构，`tools.js` 的核心逻辑可以直接搬运。

## License

[MIT](LICENSE)
