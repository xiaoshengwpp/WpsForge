// js/taskpane/selection.js - 实时表格选区感知、心跳轮询与上下文引用关联
(function () {
    "use strict";

    window.WpsForge = window.WpsForge || {};
    window.WpsForge.taskpane = window.WpsForge.taskpane || {};

    const utils = () => window.WpsForge.taskpane.utils;

    let currentSelectionContext = null;

    function refreshSelectionInfo() {
        const $ = utils().$;
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

    function getCurrentSelectionContext() {
        return currentSelectionContext;
    }

    function initSelectionPolling() {
        refreshSelectionInfo();
        window.addEventListener("focus", refreshSelectionInfo);
        setInterval(refreshSelectionInfo, 4000);
    }

    window.WpsForge.taskpane.selection = {
        refreshSelectionInfo,
        getCurrentSelectionContext,
        initSelectionPolling,
    };
})();
