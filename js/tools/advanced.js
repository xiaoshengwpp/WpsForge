// js/tools/advanced.js - 高阶数据能力：公式写入、单元格读写、选区速算、行列转置、图表创建与格式导出
(function () {
    "use strict";

    window.WpsForge = window.WpsForge || {};
    window.WpsForge.tools = window.WpsForge.tools || {};

    const core = () => window.WpsForge.tools.core;

    function findReplace(find, replace, ref, sheetName) {
        if (!find) throw new Error("find 参数不能为空");
        const c = core();
        const ws = c.sheetByName(sheetName);
        const rng = c.rangeOf(ws, ref);
        let ok = false;
        try {
            ok = rng.Replace(find, replace === undefined ? "" : replace, c.XL_PART);
        } catch (e) {
            ok = rng.Replace({ What: find, Replacement: replace || "", LookAt: c.XL_PART });
        }
        return { msg: ok ? `已将 "${find}" 替换为 "${replace || "(空)"}"` : `未找到 "${find}"` };
    }

    function sortRange(ref, byColumn, order, hasHeader, sheetName) {
        const c = core();
        const ws = c.sheetByName(sheetName);
        const rng = c.rangeOf(ws, ref);
        let data = c.to2d(rng.Value);
        if (!data.length) return { msg: "没有可排序的数据" };
        let header = null;
        if (hasHeader) { header = data[0]; data = data.slice(1); }
        const idx = Math.max(0, (byColumn || 1) - 1);
        const dir = (order === "desc") ? -1 : 1;
        data.sort((a, b) => {
            const x = a[idx], y = b[idx];
            if (c.isBlank(x) && c.isBlank(y)) return 0;
            if (c.isBlank(x)) return 1;   // 空值永远沉底
            if (c.isBlank(y)) return -1;
            if (typeof x === "number" && typeof y === "number") return (x - y) * dir;
            return String(x).localeCompare(String(y), "zh") * dir;
        });
        if (header) data.unshift(header);
        c.writeBlock(ws, rng.Row, rng.Column, data);
        return { msg: `按第 ${byColumn || 1} 列${dir > 0 ? "升序" : "降序"}排序完成` };
    }

    function setFormula(cell, formula, sheetName) {
        const c = core();
        const ws = c.sheetByName(sheetName);
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
        const c = core();
        const ws = c.sheetByName(sheetName);
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
        c.writeBlock(ws, cell.Row, cell.Column, norm);
        return { msg: `已写入 ${norm.length} 行 × ${width} 列数据到 ${start}` };
    }

    function readRange(ref, sheetName) {
        const c = core();
        const ws = c.sheetByName(sheetName);
        const rng = c.rangeOf(ws, ref);
        const rows = rng.Rows.Count, cols = rng.Columns.Count;
        const LIMIT_R = 200, LIMIT_C = 30;
        const data = c.to2d(rng.Value);
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
        const c = core();
        const a = c.app();
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

    function getSelectionInfo() {
        const c = core();
        const a = c.app();
        const ws = c.activeSheet();
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
        const data = c.to2d(sel.Value);
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

    function insertDeleteRowsCols(sheetName, type, action, index, count) {
        const c = core();
        const ws = c.sheetByName(sheetName);
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

    function transposeRange(sourceRef, targetStart, sheetName) {
        const c = core();
        const ws = c.sheetByName(sheetName);
        const src = (sourceRef ? ws.Range(sourceRef) : c.selectionOrUsed(ws));
        const data = c.to2d(src.Value);
        if (!data.length || !data[0].length) return { msg: "没有有效数据可供转置" };
        const rows = data.length;
        const cols = data[0].length;
        const transposed = [];
        for (let col = 0; col < cols; col++) {
            const newRow = [];
            for (let r = 0; r < rows; r++) {
                newRow.push(data[r][col] !== undefined ? data[r][col] : null);
            }
            transposed.push(newRow);
        }
        const targetCell = targetStart ? ws.Range(targetStart.split(":")[0]) : ws.Cells.Item(src.Row, src.Column + cols + 1);
        c.writeBlock(ws, targetCell.Row, targetCell.Column, transposed);
        return {
            msg: `已将 ${src.Address(false, false)} (${rows}行×${cols}列) 转置为 (${cols}行×${rows}列) 写入 ${targetCell.Address(false, false)}`,
            data: { rows: cols, columns: rows, start: targetCell.Address(false, false) }
        };
    }

    function quickStats(ref, sheetName) {
        const c = core();
        const ws = c.sheetByName(sheetName);
        const rng = (ref ? ws.Range(ref) : c.selectionOrUsed(ws));
        const data = c.to2d(rng.Value);
        let total = 0, nonBlank = 0, numCount = 0;
        let sum = 0, min = null, max = null;
        for (let r = 0; r < data.length; r++) {
            for (let col = 0; col < data[r].length; col++) {
                total++;
                const v = data[r][col];
                if (!c.isBlank(v)) {
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
        const c = core();
        const ws = c.sheetByName(sheetName);
        const rng = (ref ? ws.Range(ref) : c.selectionOrUsed(ws));
        const data = c.to2d(rng.Value);
        if (!data.length) return { msg: "没有数据可导出", data: { text: "" } };
        const fmt = (format || "markdown").toLowerCase();
        let out = "";
        if (fmt === "json") {
            if (data.length > 1) {
                const headers = data[0].map((h, i) => c.isBlank(h) ? `col_${i + 1}` : String(h));
                const list = [];
                for (let r = 1; r < data.length; r++) {
                    const rowObj = {};
                    for (let col = 0; col < headers.length; col++) {
                        rowObj[headers[col]] = data[r][col] !== undefined ? data[r][col] : null;
                    }
                    list.push(rowObj);
                }
                out = JSON.stringify(list, null, 2);
            } else {
                out = JSON.stringify(data, null, 2);
            }
        } else if (fmt === "csv") {
            out = data.map(r => r.map(cell => {
                if (cell == null) return "";
                const s = String(cell).replace(/"/g, '""');
                return /[",\n]/.test(s) ? `"${s}"` : s;
            }).join(",")).join("\n");
        } else {
            // markdown
            const headers = data[0].map(h => c.isBlank(h) ? "-" : String(h));
            const divider = headers.map(() => "---");
            const lines = [
                `| ${headers.join(" | ")} |`,
                `| ${divider.join(" | ")} |`
            ];
            for (let r = 1; r < data.length; r++) {
                const row = data[r].map(cell => c.isBlank(cell) ? " " : String(cell).replace(/\|/g, "\\|"));
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
        const c = core();
        const ws = c.sheetByName(sheetName);
        const rng = (ref ? ws.Range(ref) : c.selectionOrUsed(ws));
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

    window.WpsForge.tools.advanced = {
        findReplace,
        sortRange,
        setFormula,
        writeCells,
        readRange,
        getSheetInfo,
        getSelectionInfo,
        insertDeleteRowsCols,
        transposeRange,
        quickStats,
        exportData,
        createChart,
    };
})();
