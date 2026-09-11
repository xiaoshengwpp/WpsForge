// js/taskpane/constants.js - 侧边栏服务商预设、中文工具名映射与纯矢量 SVG 图标库
(function () {
    "use strict";

    window.WpsForge = window.WpsForge || {};
    window.WpsForge.taskpane = window.WpsForge.taskpane || {};

    const PROVIDERS = {
        deepseek: { base: "https://api.deepseek.com/v1", model: "deepseek-chat", name: "DeepSeek" },
        siliconflow: { base: "https://api.siliconflow.cn/v1", model: "deepseek-ai/DeepSeek-V3", name: "硅基流动" },
        kimi: { base: "https://api.moonshot.cn/v1", model: "moonshot-v1-8k", name: "Kimi" },
        glm: { base: "https://open.bigmodel.cn/api/paas/v4", model: "glm-4-flash", name: "智谱 GLM" },
        openai: { base: "https://api.openai.com/v1", model: "gpt-4o-mini", name: "OpenAI" },
        ollama: { base: "http://127.0.0.1:11434/v1", model: "qwen2.5:7b", name: "Ollama 本地" },
        custom: { base: "", model: "", name: "自定义" },
    };

    const TOOL_NAMES_ZH = {
        get_sheet_info: "获取表格概况",
        get_selection: "获取当前选区",
        read_range: "读取数据区域",
        write_cells: "写入单元格",
        set_formula: "写入公式",
        highlight_cells: "单元格着色高亮",
        merge_cells: "单元格合并/居中",
        insert_delete_rows_cols: "插入/删除行列",
        transpose_range: "行列转置",
        quick_stats: "选区快速统计",
        set_col_width_row_height: "调整行列宽",
        create_chart: "创建图表",
        clean_data: "数据清洗",
        sort_range: "区域排序",
        find_replace: "查找与替换",
        beautify_table: "一键美化表格",
        add_zebra: "添加斑马纹",
        fill_serial: "填充连续序号",
        freeze_header: "冻结首行",
        set_number_format: "设置数字格式",
    };

    function getToolSvg(name) {
        const s = "currentColor";
        switch (name) {
            case "get_sheet_info":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M3 9h18M9 21V9"></path></svg>`;
            case "get_selection":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg>`;
            case "read_range":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
            case "write_cells":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
            case "set_formula":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19L10 5M10 19l6-14M14 12h7"></path></svg>`;
            case "highlight_cells":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;
            case "merge_cells":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>`;
            case "insert_delete_rows_cols":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
            case "transpose_range":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>`;
            case "quick_stats":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="18"></line></svg>`;
            case "set_col_width_row_height":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 3 4 7 8 11"></polyline><polyline points="16 3 20 7 16 11"></polyline><line x1="4" y1="7" x2="20" y2="7"></line></svg>`;
            case "create_chart":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`;
            case "clean_data":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line><path d="M3 6h18M3 12h18M3 18h18"></path></svg>`;
            case "sort_range":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 10M6 10l-5-5M6 10V2M18 19l5-5M23 14l-5 5M18 14v8"></path></svg>`;
            case "find_replace":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35M8 11h6M11 8v6"></path></svg>`;
            case "beautify_table":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6Z"></path></svg>`;
            case "add_zebra":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="14" x2="21" y2="14"></line></svg>`;
            case "fill_serial":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h1v4M4 10h2M4 14h2l-2 2h2M4 18h2v2H4z"></path></svg>`;
            case "freeze_header":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="8" x2="21" y2="8"></line><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="12" cy="15" r="2"></circle></svg>`;
            case "set_number_format":
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg>`;
            default:
                return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${s}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0-.33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;
        }
    }

    const SVG_SPARKLE = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6Z"/></svg>`;
    const SVG_CHECK = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    const SVG_CROSS = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    const SVG_SPINNER = `<svg class="spin-svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>`;
    const SVG_CHEVRON_DOWN = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex:none;"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
    const SVG_CHEVRON_UP = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex:none;"><polyline points="18 15 12 9 6 15"></polyline></svg>`;
    const SVG_COPY = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;

    const EYE_OPEN = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    const EYE_CLOSED = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

    const SET_KEY = "wpsforge.settings.v2";
    const OLD_SET_KEY = "wpsforge.settings.v1";
    const CHAT_HISTORY_KEY = "wpsforge.chat.history.v1";
    const MAX_TOOL_STEPS = 12;
    const HISTORY_KEEP = 20;

    window.WpsForge.taskpane.constants = {
        PROVIDERS,
        TOOL_NAMES_ZH,
        getToolSvg,
        SVG_SPARKLE,
        SVG_CHECK,
        SVG_CROSS,
        SVG_SPINNER,
        SVG_CHEVRON_DOWN,
        SVG_CHEVRON_UP,
        SVG_COPY,
        EYE_OPEN,
        EYE_CLOSED,
        SET_KEY,
        OLD_SET_KEY,
        CHAT_HISTORY_KEY,
        MAX_TOOL_STEPS,
        HISTORY_KEEP,
    };
})();
