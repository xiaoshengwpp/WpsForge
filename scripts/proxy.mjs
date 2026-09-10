#!/usr/bin/env node
// WpsForge 本地 LLM 转发代理
// 用途：WPS 任务窗格 webview 直连部分模型服务会被 CORS/网络策略拦截，
//       本代理仅监听 127.0.0.1，把请求原样转发到调用方指定的目标地址，并补上 CORS 头。
// 启动：npm run proxy   （默认端口 3890）
import http from "node:http";
import https from "node:https";

const PORT = Number(process.env.WF_PROXY_PORT || 3890);
const CORS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers": "*",
	"Access-Control-Allow-Methods": "*",
};

http
	.createServer((req, res) => {
		if (req.method === "OPTIONS") {
			res.writeHead(204, CORS);
			return res.end();
		}
		const target = req.headers["x-wf-target"];
		if (!target || !/^https?:\/\//i.test(target)) {
			res.writeHead(400, CORS);
			return res.end(JSON.stringify({ error: "missing/invalid X-WF-Target header" }));
		}
		const chunks = [];
		req.on("data", (c) => chunks.push(c));
		req.on("end", () => {
			const headers = { "content-type": req.headers["content-type"] || "application/json" };
			if (req.headers["authorization"]) headers["authorization"] = req.headers["authorization"];
			const u = new URL(target);
			const up = (u.protocol === "https:" ? https : http).request(
				u,
				{ method: req.method, headers },
				(resp) => {
					const body = [];
					resp.on("data", (c) => body.push(c));
					resp.on("end", () => {
						res.writeHead(resp.statusCode || 502, {
							...CORS,
							"content-type": resp.headers["content-type"] || "application/json",
						});
						res.end(Buffer.concat(body));
					});
				}
			);
			up.on("error", (e) => {
				res.writeHead(502, CORS);
				res.end(JSON.stringify({ error: "upstream_failed: " + e.message }));
			});
			if (chunks.length) up.write(Buffer.concat(chunks));
			up.end();
		});
	})
	.listen(PORT, "127.0.0.1", () => {
		console.log(`[WpsForge] LLM 本地代理已启动 → http://127.0.0.1:${PORT}/proxy`);
		console.log("[WpsForge] 仅监听回环地址，只转发显式指定的目标，不保存任何数据。Ctrl+C 退出。");
	});
