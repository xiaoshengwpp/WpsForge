// 共享的 LLM 请求转发实现：
//  - vite 插件（开发期内嵌同源代理 /llm-proxy）
//  - scripts/proxy.mjs（独立进程，用于生产分发场景）
// 安全边界：只转发调用方在 X-WF-Target 头里显式给出的 http(s) 地址；不记录任何内容。
import http from "node:http";
import https from "node:https";

export const CORS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers": "*",
	"Access-Control-Allow-Methods": "*",
};

export function handleForward(req, res) {
	if (req.method === "OPTIONS") {
		res.writeHead(204, CORS);
		return res.end();
	}
	const target = req.headers["x-wf-target"];
	if (!target || !/^https?:\/\//i.test(target)) {
		res.writeHead(400, { ...CORS, "content-type": "application/json" });
		return res.end(JSON.stringify({ error: "missing/invalid X-WF-Target header" }));
	}
	const chunks = [];
	req.on("data", (c) => chunks.push(c));
	req.on("end", () => {
		const headers = { "content-type": req.headers["content-type"] || "application/json" };
		if (req.headers["authorization"]) headers["authorization"] = req.headers["authorization"];
		let u;
		try { u = new URL(target); } catch (e) {
			res.writeHead(400, { ...CORS, "content-type": "application/json" });
			return res.end(JSON.stringify({ error: "bad target url" }));
		}
		const up = (u.protocol === "https:" ? https : http).request(u, { method: req.method, headers }, (resp) => {
			const body = [];
			resp.on("data", (c) => body.push(c));
			resp.on("end", () => {
				res.writeHead(resp.statusCode || 502, {
					...CORS,
					"content-type": resp.headers["content-type"] || "application/json",
				});
				res.end(Buffer.concat(body));
			});
		});
		up.on("error", (e) => {
			res.writeHead(502, { ...CORS, "content-type": "application/json" });
			res.end(JSON.stringify({ error: "upstream_failed: " + e.message }));
		});
		if (chunks.length) up.write(Buffer.concat(chunks));
		up.end();
	});
}

// vite 插件：把转发挂到 dev server 的 /llm-proxy（与加载项页面同源，webview 不会拦截）
export function wfLlmProxyPlugin() {
	return {
		name: "wpsforge-llm-proxy",
		configureServer(server) {
			server.middlewares.use("/llm-proxy", handleForward);
		},
	};
}
