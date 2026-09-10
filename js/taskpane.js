// js/taskpane.js — AI 侧边栏：对话 + function-calling 执行引擎
// 复用 js/tools.js 中的 window.ForgeTools 注册表，与功能区按钮共享同一套操作实现。
(function () {
    "use strict";

    const PROVIDERS = {
        deepseek: { base: "https://api.deepseek.com/v1", model: "deepseek-chat" },
        kimi: { base: "https://api.moonshot.cn/v1", model: "moonshot-v1-8k" },
        glm: { base: "https://open.bigmodel.cn/api/paas/v4", model: "glm-4-flash" },
        openai: { base: "https://api.openai.com/v1", model: "gpt-4o-mini" },
        custom: { base: "", model: "" },
    };
    const SET_KEY = "wpsforge.settings.v1";
    const MAX_TOOL_STEPS = 12;
    const HISTORY_KEEP = 24;

    // ---------- 设置 ----------
    function loadSettings() {
        let s = { provider: "deepseek", base: PROVIDERS.deepseek.base, model: PROVIDERS.deepseek.model, key: "" };
        try { Object.assign(s, JSON.parse(localStorage.getItem(SET_KEY) || "{}")); } catch (e) { }
        return s;
    }
    function saveSettings(s) { localStorage.setItem(SET_KEY, JSON.stringify(s)); }
    let settings = loadSettings();

    // ---------- 对话状态 ----------
    let messages = [];   // 不含 system，system 每次请求时重建
    let busy = false;

    function systemPrompt() {
        let info = "（无法获取，可能尚未打开表格）";
        try { info = JSON.stringify(window.ForgeTools.find(t => t.name === "get_sheet_info").run()).data; } catch (e) { }
        return "你是嵌入在 WPS 表格里的智能表格助手 WpsForge，可以通过工具直接操作用户当前打开的工作簿。\n" +
            "当前工作簿概况: " + JSON.stringify(info) + "\n" +
            "规则:\n" +
            "1. 需要理解数据时，先调用 get_sheet_info / read_range 查看真实数据，绝不臆测单元格内容。\n" +
            "2. 生成公式用 set_formula（公式必须以=开头，写入前先核对列位置）；成批数据用 write_cells。\n" +
            "3. clean_data 的删行/删列/去重属于破坏性操作：必须先向用户复述将影响的范围并得到用户明确同意，才能调用。\n" +
            "4. 允许一次回复中连续调用多个工具；每完成一步用一句话向用户汇报。\n" +
            "5. 提示用户：插件操作支持 Ctrl+Z 撤销，但保存前请自行备份重要数据。\n" +
            "6. 回答用中文，简洁。";
    }

    function toolsSchema() {
        return window.ForgeTools.map(t => ({
            type: "function",
            function: { name: t.name, description: t.description, parameters: t.parameters },
        }));
    }

    // ---------- LLM 调用 ----------
    // 连接链：直连 → 同源内嵌代理 /llm-proxy(随 wpsjs debug 自动存在) → 独立代理 :3890(生产用)
    async function apiRequest(path, init) {
        const base = (settings.base || "").replace(/\/+$/, "");
        if (!base) throw new Error("接口地址未设置，请先点 ⚙ 配置");
        const target = base + path;
        const via = (url) => Object.assign({}, init, {
            headers: Object.assign({}, init.headers, { "X-WF-Target": target }),
        });
        const attempts = [
            ["直连", () => fetch(target, init)],
            ["内嵌代理", () => fetch("/llm-proxy", via())],
            ["独立代理", () => fetch("http://127.0.0.1:3890/proxy", via())],
        ];
        const errors = [];
        for (const [label, fn] of attempts) {
            try {
                const r = await fn();
                if (r.status === 404) {
                    const t = await r.clone().text().catch(() => "");
                    if (!/^\s*[{[]/.test(t)) { errors.push(label + "不可用(404)"); continue; } // 代理端点不存在，换下一个
                }
                return r; // 有真实响应(含业务错误)交给调用方处理
            } catch (e) {
                errors.push(label + "失败(" + (e && e.message || e) + ")");
            }
        }
        throw new Error("三种连接方式都不通：" + errors.join("；") +
            "\n若内嵌代理 404，说明开发服务还是旧配置——请在终端重启 wpsjs debug；生产环境请运行 npm run proxy。");
    }

    async function callLLM() {
        if (!settings.key) throw new Error("请先在 ⚙ 设置中填写 API Key");
        const payload = {
            model: settings.model,
            messages: [{ role: "system", content: systemPrompt() }].concat(messages.slice(-HISTORY_KEEP)),
            tools: toolsSchema(),
            temperature: 0.2,
        };
        const resp = await apiRequest("/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + settings.key },
            body: JSON.stringify(payload),
        });
        if (!resp.ok) {
            let detail = "";
            try { detail = (await resp.text()).slice(0, 400); } catch (e) { }
            throw new Error(`API ${resp.status} ${detail || resp.statusText}`);
        }
        const j = await resp.json();
        if (!j.choices || !j.choices.length) throw new Error("API 返回异常: " + JSON.stringify(j).slice(0, 300));
        return j.choices[0].message;
    }

    async function testConnection() {
        const out = $("test-result");
        out.textContent = "测试中…";
        try {
            const resp = await apiRequest("/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": "Bearer " + settings.key },
                body: JSON.stringify({
                    model: settings.model,
                    messages: [{ role: "user", content: "ping" }],
                    tools: toolsSchema(),
                    max_tokens: 1,
                }),
            });
            const text = await resp.text();
            if (resp.ok) { out.textContent = "✅ 连接成功，模型可调用且支持 function-calling"; return; }
            if (/tool/i.test(text) && /not support|unsupported|invalid|error/i.test(text)) {
                out.textContent = "❌ HTTP " + resp.status + "：该模型/服务不支持 function-calling（tools 参数被拒绝），请换支持工具调用的模型，如 deepseek-chat、moonshot-v1-8k、glm-4-flash";
            } else {
                out.textContent = "❌ HTTP " + resp.status + "：" + text.slice(0, 260);
            }
        } catch (e) {
            out.textContent = "❌ " + (e && e.message ? e.message : e);
        }
    }

    function execTool(name, argsJson) {
        const tool = window.ForgeTools.find(t => t.name === name);
        if (!tool) return { ok: false, error: "未知工具: " + name };
        let args = {};
        try { args = argsJson ? JSON.parse(argsJson) : {}; } catch (e) { return { ok: false, error: "参数不是合法 JSON: " + argsJson }; }
        try {
            const r = tool.run(args) || {};
            return { ok: true, msg: r.msg, data: r.data };
        } catch (e) {
            return { ok: false, error: e && e.message ? e.message : String(e) };
        }
    }

    // ---------- 剪贴板：WPS 宿主抢占 ⌘C/⌘V，这里自行拦截 + 右键菜单 ----------
    const isEditable = (el) => !!(el && el.matches && el.matches("input, textarea"));
    function selText(field) {
        const s = field.selectionStart, e = field.selectionEnd;
        return (s != null && e != null && e > s) ? field.value.slice(s, e) : "";
    }
    function clipWrite(t) {
        try { return navigator.clipboard.writeText(t) } catch (e) { }
        try { const ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); } catch (e) { }
        return Promise.resolve();
    }
    function clipRead() {
        try { return navigator.clipboard.readText().catch(() => null) } catch (e) { return Promise.resolve(null) }
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
        if (op === "copy") { clipWrite(selText(field) || field.value); }
        else if (op === "cut") {
            const t = selText(field);
            if (t) { clipWrite(t); insertText(field, ""); }
        }
        else if (op === "paste") { clipRead().then((t) => { if (t != null && t !== "") insertText(field, t); }); }
        else if (op === "selectall") { field.focus(); field.select(); }
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
                el.onmousedown = (ev) => { ev.preventDefault(); clipOp(op, field); menu.style.display = "none"; };
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

    // ---------- 渲染 ----------
    const $ = (id) => document.getElementById(id);
    function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
    function mdLite(s) {
        return esc(s)
            .replace(/`([^`\n]+)`/g, "<code>$1</code>")
            .replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>");
    }
    function addBubble(cls) {
        const div = document.createElement("div");
        div.className = "msg " + cls;
        $("chat").appendChild(div);
        $("chat").scrollTop = $("chat").scrollHeight;
        return div;
    }
    function setStatus(t) { $("status").textContent = t; }

    // ---------- 主流程 ----------
    async function send() {
        const text = $("input").value.trim();
        if (!text || busy) return;
        $("input").value = "";
        busy = true; $("btnSend").disabled = true;

        messages.push({ role: "user", content: text });
        addBubble("user").textContent = text;

        const aiDiv = addBubble("ai");
        let answerShown = false;
        try {
            for (let step = 0; step < MAX_TOOL_STEPS; step++) {
                setStatus("思考中…");
                const msg = await callLLM();
                if (msg.tool_calls && msg.tool_calls.length) {
                    messages.push({ role: "assistant", content: msg.content || "", tool_calls: msg.tool_calls });
                    for (const tc of msg.tool_calls) {
                        setStatus(`执行工具 ${tc.function.name}…`);
                        const result = execTool(tc.function.name, tc.function.arguments);
                        const line = document.createElement("span");
                        line.className = "tool";
                        line.innerHTML = "🔧 <b>" + esc(tc.function.name) + "</b> " +
                            esc(tc.function.arguments || "") +
                            " → " + esc(result.ok ? (result.msg || "完成") : "✗ " + result.error);
                        aiDiv.appendChild(line);
                        messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result).slice(0, 15000) });
                    }
                    aiDiv.style.display = answerShown ? "block" : "none";
                    $("chat").scrollTop = $("chat").scrollHeight;
                    continue;
                }
                aiDiv.textContent = "";
                aiDiv.innerHTML = mdLite(msg.content || "(空回复)");
                messages.push({ role: "assistant", content: msg.content || "" });
                answerShown = true;
                break;
            }
            if (!answerShown) aiDiv.innerHTML = mdLite("（本轮工具调用步数达到上限，请继续说\"接着做\"）");
        } catch (e) {
            aiDiv.innerHTML = mdLite("⚠ " + (e && e.message ? e.message : e) +
                "\n\n排查建议：① ⚙ 里 Base URL / API Key / 模型名是否正确；② 该模型服务是否支持 function-calling；③ 本机网络能否访问该服务（浏览器直接打开 Base URL 试试）。");
        } finally {
            busy = false; $("btnSend").disabled = false; setStatus("");
            $("chat").scrollTop = $("chat").scrollHeight;
        }
    }

    // ---------- 绑定 ----------
    window.onload = function () {
        $("btnSend").onclick = send;
        $("input").addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
        });
        $("btnClear").onclick = function () { messages = []; $("chat").innerHTML = ""; greet(); };
        $("btnConfig").onclick = () => $("settings").classList.toggle("open");
        $("btnHide").onclick = function () {
            try {
                let tsId = window.Application.PluginStorage.getItem("wf_taskpane_id");
                if (tsId) window.Application.GetTaskPane(tsId).Visible = false;
            } catch (e) { }
        };
        $("s-provider").onchange = function () {
            const p = PROVIDERS[this.value];
            $("wrap-base").style.display = this.value === "custom" ? "block" : "none";
            if (this.value !== "custom") $("s-model").value = p.model;
        };
        function readForm() {
            const provider = $("s-provider").value;
            settings = {
                provider,
                base: provider === "custom" ? $("s-base").value.trim() : PROVIDERS[provider].base,
                model: $("s-model").value.trim() || PROVIDERS[provider].model,
                key: $("s-key").value.trim(),
            };
            return settings;
        }
        $("btnSave").onclick = function () {
            readForm();
            saveSettings(settings);
            $("settings").classList.remove("open");
            setStatus("设置已保存");
        };
        $("btnTest").onclick = function () { readForm(); testConnection(); };
        $("btnEye").onclick = function () {
            const k = $("s-key");
            const hidden = k.type === "password";
            k.type = hidden ? "text" : "password";
            this.textContent = hidden ? "🙈" : "👁";
        };
        bindCtxMenu();
        // 回填设置
        $("s-provider").value = settings.provider || "deepseek";
        $("s-base").value = settings.base || "";
        $("s-key").value = settings.key || "";
        $("s-model").value = settings.model || "";
        $("wrap-base").style.display = settings.provider === "custom" ? "block" : "none";
        // 快捷指令
        document.querySelectorAll("#quick span").forEach(el => {
            el.onclick = function () { $("input").value = this.textContent; send(); };
        });
        greet();
    };

    function greet() {
        const div = addBubble("ai");
        div.innerHTML = mdLite("你好，我是 **WpsForge AI**。直接用大白话告诉我要对表格做什么，比如：\n" +
            "`把销售额大于1万的行提成列算出来写进G列`\n`按部门统计人数做一列占比`\n`清理这张表的空行和重复行`\n\n" +
            "首次使用请先点右上角 **⚙** 填一个支持函数调用的大模型 API Key（DeepSeek/Kimi/智谱均可）。");
    }
})();
