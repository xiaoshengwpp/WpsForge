// js/tools/core.js - WPS表格底层对象访问、选区归一化与批量写入基础设施
(function () {
    "use strict";

    window.WpsForge = window.WpsForge || {};
    window.WpsForge.tools = window.WpsForge.tools || {};

    const app = () => {
        const a = window.Application || (window.wps && (window.wps.EtApplication ? window.wps.EtApplication() : window.wps.Application));
        if (!a) throw new Error("未检测到 WPS 运行环境（window.Application 为空）");
        return a;
    };

    // WPS/Excel 的 Color 是 BGR 序整数
    function rgb(r, g, b) {
        return r + g * 256 + b * 65536;
    }

    const COLORS = {
        header: rgb(68, 114, 196),   // 表头蓝
        headerFont: rgb(255, 255, 255),
        zebra: rgb(235, 241, 249),   // 斑马纹浅蓝
    };

    const XL_CENTER = -4108; // xlCenter
    const XL_CONTINUOUS = 1; // xlContinuous
    const XL_PART = 2;       // xlPart (查找替换：部分匹配)
    const MAX_TOUCH_ROWS = 30000; // 单次批量操作行数上限，防呆

    function activeSheet() {
        const s = app().ActiveSheet;
        if (!s) throw new Error("请先打开一个表格文件");
        return s;
    }

    function sheetByName(name) {
        if (!name) return activeSheet();
        const sheets = app().Sheets;
        for (let i = 1; i <= sheets.Count; i++) {
            const s = sheets.Item(i);
            if (s.Name === name) return s;
        }
        throw new Error("找不到工作表: " + name);
    }

    // 取操作范围：给了 ref 用 ref，否则用整表已用区域
    function rangeOf(ws, ref) {
        if (ref) return ws.Range(ref);
        const ur = ws.UsedRange;
        if (!ur) throw new Error("当前工作表没有数据");
        return ur;
    }

    // 当前选区（给按钮用）：有选区用选区，否则用已用区域
    function selectionOrUsed(ws) {
        const sel = app().Selection;
        try {
            if (sel && sel.Address) {
                // 整表选中(点击左上角全选)时 Address 可能巨大，退回 UsedRange
                const n = (sel.Row || 1) + (sel.Rows.Count || 1);
                if ((sel.Rows.Count || 1) < 100000 && (sel.Columns.Count || 1) < 100) {
                    // 只有用户真的选了个"小区域"才用选区，否则用 UsedRange
                    if ((sel.Rows.Count || 1) > 1 || (sel.Columns.Count || 1) > 1) return sel;
                }
            }
        } catch (e) { /* Selection 不是 Range（如图表），忽略 */ }
        return ws.UsedRange;
    }

    // Range.Value 归一化为二维数组
    function to2d(v) {
        if (v === null || v === undefined) return [];
        if (Array.isArray(v)) {
            if (v.length === 0) return [];
            if (Array.isArray(v[0])) return v;
            return [v]; // 单行
        }
        return [[v]]; // 单值
    }

    function isBlank(v) {
        return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
    }

    function rowIsBlank(row) {
        return row.every(isBlank);
    }

    function writeBlock(ws, r1, c1, arr2d) {
        const rows = arr2d.length, cols = arr2d[0].length;
        const cell = ws.Cells.Item(r1, c1);
        const target = ws.Range(cell, ws.Cells.Item(r1 + rows - 1, c1 + cols - 1));
        if (rows === 1 && cols === 1) {
            target.Value = arr2d[0][0];
        } else {
            try {
                target.Value = arr2d;
            } catch (e) {
                // 若批量赋值受限，安全降级为逐单元格写入
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        try { ws.Cells.Item(r1 + r, c1 + c).Value = arr2d[r][c]; } catch (err) { }
                    }
                }
            }
        }
        return target;
    }

    window.WpsForge.tools.core = {
        app,
        rgb,
        COLORS,
        XL_CENTER,
        XL_CONTINUOUS,
        XL_PART,
        MAX_TOUCH_ROWS,
        activeSheet,
        sheetByName,
        rangeOf,
        selectionOrUsed,
        to2d,
        isBlank,
        rowIsBlank,
        writeBlock,
    };
})();
