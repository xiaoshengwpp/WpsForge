// js/tools.js
// WpsForge 核心库：工具箱实现 + AI 工具注册表。
// 本文件同时被功能区后台(main.js)和任务窗格(taskpane.html)加载，
// 保证"按钮点的功能"和"AI 调用的功能"是同一套代码。
(function () {
    "use strict";

    const app = () => {
        const a = window.Application || (window.wps && (window.wps.EtApplication ? window.wps.EtApplication() : window.wps.Application));
        if (!a) throw new Error("未检测到 WPS 运行环境（window.Application 为空）");
        return a;
    };

    // WPS/Excel 的 Color 是 BGR 序整数
    function rgb(r, g, b) { return r + g * 256 + b * 65536; }

    const COLORS = {
        header: rgb(68, 114, 196),   // 表头蓝
        headerFont: rgb(255, 255, 255),
        zebra: rgb(235, 241, 249),   // 斑马纹浅蓝
    };
    const XL_CENTER = -4108; // xlCenter
    const XL_CONTINUOUS = 1; // xlContinuous
    const XL_PART = 2;       // xlPart (查找替换：部分匹配)
    const MAX_TOUCH_ROWS = 30000; // 单次批量操作行数上限，防呆

    // ---------- 基础辅助 ----------

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

    function rowIsBlank(row) { return row.every(isBlank); }

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

    // ---------- 工具箱功能实现（每个函数返回 {msg, data?}） ----------

    function deleteEmptyRows(ref, sheetName) {
        const ws = sheetByName(sheetName);
        const rng = rangeOf(ws, ref);
        const startRow = rng.Row, nRows = Math.min(rng.Rows.Count, MAX_TOUCH_ROWS);
        const data = to2d(rng.Value);
        const doomed = [];
        for (let i = 0; i < data.length; i++) if (rowIsBlank(data[i])) doomed.push(startRow + i);
        for (let i = doomed.length - 1; i >= 0; i--) ws.Rows.Item(doomed[i]).Delete();
        return { msg: `已删除 ${doomed.length} 行空行` + (nRows >= MAX_TOUCH_ROWS ? "（达到 3 万行处理上限，如需更多请分区操作）" : "") };
    }

    function deleteEmptyCols(ref, sheetName) {
        const ws = sheetByName(sheetName);
        const rng = rangeOf(ws, ref);
        const startCol = rng.Column, data = to2d(rng.Value);
        const nCols = data.length ? Math.max(...data.map(r => r.length)) : 0;
        const doomed = [];
        for (let c = 0; c < nCols; c++) {
            let empty = true;
            for (let r = 0; r < data.length; r++) {
                if (!isBlank(data[r][c])) { empty = false; break; }
            }
            if (empty) doomed.push(startCol + c);
        }
        for (let i = doomed.length - 1; i >= 0; i--) ws.Columns.Item(doomed[i]).Delete();
        return { msg: `已删除 ${doomed.length} 列空列` };
    }

    function removeDuplicates(ref, hasHeader, sheetName) {
        const ws = sheetByName(sheetName);
        const rng = rangeOf(ws, ref);
        const startRow = rng.Row, data = to2d(rng.Value);
        const seen = new Set(), doomed = [];
        for (let i = 0; i < data.length; i++) {
            if (hasHeader && i === 0) continue;
            const key = JSON.stringify(data[i]);
            if (seen.has(key)) doomed.push(startRow + i);
            else seen.add(key);
        }
        for (let i = doomed.length - 1; i >= 0; i--) ws.Rows.Item(doomed[i]).Delete();
        return { msg: `已删除 ${doomed.length} 行重复数据（保留首次出现）` };
    }

    function trimText(ref, sheetName) {
        const ws = sheetByName(sheetName);
        const rng = rangeOf(ws, ref);
        const data = to2d(rng.Value);
        let changed = 0;
        const out = data.map(row => row.map(v => {
            if (typeof v === "string") {
                const nv = v.replace(/\u3000/g, " ").trim();
                if (nv !== v) changed++;
                return nv;
            }
            return v;
        }));
        if (changed > 0) writeBlock(ws, rng.Row, rng.Column, out);
        return { msg: `已清理 ${changed} 个单元格的首尾空格/全角空格` };
    }

    function findReplace(find, replace, ref, sheetName) {
        if (!find) throw new Error("find 参数不能为空");
        const ws = sheetByName(sheetName);
        const rng = rangeOf(ws, ref);
        let ok = false;
        try { ok = rng.Replace(find, replace === undefined ? "" : replace, XL_PART); }
        catch (e) { ok = rng.Replace({ What: find, Replacement: replace || "", LookAt: XL_PART }); }
        return { msg: ok ? `已将 "${find}" 替换为 "${replace || "(空)"}"` : `未找到 "${find}"` };
    }

    function sortRange(ref, byColumn, order, hasHeader, sheetName) {
        const ws = sheetByName(sheetName);
        const rng = rangeOf(ws, ref);
        let data = to2d(rng.Value);
        if (!data.length) return { msg: "没有可排序的数据" };
        let header = null;
        if (hasHeader) { header = data[0]; data = data.slice(1); }
        const idx = Math.max(0, (byColumn || 1) - 1);
        const dir = (order === "desc") ? -1 : 1;
        data.sort((a, b) => {
            const x = a[idx], y = b[idx];
            if (isBlank(x) && isBlank(y)) return 0;
            if (isBlank(x)) return 1;   // 空值永远沉底
            if (isBlank(y)) return -1;
            if (typeof x === "number" && typeof y === "number") return (x - y) * dir;
            return String(x).localeCompare(String(y), "zh") * dir;
        });
        if (header) data.unshift(header);
        writeBlock(ws, rng.Row, rng.Column, data);
        return { msg: `按第 ${byColumn || 1} 列${dir > 0 ? "升序" : "降序"}排序完成` };
    }

    function setFormula(cell, formula, sheetName) {
        const ws = sheetByName(sheetName);
        if (!cell) throw new Error("cell 参数不能为空（如 A1 或 B2:B100）");
        if (typeof formula !== "string") formula = String(formula || "");
        formula = formula.trim();
        // 纠偏模型生成的常见全角标点
        formula = formula.replace(/，/g, ",").replace(/（/g, "(").replace(/）/g, ")").replace(/：/g, ":");
        if (!formula.startsWith("=")) formula = "=" + formula;
        ws.Range(cell).Formula = formula;
        return { msg: `已在 ${cell} 写入公式: ${formula}` };
    }

    function writeCells(start, values, sheetName) {
        const ws = sheetByName(sheetName);
        if (!start) throw new Error("start 不能为空");
        if (typeof values === "string") {
            try { values = JSON.parse(values); } catch (e) { }
        }
        if (!Array.isArray(values) || !values.length) throw new Error("values 必须为有效数组");
        const width = Math.max(...values.map(r => Array.isArray(r) ? r.length : 1));
        const norm = values.map(r => {
            if (!Array.isArray(r)) { const a = new Array(width).fill(null); a[0] = r; return a; }
            const a = r.slice(); while (a.length < width) a.push(null); return a;
        });
        const cell = ws.Range(start.split(":")[0]);
        writeBlock(ws, cell.Row, cell.Column, norm);
        return { msg: `已写入 ${norm.length} 行 × ${width} 列数据到 ${start}` };
    }

    function readRange(ref, sheetName) {
        const ws = sheetByName(sheetName);
        const rng = rangeOf(ws, ref);
        const rows = rng.Rows.Count, cols = rng.Columns.Count;
        const LIMIT_R = 200, LIMIT_C = 30;
        const data = to2d(rng.Value);
        const clipped = data.slice(0, LIMIT_R).map(r => r.slice(0, LIMIT_C));
        return {
            msg: `${ws.Name}!${rng.Address(false, false)} 共 ${rows} 行 × ${cols} 列`,
            data: {
                sheet: ws.Name, rows, columns: cols,
                truncated: rows > LIMIT_R || cols > LIMIT_C,
                values: clipped,
            },
        };
    }

    function getSheetInfo() {
        const a = app();
        const wb = a.ActiveWorkbook;
        if (!wb) throw new Error("请先打开一个表格文件");
        const ws = a.ActiveSheet;
        const sheets = [];
        const sheetsObj = wb.Sheets || wb.Worksheets || a.Sheets;
        if (sheetsObj && sheetsObj.Count) {
            for (let i = 1; i <= sheetsObj.Count; i++) {
                try { sheets.push(sheetsObj.Item(i).Name); } catch (e) { }
            }
        }
        const info = { workbook: wb.Name, sheets, active: ws ? ws.Name : null };
        try {
            if (ws && ws.UsedRange) {
                const ur = ws.UsedRange;
                info.used_range = ur.Address ? ur.Address(false, false) : "A1";
                info.rows = ur.Rows ? ur.Rows.Count : 0;
                info.columns = ur.Columns ? ur.Columns.Count : 0;
            }
        } catch (e) { }
        return { msg: `${wb.Name} · ${sheets.length} 个工作表`, data: info };
    }

    function setNumberFormat(ref, code, sheetName) {
        const ws = sheetByName(sheetName);
        const rng = rangeOf(ws, ref);
        rng.NumberFormat = code;
        return { msg: `已设置数字格式 ${code}` };
    }

    function fillSerial(ref, start, step, sheetName) {
        const ws = sheetByName(sheetName);
        const rng = (ref ? ws.Range(ref) : selectionOrUsed(ws));
        const rows = Math.min(rng.Rows.Count, MAX_TOUCH_ROWS);
        const c0 = rng.Column, r0 = rng.Row;
        start = (typeof start === "number") ? start : 1;
        step = (typeof step === "number") ? step : 1;
        for (let i = 0; i < rows; i++) ws.Cells.Item(r0 + i, c0).Value = start + i * step;
        return { msg: `已在 ${rows} 行填充序号 ${start} 起步长 ${step}` };
    }

    function borderize(rng) { try { rng.Borders.LineStyle = XL_CONTINUOUS; } catch (e) { try { rng.Borders.Item(XL_CONTINUOUS).LineStyle = XL_CONTINUOUS; } catch (e2) { } } }

    function beautifyTable(ref, sheetName) {
        const ws = sheetByName(sheetName);
        const rng = (ref ? ws.Range(ref) : selectionOrUsed(ws));
        borderize(rng);
        try { rng.Font.Size = rng.Font.Size; } catch (e) { }
        const firstRow = ws.Range(ws.Cells.Item(rng.Row, rng.Column), ws.Cells.Item(rng.Row, rng.Column + rng.Columns.Count - 1));
        firstRow.Font.Bold = true;
        firstRow.Font.Color = COLORS.headerFont;
        firstRow.Interior.Color = COLORS.header;
        firstRow.HorizontalAlignment = XL_CENTER;
        try { rng.Rows.AutoFit(); rng.Columns.AutoFit(); } catch (e) { }
        return { msg: "已美化：加边框、表头加粗填色、自动行列宽" };
    }

    function addZebra(ref, sheetName) {
        const ws = sheetByName(sheetName);
        const rng = (ref ? ws.Range(ref) : selectionOrUsed(ws));
        const r0 = rng.Row, c0 = rng.Column, cN = rng.Column + rng.Columns.Count - 1;
        const n = Math.min(rng.Rows.Count - 1, MAX_TOUCH_ROWS);
        for (let i = 1; i <= n; i++) { // 跳过表头(第1行)，给奇数数据行上色
            if (i % 2 === 0) continue;
            ws.Range(ws.Cells.Item(r0 + i, c0), ws.Cells.Item(r0 + i, cN)).Interior.Color = COLORS.zebra;
        }
        return { msg: `已为 ${n} 行数据添加斑马纹底色` };
    }

    function freezeHeader(sheetName) {
        const a = app();
        const win = a.ActiveWindow;
        win.FreezePanes = false;
        win.SplitRow = 1;
        win.FreezePanes = true;
        return { msg: "已冻结首行" };
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

    // ---------- 高阶能力扩展 ----------

    const PRESET_COLORS = {
        yellow: rgb(254, 240, 138), // #fef08a
        green: rgb(187, 247, 208),  // #bbf7d0
        red: rgb(254, 202, 202),    // #fecaca
        blue: rgb(191, 219, 254),   // #bfdbfe
        orange: rgb(254, 215, 170), // #fed7aa
        purple: rgb(233, 213, 255), // #e9d5ff
        gray: rgb(241, 245, 249),   // #f1f5f9
        cyan: rgb(165, 243, 252),   // #a5f3fc
    };

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
                return rgb(r, g, b);
            }
        }
        if (typeof val === "number") return val;
        return PRESET_COLORS.yellow;
    }

    function getSelectionInfo() {
        const a = app();
        const ws = activeSheet();
        let sel = null;
        try { sel = a.Selection; } catch (e) { }
        if (!sel || !sel.Address) {
            return {
                msg: `${ws.Name} · 未检测到选区`,
                data: { sheet: ws.Name, address: "A1", rows: 1, columns: 1, preview: [] }
            };
        }
        const addr = sel.Address(false, false);
        const rows = sel.Rows ? sel.Rows.Count : 1;
        const cols = sel.Columns ? sel.Columns.Count : 1;
        const data = to2d(sel.Value);
        const preview = data.slice(0, 20).map(r => r.slice(0, 10));
        return {
            msg: `${ws.Name}!${addr} (${rows}行 × ${cols}列)`,
            data: {
                sheet: ws.Name,
                address: addr,
                rows,
                columns: cols,
                preview,
            }
        };
    }

    function highlightCells(ref, sheetName, colorType, customColor) {
        const ws = sheetByName(sheetName);
        const rng = (ref ? ws.Range(ref) : selectionOrUsed(ws));
        const color = parseColor(customColor || colorType);
        if (color === null || colorType === "clear") {
            try { rng.Interior.ColorIndex = -4142; } catch (e) {
                try { rng.Interior.Pattern = -4142; } catch (e2) {
                    rng.Interior.Color = rgb(255, 255, 255);
                }
            }
            return { msg: `已清除 ${rng.Address(false, false)} 的背景高亮` };
        }
        rng.Interior.Color = color;
        return { msg: `已将 ${rng.Address(false, false)} 高亮标记为 ${colorType || "自定义颜色"}` };
    }

    function mergeCells(ref, sheetName, action) {
        const ws = sheetByName(sheetName);
        const rng = (ref ? ws.Range(ref) : selectionOrUsed(ws));
        const act = (action || "merge_center").toLowerCase();
        if (act === "unmerge") {
            rng.UnMerge();
            return { msg: `已取消 ${rng.Address(false, false)} 的合并单元格` };
        } else if (act === "merge") {
            rng.Merge();
            return { msg: `已合并 ${rng.Address(false, false)}` };
        } else {
            rng.Merge();
            try { rng.HorizontalAlignment = XL_CENTER; } catch (e) { }
            return { msg: `已合并居中 ${rng.Address(false, false)}` };
        }
    }

    function insertDeleteRowsCols(sheetName, type, action, index, count) {
        const ws = sheetByName(sheetName);
        const n = Math.max(1, count || 1);
        const idx = Math.max(1, index || 1);
        const isRow = (type === "row");
        const isInsert = (action === "insert");

        for (let i = 0; i < n; i++) {
            if (isRow) {
                if (isInsert) ws.Rows.Item(idx).Insert();
                else ws.Rows.Item(idx).Delete();
            } else {
                if (isInsert) ws.Columns.Item(idx).Insert();
                else ws.Columns.Item(idx).Delete();
            }
        }
        const actStr = isInsert ? "插入" : "删除";
        const targetStr = isRow ? `第 ${idx} 行起 ${n} 行` : `第 ${idx} 列起 ${n} 列`;
        return { msg: `已成功${actStr} ${targetStr}` };
    }

    function setColWidthRowHeight(ref, sheetName, colWidth, rowHeight, autoFit) {
        const ws = sheetByName(sheetName);
        const rng = (ref ? ws.Range(ref) : selectionOrUsed(ws));
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

    function transposeRange(sourceRef, targetStart, sheetName) {
        const ws = sheetByName(sheetName);
        const src = (sourceRef ? ws.Range(sourceRef) : selectionOrUsed(ws));
        const data = to2d(src.Value);
        if (!data.length || !data[0].length) return { msg: "没有有效数据可供转置" };
        const rows = data.length;
        const cols = data[0].length;
        const transposed = [];
        for (let c = 0; c < cols; c++) {
            const newRow = [];
            for (let r = 0; r < rows; r++) {
                newRow.push(data[r][c] !== undefined ? data[r][c] : null);
            }
            transposed.push(newRow);
        }
        const targetCell = targetStart ? ws.Range(targetStart.split(":")[0]) : ws.Cells.Item(src.Row, src.Column + cols + 1);
        writeBlock(ws, targetCell.Row, targetCell.Column, transposed);
        return {
            msg: `已将 ${src.Address(false, false)} (${rows}行×${cols}列) 转置为 (${cols}行×${rows}列) 写入 ${targetCell.Address(false, false)}`,
            data: { rows: cols, columns: rows, start: targetCell.Address(false, false) }
        };
    }

    function quickStats(ref, sheetName) {
        const ws = sheetByName(sheetName);
        const rng = (ref ? ws.Range(ref) : selectionOrUsed(ws));
        const data = to2d(rng.Value);
        let total = 0, nonBlank = 0, numCount = 0;
        let sum = 0, min = null, max = null;
        for (let r = 0; r < data.length; r++) {
            for (let c = 0; c < data[r].length; c++) {
                total++;
                const v = data[r][c];
                if (!isBlank(v)) {
                    nonBlank++;
                    let n = null;
                    if (typeof v === "number") n = v;
                    else if (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v.trim()))) n = Number(v.trim());
                    if (n !== null) {
                        numCount++;
                        sum += n;
                        if (min === null || n < min) min = n;
                        if (max === null || n > max) max = n;
                    }
                }
            }
        }
        const avg = numCount > 0 ? (sum / numCount) : 0;
        const stats = {
            address: rng.Address(false, false),
            total,
            nonBlank,
            blank: total - nonBlank,
            numCount,
            sum: numCount > 0 ? Number(sum.toFixed(4)) : null,
            avg: numCount > 0 ? Number(avg.toFixed(4)) : null,
            min: min !== null ? Number(min.toFixed(4)) : null,
            max: max !== null ? Number(max.toFixed(4)) : null,
        };
        const summaryText = numCount > 0
            ? `${rng.Address(false, false)}：共 ${total} 单元格，数值 ${numCount} 个，求和=${stats.sum}，平均值=${stats.avg}，极值[${stats.min}, ${stats.max}]`
            : `${rng.Address(false, false)}：共 ${total} 单元格，非空 ${nonBlank} 个，未包含数值数据`;
        return { msg: summaryText, data: stats };
    }

    function exportData(ref, sheetName, format) {
        const ws = sheetByName(sheetName);
        const rng = (ref ? ws.Range(ref) : selectionOrUsed(ws));
        const data = to2d(rng.Value);
        if (!data.length) return { msg: "没有数据可导出", data: { text: "" } };
        const fmt = (format || "markdown").toLowerCase();
        let out = "";
        if (fmt === "json") {
            if (data.length > 1) {
                const headers = data[0].map((h, i) => isBlank(h) ? `col_${i + 1}` : String(h));
                const list = [];
                for (let r = 1; r < data.length; r++) {
                    const rowObj = {};
                    for (let c = 0; c < headers.length; c++) {
                        rowObj[headers[c]] = data[r][c] !== undefined ? data[r][c] : null;
                    }
                    list.push(rowObj);
                }
                out = JSON.stringify(list, null, 2);
            } else {
                out = JSON.stringify(data, null, 2);
            }
        } else if (fmt === "csv") {
            out = data.map(r => r.map(c => {
                if (c == null) return "";
                const s = String(c).replace(/"/g, '""');
                return /[",\n]/.test(s) ? `"${s}"` : s;
            }).join(",")).join("\n");
        } else {
            // markdown
            const headers = data[0].map(h => isBlank(h) ? "-" : String(h));
            const divider = headers.map(() => "---");
            const lines = [
                `| ${headers.join(" | ")} |`,
                `| ${divider.join(" | ")} |`
            ];
            for (let r = 1; r < data.length; r++) {
                const row = data[r].map(c => isBlank(c) ? " " : String(c).replace(/\|/g, "\\|"));
                while (row.length < headers.length) row.push(" ");
                lines.push(`| ${row.join(" | ")} |`);
            }
            out = lines.join("\n");
        }
        return {
            msg: `已将 ${rng.Address(false, false)} 转换为 ${fmt.toUpperCase()} (${data.length}行)`,
            data: { text: out, format: fmt, rows: data.length, columns: data[0].length }
        };
    }

    function createChart(ref, sheetName, chartType, title) {
        const ws = sheetByName(sheetName);
        const rng = (ref ? ws.Range(ref) : selectionOrUsed(ws));
        try {
            const chartObjs = ws.ChartObjects();
            const left = (rng.Left || 50) + (rng.Width || 300) + 20;
            const top = rng.Top || 30;
            const co = chartObjs.Add(left, top, 460, 280);
            co.Chart.SetSourceData(rng);
            if (title) {
                try {
                    co.Chart.HasTitle = true;
                    co.Chart.ChartTitle.Text = title;
                } catch (e) { }
            }
            return { msg: `已在 ${rng.Address(false, false)} 旁创建${title ? "「" + title + "」" : ""}图表` };
        } catch (err) {
            return { msg: `创建图表受限: ${err && err.message ? err.message : err}` };
        }
    }

    // ---------- 功能区与快捷面板按钮入口 ----------

    const actions = {
        deleteEmptyRows: () => deleteEmptyRows(null, activeSheet().Name),
        deleteEmptyCols: () => deleteEmptyCols(null, activeSheet().Name),
        removeDuplicates: () => removeDuplicates(null, true, activeSheet().Name),
        trimText: () => trimText(null, activeSheet().Name),
        beautify: () => beautifyTable(null, activeSheet().Name),
        addZebra: () => addZebra(null, activeSheet().Name),
        freeze: () => freezeHeader(),
        fillSerial: () => fillSerial(null, 1, 1, activeSheet().Name),
        getSelectionInfo: () => getSelectionInfo(),
        quickStats: (ref) => quickStats(ref, activeSheet().Name),
        highlight: (ref, color) => highlightCells(ref, activeSheet().Name, color),
        merge: (ref, act) => mergeCells(ref, activeSheet().Name, act),
        transpose: (src, dst) => transposeRange(src, dst, activeSheet().Name),
        autoFit: (ref) => setColWidthRowHeight(ref, activeSheet().Name, null, null, true),
        exportMarkdown: (ref) => exportData(ref, activeSheet().Name, "markdown"),
        exportJson: (ref) => exportData(ref, activeSheet().Name, "json"),
        createChart: (ref, type, title) => createChart(ref, activeSheet().Name, type, title),
    };

    // ---------- AI 工具注册表（JSON Schema 供 function-calling） ----------

    const RANGE_PARAM = { type: "string", description: "区域地址如 A1:D100，省略则用当前工作表已用区域" };
    const SHEET_PARAM = { type: "string", description: "工作表名称，省略则用当前工作表" };

    const aiTools = [
        {
            name: "get_sheet_info", description: "获取当前工作簿概况：文件名、所有工作表、当前表的数据范围和选区。对话开始时先调用它了解上下文。",
            parameters: { type: "object", properties: {} }, run: getSheetInfo,
        },
        {
            name: "get_selection", description: "获取用户当前在表格中框选的活动选区坐标（如 B2:D15）、行列数以及选区内前若干行的数据内容预览。",
            parameters: { type: "object", properties: {} }, run: getSelectionInfo,
        },
        {
            name: "read_range", description: "读取指定区域的单元格值（返回二维数组）。要理解用户数据时必须先读，不要凭空猜测内容。",
            parameters: { type: "object", properties: { range: RANGE_PARAM, sheet: SHEET_PARAM } },
            run: (a) => readRange(a.range, a.sheet),
        },
        {
            name: "write_cells", description: "把二维数组写入以 start 为左上角的区域。可用于写数据、写表头。",
            parameters: {
                type: "object", required: ["start", "values"],
                properties: {
                    start: { type: "string", description: "左上角单元格，如 E1" },
                    values: { type: "array", items: { type: "array" }, description: "二维数组，如 [[\"姓名\",\"分数\"],[\"张三\",90]]" },
                    sheet: SHEET_PARAM,
                },
            },
            run: (a) => writeCells(a.start, a.values, a.sheet),
        },
        {
            name: "set_formula", description: "向单元格或区域写入 Excel/WPS 公式，公式必须以=开头。写入前先 read_range 核对列位置。",
            parameters: {
                type: "object", required: ["cell", "formula"],
                properties: {
                    cell: { type: "string", description: "目标单元格或区域，如 C2 或 C2:C100" },
                    formula: { type: "string" }, sheet: SHEET_PARAM,
                },
            },
            run: (a) => setFormula(a.cell, a.formula, a.sheet),
        },
        {
            name: "highlight_cells", description: "给指定单元格或区域设置背景高亮色。color 可选预设值：yellow(黄色)、green(浅绿)、red(浅红)、blue(浅蓝)、orange(橙色)、purple(淡紫)、gray(浅灰) 或 clear(清除高亮)。",
            parameters: {
                type: "object", required: ["color"],
                properties: {
                    color: { type: "string", enum: ["yellow", "green", "red", "blue", "orange", "purple", "gray", "clear"] },
                    custom_color: { type: "string", description: "十六进制颜色如 #fef08a" },
                    range: RANGE_PARAM, sheet: SHEET_PARAM,
                },
            },
            run: (a) => highlightCells(a.range, a.sheet, a.color, a.custom_color),
        },
        {
            name: "merge_cells", description: "合并单元格或取消合并。action 可选值：merge_center(合并居中，默认)、merge(普通合并)、unmerge(取消合并)。",
            parameters: {
                type: "object",
                properties: {
                    action: { type: "string", enum: ["merge_center", "merge", "unmerge"] },
                    range: RANGE_PARAM, sheet: SHEET_PARAM,
                },
            },
            run: (a) => mergeCells(a.range, a.sheet, a.action),
        },
        {
            name: "insert_delete_rows_cols", description: "插入或删除特定行或列。",
            parameters: {
                type: "object", required: ["type", "action", "index"],
                properties: {
                    type: { type: "string", enum: ["row", "column"], description: "row为行，column为列" },
                    action: { type: "string", enum: ["insert", "delete"], description: "insert为插入，delete为删除" },
                    index: { type: "number", description: "从第几行或第几列开始(1开始)" },
                    count: { type: "number", description: "数量，默认1" },
                    sheet: SHEET_PARAM,
                },
            },
            run: (a) => insertDeleteRowsCols(a.sheet, a.type, a.action, a.index, a.count),
        },
        {
            name: "transpose_range", description: "行列转置：将指定区域的行列进行互换，并写入目标起始单元格。",
            parameters: {
                type: "object", required: ["source_range"],
                properties: {
                    source_range: { type: "string", description: "源区域地址，如 A1:D10" },
                    target_start: { type: "string", description: "目标左上角单元格，如 F1。若省略则自动写入源数据右侧" },
                    sheet: SHEET_PARAM,
                },
            },
            run: (a) => transposeRange(a.source_range, a.target_start, a.sheet),
        },
        {
            name: "quick_stats", description: "快速统计指定区域的数据概况（计算总格数、非空格数、数值格数、求和 Sum、平均值 Avg、最小值 Min、最大值 Max）。",
            parameters: { type: "object", properties: { range: RANGE_PARAM, sheet: SHEET_PARAM } },
            run: (a) => quickStats(a.range, a.sheet),
        },
        {
            name: "set_col_width_row_height", description: "调整指定区域或整表的列宽、行高，或执行全自动最佳适应自适应 (auto_fit)。",
            parameters: {
                type: "object",
                properties: {
                    auto_fit: { type: "boolean", description: "是否自动最佳适应行列宽" },
                    col_width: { type: "number", description: "列宽数值" },
                    row_height: { type: "number", description: "行高数值" },
                    range: RANGE_PARAM, sheet: SHEET_PARAM,
                },
            },
            run: (a) => setColWidthRowHeight(a.range, a.sheet, a.col_width, a.row_height, a.auto_fit),
        },
        {
            name: "create_chart", description: "根据指定数据区域在工作表中创建图表（如柱状图、折线图、饼图）。",
            parameters: {
                type: "object",
                properties: {
                    range: RANGE_PARAM, sheet: SHEET_PARAM,
                    chart_type: { type: "string", description: "图表类型，如 column, line, pie" },
                    title: { type: "string", description: "图表标题" },
                },
            },
            run: (a) => createChart(a.range, a.sheet, a.chart_type, a.title),
        },
        {
            name: "clean_data", description: "数据清洗组合操作。ops 可选值：trim(去首尾空格)、remove_empty_rows(删空行)、remove_empty_cols(删空列)、remove_duplicates(按整行去重保留表头与首行)。删除类操作不可逆，执行前必须先向用户确认。",
            parameters: {
                type: "object", required: ["ops"],
                properties: {
                    ops: { type: "array", items: { type: "string", enum: ["trim", "remove_empty_rows", "remove_empty_cols", "remove_duplicates"] } },
                    range: RANGE_PARAM, sheet: SHEET_PARAM,
                },
            },
            run: (a) => cleanData(a.ops, a.range, a.sheet),
        },
        {
            name: "sort_range", description: "对区域按某列排序（区域内首行是否为表头由 has_header 决定）。",
            parameters: {
                type: "object", required: ["by_column"],
                properties: {
                    by_column: { type: "number", description: "区域内第几列（1 开始）" },
                    order: { type: "string", enum: ["asc", "desc"] },
                    has_header: { type: "boolean" }, range: RANGE_PARAM, sheet: SHEET_PARAM,
                },
            },
            run: (a) => sortRange(a.range, a.by_column, a.order, a.has_header !== false, a.sheet),
        },
        {
            name: "find_replace", description: "在区域（默认整表已用区域）内查找并替换文本。",
            parameters: {
                type: "object", required: ["find"],
                properties: { find: { type: "string" }, replace: { type: "string" }, range: RANGE_PARAM, sheet: SHEET_PARAM },
            },
            run: (a) => findReplace(a.find, a.replace, a.range, a.sheet),
        },
        {
            name: "beautify_table", description: "一键美化：全边框、首行表头加粗白字蓝底居中、自动调整行列宽。",
            parameters: { type: "object", properties: { range: RANGE_PARAM, sheet: SHEET_PARAM } },
            run: (a) => beautifyTable(a.range, a.sheet),
        },
        {
            name: "add_zebra", description: "为数据区添加隔行斑马纹底色（自动跳过表头行）。",
            parameters: { type: "object", properties: { range: RANGE_PARAM, sheet: SHEET_PARAM } },
            run: (a) => addZebra(a.range, a.sheet),
        },
        {
            name: "fill_serial", description: "在选区/指定列填充连续序号。",
            parameters: { type: "object", properties: { start: { type: "number" }, step: { type: "number" }, range: RANGE_PARAM, sheet: SHEET_PARAM } },
            run: (a) => fillSerial(a.range, a.start, a.step, a.sheet),
        },
        {
            name: "freeze_header", description: "冻结当前窗口首行。",
            parameters: { type: "object", properties: {} },
            run: () => freezeHeader(),
        },
        {
            name: "set_number_format", description: "设置区域数字格式，如 0.00、yyyy-mm-dd、#,##0、0.0%、@ (文本)。",
            parameters: {
                type: "object", required: ["format"],
                properties: { format: { type: "string" }, range: RANGE_PARAM, sheet: SHEET_PARAM },
            },
            run: (a) => setNumberFormat(a.range, a.format || a.code, a.sheet),
        },
    ];

    // 导出
    window.ForgeTools = aiTools;
    window.ForgeActions = actions;
})();
