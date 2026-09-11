// js/taskpane/tabs.js - 数据驱动渲染 (类似 v-for)、模块导航与统一事件委托
(function () {
    "use strict";

    window.WpsForge = window.WpsForge || {};
    window.WpsForge.taskpane = window.WpsForge.taskpane || {};

    const data = () => window.WpsForge.taskpane.data;
    const constants = () => window.WpsForge.taskpane.constants;
    const utils = () => window.WpsForge.taskpane.utils;
    const state = () => window.WpsForge.taskpane.state;
    const selection = () => window.WpsForge.taskpane.selection;
    const llm = () => window.WpsForge.taskpane.llm;
    const ui = () => window.WpsForge.taskpane.ui;
    const orchestrator = () => window.WpsForge.taskpane.orchestrator;

    function switchTab(tabName) {
        document.querySelectorAll(".tab-btn").forEach(b => {
            b.classList.toggle("active", b.getAttribute("data-tab") === tabName);
        });
        document.querySelectorAll(".tab-content-view").forEach(v => {
            v.classList.toggle("active", v.id === "view-" + tabName);
        });
        if (tabName === "chat") {
            ui().scrollToBottom();
        } else if (tabName === "settings") {
            initForm();
        }
    }

    function initForm() {
        const $ = utils().$;
        const s = state().getSettings();
        const provs = constants().PROVIDERS;
        $("s-provider").value = s.provider || "deepseek";
        $("s-base").value = s.base || provs.deepseek.base;
        $("s-key").value = s.key || "";
        $("s-model").value = s.model || provs.deepseek.model;
        const temp = s.temperature ?? 0.2;
        $("s-temp").value = temp;
        $("s-temp-val").textContent = temp;
        $("wrap-base").style.display = "block";
        state().updateModelBadge();
    }

    function readForm() {
        const $ = utils().$;
        const provs = constants().PROVIDERS;
        const provider = $("s-provider").value;
        const s = {
            provider,
            base: $("s-base").value.trim(),
            model: $("s-model").value.trim() || (provs[provider] ? provs[provider].model : ""),
            key: $("s-key").value.trim(),
            temperature: Number($("s-temp").value || 0.2),
        };
        state().setSettings(s);
        return s;
    }

    // ---------- 类似 v-for 的声明式数据驱动渲染器 ----------

    function renderQuickChips() {
        const container = utils().$("quick");
        if (!container || !data().QUICK_CHIPS) return;
        const esc = utils().esc;
        container.innerHTML = data().QUICK_CHIPS.map(c => `
            <span class="quick-chip" data-prompt="${esc(c.prompt)}">
                ${c.svg}
                <span>${esc(c.title)}</span>
            </span>
        `).join("");
    }

    function renderScenarios() {
        const container = utils().$("scenarios-container");
        if (!container || !data().SCENARIOS) return;
        const esc = utils().esc;

        container.innerHTML = data().SCENARIOS.map(group => `
            <div class="scenarios-group-title">
                ${group.groupSvg}
                <span>${esc(group.groupTitle)}</span>
            </div>
            <div class="scenarios-grid">
                ${group.items.map(item => `
                    <div class="scenario-card">
                        <div class="sc-header">
                            <div class="sc-title">
                                ${item.iconSvg}
                                <span>${esc(item.title)}</span>
                            </div>
                        </div>
                        <div class="sc-desc">${esc(item.desc)}</div>
                        <div class="sc-actions">
                            <button class="sc-btn sc-fill" data-prompt="${esc(item.prompt)}">填入输入框</button>
                            ${item.allowDirect ? `<button class="sc-btn primary sc-run" data-prompt="${esc(item.prompt)}">直接执行</button>` : ""}
                        </div>
                    </div>
                `).join("")}
            </div>
        `).join("");
    }

    function renderToolbox() {
        const container = utils().$("toolbox-container");
        if (!container || !data().TOOLBOX) return;
        const esc = utils().esc;

        container.innerHTML = data().TOOLBOX.map(cat => `
            <div class="tool-category-title" style="margin-top:4px;">
                ${cat.categorySvg}
                <span>${esc(cat.categoryTitle)}</span>
            </div>
            <div class="tools-grid">
                ${cat.items.map(item => `
                    <button class="action-card-btn" id="${item.id}" data-action="${item.action}">
                        <div class="ac-top">
                            ${item.iconSvg}
                            <span>${esc(item.title)}</span>
                        </div>
                        <div class="ac-sub">${esc(item.sub)}</div>
                    </button>
                `).join("")}
            </div>
        `).join("");
    }

    // ---------- 事件委托与绑定 ----------

    function bindTabs() {
        document.querySelectorAll(".tab-btn").forEach(btn => {
            btn.onclick = function () {
                switchTab(this.getAttribute("data-tab"));
            };
        });
    }

    function bindScenarios() {
        const $ = utils().$;
        const container = $("view-scenarios");
        if (!container) return;

        // 统一事件委托，捕获填入与直接执行
        container.onclick = function (e) {
            const fillBtn = e.target.closest(".sc-fill");
            if (fillBtn) {
                const p = fillBtn.getAttribute("data-prompt");
                if (p) {
                    $("input").value = p;
                    switchTab("chat");
                    $("input").focus();
                }
                return;
            }
            const runBtn = e.target.closest(".sc-run");
            if (runBtn) {
                const p = runBtn.getAttribute("data-prompt");
                if (p) {
                    switchTab("chat");
                    orchestrator().send(p);
                }
            }
        };
    }

    function bindQuickChips() {
        const container = utils().$("quick");
        if (!container) return;

        // 统一事件委托，捕获快捷胶囊点击
        container.onclick = function (e) {
            const chip = e.target.closest(".quick-chip");
            if (chip) {
                const p = chip.getAttribute("data-prompt") || chip.querySelector("span")?.textContent?.trim();
                if (p) orchestrator().send(p);
            }
        };
    }

    function runToolboxAction(name, runner) {
        try {
            const res = runner();
            if (res && res.msg) ui().setStatus(res.msg);
            return res;
        } catch (e) {
            ui().setStatus("操作失败: " + (e && e.message ? e.message : e));
        }
    }

    function bindToolboxActions() {
        const $ = utils().$;
        const u = utils();

        $("tb-modal-close").onclick = () => {
            $("tb-modal").classList.remove("open");
        };

        const container = $("toolbox-container");
        if (!container) return;

        // 统一事件委托处理 14 个离线工具动作
        container.onclick = function (e) {
            const btn = e.target.closest(".action-card-btn");
            if (!btn) return;
            const action = btn.getAttribute("data-action");
            if (!action) return;

            switch (action) {
                case "quickStats": {
                    const r = runToolboxAction("选区统计", () => window.ForgeActions.quickStats());
                    if (r && r.data) {
                        const d = r.data;
                        const summary = `【${d.address} 数据统计】\n总单元格数: ${d.total}\n非空数: ${d.nonBlank}\n空白数: ${d.blank}\n数值个数: ${d.numCount}\n求和: ${d.sum ?? "-"}\n平均值: ${d.avg ?? "-"}\n最小值: ${d.min ?? "-"}\n最大值: ${d.max ?? "-"}`;
                        ui().showToolboxResult("选区统计测算结果", summary);
                    }
                    break;
                }
                case "transpose": {
                    const r = runToolboxAction("行列转置", () => window.ForgeActions.transpose());
                    if (r && r.msg) ui().showToolboxResult("行列转置完成", r.msg);
                    break;
                }
                case "exportMarkdown": {
                    const r = runToolboxAction("导出 Markdown", () => window.ForgeActions.exportMarkdown());
                    if (r && r.data && r.data.text) {
                        u.clipWrite(r.data.text).then(() => {
                            ui().showToolboxResult("已复制 Markdown 表格至剪贴板", r.data.text);
                        });
                    }
                    break;
                }
                case "exportJson": {
                    const r = runToolboxAction("导出 JSON", () => window.ForgeActions.exportJson());
                    if (r && r.data && r.data.text) {
                        u.clipWrite(r.data.text).then(() => {
                            ui().showToolboxResult("已复制 JSON 数组至剪贴板", r.data.text);
                        });
                    }
                    break;
                }
                case "beautify":
                    runToolboxAction("表格美化", () => window.ForgeActions.beautify());
                    break;
                case "addZebra":
                    runToolboxAction("斑马纹", () => window.ForgeActions.addZebra());
                    break;
                case "highlightYellow":
                    runToolboxAction("高亮黄色", () => window.ForgeActions.highlight(null, "yellow"));
                    break;
                case "highlightClear":
                    runToolboxAction("清除高亮", () => window.ForgeActions.highlight(null, "clear"));
                    break;
                case "freeze":
                    runToolboxAction("冻结首行", () => window.ForgeActions.freeze());
                    break;
                case "autoFit":
                    runToolboxAction("自适应列宽", () => window.ForgeActions.autoFit());
                    break;
                case "deleteEmptyRows":
                    runToolboxAction("删除空行", () => window.ForgeActions.deleteEmptyRows());
                    break;
                case "removeDuplicates":
                    runToolboxAction("整行去重", () => window.ForgeActions.removeDuplicates());
                    break;
                case "trimText":
                    runToolboxAction("去空格", () => window.ForgeActions.trimText());
                    break;
                case "fillSerial":
                    runToolboxAction("填充序号", () => window.ForgeActions.fillSerial());
                    break;
            }
        };
    }

    function bindSettingsForm() {
        const $ = utils().$;
        const provs = constants().PROVIDERS;

        $("s-provider").onchange = function () {
            const val = this.value;
            const p = provs[val];
            if (p && val !== "custom") {
                $("s-base").value = p.base;
                $("s-model").value = p.model;
            }
        };

        $("s-temp").oninput = function () {
            $("s-temp-val").textContent = this.value;
        };

        $("btnSave").onclick = function () {
            const s = readForm();
            state().saveSettings(s);
            ui().setStatus("配置已成功保存");
            setTimeout(() => ui().setStatus(""), 2000);
            switchTab("chat");
        };

        $("btnTest").onclick = function () {
            readForm();
            llm().testConnection();
        };

        $("btnEye").onclick = function () {
            const k = $("s-key");
            const hidden = k.type === "password";
            k.type = hidden ? "text" : "password";
            this.innerHTML = hidden ? constants().EYE_CLOSED : constants().EYE_OPEN;
        };
    }

    function bindSelectionBarEvents() {
        const $ = utils().$;

        $("btnRefreshSel").onclick = () => {
            const d = selection().refreshSelectionInfo();
            ui().setStatus(d ? `已更新选区: ${d.sheet}!${d.address}` : "未检测到活动选区");
            setTimeout(() => ui().setStatus(""), 2000);
        };

        $("btnInsertSel").onclick = function () {
            const d = selection().getCurrentSelectionContext() || selection().refreshSelectionInfo();
            if (d && d.address) {
                const tag = $("context-tag");
                const tagText = $("context-tag-text");
                tagText.textContent = `已关联选区: ${d.sheet}!${d.address} (${d.rows}×${d.columns})`;
                tag.classList.add("open");
                switchTab("chat");
                $("input").focus();
            } else {
                ui().setStatus("请先在表格中选择任意单元格或区域");
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
                        ui().showToolboxResult("选区统计分析结果", summary);
                    }
                }
            } catch (err) {
                ui().setStatus("统计失败: " + (err && err.message ? err.message : err));
            }
        };
    }

    function bindCtxMenu() {
        const u = utils();
        const menu = u.$("ctxmenu");
        document.addEventListener("keydown", (e) => {
            if (!(e.metaKey || e.ctrlKey) || !u.isEditable(e.target)) return;
            const k = (e.key || "").toLowerCase();
            const map = { c: "copy", v: "paste", x: "cut", a: "selectall" };
            if (!map[k]) return;
            e.preventDefault();
            u.clipOp(map[k], e.target);
        });

        document.addEventListener("contextmenu", (e) => {
            if (!u.isEditable(e.target)) return;
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
            if (u.selText(field)) {
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
                    u.clipOp(item.op, field);
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

    window.WpsForge.taskpane.tabs = {
        switchTab,
        initForm,
        readForm,
        renderQuickChips,
        renderScenarios,
        renderToolbox,
        bindTabs,
        bindScenarios,
        bindQuickChips,
        bindToolboxActions,
        bindSettingsForm,
        bindSelectionBarEvents,
        bindCtxMenu,
    };
})();
