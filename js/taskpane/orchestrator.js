// js/taskpane/orchestrator.js - 多轮 Agent 工具调用调度循环与中断控制闭环
(function () {
    "use strict";

    window.WpsForge = window.WpsForge || {};
    window.WpsForge.taskpane = window.WpsForge.taskpane || {};

    const constants = () => window.WpsForge.taskpane.constants;
    const utils = () => window.WpsForge.taskpane.utils;
    const state = () => window.WpsForge.taskpane.state;
    const selection = () => window.WpsForge.taskpane.selection;
    const llm = () => window.WpsForge.taskpane.llm;
    const ui = () => window.WpsForge.taskpane.ui;

    let busy = false;
    let abortController = null;
    let lastUserQuery = "";

    function isBusy() {
        return busy;
    }

    function abortCurrentChat() {
        if (abortController) {
            abortController.abort();
            ui().setStatus("已请求停止");
        }
    }

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

    async function send(customText) {
        const u = utils();
        const $ = u.$;
        const esc = u.esc;
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
        const currentSelectionContext = selection().getCurrentSelectionContext();
        if (ctxTag && ctxTag.classList.contains("open") && currentSelectionContext) {
            fullQuery = `【用户当前选区: ${currentSelectionContext.sheet}!${currentSelectionContext.address}，共 ${currentSelectionContext.rows} 行 × ${currentSelectionContext.columns} 列】\n` + text;
        }

        state().pushMessage({ role: "user", content: fullQuery });
        ui().addUserMessage(text);
        state().saveChatHistory();

        const aiBubble = ui().createAiMessage();

        try {
            for (let step = 0; step < constants().MAX_TOOL_STEPS; step++) {
                if (abortController.signal.aborted) throw new Error("生成已由用户中止");

                aiBubble.setTyping("思考中…");
                ui().setStatus("AI 正在思考…");

                const msg = await llm().callLLM(abortController.signal);

                if (msg.content && msg.content.trim()) {
                    if (msg.tool_calls && msg.tool_calls.length) {
                        const pre = document.createElement("div");
                        pre.style.marginBottom = "6px";
                        pre.innerHTML = u.renderMarkdown(msg.content);
                        aiBubble.content.appendChild(pre);
                    }
                }

                // 处理 Function Calling
                if (msg.tool_calls && msg.tool_calls.length) {
                    state().pushMessage({
                        role: "assistant",
                        content: msg.content || null,
                        tool_calls: msg.tool_calls,
                    });

                    for (const tc of msg.tool_calls) {
                        if (abortController.signal.aborted) throw new Error("生成已由用户中止");

                        const fnName = tc.function.name;
                        const fnArgs = tc.function.arguments;

                        aiBubble.setTyping(`正在执行 ${constants().TOOL_NAMES_ZH[fnName] || fnName}…`);
                        ui().setStatus(`执行工具: ${fnName}…`);

                        const cardHandler = aiBubble.addToolCard(fnName, fnArgs);
                        const result = execTool(fnName, fnArgs);

                        cardHandler.finish(result.ok, result.ok ? result.msg : result.error, result.data);

                        state().pushMessage({
                            role: "tool",
                            tool_call_id: tc.id || ("call_" + Math.random().toString(36).slice(2, 9)),
                            content: JSON.stringify(result).slice(0, 15000),
                        });
                    }
                    state().saveChatHistory();
                    selection().refreshSelectionInfo();
                    continue;
                }

                // 模型给出最终回复
                const finalReply = msg.content || "(完成操作)";
                state().pushMessage({ role: "assistant", content: finalReply });
                aiBubble.setFinalText(finalReply);
                state().saveChatHistory();
                selection().refreshSelectionInfo();
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
            ui().setStatus("");
            ui().scrollToBottom();
        }
    }

    window.WpsForge.taskpane.orchestrator = {
        isBusy,
        abortCurrentChat,
        execTool,
        send,
    };
})();
