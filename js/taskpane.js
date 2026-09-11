// js/taskpane.js - WpsForge AI 侧边栏装配入口
// 组装常量、工具、状态、网络、选区感知、UI气泡、Agent调度循环与标签页控制
(function () {
    "use strict";

    window.WpsForge = window.WpsForge || {};
    const tp = window.WpsForge.taskpane || {};

    const utils = () => tp.utils;
    const state = () => tp.state;
    const selection = () => tp.selection;
    const ui = () => tp.ui;
    const orchestrator = () => tp.orchestrator;
    const tabs = () => tp.tabs;

    function init() {
        const u = utils();
        const $ = u.$;

        // 0. 数据驱动渲染界面卡片 (类似 v-for)
        tabs().renderQuickChips();
        tabs().renderScenarios();
        tabs().renderToolbox();

        // 1. 选项卡与界面导航交互
        tabs().bindTabs();
        tabs().bindScenarios();
        tabs().bindQuickChips();
        tabs().bindToolboxActions();
        tabs().bindSettingsForm();
        tabs().bindSelectionBarEvents();
        tabs().bindCtxMenu();

        // 2. 发送、停止与键盘回车事件
        $("btnSend").onclick = () => orchestrator().send();
        $("btnStop").onclick = () => orchestrator().abortCurrentChat();

        $("input").addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                orchestrator().send();
            }
        });

        // 3. 清空对话历史
        $("btnClear").onclick = function () {
            state().clearChatHistory();
            $("chat").innerHTML = "";
            ui().showWelcomeCard((prompt) => {
                $("input").value = prompt;
                orchestrator().send();
            });
            ui().setStatus("对话记录已清空");
            setTimeout(() => ui().setStatus(""), 1500);
        };

        // 4. 收起侧边栏
        $("btnHide").onclick = function () {
            try {
                const a = window.Application || (window.wps && (window.wps.EtApplication ? window.wps.EtApplication() : window.wps.Application));
                if (a && a.PluginStorage) {
                    const tsId = a.PluginStorage.getItem("wf_taskpane_id");
                    if (tsId) a.GetTaskPane(tsId).Visible = false;
                }
            } catch (e) { }
        };

        // 5. 初始化配置表单与徽章
        tabs().initForm();

        // 6. 开启选区感知与心跳轮询
        selection().initSelectionPolling();

        // 7. 恢复历史记录或展示新手指引
        const hasHistory = state().loadChatHistory(
            (userContent) => ui().addUserMessage(userContent),
            (aiContent) => {
                const b = ui().createAiMessage();
                b.setFinalText(aiContent);
            }
        );

        if (!hasHistory) {
            ui().showWelcomeCard((prompt) => {
                $("input").value = prompt;
                orchestrator().send();
            });
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    window.WpsForgeTaskpane = {
        init,
        constants: tp.constants,
        utils: tp.utils,
        state: tp.state,
        selection: tp.selection,
        llm: tp.llm,
        ui: tp.ui,
        orchestrator: tp.orchestrator,
        tabs: tp.tabs,
    };
})();
