/**
 * 임시저장 · 예약 글 미리보기 — 아직 홈페이지에 공개되지 않은 글을 내 PC 에서만 실제 모양으로 봅니다.
 * ------------------------------------------------------------
 * 실행:  사이트 폴더에서  node tools/preview-drafts.js   →  http://localhost:8090/ 이 열림
 *  - pages/columns/_preview/ 에 미리보기 HTML 을 만듭니다 (git · 배포에 포함되지 않음).
 *  - 홈페이지에는 아무 영향이 없습니다. 끝낼 때는 창에서 Ctrl+C.
 */
const fs = require("fs");
const path = require("path");
const http = require("http");
const R = require("./column-render");

const ROOT = R.ROOT;
const OUT = path.join(R.COLUMNS_DIR, "_preview");
const PORT = Number(process.env.PORT) || 8090;
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const pending = R.listPosts().filter((p) => !R.isLive(p)).sort((a, b) => (a.published || "").localeCompare(b.published || ""));
pending.forEach((p, i) => {
  // 미리보기 안에서는 이전/다음 글도 미리보기끼리 연결
  let html = R.renderPost(p, { prev: pending[i - 1], next: pending[i + 1] });
  pending.forEach((q) => { html = html.split(`/pages/columns/${q.slug}"`).join(`/pages/columns/_preview/${q.slug}"`); });
  html = html.replace("<head>", '<head>\n<meta name="robots" content="noindex,nofollow">');
  fs.writeFileSync(path.join(OUT, p.slug + ".html"), html);
});
const rows = pending.map((p, i) => `<tr><td>${i + 1}</td><td>${esc(p.published)}</td><td>${p.status === "draft" ? "임시저장" : "예약"}</td><td><a href="/pages/columns/_preview/${esc(p.slug)}">${esc(p.title)}</a><br><small>${esc(p.keywords)}</small></td></tr>`).join("\n");
fs.writeFileSync(path.join(OUT, "index.html"), `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>공개 전 글 미리보기</title>
<style>body{font-family:"Malgun Gothic",sans-serif;max-width:980px;margin:40px auto;padding:0 16px;color:#222}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #ddd;padding:12px 8px;text-align:left;vertical-align:top}small{color:#777}a{color:#1f5f4a;font-weight:700;text-decoration:none}a:hover{text-decoration:underline}</style></head>
<body><h1>공개 전 글 미리보기 (${pending.length}편)</h1><p>아직 홈페이지에 공개되지 않은 글입니다. 제목을 누르면 실제 홈페이지 모양으로 보입니다.</p>
<table><thead><tr><th>#</th><th>발행 예정일</th><th>상태</th><th>제목 · 키워드</th></tr></thead><tbody>
${rows || '<tr><td colspan="4">공개 전인 글이 없습니다.</td></tr>'}
</tbody></table></body></html>`);
console.log(`미리보기 ${pending.length}편 생성 → ${path.relative(ROOT, OUT)}`);

const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "application/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp", ".ico": "image/x-icon", ".woff2": "font/woff2", ".woff": "font/woff", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8" };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") { res.writeHead(302, { Location: "/pages/columns/_preview/" }); return res.end(); }
  if (p.endsWith("/")) p += "index.html";
  let file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (!path.extname(file) && fs.existsSync(file + ".html")) file += ".html";
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("없는 페이지"); }
  res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`미리보기 주소: http://localhost:${PORT}/   (끝내려면 Ctrl+C)`));
