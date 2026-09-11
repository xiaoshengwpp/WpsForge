// js/taskpane/utils.js - DOM 辅助、HTML 安全转义、Markdown 渲染与剪贴板防拦截操作
(function () {
    "use strict";

    window.WpsForge = window.WpsForge || {};
    window.WpsForge.taskpane = window.WpsForge.taskpane || {};

    const $ = (id) => document.getElementById(id);

    function esc(s) {
        if (s == null) return "";
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function renderMarkdown(md) {
        if (!md) return "";
        let text = esc(md);

        // 代码块 ```lang ... ```
        text = text.replace(/```([\w-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><code>${code.trim()}</code></pre>`;
        });

        // 行内代码 `code`
        text = text.replace(/`([^`\n]+)`/g, "<code>$1</code>");

        // 粗体 **bold**
        text = text.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");

        // 标题 ### text
        text = text.replace(/^### (.*$)/gim, '<h4 style="font-size:13px;margin:6px 0 3px;">$1</h4>');
        text = text.replace(/^## (.*$)/gim, '<h3 style="font-size:13.5px;margin:8px 0 4px;">$1</h3>');
        text = text.replace(/^# (.*$)/gim, '<h2 style="font-size:14px;margin:10px 0 5px;">$1</h2>');

        // 无序列表 - item
        text = text.replace(/^\s*[-*]\s+(.*)$/gim, "<li>$1</li>");
        text = text.replace(/(<li>.*<\/li>)/gim, "<ul>$1</ul>");
        text = text.replace(/<\/ul>\s*<ul>/gim, "");

        // 换行处理
        const lines = text.split("\n");
        const out = [];
        for (let line of lines) {
            line = line.trim();
            if (!line) {
                out.push("<br>");
            } else if (!line.startsWith("<pre>") && !line.startsWith("<ul>") && !line.startsWith("<h") && !line.startsWith("<li>") && !line.startsWith("<table")) {
                out.push(`<p>${line}</p>`);
            } else {
                out.push(line);
            }
        }
        return out.join("");
    }

    // 剪贴板处理 (WPS 宿主环境防抢占)
    const isEditable = (el) => !!(el && el.matches && el.matches("input, textarea"));

    function selText(field) {
        const s = field.selectionStart, e = field.selectionEnd;
        return (s != null && e != null && e > s) ? field.value.slice(s, e) : "";
    }

    function clipWrite(t) {
        try {
            return navigator.clipboard.writeText(t);
        } catch (e) { }
        try {
            const ta = document.createElement("textarea");
            ta.value = t;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            ta.remove();
        } catch (e) { }
        return Promise.resolve();
    }

    function clipRead() {
        try {
            return navigator.clipboard.readText().catch(() => null);
        } catch (e) {
            return Promise.resolve(null);
        }
    }

    function insertText(field, text) {
        field.focus();
        let ok = false;
        try {
            ok = document.execCommand("insertText", false, text);
        } catch (e) { }
        if (!ok) {
            const s = field.selectionStart ?? field.value.length;
            const e = field.selectionEnd ?? field.value.length;
            field.value = field.value.slice(0, s) + text + field.value.slice(e);
            field.dispatchEvent(new Event("input", { bubbles: true }));
            field.selectionStart = field.selectionEnd = s + text.length;
        }
    }

    function clipOp(op, field) {
        field = field || document.activeElement;
        if (!isEditable(field)) return;
        if (op === "copy") {
            clipWrite(selText(field) || field.value);
        } else if (op === "cut") {
            const t = selText(field);
            if (t) { clipWrite(t); insertText(field, ""); }
        } else if (op === "paste") {
            clipRead().then((t) => { if (t != null && t !== "") insertText(field, t); });
        } else if (op === "selectall") {
            field.focus();
            field.select();
        }
    }

    window.WpsForge.taskpane.utils = {
        $,
        esc,
        renderMarkdown,
        isEditable,
        selText,
        clipWrite,
        clipRead,
        insertText,
        clipOp,
    };
})();
