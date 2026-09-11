// js/taskpane/state.js - 配置读取迁移、顶部状态徽章与对话历史持久化
(function () {
    "use strict";

    window.WpsForge = window.WpsForge || {};
    window.WpsForge.taskpane = window.WpsForge.taskpane || {};

    const constants = () => window.WpsForge.taskpane.constants;
    const utils = () => window.WpsForge.taskpane.utils;

    function loadSettings() {
        const c = constants();
        let s = {
            provider: "deepseek",
            base: c.PROVIDERS.deepseek.base,
            model: c.PROVIDERS.deepseek.model,
            key: "",
            temperature: 0.2,
        };
        try {
            const raw = localStorage.getItem(c.SET_KEY) || localStorage.getItem(c.OLD_SET_KEY);
            if (raw) Object.assign(s, JSON.parse(raw));
        } catch (e) { }
        return s;
    }

    let settings = loadSettings();

    function saveSettings(s) {
        settings = Object.assign({}, settings, s);
        localStorage.setItem(constants().SET_KEY, JSON.stringify(settings));
        updateModelBadge();
    }

    function getSettings() {
        return settings;
    }

    function setSettings(s) {
        settings = s;
    }

    function updateModelBadge() {
        const $ = utils().$;
        const badgeName = $("model-badge-name");
        if (badgeName) {
            badgeName.textContent = settings.model || settings.provider || "未配置";
        }
    }

    // 对话历史
    let messages = [];

    function getMessages() {
        return messages;
    }

    function setMessages(m) {
        messages = m;
    }

    function pushMessage(m) {
        messages.push(m);
    }

    function clearMessages() {
        messages = [];
    }

    function saveChatHistory() {
        try {
            localStorage.setItem(constants().CHAT_HISTORY_KEY, JSON.stringify(messages.slice(-30)));
        } catch (e) { }
    }

    function loadChatHistory(onUserMsg, onAiMsg) {
        try {
            const raw = localStorage.getItem(constants().CHAT_HISTORY_KEY);
            if (raw) {
                const list = JSON.parse(raw);
                if (Array.isArray(list) && list.length) {
                    messages = list;
                    for (const m of messages) {
                        if (m.role === "user") {
                            if (onUserMsg) onUserMsg(m.content);
                        } else if (m.role === "assistant" && m.content) {
                            if (onAiMsg) onAiMsg(m.content);
                        }
                    }
                    return true;
                }
            }
        } catch (e) { }
        return false;
    }

    function clearChatHistory() {
        messages = [];
        localStorage.removeItem(constants().CHAT_HISTORY_KEY);
    }

    window.WpsForge.taskpane.state = {
        loadSettings,
        saveSettings,
        getSettings,
        setSettings,
        updateModelBadge,
        getMessages,
        setMessages,
        pushMessage,
        clearMessages,
        saveChatHistory,
        loadChatHistory,
        clearChatHistory,
    };
})();
