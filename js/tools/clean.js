// js/tools/clean.js - 数据清洗模块：删除空行、删除空列、整行去重、清除多余空格
(function () {
    "use strict";

    window.WpsForge = window.WpsForge || {};
    window.WpsForge.tools = window.WpsForge.tools || {};

    const core = () => window.WpsForge.tools.core;

    function deleteEmptyRows(ref, sheetName) {
        const c = core();
        const ws = c.sheetByName(sheetName);
        const rng = c.rangeOf(ws, ref);
        const startRow = rng.Row, nRows = Math.min(rng.Rows.Count, c.MAX_TOUCH_ROWS);
        const data = c.to2d(rng.Value);
        const doomed = [];
        for (let i = 0; i < data.length; i++) {
            if (c.rowIsBlank(data[i])) doomed.push(startRow + i);
        }
        for (let i = doomed.length - 1; i >= 0; i--) {
            ws.Rows.Item(doomed[i]).Delete();
        }
        return { msg: `已删除 ${doomed.length} 行空行` + (nRows >= c.MAX_TOUCH_ROWS ? "（达到 3 万行处理上限，如需更多请分区操作）" : "") };
    }

    function deleteEmptyCols(ref, sheetName) {
        const c = core();
        const ws = c.sheetByName(sheetName);
        const rng = c.rangeOf(ws, ref);
        const startCol = rng.Column, data = c.to2d(rng.Value);
        const nCols = data.length ? Math.max(...data.map(r => r.length)) : 0;
        const doomed = [];
        for (let col = 0; col < nCols; col++) {
            let empty = true;
            for (let r = 0; r < data.length; r++) {
                if (!c.isBlank(data[r][col])) { empty = false; break; }
            }
            if (empty) doomed.push(startCol + col);
        }
        for (let i = doomed.length - 1; i >= 0; i--) {
            ws.Columns.Item(doomed[i]).Delete();
        }
        return { msg: `已删除 ${doomed.length} 列空列` };
    }

    function removeDuplicates(ref, hasHeader, sheetName) {
        const c = core();
        const ws = c.sheetByName(sheetName);
        const rng = c.rangeOf(ws, ref);
        const startRow = rng.Row, data = c.to2d(rng.Value);
        const seen = new Set(), doomed = [];
        for (let i = 0; i < data.length; i++) {
            if (hasHeader && i === 0) continue;
            const key = JSON.stringify(data[i]);
            if (seen.has(key)) doomed.push(startRow + i);
            else seen.add(key);
        }
        for (let i = doomed.length - 1; i >= 0; i--) {
            ws.Rows.Item(doomed[i]).Delete();
        }
        return { msg: `已删除 ${doomed.length} 行重复数据（保留首次出现）` };
    }

    function trimText(ref, sheetName) {
        const c = core();
        const ws = c.sheetByName(sheetName);
        const rng = c.rangeOf(ws, ref);
        const data = c.to2d(rng.Value);
        let changed = 0;
        const out = data.map(row => row.map(v => {
            if (typeof v === "string") {
                const nv = v.replace(/\u3000/g, " ").trim();
                if (nv !== v) changed++;
                return nv;
            }
            return v;
        }));
        if (changed > 0) c.writeBlock(ws, rng.Row, rng.Column, out);
        return { msg: `已清理 ${changed} 个单元格的首尾空格/全角空格` };
    }

    function cleanData(ops, ref, sheetName) {
        if (typeof ops === "string") ops = [ops];
        if (!Array.isArray(ops) || !ops.length) throw new Error("ops 必须包含至少一个清洗操作");
        const results = [];
        for (const op of ops) {
            switch (op) {
                case "remove_empty_rows": results.push(deleteEmptyRows(ref, sheetName).msg); break;
                case "remove_empty_cols": results.push(deleteEmptyCols(ref, sheetName).msg); break;
                case "remove_duplicates": results.push(removeDuplicates(ref, true, sheetName).msg); break;
                case "trim": results.push(trimText(ref, sheetName).msg); break;
                default: throw new Error("未知清洗操作: " + op);
            }
        }
        return { msg: results.join("；") };
    }

    window.WpsForge.tools.clean = {
        deleteEmptyRows,
        deleteEmptyCols,
        removeDuplicates,
        trimText,
        cleanData,
    };
})();
