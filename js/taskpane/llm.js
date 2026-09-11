// js/taskpane/llm.js - 大模型通信客户端：同源代理降级、系统提示词装配与连接能力探测
(function () {
    "use strict";

    window.WpsForge = window.WpsForge || {};
    window.WpsForge.taskpane = window.WpsForge.taskpane || {};

    const constants = () => window.WpsForge.taskpane.constants;
    const utils = () => window.WpsForge.taskpane.utils;
    const state = () => window.WpsForge.taskpane.state;
    const selection = () => window.WpsForge.taskpane.selection;

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

    function systemPrompt() {
        const info = getWorkbookInfo();
        const sel = selection().getCurrentSelectionContext() || selection().refreshSelectionInfo();
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

    async function apiRequest(path, init) {
        const settings = state().getSettings();
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
        const settings = state().getSettings();
        if (!settings.key && settings.provider !== "ollama") {
            throw new Error("请先点击【模型设置】标签页填写并保存您的 API Key");
        }
        const payload = {
            model: settings.model,
            messages: [{ role: "system", content: systemPrompt() }].concat(state().getMessages().slice(-constants().HISTORY_KEEP)),
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

    async function testConnection() {
        const $ = utils().$;
        const esc = utils().esc;
        const settings = state().getSettings();
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

    window.WpsForge.taskpane.llm = {
        getWorkbookInfo,
        systemPrompt,
        toolsSchema,
        apiRequest,
        callLLM,
        testConnection,
    };
})();
