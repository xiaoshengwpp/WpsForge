// js/taskpane/data.js - 快捷胶囊、场景库与工具箱静态数据元配置 (声明式驱动 UI 渲染)
(function () {
    "use strict";

    window.WpsForge = window.WpsForge || {};
    window.WpsForge.taskpane = window.WpsForge.taskpane || {};

    const QUICK_CHIPS = [
        {
            title: "一键美化表格",
            prompt: "给当前表格做一键美化：加边框、深蓝表头白字、自适应列宽",
            svg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6Z"/></svg>`,
        },
        {
            title: "删除空行空格",
            prompt: "删除当前工作表中的所有空白行与多余空格",
            svg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line><path d="M3 6h18M3 12h18M3 18h18"></path></svg>`,
        },
        {
            title: "求和与公式",
            prompt: "读取当前选区数据，并给出求和公式与统计分析",
            svg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="18"></line></svg>`,
        },
        {
            title: "斑马纹+冻结",
            prompt: "为数据区域添加隔行浅色斑马纹底色并冻结首行",
            svg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="14" x2="21" y2="14"></line></svg>`,
        },
        {
            title: "数据全貌诊断",
            prompt: "分析当前表格数据全貌，指出可能存在的异常值或空值",
            svg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
        },
    ];

    const SCENARIOS = [
        {
            groupTitle: "常用公式与计算",
            groupSvg: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
            items: [
                {
                    title: "跨列求和与总计",
                    desc: "读取选区数值并自动在最下方或最右侧写入精确的 SUM 求和公式。",
                    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><path d="M4 19L10 5M10 19l6-14M14 12h7"></path></svg>`,
                    prompt: "请读取当前选中区域的数据，核对数值列并在下方空白行填入标准的 SUM 求和公式",
                    allowDirect: true,
                },
                {
                    title: "跨表关联查询 (VLOOKUP/XLOOKUP)",
                    desc: "根据指定关键词列，生成匹配另一个工作表数据的查找函数。",
                    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
                    prompt: "帮我分析当前表与关联表的数据结构，写出 VLOOKUP 或 XLOOKUP 匹配公式",
                    allowDirect: false,
                },
                {
                    title: "身份证提取生日与性别",
                    desc: "从 18 位身份证号码中提取出生年月日（YYYY-MM-DD）和性别公式。",
                    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7.5" r="4"></circle></svg>`,
                    prompt: "读取表格中的身份证列，在右侧新增两列：一列提取出生日期(YYYY-MM-DD)，一列根据倒数第二位判断性别(男/女)",
                    allowDirect: true,
                },
            ],
        },
        {
            groupTitle: "数据清洗与规范化",
            groupSvg: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
            items: [
                {
                    title: "全表深度大扫除",
                    desc: "一次性清理全角半角首尾空格、剔除空白行空白列并进行整行查重。",
                    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line><path d="M3 6h18M3 12h18M3 18h18"></path></svg>`,
                    prompt: "请对我当前工作表执行深度清洗：清理所有空格、删除所有空行与空列、去除完全重复的数据行",
                    allowDirect: true,
                },
                {
                    title: "高亮重复值与异常值",
                    desc: "找出选区中的重复数据项或异常偏大偏小值，并用醒目黄色标记。",
                    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
                    prompt: "读取当前选区数据，找出重复出现的内容，并调用 highlight_cells 工具将其高亮标记为黄色",
                    allowDirect: true,
                },
            ],
        },
        {
            groupTitle: "排版美化与数据生成",
            groupSvg: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`,
            items: [
                {
                    title: "专业商务报表美化",
                    desc: "一键应用科技蓝表头、清晰外边框、隔行微蓝斑马纹并冻结标题首行。",
                    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6Z"/></svg>`,
                    prompt: "对当前表格进行专业商务美化：加表头深蓝底色与白字、加细边框、加隔行浅色斑马纹、冻结首行并自动自适应列宽",
                    allowDirect: true,
                },
                {
                    title: "生成模拟测试数据",
                    desc: "从当前单元格开始快速生成 15 行逼真的电商或销售统计模拟表格。",
                    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>`,
                    prompt: "在当前表格中写入一份逼真的 15 行员工销售业绩统计表（包含姓名、部门、销售额、达成率、评级），并自动设置表头美化",
                    allowDirect: true,
                },
            ],
        },
    ];

    const TOOLBOX = [
        {
            categoryTitle: "选区速算与转换",
            categorySvg: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2"></line></svg>`,
            items: [
                {
                    id: "tb-quick-stats",
                    title: "选区快速统计",
                    sub: "即时测算求和、均值与极值",
                    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="18"></line></svg>`,
                    action: "quickStats",
                },
                {
                    id: "tb-transpose",
                    title: "行列一键转置",
                    sub: "横排变竖排，写在数据右侧",
                    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>`,
                    action: "transpose",
                },
                {
                    id: "tb-export-md",
                    title: "复制为 Markdown",
                    sub: "转换为 MD 格式写入剪贴板",
                    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M7 8h10M7 12h10M7 16h6"></path></svg>`,
                    action: "exportMarkdown",
                },
                {
                    id: "tb-export-json",
                    title: "复制为 JSON 数组",
                    sub: "快速转为程序员友好的 JSON",
                    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,
                    action: "exportJson",
                },
            ],
        },
        {
            categoryTitle: "一键样式与排版",
            categorySvg: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`,
            items: [
                {
                    id: "tb-beautify",
                    title: "一键美化表格",
                    sub: "加边框、蓝表头、自动列宽",
                    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6Z"/></svg>`,
                    action: "beautify",
                },
                {
                    id: "tb-zebra",
                    title: "添加斑马纹底色",
                    sub: "奇偶行浅蓝交替排版",
                    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="14" x2="21" y2="14"></line></svg>`,
                    action: "addZebra",
                },
                {
                    id: "tb-highlight-yellow",
                    title: "标记黄色重点",
                    sub: "为选区添加柔和黄色高亮",
                    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg>`,
                    action: "highlightYellow",
                },
                {
                    id: "tb-highlight-clear",
                    title: "清除背景底色",
                    sub: "还原选区为纯白无底色",
                    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
                    action: "highlightClear",
                },
                {
                    id: "tb-freeze",
                    title: "冻结标题首行",
                    sub: "滚动时固定表头行",
                    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><line x1="3" y1="8" x2="21" y2="8"></line><rect x="3" y="3" width="18" height="18" rx="2"></rect></svg>`,
                    action: "freeze",
                },
                {
                    id: "tb-autofit",
                    title: "自适应最佳列宽",
                    sub: "消除 ### 遮挡",
                    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><polyline points="8 3 4 7 8 11"></polyline><polyline points="16 3 20 7 16 11"></polyline><line x1="4" y1="7" x2="20" y2="7"></line></svg>`,
                    action: "autoFit",
                },
            ],
        },
        {
            categoryTitle: "一键清洗与除杂",
            categorySvg: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line><path d="M3 6h18M3 12h18M3 18h18"></path></svg>`,
            items: [
                {
                    id: "tb-del-empty-rows",
                    title: "删除全部空行",
                    sub: "扫描并彻底清理空白行",
                    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line><path d="M3 6h18M3 12h18M3 18h18"></path></svg>`,
                    action: "deleteEmptyRows",
                },
                {
                    id: "tb-del-dup",
                    title: "整行去重",
                    sub: "保留首个唯一记录",
                    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8" cy="12" r="2"></circle><circle cx="16" cy="12" r="2"></circle></svg>`,
                    action: "removeDuplicates",
                },
                {
                    id: "tb-trim",
                    title: "修剪首尾空格",
                    sub: "清理半角/全角多余空格",
                    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>`,
                    action: "trimText",
                },
                {
                    id: "tb-fill-serial",
                    title: "批量填充序号",
                    sub: "在选区生成 1,2,3...",
                    iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h1v4M4 10h2M4 14h2l-2 2h2M4 18h2v2H4z"></path></svg>`,
                    action: "fillSerial",
                },
            ],
        },
    ];

    window.WpsForge.taskpane.data = {
        QUICK_CHIPS,
        SCENARIOS,
        TOOLBOX,
    };
})();
