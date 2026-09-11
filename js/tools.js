// js/tools.js - WpsForge 核心操作聚合入口
// 聚合 core、clean、format、advanced 与 schema 模块，
// 导出全局供功能区 (ribbon.js) 与 AI 对话 (taskpane.js) 调用。
(function () {
    "use strict";

    window.WpsForge = window.WpsForge || {};
    const tools = window.WpsForge.tools || {};

    const core = () => tools.core;
    const clean = () => tools.clean;
    const format = () => tools.format;
    const advanced = () => tools.advanced;
    const schema = () => tools.schema;

    // 功能区与快捷面板按钮入口
    const actions = {
        deleteEmptyRows: () => clean().deleteEmptyRows(null, core().activeSheet().Name),
        deleteEmptyCols: () => clean().deleteEmptyCols(null, core().activeSheet().Name),
        removeDuplicates: () => clean().removeDuplicates(null, true, core().activeSheet().Name),
        trimText: () => clean().trimText(null, core().activeSheet().Name),
        beautify: () => format().beautifyTable(null, core().activeSheet().Name),
        addZebra: () => format().addZebra(null, core().activeSheet().Name),
        freeze: () => format().freezeHeader(),
        fillSerial: () => format().fillSerial(null, 1, 1, core().activeSheet().Name),
        getSelectionInfo: () => advanced().getSelectionInfo(),
        quickStats: (ref) => advanced().quickStats(ref, core().activeSheet().Name),
        highlight: (ref, color) => format().highlightCells(ref, core().activeSheet().Name, color),
        merge: (ref, act) => format().mergeCells(ref, core().activeSheet().Name, act),
        transpose: (src, dst) => advanced().transposeRange(src, dst, core().activeSheet().Name),
        autoFit: (ref) => format().setColWidthRowHeight(ref, core().activeSheet().Name, null, null, true),
        exportMarkdown: (ref) => advanced().exportData(ref, core().activeSheet().Name, "markdown"),
        exportJson: (ref) => advanced().exportData(ref, core().activeSheet().Name, "json"),
        createChart: (ref, type, title) => advanced().createChart(ref, core().activeSheet().Name, type, title),
    };

    // 导出全局对象，保持 100% 向后兼容
    window.ForgeActions = actions;
    window.ForgeTools = schema().aiTools;
    window.WpsForgeTools = {
        actions,
        aiTools: window.ForgeTools,
        core: tools.core,
        clean: tools.clean,
        format: tools.format,
        advanced: tools.advanced,
        schema: tools.schema,
    };
})();
