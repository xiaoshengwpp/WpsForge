// js/taskpane.js — WpsForge AI 侧边栏：多功能模块、实时选区联动与智能执行引擎
(function () {
    "use strict";

    const PROVIDERS = {
        deepseek: { base: "https://api.deepseek.com/v1", model: "deepseek-chat", name: "DeepSeek" },
        siliconflow: { base: "https://api.siliconflow.cn/v1", model: "deepseek-ai/DeepSeek-V3", name: "硅基流动" },
        kimi: { base: "https://api.moonshot.cn/v1", model: "moonshot-v1-8k", name: "Kimi" },
        glm: { base: "https://open.bigmodel.cn/api/paas/v4", model: "glm-4-flash", name: "智谱 GLM" },
        openai: { base: "https://api.openai.com/v1", model: "gpt-4o-mini", name: "OpenAI" },
        ollama: { base: "http://127.0.0.1:11434/v1", model: "qwen2.5:7b", name: "Ollama 本地" },
        custom: { base: "", model: "", name: "自定义" },
    };

    const TOOL_NAMES_ZH = {
        get_sheet_info: "获取表格概况",
        get_selection: "获取当前选区",
        read_range: "读取数据区域",
        write_cells: "写入单元格",
        set_formula: "写入公式",
        highlight_cells: "单元格着色高亮",
        merge_cells: "单元格合并/居中",
        insert_delete_rows_cols: "插入/删除行列",
        transpose_range: "行列转置",
        quick_stats: "选区快速统计",
        set_col_width_row_height: "调整行列宽",
        create_chart: "创建图表",
        clean_data: "数据清洗",
        sort_range: "区域排序",
        find_replace: "查找与替换",
        beautify_table: "一键美化表格",
        add_zebra: "添加斑马纹",
        fill_serial: "填充连续序号",
        freeze_header: "冻结首行",
        set_number_format: "设置数字格式",
    };

    // 矢量 SVG 图标库
    function getToolSvg(name) {
        const s = "currentColor";
        switch (name) {
            case "get_sheet_info":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M3 9h18M9 21V9"></path></svg>`;
            case "get_selection":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg>`;
            case "read_range":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
            case "write_cells":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
            case "set_formula":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19L10 5M10 19l6-14M14 12h7"></path></svg>`;
            case "highlight_cells":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;
            case "merge_cells":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>`;
            case "insert_delete_rows_cols":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
            case "transpose_range":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>`;
            case "quick_stats":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="18"></line></svg>`;
            case "set_col_width_row_height":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 3 4 7 8 11"></polyline><polyline points="16 3 20 7 16 11"></polyline><line x1="4" y1="7" x2="20" y2="7"></line></svg>`;
            case "create_chart":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`;
            case "clean_data":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line><path d="M3 6h18M3 12h18M3 18h18"></path></svg>`;
            case "sort_range":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 10M6 10l-5-5M6 10V2M18 19l5-5M23 14l-5 5M18 14v8"></path></svg>`;
            case "find_replace":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35M8 11h6M11 8v6"></path></svg>`;
            case "beautify_table":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6Z"></path></svg>`;
            case "add_zebra":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="14" x2="21" y2="14"></line></svg>`;
            case "fill_serial":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h1v4M4 10h2M4 14h2l-2 2h2M4 18h2v2H4z"></path></svg>`;
            case "freeze_header":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="8" x2="21" y2="8"></line><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="12" cy="15" r="2"></circle></svg>`;
            case "set_number_format":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg>`;
            default:
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0-.33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;
        }
    }

    const SVG_SPARKLE = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6Z"/></svg>`;
    const SVG_CHECK = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    const SVG_CROSS = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    const SVG_SPINNER = `<svg class="spin-svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>`;
    const SVG_CHEVRON_DOWN = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex:none;"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
    const SVG_CHEVRON_UP = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex:none;"><polyline points="18 15 12 9 6 15"></polyline></svg>`;
    const SVG_COPY = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;

    const EYE_OPEN = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    const EYE_CLOSED = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

    const SET_KEY = "wpsforge.settings.v2";
    const OLD_SET_KEY = "wpsforge.settings.v1";
    const CHAT_HISTORY_KEY = "wpsforge.chat.history.v1";
    const MAX_TOOL_STEPS = 12;
    const HISTORY_KEEP = 20;

    // ---------- 辅助函数 ----------
    const $ = (id) => document.getElementById(id);

    function esc(s) {
        if (s == null) return "";
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function renderMarkdown(md) {
        if (!md) return "";
        let text = esc(md);

        // 代码块 ```lang ... ```
        text = text.replace(/```([\w-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><code>${code.trim()}</code></pre>`;
        });

        // 行内代码 `code`
        text = text.replace(/`([^`\n]+)`/g, "<code>$1</code>");

        // 粗体 **bold**
        text = text.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");

        // 标题 ### text
        text = text.replace(/^### (.*$)/gim, '<h4 style="font-size:13px;margin:6px 0 3px;">$1</h4>');
        text = text.replace(/^## (.*$)/gim, '<h3 style="font-size:13.5px;margin:8px 0 4px;">$1</h3>');
        text = text.replace(/^# (.*$)/gim, '<h2 style="font-size:14px;margin:10px 0 5px;">$1</h2>');

        // 无序列表 - item
        text = text.replace(/^\s*[-*]\s+(.*)$/gim, "<li>$1</li>");
        text = text.replace(/(<li>.*<\/li>)/gim, "<ul>$1</ul>");
        text = text.replace(/<\/ul>\s*<ul>/gim, "");

        // 换行处理
        const lines = text.split("\n");
        const out = [];
        for (let line of lines) {
            line = line.trim();
            if (!line) {
                out.push("<br>");
            } else if (!line.startsWith("<pre>") && !line.startsWith("<ul>") && !line.startsWith("<h") && !line.startsWith("<li>") && !line.startsWith("<table")) {
                out.push(`<p>${line}</p>`);
            } else {
                out.push(line);
            }
        }
        return out.join("");
    }

    // ---------- 设置读写 ----------
    function loadSettings() {
        let s = {
            provider: "deepseek",
            base: PROVIDERS.deepseek.base,
            model: PROVIDERS.deepseek.model,
            key: "",
            temperature: 0.2,
        };
        try {
            const raw = localStorage.getItem(SET_KEY) || localStorage.getItem(OLD_SET_KEY);
            if (raw) Object.assign(s, JSON.parse(raw));
        } catch (e) { }
        return s;
    }

    function saveSettings(s) {
        localStorage.setItem(SET_KEY, JSON.stringify(s));
        updateModelBadge();
    }

    let settings = loadSettings();

    function updateModelBadge() {
        const badgeName = $("model-badge-name");
        if (badgeName) {
            badgeName.textContent = settings.model || settings.provider || "未配置";
        }
    }

    // ---------- 对话状态与控制器 ----------
    let messages = [];
    let busy = false;
    let abortController = null;
    let lastUserQuery = "";
    let currentSelectionContext = null;

    function saveChatHistory() {
        try {
            localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages.slice(-30)));
        } catch (e) { }
    }

    function loadChatHistory() {
        try {
            const raw = localStorage.getItem(CHAT_HISTORY_KEY);
            if (raw) {
                const list = JSON.parse(raw);
                if (Array.isArray(list) && list.length) {
                    messages = list;
                    for (const m of messages) {
                        if (m.role === "user") {
                            addUserMessage(m.content);
                        } else if (m.role === "assistant" && m.content) {
                            const b = createAiMessage();
                            b.setFinalText(m.content);
                        }
                    }
                    return true;
                }
            }
        } catch (e) { }
        return false;
    }

    function getWorkbookInfo() {
        try {
            if (window.ForgeTools) {
                const tool = window.ForgeTools.find(t => t.name === "get_sheet_info");
                if (tool) {
                    const r = tool.run();
                    if (r && r.data) return JSON.stringify(r.data);
                    if (r && r.msg) return r.msg;
                }
            }
        } catch (e) {
            return "（尚未打开表格文件或正在加载）";
        }
        return "（未检测到活动工作簿）";
    }

    function getActiveSelectionContext() {
        try {
            if (window.ForgeActions && window.ForgeActions.getSelectionInfo) {
                const r = window.ForgeActions.getSelectionInfo();
                if (r && r.data) {
                    return r.data;
                }
            }
        } catch (e) { }
        return null;
    }

    function systemPrompt() {
        const info = getWorkbookInfo();
        const sel = getActiveSelectionContext();
        let selStr = "当前无特定选区";
        if (sel && sel.address) {
            selStr = `${sel.sheet}!${sel.address} (${sel.rows}行 × ${sel.columns}列)`;
        }

        return "你是嵌入在 WPS 表格里的专业智能表格助手 WpsForge，可以通过系统工具直接操作用户当前打开的工作簿。\n" +
            "当前工作簿概况: " + info + "\n" +
            "当前用户活动选区: " + selStr + "\n" +
            "核心规则:\n" +
            "1. 需要理解数据结构或具体内容时，必须先调用 read_range 或 get_selection 读取真实单元格，绝不凭空臆测。\n" +
            "2. 生成公式使用 set_formula（公式必须以=开头，写入前核对行列位置）；成批写入使用 write_cells。\n" +
            "3. clean_data 中的删行、删列、整行去重为破坏性操作，若数据较多请提示用户支持 Ctrl+Z 撤销。\n" +
            "4. 一次回复中可连续调用多个工具协同完成复合任务；每一步给出简洁明了的说明。\n" +
            "5. 回答始终使用中文，语言专业、精炼、清晰。";
    }

    function toolsSchema() {
        if (!window.ForgeTools) return [];
        return window.ForgeTools.map(t => ({
            type: "function",
            function: {
                name: t.name,
                description: t.description,
                parameters: t.parameters,
            },
        }));
    }

    // ---------- 网络请求与多级代理 ----------
    async function apiRequest(path, init) {
        const base = (settings.base || "").replace(/\/+$/, "");
        if (!base) throw new Error("接口地址未设置，请在【模型设置】标签页中设置并保存配置");
        const target = base + path;

        const via = () => Object.assign({}, init, {
            headers: Object.assign({}, init.headers, { "X-WF-Target": target }),
        });

        // 智能推导内嵌代理地址
        let embeddedProxy = "/llm-proxy";
        if (!window.location.origin || window.location.origin === "null" || window.location.protocol === "file:") {
            embeddedProxy = "http://127.0.0.1:3889/llm-proxy";
        }

        const attempts = [
            ["直连", () => fetch(target, init)],
            ["内嵌代理", () => fetch(embeddedProxy, via())],
            ["备用端口代理", () => fetch("http://localhost:3889/llm-proxy", via())],
            ["独立代理", () => fetch("http://127.0.0.1:3890/proxy", via())],
        ];

        const errors = [];
        for (const [label, fn] of attempts) {
            try {
                const r = await fn();
                if (r.status === 404) {
                    const text = await r.clone().text().catch(() => "");
                    if (!/^\s*[{[]/.test(text)) {
                        errors.push(label + "不可用(404)");
                        continue;
                    }
                }
                return r;
            } catch (e) {
                if (e.name === "AbortError") throw e;
                errors.push(label + "异常(" + (e && e.message ? e.message : e) + ")");
            }
        }
        throw new Error("连接模型服务失败（" + errors.join("；") + "）。\n提示：若由于 CORS 跨域拦截，请保持终端开发服务运行。");
    }

    async function callLLM(signal) {
        if (!settings.key && settings.provider !== "ollama") {
            throw new Error("请先点击【模型设置】标签页填写并保存您的 API Key");
        }
        const payload = {
            model: settings.model,
            messages: [{ role: "system", content: systemPrompt() }].concat(messages.slice(-HISTORY_KEEP)),
            tools: toolsSchema(),
            temperature: Number(settings.temperature ?? 0.2),
        };

        const headers = { "Content-Type": "application/json" };
        if (settings.key) headers["Authorization"] = "Bearer " + settings.key;

        const resp = await apiRequest("/chat/completions", {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
            signal,
        });

        if (!resp.ok) {
            let detail = "";
            try { detail = (await resp.text()).slice(0, 400); } catch (e) { }
            throw new Error(`API 状态错误 HTTP ${resp.status}: ${detail || resp.statusText}`);
        }

        const j = await resp.json();
        if (!j.choices || !j.choices.length) {
            throw new Error("模型未返回有效 choices: " + JSON.stringify(j).slice(0, 300));
        }
        return j.choices[0].message;
    }

    // ---------- 测试连接 ----------
    async function testConnection() {
        const out = $("test-result");
        out.className = "loading";
        out.textContent = "正在发起连接与工具调用能力验证…";
        try {
            const headers = { "Content-Type": "application/json" };
            if (settings.key) headers["Authorization"] = "Bearer " + settings.key;

            const resp = await apiRequest("/chat/completions", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    model: settings.model,
                    messages: [{ role: "user", content: "ping" }],
                    tools: toolsSchema(),
                    max_tokens: 5,
                }),
            });
            const text = await resp.text();
            if (resp.ok) {
                out.className = "success";
                out.innerHTML = `
                    <div style="display:flex;align-items:center;gap:6px;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        <span>连接成功！模型响应正常，且已通过 Function Calling 自动化工具链验证。</span>
                    </div>
                `;
                return;
            }
            out.className = "error";
            const errIcon = `<svg style="flex:none;margin-top:2px;" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
            if (/tool/i.test(text) && /unsupported|not support|invalid/i.test(text)) {
                out.innerHTML = `
                    <div style="display:flex;align-items:flex-start;gap:6px;">
                        ${errIcon}
                        <span>HTTP ${resp.status}：该模型不支持 tools 工具调用参数，请更换支持函数调用的模型（如 deepseek-chat、moonshot-v1-8k、glm-4-flash）。</span>
                    </div>
                `;
            } else {
                out.innerHTML = `
                    <div style="display:flex;align-items:flex-start;gap:6px;">
                        ${errIcon}
                        <span>HTTP ${resp.status}：${esc(text.slice(0, 260))}</span>
                    </div>
                `;
            }
        } catch (e) {
            out.className = "error";
            out.innerHTML = `
                <div style="display:flex;align-items:flex-start;gap:6px;">
                    <svg style="flex:none;margin-top:2px;" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                    <span>${esc(e && e.message ? e.message : String(e))}</span>
                </div>
            `;
        }
    }

    // ---------- 执行工具 ----------
    function execTool(name, argsJson) {
        if (!window.ForgeTools) return { ok: false, error: "未找到工具注册表 ForgeTools" };
        const tool = window.ForgeTools.find(t => t.name === name);
        if (!tool) return { ok: false, error: "未知工具: " + name };

        let args = {};
        if (typeof argsJson === "object" && argsJson !== null) {
            args = argsJson;
        } else if (typeof argsJson === "string") {
            const raw = argsJson.trim();
            if (raw) {
                try {
                    args = JSON.parse(raw);
                } catch (e) {
                    return { ok: false, error: "参数格式异常: " + raw.slice(0, 100) };
                }
            }
        }

        try {
            const r = tool.run(args) || {};
            return { ok: true, msg: r.msg || "完成", data: r.data };
        } catch (e) {
            return { ok: false, error: e && e.message ? e.message : String(e) };
        }
    }

    // ---------- 实时选区感知 ----------
    function refreshSelectionInfo() {
        try {
            if (window.ForgeActions && window.ForgeActions.getSelectionInfo) {
                const r = window.ForgeActions.getSelectionInfo();
                if (r && r.data) {
                    const d = r.data;
                    currentSelectionContext = d;
                    const el = $("sel-pill");
                    if (el) {
                        el.textContent = `${d.sheet}!${d.address} (${d.rows}×${d.columns})`;
                        el.title = `工作表: ${d.sheet}\n选区地址: ${d.address}\n维度: ${d.rows} 行 × ${d.columns} 列`;
                    }
                    return d;
                }
            }
        } catch (e) { }
        const el = $("sel-pill");
        if (el) el.textContent = "未检测到选区";
        return null;
    }

    // ---------- UI 气泡与消息卡片构建 ----------
    function scrollToBottom() {
        const chat = $("chat");
        if (chat) chat.scrollTop = chat.scrollHeight;
    }

    function addUserMessage(text) {
        const row = document.createElement("div");
        row.className = "msg-row";
        const div = document.createElement("div");
        div.className = "msg user";
        div.textContent = text;
        row.appendChild(div);
        $("chat").appendChild(row);
        scrollToBottom();
    }

    function createAiMessage() {
        const row = document.createElement("div");
        row.className = "msg-row";

        const div = document.createElement("div");
        div.className = "msg ai";

        const header = document.createElement("div");
        header.className = "ai-avatar-bar";
        header.innerHTML = `
            <div class="ai-avatar-name">
                ${SVG_SPARKLE}
                <span>WpsForge AI</span>
            </div>
            <div class="ai-msg-actions">
                <button class="msg-action-btn btn-copy-msg" title="复制完整回答">
                    ${SVG_COPY}
                    <span>复制</span>
                </button>
            </div>
        `;
        div.appendChild(header);

        const toolList = document.createElement("div");
        toolList.className = "tool-list";
        div.appendChild(toolList);

        const content = document.createElement("div");
        content.className = "msg-content";
        div.appendChild(content);

        const typing = document.createElement("div");
        typing.className = "typing-indicator";
        typing.innerHTML = '<span class="dot-flashing"></span><span class="dot-flashing"></span><span class="dot-flashing"></span><span class="typing-text">正在思考…</span>';
        div.appendChild(typing);

        row.appendChild(div);
        $("chat").appendChild(row);
        scrollToBottom();

        // 绑定复制按钮
        header.querySelector(".btn-copy-msg").onclick = function () {
            const raw = content.innerText || content.textContent;
            clipWrite(raw).then(() => {
                const sp = this.querySelector("span");
                if (sp) {
                    sp.textContent = "已复制";
                    setTimeout(() => { sp.textContent = "复制"; }, 1500);
                }
            });
        };

        return {
            row,
            div,
            toolList,
            content,
            typing,
            setTyping(text) {
                const t = typing.querySelector(".typing-text");
                if (t) t.textContent = text;
                typing.style.display = "inline-flex";
                scrollToBottom();
            },
            hideTyping() {
                typing.style.display = "none";
            },
            addToolCard(name, argsStr) {
                const card = document.createElement("div");
                card.className = "tool-card";

                const iconSvg = getToolSvg(name);
                const titleZh = TOOL_NAMES_ZH[name] || name;

                card.innerHTML = `
                    <div class="tool-card-header">
                        <div class="tool-info">
                            <span style="display:inline-flex;align-items:center;color:#6366f1;">${iconSvg}</span>
                            <span>${esc(titleZh)}</span>
                            <small style="color:#94a3b8;font-weight:400">(${esc(name)})</small>
                        </div>
                        <span class="tool-badge running">
                            ${SVG_SPINNER}
                            <span>执行中</span>
                        </span>
                    </div>
                    <div class="tool-desc">正在处理表格数据…</div>
                `;
                toolList.appendChild(card);
                scrollToBottom();

                return {
                    finish(ok, msg, data) {
                        const badge = card.querySelector(".tool-badge");
                        const desc = card.querySelector(".tool-desc");
                        if (badge) {
                            badge.className = "tool-badge " + (ok ? "success" : "error");
                            badge.innerHTML = (ok ? SVG_CHECK : SVG_CROSS) + `<span>${ok ? "完成" : "失败"}</span>`;
                        }
                        if (desc) {
                            desc.innerHTML = ok
                                ? `<b>结果</b>：${esc(msg || "操作已完成")}`
                                : `<b>错误</b>：<span style="color:#ef4444">${esc(msg || "执行失败")}</span>`;
                        }
                        if (data || argsStr) {
                            const btn = document.createElement("button");
                            btn.className = "tool-detail-toggle";
                            btn.innerHTML = `<span>展开详情</span>${SVG_CHEVRON_DOWN}`;
                            const detailBox = document.createElement("div");
                            detailBox.className = "tool-detail-content";
                            const payload = {};
                            if (argsStr) {
                                try { payload.arguments = JSON.parse(argsStr); } catch (e) { payload.arguments = argsStr; }
                            }
                            if (data) payload.data = data;
                            detailBox.textContent = JSON.stringify(payload, null, 2);

                            btn.onclick = () => {
                                const isOpen = detailBox.classList.toggle("open");
                                btn.innerHTML = isOpen ? `<span>收起详情</span>${SVG_CHEVRON_UP}` : `<span>展开详情</span>${SVG_CHEVRON_DOWN}`;
                                scrollToBottom();
                            };
                            card.appendChild(btn);
                            card.appendChild(detailBox);
                        }
                        scrollToBottom();
                    }
                };
            },
            setFinalText(text) {
                this.hideTyping();
                content.innerHTML = renderMarkdown(text);

                // 公式快速填入卡片检测
                const formulas = [];
                const formulaRegex = /(=[A-Z0-9_]+\([^\n]+\))/g;
                let m;
                while ((m = formulaRegex.exec(text)) !== null) {
                    if (!formulas.includes(m[1])) formulas.push(m[1]);
                }
                if (formulas.length > 0) {
                    formulas.slice(0, 3).forEach(f => {
                        const dock = document.createElement("div");
                        dock.className = "formula-dock-bar";
                        dock.innerHTML = `
                            <span>公式: <code>${esc(f)}</code></span>
                            <button>填入选区</button>
                        `;
                        dock.querySelector("button").onclick = () => {
                            try {
                                if (window.ForgeActions) {
                                    const a = window.Application || (window.wps && (window.wps.EtApplication ? window.wps.EtApplication() : window.wps.Application));
                                    const sel = a ? a.Selection : null;
                                    if (sel && sel.Address) {
                                        sel.Formula = f;
                                        setStatus(`已填入公式 ${f} 到 ${sel.Address(false, false)}`);
                                    } else {
                                        setStatus("请先在表格中选定目标单元格");
                                    }
                                }
                            } catch (err) {
                                setStatus("填入公式受限: " + (err && err.message ? err.message : err));
                            }
                        };
                        content.appendChild(dock);
                    });
                }

                scrollToBottom();
            },
        };
    }

    function setStatus(t) {
        const el = $("status");
        if (el) el.textContent = t;
    }

    // ---------- 发送与执行主循环 ----------
    async function send(customText) {
        const inputEl = $("input");
        const text = (customText || inputEl.value).trim();
        if (!text || busy) return;

        if (!customText) inputEl.value = "";
        lastUserQuery = text;
        busy = true;

        $("btnSend").disabled = true;
        const btnStop = $("btnStop");
        if (btnStop) btnStop.classList.add("active");

        abortController = new AbortController();

        // 处理选区上下文关联
        let fullQuery = text;
        const ctxTag = $("context-tag");
        if (ctxTag && ctxTag.classList.contains("open") && currentSelectionContext) {
            fullQuery = `【用户当前选区: ${currentSelectionContext.sheet}!${currentSelectionContext.address}，共 ${currentSelectionContext.rows} 行 × ${currentSelectionContext.columns} 列】\n` + text;
        }

        messages.push({ role: "user", content: fullQuery });
        addUserMessage(text);
        saveChatHistory();

        const aiBubble = createAiMessage();

        try {
            for (let step = 0; step < MAX_TOOL_STEPS; step++) {
                if (abortController.signal.aborted) throw new Error("生成已由用户中止");

                aiBubble.setTyping("思考中…");
                setStatus("AI 正在思考…");

                const msg = await callLLM(abortController.signal);

                if (msg.content && msg.content.trim()) {
                    if (msg.tool_calls && msg.tool_calls.length) {
                        const pre = document.createElement("div");
                        pre.style.marginBottom = "6px";
                        pre.innerHTML = renderMarkdown(msg.content);
                        aiBubble.content.appendChild(pre);
                    }
                }

                // 处理 Function Calling
                if (msg.tool_calls && msg.tool_calls.length) {
                    messages.push({
                        role: "assistant",
                        content: msg.content || null,
                        tool_calls: msg.tool_calls,
                    });

                    for (const tc of msg.tool_calls) {
                        if (abortController.signal.aborted) throw new Error("生成已由用户中止");

                        const fnName = tc.function.name;
                        const fnArgs = tc.function.arguments;

                        aiBubble.setTyping(`正在执行 ${TOOL_NAMES_ZH[fnName] || fnName}…`);
                        setStatus(`执行工具: ${fnName}…`);

                        const cardHandler = aiBubble.addToolCard(fnName, fnArgs);
                        const result = execTool(fnName, fnArgs);

                        cardHandler.finish(result.ok, result.ok ? result.msg : result.error, result.data);

                        messages.push({
                            role: "tool",
                            tool_call_id: tc.id || ("call_" + Math.random().toString(36).slice(2, 9)),
                            content: JSON.stringify(result).slice(0, 15000),
                        });
                    }
                    saveChatHistory();
                    refreshSelectionInfo();
                    continue;
                }

                // 模型给出最终回复
                const finalReply = msg.content || "(完成操作)";
                messages.push({ role: "assistant", content: finalReply });
                aiBubble.setFinalText(finalReply);
                saveChatHistory();
                refreshSelectionInfo();
                break;
            }
        } catch (e) {
            aiBubble.hideTyping();
            const errMsg = e && e.message ? e.message : String(e);
            if (e.name === "AbortError" || errMsg.includes("中止")) {
                aiBubble.content.innerHTML = `
                    <div style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;padding:8px;color:#64748b;font-size:11.5px;">
                        <span>操作已停止。</span>
                    </div>
                `;
            } else {
                aiBubble.content.innerHTML = `
                    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px;color:#991b1b;font-size:12px;">
                        <div style="display:flex;align-items:center;gap:6px;font-weight:700;margin-bottom:6px;">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                            <span>请求或执行异常</span>
                        </div>
                        <div style="margin-bottom:6px;">${esc(errMsg)}</div>
                        <div style="color:#64748b;font-size:11px;line-height:1.5;">
                            <b>排查建议</b>：<br>
                            1. 检查【模型设置】中的 API Key、Base URL 与模型名称是否准确。<br>
                            2. 确保选择的模型支持 Function Calling（工具调用），如 DeepSeek-Chat、Kimi 或 GLM-4-Flash。<br>
                            3. 如为本地网络环境，可启动开发服务代理转发。
                        </div>
                    </div>
                `;
            }
        } finally {
            busy = false;
            $("btnSend").disabled = false;
            if (btnStop) btnStop.classList.remove("active");
            abortController = null;
            setStatus("");
            scrollToBottom();
        }
    }

    // ---------- 剪贴板处理 (WPS 宿主环境防抢占) ----------
    const isEditable = (el) => !!(el && el.matches && el.matches("input, textarea"));

    function selText(field) {
        const s = field.selectionStart, e = field.selectionEnd;
        return (s != null && e != null && e > s) ? field.value.slice(s, e) : "";
    }

    function clipWrite(t) {
        try { return navigator.clipboard.writeText(t); } catch (e) { }
        try {
            const ta = document.createElement("textarea");
            ta.value = t;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            ta.remove();
        } catch (e) { }
        return Promise.resolve();
    }

    function clipRead() {
        try { return navigator.clipboard.readText().catch(() => null); } catch (e) { return Promise.resolve(null); }
    }

    function insertText(field, text) {
        field.focus();
        let ok = false;
        try { ok = document.execCommand("insertText", false, text); } catch (e) { }
        if (!ok) {
            const s = field.selectionStart ?? field.value.length;
            const e = field.selectionEnd ?? field.value.length;
            field.value = field.value.slice(0, s) + text + field.value.slice(e);
            field.dispatchEvent(new Event("input", { bubbles: true }));
            field.selectionStart = field.selectionEnd = s + text.length;
        }
    }

    function clipOp(op, field) {
        field = field || document.activeElement;
        if (!isEditable(field)) return;
        if (op === "copy") {
            clipWrite(selText(field) || field.value);
        } else if (op === "cut") {
            const t = selText(field);
            if (t) { clipWrite(t); insertText(field, ""); }
        } else if (op === "paste") {
            clipRead().then((t) => { if (t != null && t !== "") insertText(field, t); });
        } else if (op === "selectall") {
            field.focus();
            field.select();
        }
    }

    document.addEventListener("keydown", (e) => {
        if (!(e.metaKey || e.ctrlKey) || !isEditable(e.target)) return;
        const k = (e.key || "").toLowerCase();
        const map = { c: "copy", v: "paste", x: "cut", a: "selectall" };
        if (!map[k]) return;
        e.preventDefault();
        clipOp(map[k], e.target);
    });

    function bindCtxMenu() {
        const menu = $("ctxmenu");
        document.addEventListener("contextmenu", (e) => {
            if (!isEditable(e.target)) return;
            e.preventDefault();
            const field = e.target;
            const items = [
                {
                    label: "复制",
                    op: "copy",
                    svg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`
                },
                {
                    label: "粘贴",
                    op: "paste",
                    svg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1"></rect></svg>`
                },
                {
                    label: "全选",
                    op: "selectall",
                    svg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M9 3v18M3 9h18"></path></svg>`
                }
            ];
            if (selText(field)) {
                items.unshift({
                    label: "剪切",
                    op: "cut",
                    svg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg>`
                });
            }
            menu.innerHTML = "";
            items.forEach((item) => {
                const el = document.createElement("div");
                el.innerHTML = `${item.svg}<span>${item.label}</span>`;
                el.onmousedown = (ev) => {
                    ev.preventDefault();
                    clipOp(item.op, field);
                    menu.style.display = "none";
                };
                menu.appendChild(el);
            });
            menu.style.display = "block";
            menu.style.left = Math.max(0, Math.min(e.clientX, window.innerWidth - 110)) + "px";
            menu.style.top = Math.max(0, Math.min(e.clientY, window.innerHeight - menu.offsetHeight - 4)) + "px";
        });
        document.addEventListener("mousedown", (e) => {
            if (menu.style.display === "block" && !menu.contains(e.target)) menu.style.display = "none";
        });
    }

    // ---------- 初始化与界面事件绑定 ----------
    function showWelcomeCard() {
        const chat = $("chat");
        if (!chat) return;
        const card = document.createElement("div");
        card.className = "welcome-card";
        card.innerHTML = `
            <div class="welcome-header">
                <div class="brand-icon" style="width:24px;height:24px;border-radius:6px;background:var(--primary-gradient);display:flex;align-items:center;justify-content:center;color:#fff;">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
                </div>
                <h4>欢迎使用 WpsForge AI 智能伴侣</h4>
            </div>
            <div class="welcome-p">
                我直接连接 WPS 表格对象模型，支持智能选区感知与 Function Calling 自动化执行。用大白话描述您的需求，AI 将自动调用内置工具精确操作表格。
            </div>
            <div style="font-size:11px;font-weight:600;color:#475569;margin-bottom:6px;">推荐新手试试：</div>
            <div class="welcome-grid">
                <button class="welcome-grid-btn" data-p="对当前选区执行一键商务美化并添加斑马纹">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6Z"/></svg>
                    <span>商务美化报表</span>
                </button>
                <button class="welcome-grid-btn" data-p="清理当前工作表中的所有空白行与多余空格">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    <span>删除全部空行</span>
                </button>
                <button class="welcome-grid-btn" data-p="读取当前选区数据，并在下方写出求和与平均值公式">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"></rect></svg>
                    <span>写入求和公式</span>
                </button>
                <button class="welcome-grid-btn" data-p="帮我分析当前表格数据结构并给出分析总结">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><circle cx="11" cy="11" r="8"></circle></svg>
                    <span>数据诊断与洞察</span>
                </button>
            </div>
        `;
        chat.appendChild(card);

        card.querySelectorAll(".welcome-grid-btn").forEach(btn => {
            btn.onclick = function () {
                const p = this.getAttribute("data-p");
                if (p) {
                    $("input").value = p;
                    send();
                }
            };
        });
    }

    function initForm() {
        $("s-provider").value = settings.provider || "deepseek";
        $("s-base").value = settings.base || PROVIDERS.deepseek.base;
        $("s-key").value = settings.key || "";
        $("s-model").value = settings.model || PROVIDERS.deepseek.model;
        const temp = settings.temperature ?? 0.2;
        $("s-temp").value = temp;
        $("s-temp-val").textContent = temp;
        $("wrap-base").style.display = "block";
        updateModelBadge();
    }

    // 切换 Tab 模块
    function switchTab(tabName) {
        document.querySelectorAll(".tab-btn").forEach(b => {
            b.classList.toggle("active", b.getAttribute("data-tab") === tabName);
        });
        document.querySelectorAll(".tab-content-view").forEach(v => {
            v.classList.toggle("active", v.id === "view-" + tabName);
        });
        if (tabName === "chat") {
            scrollToBottom();
        } else if (tabName === "settings") {
            initForm();
        }
    }

    // 工具箱模态面板展示
    function showToolboxResult(title, content) {
        const modal = $("tb-modal");
        const titleEl = $("tb-modal-title-text");
        const bodyEl = $("tb-modal-body");
        if (modal && titleEl && bodyEl) {
            titleEl.textContent = title;
            bodyEl.textContent = content;
            modal.classList.add("open");
        }
    }

    window.onload = function () {
        // Tab 按钮绑定
        document.querySelectorAll(".tab-btn").forEach(btn => {
            btn.onclick = function () {
                switchTab(this.getAttribute("data-tab"));
            };
        });

        // 发送与停止按钮
        $("btnSend").onclick = () => send();
        $("btnStop").onclick = function () {
            if (abortController) {
                abortController.abort();
                setStatus("已请求停止");
            }
        };

        $("input").addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
            }
        });

        // 选区感知工具条
        $("btnRefreshSel").onclick = () => {
            const d = refreshSelectionInfo();
            setStatus(d ? `已更新选区: ${d.sheet}!${d.address}` : "未检测到活动选区");
            setTimeout(() => setStatus(""), 2000);
        };

        $("btnInsertSel").onclick = function () {
            const d = currentSelectionContext || refreshSelectionInfo();
            if (d && d.address) {
                const tag = $("context-tag");
                const tagText = $("context-tag-text");
                tagText.textContent = `已关联选区: ${d.sheet}!${d.address} (${d.rows}×${d.columns})`;
                tag.classList.add("open");
                switchTab("chat");
                $("input").focus();
            } else {
                setStatus("请先在表格中选择任意单元格或区域");
            }
        };

        $("context-tag-close").onclick = function () {
            $("context-tag").classList.remove("open");
        };

        $("btnQuickStatsSel").onclick = function () {
            try {
                if (window.ForgeActions && window.ForgeActions.quickStats) {
                    const r = window.ForgeActions.quickStats();
                    if (r && r.data) {
                        const d = r.data;
                        const summary = `【${d.address} 快速统计】\n总格数: ${d.total}\n非空数: ${d.nonBlank}\n数值数: ${d.numCount}\n求和 (Sum): ${d.sum ?? "-"}\n平均值 (Avg): ${d.avg ?? "-"}\n最小值 (Min): ${d.min ?? "-"}\n最大值 (Max): ${d.max ?? "-"}`;
                        switchTab("toolbox");
                        showToolboxResult("选区统计分析结果", summary);
                    }
                }
            } catch (err) {
                setStatus("统计失败: " + (err && err.message ? err.message : err));
            }
        };

        // 清空对话
        $("btnClear").onclick = function () {
            messages = [];
            localStorage.removeItem(CHAT_HISTORY_KEY);
            $("chat").innerHTML = "";
            showWelcomeCard();
            setStatus("对话记录已清空");
            setTimeout(() => setStatus(""), 1500);
        };

        // 收起侧边栏
        $("btnHide").onclick = function () {
            try {
                const a = window.Application || (window.wps && (window.wps.EtApplication ? window.wps.EtApplication() : window.wps.Application));
                if (a && a.PluginStorage) {
                    const tsId = a.PluginStorage.getItem("wf_taskpane_id");
                    if (tsId) a.GetTaskPane(tsId).Visible = false;
                }
            } catch (e) { }
        };

        // 场景库事件绑定
        document.querySelectorAll(".sc-fill").forEach(btn => {
            btn.onclick = function () {
                const p = this.getAttribute("data-prompt");
                if (p) {
                    $("input").value = p;
                    switchTab("chat");
                    $("input").focus();
                }
            };
        });

        document.querySelectorAll(".sc-run").forEach(btn => {
            btn.onclick = function () {
                const p = this.getAttribute("data-prompt");
                if (p) {
                    switchTab("chat");
                    send(p);
                }
            };
        });

        // 快捷指令胶囊栏
        document.querySelectorAll(".quick-chip").forEach(el => {
            el.onclick = function () {
                const p = this.getAttribute("data-prompt") || this.querySelector("span")?.textContent?.trim();
                if (p) send(p);
            };
        });

        // 快捷工具箱离线动作绑定
        $("tb-modal-close").onclick = () => {
            $("tb-modal").classList.remove("open");
        };

        function runToolboxAction(name, runner) {
            try {
                const res = runner();
                if (res && res.msg) setStatus(res.msg);
                return res;
            } catch (e) {
                setStatus("操作失败: " + (e && e.message ? e.message : e));
            }
        }

        $("tb-quick-stats").onclick = () => {
            const r = runToolboxAction("选区统计", () => window.ForgeActions.quickStats());
            if (r && r.data) {
                const d = r.data;
                const summary = `【${d.address} 数据统计】\n总单元格数: ${d.total}\n非空数: ${d.nonBlank}\n空白数: ${d.blank}\n数值个数: ${d.numCount}\n求和: ${d.sum ?? "-"}\n平均值: ${d.avg ?? "-"}\n最小值: ${d.min ?? "-"}\n最大值: ${d.max ?? "-"}`;
                showToolboxResult("选区统计测算结果", summary);
            }
        };

        $("tb-transpose").onclick = () => {
            const r = runToolboxAction("行列转置", () => window.ForgeActions.transpose());
            if (r && r.msg) showToolboxResult("行列转置完成", r.msg);
        };

        $("tb-export-md").onclick = () => {
            const r = runToolboxAction("导出 Markdown", () => window.ForgeActions.exportMarkdown());
            if (r && r.data && r.data.text) {
                clipWrite(r.data.text).then(() => {
                    showToolboxResult("已复制 Markdown 表格至剪贴板", r.data.text);
                });
            }
        };

        $("tb-export-json").onclick = () => {
            const r = runToolboxAction("导出 JSON", () => window.ForgeActions.exportJson());
            if (r && r.data && r.data.text) {
                clipWrite(r.data.text).then(() => {
                    showToolboxResult("已复制 JSON 数组至剪贴板", r.data.text);
                });
            }
        };

        $("tb-beautify").onclick = () => runToolboxAction("表格美化", () => window.ForgeActions.beautify());
        $("tb-zebra").onclick = () => runToolboxAction("斑马纹", () => window.ForgeActions.addZebra());
        $("tb-highlight-yellow").onclick = () => runToolboxAction("高亮黄色", () => window.ForgeActions.highlight(null, "yellow"));
        $("tb-highlight-clear").onclick = () => runToolboxAction("清除高亮", () => window.ForgeActions.highlight(null, "clear"));
        $("tb-freeze").onclick = () => runToolboxAction("冻结首行", () => window.ForgeActions.freeze());
        $("tb-autofit").onclick = () => runToolboxAction("自适应列宽", () => window.ForgeActions.autoFit());
        $("tb-del-empty-rows").onclick = () => runToolboxAction("删除空行", () => window.ForgeActions.deleteEmptyRows());
        $("tb-del-dup").onclick = () => runToolboxAction("整行去重", () => window.ForgeActions.removeDuplicates());
        $("tb-trim").onclick = () => runToolboxAction("去空格", () => window.ForgeActions.trimText());
        $("tb-fill-serial").onclick = () => runToolboxAction("填充序号", () => window.ForgeActions.fillSerial());

        // 模型设置相关
        $("s-provider").onchange = function () {
            const val = this.value;
            const p = PROVIDERS[val];
            if (p) {
                if (val !== "custom") {
                    $("s-base").value = p.base;
                    $("s-model").value = p.model;
                }
            }
        };

        $("s-temp").oninput = function () {
            $("s-temp-val").textContent = this.value;
        };

        function readForm() {
            const provider = $("s-provider").value;
            settings = {
                provider,
                base: $("s-base").value.trim(),
                model: $("s-model").value.trim() || (PROVIDERS[provider] ? PROVIDERS[provider].model : ""),
                key: $("s-key").value.trim(),
                temperature: Number($("s-temp").value || 0.2),
            };
            return settings;
        }

        $("btnSave").onclick = function () {
            readForm();
            saveSettings(settings);
            setStatus("配置已成功保存");
            setTimeout(() => setStatus(""), 2000);
            switchTab("chat");
        };

        $("btnTest").onclick = function () {
            readForm();
            testConnection();
        };

        $("btnEye").onclick = function () {
            const k = $("s-key");
            const hidden = k.type === "password";
            k.type = hidden ? "text" : "password";
            this.innerHTML = hidden ? EYE_CLOSED : EYE_OPEN;
        };

        bindCtxMenu();
        initForm();
        refreshSelectionInfo();

        // 尝试载入历史聊天，若无则展示欢迎卡片
        const hasHistory = loadChatHistory();
        if (!hasHistory) {
            showWelcomeCard();
        }

        // 定时与窗口激活时刷新选区状态
        window.addEventListener("focus", refreshSelectionInfo);
        setInterval(refreshSelectionInfo, 4000);
    };
})();
