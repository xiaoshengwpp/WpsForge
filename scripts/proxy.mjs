#!/usr/bin/env node
// WpsForge 独立 LLM 转发代理（生产分发场景用；开发期无需运行，vite 已内嵌同源代理）
// 启动：npm run proxy   （默认端口 3890）
import http from "node:http";
import { handleForward } from "./llm-forward.mjs";

const PORT = Number(process.env.WF_PROXY_PORT || 3890);
http.createServer(handleForward).listen(PORT, "127.0.0.1", () => {
	console.log(`[WpsForge] LLM 独立代理已启动 → http://127.0.0.1:${PORT}/proxy`);
	console.log("[WpsForge] 仅监听回环地址，只转发显式指定的目标，不保存任何数据。Ctrl+C 退出。");
});
