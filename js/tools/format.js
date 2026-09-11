// js/tools/format.js - 格式排版模块：一键美化、斑马纹、冻结首行、批量序号、高亮与合并居中
(function () {
    "use strict";

    window.WpsForge = window.WpsForge || {};
    window.WpsForge.tools = window.WpsForge.tools || {};

    const core = () => window.WpsForge.tools.core;

    const PRESET_COLORS = {
        yellow: 0,
        green: 0,
        red: 0,
        blue: 0,
        orange: 0,
        purple: 0,
        gray: 0,
        cyan: 0,
    };

    function initColors() {
        const c = core();
        PRESET_COLORS.yellow = c.rgb(254, 240, 138); // #fef08a
        PRESET_COLORS.green = c.rgb(187, 247, 208);  // #bbf7d0
        PRESET_COLORS.red = c.rgb(254, 202, 202);    // #fecaca
        PRESET_COLORS.blue = c.rgb(191, 219, 254);   // #bfdbfe
        PRESET_COLORS.orange = c.rgb(254, 215, 170); // #fed7aa
        PRESET_COLORS.purple = c.rgb(233, 213, 255); // #e9d5ff
        PRESET_COLORS.gray = c.rgb(241, 245, 249);   // #f1f5f9
        PRESET_COLORS.cyan = c.rgb(165, 243, 252);   // #a5f3fc
    }
    initColors();

    function parseColor(val) {
        if (!val || val === "clear" || val === "none") return null;
        if (PRESET_COLORS[val]) return PRESET_COLORS[val];
        if (typeof val === "string" && val.startsWith("#")) {
            let hex = val.replace("#", "");
            if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
            if (hex.length === 6) {
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);
                return core().rgb(r, g, b);
            }
        }
        if (typeof val === "number") return val;
        return PRESET_COLORS.yellow;
    }

    function borderize(rng) {
        const c = core();
        try {
            rng.Borders.LineStyle = c.XL_CONTINUOUS;
        } catch (e) {
            try {
                rng.Borders.Item(c.XL_CONTINUOUS).LineStyle = c.XL_CONTINUOUS;
            } catch (e2) { }
        }
    }

    function beautifyTable(ref, sheetName) {
        const c = core();
        const ws = c.sheetByName(sheetName);
        const rng = (ref ? ws.Range(ref) : c.selectionOrUsed(ws));
        borderize(rng);
        try { rng.Font.Size = rng.Font.Size; } catch (e) { }
        const firstRow = ws.Range(ws.Cells.Item(rng.Row, rng.Column), ws.Cells.Item(rng.Row, rng.Column + rng.Columns.Count - 1));
        firstRow.Font.Bold = true;
        firstRow.Font.Color = c.COLORS.headerFont;
        firstRow.Interior.Color = c.COLORS.header;
        firstRow.HorizontalAlignment = c.XL_CENTER;
        try { rng.Rows.AutoFit(); rng.Columns.AutoFit(); } catch (e) { }
        return { msg: "已美化：加边框、表头加粗填色、自动行列宽" };
    }

    function addZebra(ref, sheetName) {
        const c = core();
        const ws = c.sheetByName(sheetName);
        const rng = (ref ? ws.Range(ref) : c.selectionOrUsed(ws));
        const r0 = rng.Row, c0 = rng.Column, cN = rng.Column + rng.Columns.Count - 1;
        const n = Math.min(rng.Rows.Count - 1, c.MAX_TOUCH_ROWS);
        for (let i = 1; i <= n; i++) { // 跳过表头(第1行)，给奇数数据行上色
            if (i % 2 === 0) continue;
            ws.Range(ws.Cells.Item(r0 + i, c0), ws.Cells.Item(r0 + i, cN)).Interior.Color = c.COLORS.zebra;
        }
        return { msg: `已为 ${n} 行数据添加斑马纹底色` };
    }

    function freezeHeader(sheetName) {
        const a = core().app();
        const win = a.ActiveWindow;
        win.FreezePanes = false;
        win.SplitRow = 1;
        win.FreezePanes = true;
        return { msg: "已冻结首行" };
    }

    function fillSerial(ref, start, step, sheetName) {
        const c = core();
        const ws = c.sheetByName(sheetName);
        const rng = (ref ? ws.Range(ref) : c.selectionOrUsed(ws));
        const rows = Math.min(rng.Rows.Count, c.MAX_TOUCH_ROWS);
        const c0 = rng.Column, r0 = rng.Row;
        start = (typeof start === "number") ? start : 1;
        step = (typeof step === "number") ? step : 1;
        for (let i = 0; i < rows; i++) {
            ws.Cells.Item(r0 + i, c0).Value = start + i * step;
        }
        return { msg: `已在 ${rows} 行填充序号 ${start} 起步长 ${step}` };
    }

    function setNumberFormat(ref, code, sheetName) {
        const c = core();
        const ws = c.sheetByName(sheetName);
        const rng = c.rangeOf(ws, ref);
        rng.NumberFormat = code;
        return { msg: `已设置数字格式 ${code}` };
    }

    function highlightCells(ref, sheetName, colorType, customColor) {
        const c = core();
        const ws = c.sheetByName(sheetName);
        const rng = (ref ? ws.Range(ref) : c.selectionOrUsed(ws));
        const color = parseColor(customColor || colorType);
        if (color === null || colorType === "clear") {
            try {
                rng.Interior.ColorIndex = -4142;
            } catch (e) {
                try {
                    rng.Interior.Pattern = -4142;
                } catch (e2) {
                    rng.Interior.Color = c.rgb(255, 255, 255);
                }
            }
            return { msg: `已清除 ${rng.Address(false, false)} 的背景高亮` };
        }
        rng.Interior.Color = color;
        return { msg: `已将 ${rng.Address(false, false)} 高亮标记为 ${colorType || "自定义颜色"}` };
    }

    function mergeCells(ref, sheetName, action) {
        const c = core();
        const ws = c.sheetByName(sheetName);
        const rng = (ref ? ws.Range(ref) : c.selectionOrUsed(ws));
        const act = (action || "merge_center").toLowerCase();
        if (act === "unmerge") {
            rng.UnMerge();
            return { msg: `已取消 ${rng.Address(false, false)} 的合并单元格` };
        } else if (act === "merge") {
            rng.Merge();
            return { msg: `已合并 ${rng.Address(false, false)}` };
        } else {
            rng.Merge();
            try { rng.HorizontalAlignment = c.XL_CENTER; } catch (e) { }
            return { msg: `已合并居中 ${rng.Address(false, false)}` };
        }
    }

    function setColWidthRowHeight(ref, sheetName, colWidth, rowHeight, autoFit) {
        const c = core();
        const ws = c.sheetByName(sheetName);
        const rng = (ref ? ws.Range(ref) : c.selectionOrUsed(ws));
        if (autoFit) {
            try { rng.Columns.AutoFit(); } catch (e) { }
            try { rng.Rows.AutoFit(); } catch (e) { }
            return { msg: `已对 ${rng.Address(false, false)} 执行自动调整行列宽` };
        }
        if (colWidth != null && !isNaN(colWidth)) {
            try { rng.ColumnWidth = Number(colWidth); } catch (e) { }
        }
        if (rowHeight != null && !isNaN(rowHeight)) {
            try { rng.RowHeight = Number(rowHeight); } catch (e) { }
        }
        return { msg: `已调整 ${rng.Address(false, false)} 尺寸 (列宽: ${colWidth ?? "默认"}, 行高: ${rowHeight ?? "默认"})` };
    }

    window.WpsForge.tools.format = {
        PRESET_COLORS,
        parseColor,
        borderize,
        beautifyTable,
        addZebra,
        freezeHeader,
        fillSerial,
        setNumberFormat,
        highlightCells,
        mergeCells,
        setColWidthRowHeight,
    };
})();
