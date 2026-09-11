// js/tools/schema.js - AI Function Calling 工具规格定义 (JSON Schema) 与运行入口绑定
(function () {
    "use strict";

    window.WpsForge = window.WpsForge || {};
    window.WpsForge.tools = window.WpsForge.tools || {};

    const clean = () => window.WpsForge.tools.clean;
    const format = () => window.WpsForge.tools.format;
    const advanced = () => window.WpsForge.tools.advanced;

    const RANGE_PARAM = { type: "string", description: "区域地址如 A1:D100，省略则用当前工作表已用区域" };
    const SHEET_PARAM = { type: "string", description: "工作表名称，省略则用当前工作表" };

    const aiTools = [
        {
            name: "get_sheet_info",
            description: "获取当前工作簿概况：文件名、所有工作表、当前表的数据范围和选区。对话开始时先调用它了解上下文。",
            parameters: { type: "object", properties: {} },
            run: () => advanced().getSheetInfo(),
        },
        {
            name: "get_selection",
            description: "获取用户当前在表格中框选的活动选区坐标（如 B2:D15）、行列数以及选区内前若干行的数据内容预览。",
            parameters: { type: "object", properties: {} },
            run: () => advanced().getSelectionInfo(),
        },
        {
            name: "read_range",
            description: "读取指定区域的单元格值（返回二维数组）。要理解用户数据时必须先读，不要凭空猜测内容。",
            parameters: { type: "object", properties: { range: RANGE_PARAM, sheet: SHEET_PARAM } },
            run: (a) => advanced().readRange(a.range, a.sheet),
        },
        {
            name: "write_cells",
            description: "把二维数组写入以 start 为左上角的区域。可用于写数据、写表头。",
            parameters: {
                type: "object", required: ["start", "values"],
                properties: {
                    start: { type: "string", description: "左上角单元格，如 E1" },
                    values: { type: "array", items: { type: "array" }, description: "二维数组，如 [[\"姓名\",\"分数\"],[\"张三\",90]]" },
                    sheet: SHEET_PARAM,
                },
            },
            run: (a) => advanced().writeCells(a.start, a.values, a.sheet),
        },
        {
            name: "set_formula",
            description: "向单元格或区域写入 Excel/WPS 公式，公式必须以=开头。写入前先 read_range 核对列位置。",
            parameters: {
                type: "object", required: ["cell", "formula"],
                properties: {
                    cell: { type: "string", description: "目标单元格或区域，如 C2 或 C2:C100" },
                    formula: { type: "string" }, sheet: SHEET_PARAM,
                },
            },
            run: (a) => advanced().setFormula(a.cell, a.formula, a.sheet),
        },
        {
            name: "highlight_cells",
            description: "给指定单元格或区域设置背景高亮色。color 可选预设值：yellow(黄色)、green(浅绿)、red(浅红)、blue(浅蓝)、orange(橙色)、purple(淡紫)、gray(浅灰) 或 clear(清除高亮)。",
            parameters: {
                type: "object", required: ["color"],
                properties: {
                    color: { type: "string", enum: ["yellow", "green", "red", "blue", "orange", "purple", "gray", "clear"] },
                    custom_color: { type: "string", description: "十六进制颜色如 #fef08a" },
                    range: RANGE_PARAM, sheet: SHEET_PARAM,
                },
            },
            run: (a) => format().highlightCells(a.range, a.sheet, a.color, a.custom_color),
        },
        {
            name: "merge_cells",
            description: "合并单元格或取消合并。action 可选值：merge_center(合并居中，默认)、merge(普通合并)、unmerge(取消合并)。",
            parameters: {
                type: "object",
                properties: {
                    action: { type: "string", enum: ["merge_center", "merge", "unmerge"] },
                    range: RANGE_PARAM, sheet: SHEET_PARAM,
                },
            },
            run: (a) => format().mergeCells(a.range, a.sheet, a.action),
        },
        {
            name: "insert_delete_rows_cols",
            description: "插入或删除特定行或列。",
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
            run: (a) => advanced().insertDeleteRowsCols(a.sheet, a.type, a.action, a.index, a.count),
        },
        {
            name: "transpose_range",
            description: "行列转置：将指定区域的行列进行互换，并写入目标起始单元格。",
            parameters: {
                type: "object", required: ["source_range"],
                properties: {
                    source_range: { type: "string", description: "源区域地址，如 A1:D10" },
                    target_start: { type: "string", description: "目标左上角单元格，如 F1。若省略则自动写入源数据右侧" },
                    sheet: SHEET_PARAM,
                },
            },
            run: (a) => advanced().transposeRange(a.source_range, a.target_start, a.sheet),
        },
        {
            name: "quick_stats",
            description: "快速统计指定区域的数据概况（计算总格数、非空格数、数值格数、求和 Sum、平均值 Avg、最小值 Min、最大值 Max）。",
            parameters: { type: "object", properties: { range: RANGE_PARAM, sheet: SHEET_PARAM } },
            run: (a) => advanced().quickStats(a.range, a.sheet),
        },
        {
            name: "set_col_width_row_height",
            description: "调整指定区域或整表的列宽、行高，或执行全自动最佳适应自适应 (auto_fit)。",
            parameters: {
                type: "object",
                properties: {
                    auto_fit: { type: "boolean", description: "是否自动最佳适应行列宽" },
                    col_width: { type: "number", description: "列宽数值" },
                    row_height: { type: "number", description: "行高数值" },
                    range: RANGE_PARAM, sheet: SHEET_PARAM,
                },
            },
            run: (a) => format().setColWidthRowHeight(a.range, a.sheet, a.col_width, a.row_height, a.auto_fit),
        },
        {
            name: "create_chart",
            description: "根据指定数据区域在工作表中创建图表（如柱状图、折线图、饼图）。",
            parameters: {
                type: "object",
                properties: {
                    range: RANGE_PARAM, sheet: SHEET_PARAM,
                    chart_type: { type: "string", description: "图表类型，如 column, line, pie" },
                    title: { type: "string", description: "图表标题" },
                },
            },
            run: (a) => advanced().createChart(a.range, a.sheet, a.chart_type, a.title),
        },
        {
            name: "clean_data",
            description: "数据清洗组合操作。ops 可选值：trim(去首尾空格)、remove_empty_rows(删空行)、remove_empty_cols(删空列)、remove_duplicates(按整行去重保留表头与首行)。删除类操作不可逆，执行前必须先向用户确认。",
            parameters: {
                type: "object", required: ["ops"],
                properties: {
                    ops: { type: "array", items: { type: "string", enum: ["trim", "remove_empty_rows", "remove_empty_cols", "remove_duplicates"] } },
                    range: RANGE_PARAM, sheet: SHEET_PARAM,
                },
            },
            run: (a) => clean().cleanData(a.ops, a.range, a.sheet),
        },
        {
            name: "sort_range",
            description: "对区域按某列排序（区域内首行是否为表头由 has_header 决定）。",
            parameters: {
                type: "object", required: ["by_column"],
                properties: {
                    by_column: { type: "number", description: "区域内第几列（1 开始）" },
                    order: { type: "string", enum: ["asc", "desc"] },
                    has_header: { type: "boolean" }, range: RANGE_PARAM, sheet: SHEET_PARAM,
                },
            },
            run: (a) => advanced().sortRange(a.range, a.by_column, a.order, a.has_header !== false, a.sheet),
        },
        {
            name: "find_replace",
            description: "在区域（默认整表已用区域）内查找并替换文本。",
            parameters: {
                type: "object", required: ["find"],
                properties: { find: { type: "string" }, replace: { type: "string" }, range: RANGE_PARAM, sheet: SHEET_PARAM },
            },
            run: (a) => advanced().findReplace(a.find, a.replace, a.range, a.sheet),
        },
        {
            name: "beautify_table",
            description: "一键美化：全边框、首行表头加粗白字蓝底居中、自动调整行列宽。",
            parameters: { type: "object", properties: { range: RANGE_PARAM, sheet: SHEET_PARAM } },
            run: (a) => format().beautifyTable(a.range, a.sheet),
        },
        {
            name: "add_zebra",
            description: "为数据区添加隔行斑马纹底色（自动跳过表头行）。",
            parameters: { type: "object", properties: { range: RANGE_PARAM, sheet: SHEET_PARAM } },
            run: (a) => format().addZebra(a.range, a.sheet),
        },
        {
            name: "fill_serial",
            description: "在选区/指定列填充连续序号。",
            parameters: { type: "object", properties: { start: { type: "number" }, step: { type: "number" }, range: RANGE_PARAM, sheet: SHEET_PARAM } },
            run: (a) => format().fillSerial(a.range, a.start, a.step, a.sheet),
        },
        {
            name: "freeze_header",
            description: "冻结当前窗口首行。",
            parameters: { type: "object", properties: {} },
            run: () => format().freezeHeader(),
        },
        {
            name: "set_number_format",
            description: "设置区域数字格式，如 0.00、yyyy-mm-dd、#,##0、0.0%、@ (文本)。",
            parameters: {
                type: "object", required: ["format"],
                properties: { format: { type: "string" }, range: RANGE_PARAM, sheet: SHEET_PARAM },
            },
            run: (a) => format().setNumberFormat(a.range, a.format || a.code, a.sheet),
        },
    ];

    window.WpsForge.tools.schema = {
        RANGE_PARAM,
        SHEET_PARAM,
        aiTools,
    };
})();
