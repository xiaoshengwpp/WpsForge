/**
 * WpsForge 自定义函数示例（UDF）。
 * 在 WPS 单元格中可通过 =WpsForge.custom_function("hi") 调用。
 * @customfunction
 * @param {string} arg0 - 任意文本
 * @returns {string}
 */
function custom_function(arg0) {
    return `WpsForge 自定义函数已加载: ${arg0}`
}
