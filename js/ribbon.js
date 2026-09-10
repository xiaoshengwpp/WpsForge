// js/ribbon.js 功能区响应逻辑
//这个函数在整个wps加载项中是第一个执行的
function OnAddinLoad(ribbonUI) {
    if (typeof (window.Application.ribbonUI) != "object") {
        window.Application.ribbonUI = ribbonUI
    }
    if (typeof (window.Application.Enum) != "object") { // 如果没有内置枚举值
        window.Application.Enum = WPS_Enum
    }
    return true
}

const TOOL_BUTTONS = {
    btnDelEmptyRows: "deleteEmptyRows",
    btnDelEmptyCols: "deleteEmptyCols",
    btnDelDup: "removeDuplicates",
    btnTrim: "trimText",
    btnBeautify: "beautify",
    btnZebra: "addZebra",
    btnFreeze: "freeze",
    btnSerial: "fillSerial",
}

function OnAction(control) {
    const eleId = control.Id
    if (eleId === "btnAI") {
        toggleTaskPane()
        return true
    }
    const actionName = TOOL_BUTTONS[eleId]
    if (!actionName) return true
    try {
        const result = window.ForgeActions[actionName]()
        notify(result && result.msg ? result.msg : "完成")
    } catch (e) {
        notify("操作失败：" + (e && e.message ? e.message : e))
    }
    return true
}

function toggleTaskPane() {
    let tsId = window.Application.PluginStorage.getItem("wf_taskpane_id")
    if (!tsId) {
        let tskpane = window.Application.CreateTaskPane(GetUrlPath() + "/ui/taskpane.html")
        let id = tskpane.ID
        window.Application.PluginStorage.setItem("wf_taskpane_id", id)
        tskpane.Visible = true
    } else {
        let tskpane = window.Application.GetTaskPane(tsId)
        tskpane.Visible = !tskpane.Visible
    }
}

// 结果提示：alert 在部分 WPS 环境被屏蔽时退回到无提示（操作结果仍可在工作表中验证）
function notify(msg) {
    try { alert(msg) } catch (e) { /* ignore */ }
}

function GetImage(control) {
    const eleId = control.Id
    switch (eleId) {
        case "btnAI":
            return "images/ai.svg"
        case "btnBeautify":
        case "btnZebra":
        case "btnFreeze":
        case "btnSerial":
            return "images/format.svg"
        default:
            return "images/clean.svg"
    }
}
