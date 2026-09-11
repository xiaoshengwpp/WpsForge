// main.js - WpsForge 功能区后台脚本入口
// 由 index.html 包含，在 WPS 启动加载项时首先执行
(function () {
    const scripts = [
        "js/util.js",
        "js/tools/core.js",
        "js/tools/clean.js",
        "js/tools/format.js",
        "js/tools/advanced.js",
        "js/tools/schema.js",
        "js/tools.js",
        "js/ribbon.js",
    ];
    for (const src of scripts) {
        document.write("<script language='javascript' src='" + src + "'></script>");
    }
})();
