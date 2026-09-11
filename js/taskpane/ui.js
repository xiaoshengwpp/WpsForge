// js/taskpane/ui.js - 消息气泡工厂、工具步骤卡片、公式一键填入与模态弹窗
(function () {
    "use strict";

    window.WpsForge = window.WpsForge || {};
    window.WpsForge.taskpane = window.WpsForge.taskpane || {};

    const constants = () => window.WpsForge.taskpane.constants;
    const utils = () => window.WpsForge.taskpane.utils;

    function scrollToBottom() {
        const chat = utils().$("chat");
        if (chat) chat.scrollTop = chat.scrollHeight;
    }

    function setStatus(t) {
        const el = utils().$("status");
        if (el) el.textContent = t;
    }

    function addUserMessage(text) {
        const row = document.createElement("div");
        row.className = "msg-row";
        const div = document.createElement("div");
        div.className = "msg user";
        div.textContent = text;
        row.appendChild(div);
        utils().$("chat").appendChild(row);
        scrollToBottom();
    }

    function createAiMessage() {
        const c = constants();
        const u = utils();
        const esc = u.esc;

        const row = document.createElement("div");
        row.className = "msg-row";

        const div = document.createElement("div");
        div.className = "msg ai";

        const header = document.createElement("div");
        header.className = "ai-avatar-bar";
        header.innerHTML = `
            <div class="ai-avatar-name">
                ${c.SVG_SPARKLE}
                <span>WpsForge AI</span>
            </div>
            <div class="ai-msg-actions">
                <button class="msg-action-btn btn-copy-msg" title="复制完整回答">
                    ${c.SVG_COPY}
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
        u.$("chat").appendChild(row);
        scrollToBottom();

        // 绑定复制按钮
        header.querySelector(".btn-copy-msg").onclick = function () {
            const raw = content.innerText || content.textContent;
            u.clipWrite(raw).then(() => {
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

                const iconSvg = c.getToolSvg(name);
                const titleZh = c.TOOL_NAMES_ZH[name] || name;

                card.innerHTML = `
                    <div class="tool-card-header">
                        <div class="tool-info">
                            <span style="display:inline-flex;align-items:center;color:#6366f1;">${iconSvg}</span>
                            <span>${esc(titleZh)}</span>
                            <small style="color:#94a3b8;font-weight:400">(${esc(name)})</small>
                        </div>
                        <span class="tool-badge running">
                            ${c.SVG_SPINNER}
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
                            badge.innerHTML = (ok ? c.SVG_CHECK : c.SVG_CROSS) + `<span>${ok ? "完成" : "失败"}</span>`;
                        }
                        if (desc) {
                            desc.innerHTML = ok
                                ? `<b>结果</b>：${esc(msg || "操作已完成")}`
                                : `<b>错误</b>：<span style="color:#ef4444">${esc(msg || "执行失败")}</span>`;
                        }
                        if (data || argsStr) {
                            const btn = document.createElement("button");
                            btn.className = "tool-detail-toggle";
                            btn.innerHTML = `<span>展开详情</span>${c.SVG_CHEVRON_DOWN}`;
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
                                btn.innerHTML = isOpen ? `<span>收起详情</span>${c.SVG_CHEVRON_UP}` : `<span>展开详情</span>${c.SVG_CHEVRON_DOWN}`;
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
                content.innerHTML = u.renderMarkdown(text);

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

    function showWelcomeCard(onSelectPrompt) {
        const chat = utils().$("chat");
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
                if (p && onSelectPrompt) onSelectPrompt(p);
            };
        });
    }

    function showToolboxResult(title, content) {
        const modal = utils().$("tb-modal");
        const titleEl = utils().$("tb-modal-title-text");
        const bodyEl = utils().$("tb-modal-body");
        if (modal && titleEl && bodyEl) {
            titleEl.textContent = title;
            bodyEl.textContent = content;
            modal.classList.add("open");
        }
    }

    window.WpsForge.taskpane.ui = {
        scrollToBottom,
        setStatus,
        addUserMessage,
        createAiMessage,
        showWelcomeCard,
        showToolboxResult,
    };
})();
