// js/taskpane.js — WpsForge AI 侧边栏：智能对话与工具执行引擎
(function () {
    "use strict";

    const PROVIDERS = {
        deepseek: { base: "https://api.deepseek.com/v1", model: "deepseek-chat", name: "DeepSeek" },
        siliconflow: { base: "https://api.siliconflow.cn/v1", model: "deepseek-ai/DeepSeek-V3", name: "硅基流动" },
        kimi: { base: "https://api.moonshot.cn/v1", model: "moonshot-v1-8k", name: "Kimi" },
        glm: { base: "https://open.bigmodel.cn/api/paas/v4", model: "glm-4-flash", name: "智谱 GLM" },
        openai: { base: "https://api.openai.com/v1", model: "gpt-4o-mini", name: "OpenAI" },
        custom: { base: "", model: "", name: "自定义" },
    };

    const TOOL_NAMES_ZH = {
        get_sheet_info: "获取表格概况",
        read_range: "读取数据区域",
        write_cells: "写入单元格",
        set_formula: "写入公式",
        clean_data: "数据清洗",
        sort_range: "区域排序",
        find_replace: "查找与替换",
        beautify_table: "一键美化表格",
        add_zebra: "添加斑马纹",
        fill_serial: "填充连续序号",
        freeze_header: "冻结首行",
        set_number_format: "设置数字格式",
    };

    const TOOL_ICONS = {
        get_sheet_info: "📊",
        read_range: "🔍",
        write_cells: "✍️",
        set_formula: "📐",
        clean_data: "🧹",
        sort_range: "↕️",
        find_replace: "🔎",
        beautify_table: "🎨",
        add_zebra: "🏁",
        fill_serial: "🔢",
        freeze_header: "❄️",
        set_number_format: "🏷️",
    };

    const SET_KEY = "wpsforge.settings.v2";
    const OLD_SET_KEY = "wpsforge.settings.v1";
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
            } else if (!line.startsWith("<pre>") && !line.startsWith("<ul>") && !line.startsWith("<h") && !line.startsWith("<li>")) {
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

    // ---------- 对话状态 ----------
    let messages = [];
    let busy = false;

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
        return "你是嵌入在 WPS 表格里的专业智能表格助手 WpsForge，可以通过系统工具直接操作用户当前打开的工作簿。\n" +
            "当前工作簿概况: " + info + "\n" +
            "核心规则:\n" +
            "1. 需要理解数据结构或具体内容时，必须先调用 read_range 读取真实单元格，绝不凭空臆测。\n" +
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
        if (!base) throw new Error("接口地址未设置，请点击右上角 ⚙ 配置");
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
                // 若端点 404 且不是 JSON 响应，说明此代理端点不存在，继续尝试下一个通道
                if (r.status === 404) {
                    const text = await r.clone().text().catch(() => "");
                    if (!/^\s*[{[]/.test(text)) {
                        errors.push(label + "不可用(404)");
                        continue;
                    }
                }
                return r; // 有真实响应交给调用者
            } catch (e) {
                errors.push(label + "异常(" + (e && e.message ? e.message : e) + ")");
            }
        }
        throw new Error("连接模型服务失败（" + errors.join("；") + "）。\n提示：若由于 CORS 跨域拦截，请在终端保持运行 npm run dev 或 npm run proxy。");
    }

    async function callLLM() {
        if (!settings.key) throw new Error("请先点击右上角 ⚙ 设置并保存 API Key");
        const payload = {
            model: settings.model,
            messages: [{ role: "system", content: systemPrompt() }].concat(messages.slice(-HISTORY_KEEP)),
            tools: toolsSchema(),
            temperature: 0.2,
        };

        const resp = await apiRequest("/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + settings.key,
            },
            body: JSON.stringify(payload),
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
        out.textContent = "正在发起连接与工具调用验证…";
        try {
            const resp = await apiRequest("/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + settings.key,
                },
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
                out.textContent = "✅ 连接成功！模型响应正常，且完美支持 Function Calling 工具调用。";
                return;
            }
            out.className = "error";
            if (/tool/i.test(text) && /unsupported|not support|invalid/i.test(text)) {
                out.textContent = `❌ HTTP ${resp.status}：该模型不支持 tools 工具调用参数，请更换支持函数调用的模型（如 deepseek-chat、moonshot-v1-8k、glm-4-flash）。`;
            } else {
                out.textContent = `❌ HTTP ${resp.status}：${text.slice(0, 260)}`;
            }
        } catch (e) {
            out.className = "error";
            out.textContent = "❌ " + (e && e.message ? e.message : e);
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

    // ---------- UI 气泡与卡片构建 ----------
    function scrollToBottom() {
        const chat = $("chat");
        chat.scrollTop = chat.scrollHeight;
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
        header.innerHTML = '<span class="spark">✨</span><span>WpsForge AI</span>';
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

                const icon = TOOL_ICONS[name] || "⚙️";
                const titleZh = TOOL_NAMES_ZH[name] || name;

                card.innerHTML = `
                    <div class="tool-card-header">
                        <div class="tool-info">
                            <span>${icon}</span>
                            <span>${esc(titleZh)}</span>
                            <small style="color:#94a3b8;font-weight:400">(${esc(name)})</small>
                        </div>
                        <span class="tool-badge running">⟳ 执行中</span>
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
                            badge.textContent = ok ? "✓ 完成" : "✗ 失败";
                        }
                        if (desc) {
                            desc.innerHTML = ok
                                ? `<b>结果</b>：${esc(msg || "操作已完成")}`
                                : `<b>错误</b>：<span style="color:#ef4444">${esc(msg || "执行失败")}</span>`;
                        }
                        if (data || argsStr) {
                            const btn = document.createElement("button");
                            btn.className = "tool-detail-toggle";
                            btn.textContent = "展开详情 ▾";
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
                                btn.textContent = isOpen ? "收起详情 ▴" : "展开详情 ▾";
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
                scrollToBottom();
            },
        };
    }

    function setStatus(t) {
        const el = $("status");
        if (el) el.textContent = t;
    }

    // ---------- 发送与执行主循环 ----------
    async function send() {
        const text = $("input").value.trim();
        if (!text || busy) return;
        $("input").value = "";
        busy = true;
        $("btnSend").disabled = true;

        messages.push({ role: "user", content: text });
        addUserMessage(text);

        const aiBubble = createAiMessage();

        try {
            for (let step = 0; step < MAX_TOOL_STEPS; step++) {
                aiBubble.setTyping("思考中…");
                setStatus("AI 正在思考…");

                const msg = await callLLM();

                // 检查是否有模型附带的回复文本
                if (msg.content && msg.content.trim()) {
                    // 若有工具调用又有文本，先展示部分文本
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
                    continue; // 执行完工具，回到循环继续给 LLM 总结或继续下一步
                }

                // 模型给出最终回复
                const finalReply = msg.content || "(完成操作)";
                messages.push({ role: "assistant", content: finalReply });
                aiBubble.setFinalText(finalReply);
                break;
            }
        } catch (e) {
            aiBubble.hideTyping();
            const errMsg = e && e.message ? e.message : String(e);
            aiBubble.content.innerHTML = `
                <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px;color:#991b1b;font-size:12px;">
                    <div style="font-weight:700;margin-bottom:4px;">⚠️ 请求或执行异常</div>
                    <div style="margin-bottom:6px;">${esc(errMsg)}</div>
                    <div style="color:#64748b;font-size:11px;line-height:1.5;">
                        <b>排查建议</b>：<br>
                        1. 点击右上角 ⚙ 检查 API Key、Base URL 与模型名称是否准确。<br>
                        2. 确保选择的模型支持 Function Calling（工具调用），如 DeepSeek-Chat、Kimi 或 GLM-4-Flash。<br>
                        3. 若为本地网络受限，可开启独立代理：<code>npm run proxy</code>。
                    </div>
                </div>
            `;
        } finally {
            busy = false;
            $("btnSend").disabled = false;
            setStatus("");
            scrollToBottom();
        }
    }

    // ---------- 剪贴板处理 (WPS 宿主防抢占) ----------
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
            const items = [["复制", "copy"], ["粘贴", "paste"], ["全选", "selectall"]];
            if (selText(field)) items.unshift(["剪切", "cut"]);
            menu.innerHTML = "";
            items.forEach(([label, op]) => {
                const el = document.createElement("div");
                el.textContent = label;
                el.onmousedown = (ev) => {
                    ev.preventDefault();
                    clipOp(op, field);
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
        const card = document.createElement("div");
        card.className = "welcome-card";
        card.innerHTML = `
            <div class="welcome-header">
                <div class="brand-icon" style="width:24px;height:24px;font-size:12px;">⚒️</div>
                <h4>欢迎使用 WpsForge AI</h4>
            </div>
            <div class="welcome-p">
                我是直接连接 WPS 表格对象模型的智能助手。您可以直接用大白话描述想对表格做的操作，AI 将自动调用内置工具实时执行。
            </div>
            <div class="welcome-tips">
                💡 <b>常用指令</b>：<br>
                • <code>给当前表格做一键美化和斑马纹</code><br>
                • <code>删除所有空行与首尾空格</code><br>
                • <code>读取第 C 列并写入求和公式到末尾</code><br>
                • <code>按金额列降序排列整个表格</code>
            </div>
        `;
        chat.appendChild(card);
    }

    function initForm() {
        $("s-provider").value = settings.provider || "deepseek";
        $("s-base").value = settings.base || PROVIDERS.deepseek.base;
        $("s-key").value = settings.key || "";
        $("s-model").value = settings.model || PROVIDERS.deepseek.model;
        $("wrap-base").style.display = "block";
        updateModelBadge();
    }

    window.onload = function () {
        $("btnSend").onclick = send;
        $("input").addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
            }
        });

        $("btnClear").onclick = function () {
            messages = [];
            $("chat").innerHTML = "";
            showWelcomeCard();
        };

        $("btnConfig").onclick = () => {
            $("settings").classList.toggle("open");
        };

        $("btnHide").onclick = function () {
            try {
                const a = window.Application || (window.wps && (window.wps.EtApplication ? window.wps.EtApplication() : window.wps.Application));
                if (a && a.PluginStorage) {
                    const tsId = a.PluginStorage.getItem("wf_taskpane_id");
                    if (tsId) a.GetTaskPane(tsId).Visible = false;
                }
            } catch (e) { }
        };

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

        function readForm() {
            const provider = $("s-provider").value;
            settings = {
                provider,
                base: $("s-base").value.trim(),
                model: $("s-model").value.trim() || (PROVIDERS[provider] ? PROVIDERS[provider].model : ""),
                key: $("s-key").value.trim(),
            };
            return settings;
        }

        $("btnSave").onclick = function () {
            readForm();
            saveSettings(settings);
            $("settings").classList.remove("open");
            setStatus("设置已成功保存");
            setTimeout(() => setStatus(""), 2000);
        };

        $("btnTest").onclick = function () {
            readForm();
            testConnection();
        };

        $("btnEye").onclick = function () {
            const k = $("s-key");
            const hidden = k.type === "password";
            k.type = hidden ? "text" : "password";
            this.textContent = hidden ? "🙈" : "👁";
        };

        bindCtxMenu();
        initForm();
        if (location.hash === "#settings") {
            $("settings").classList.add("open");
        }
        window.addEventListener("hashchange", () => {
            if (location.hash === "#settings") $("settings").classList.add("open");
        });

        // 快捷指令点击
        document.querySelectorAll(".quick-chip").forEach(el => {
            el.onclick = function () {
                const text = this.textContent.replace(/^[\uD800-\uDBFF\uDC00-\uDFFF\u2600-\u27FF\uFE0F\s]+/g, "").trim();
                $("input").value = text;
                send();
            };
        });

        showWelcomeCard();
    };
})();
