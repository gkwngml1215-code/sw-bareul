/**
 * 원장칼럼 명령줄 발행 — GEO 작성원칙(geo-v1) 검사 후 칼럼 원본(JSON)을 저장합니다.
 * 저장소에 올리면 Cloudflare Pages 빌드(tools/build.js)가 페이지·목록·사이트맵을 만듭니다.
 *
 *   발행      : node tools/publish-column.js <원고.json>
 *   검사만    : node tools/publish-column.js <원고.json> --check
 *   임시저장글: node tools/publish-column.js --from-draft <slug> <원고.json>
 *               (이미 있는 임시저장 글을 GEO 원칙으로 보강해 같은 주소로 공개)
 *
 * 지키는 약속
 *   · 발행일 = 수정일 = 오늘(한국 시간). 미래(예약)·과거(소급) 날짜를 넣지 않는다
 *   · 이미 공개된 글의 주소(slug)는 덮어쓰지 않는다 — 다른 글은 건드리지 않는다
 *   · 검사에 하나라도 걸리면 아무 파일도 바꾸지 않는다
 *
 * 원고.json 필드: slug, title(질문형·지역명), category, related(선택), description, keywords,
 *   summary[2~3], content(질문형 <h2> 8개 + <caption> 비교표 2개), references[{source,title,url}×3],
 *   faqs[{q,a}×6], thumbnail(선택), thumbnailAlt(선택)
 */
const fs = require("fs");
const path = require("path");
const R = require("./column-render");
const G = require("./geo-column");

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const rest = args.filter((a) => !a.startsWith("--"));
const fromDraft = flags.has("--from-draft") ? rest.shift() : "";
const file = rest[0];
const fail = (m) => { console.error("✗ " + m); process.exit(1); };

if (!file) fail("원고 JSON 파일 경로를 주세요.  예: node tools/publish-column.js draft.json");
let draft;
try { draft = JSON.parse(fs.readFileSync(path.resolve(file), "utf8")); } catch (e) { fail("원고 JSON 을 읽을 수 없습니다: " + e.message); }

const today = G.todayKST();
const now = new Date().toISOString();
const existing = R.readPost(draft.slug);
if (fromDraft) {
  if (draft.slug !== fromDraft) fail(`원고의 slug(${draft.slug})가 --from-draft ${fromDraft} 와 다릅니다.`);
  if (!existing || existing.status !== "draft") fail(`${fromDraft} 는 임시저장 글이 아닙니다.`);
} else if (existing) {
  fail(`주소 ${draft.slug} 는 이미 있습니다. 다른 주소를 쓰세요.`);
}
const posts = R.listPosts();
if (posts.some((p) => p.slug !== draft.slug && G.flat(p.title) === G.flat(draft.title))) fail("같은 제목의 글이 이미 있습니다.");

const post = Object.assign({
  author: R.DEFAULT_AUTHOR,
  schema: "",
  video: "",
  thumbnail: "",
  thumbnailAlt: ""
}, existing && fromDraft ? { createdAt: existing.createdAt } : {}, draft, {
  format: G.FORMAT,
  status: "published",
  published: today,
  modified: today,
  createdAt: (existing && existing.createdAt) || now,
  updatedAt: now
});
delete post.note;
post.readingMinutes = R.readingMinutes(post.content);
if (R.CATEGORIES && post.category && !R.CATEGORIES.includes(post.category)) {
  fail(`카테고리 "${post.category}" 가 없습니다. 쓸 수 있는 값: ${R.CATEGORIES.join(", ")}`);
}

const errors = G.validateGeo(post);
if (errors.length) {
  errors.forEach((e) => console.error("✗ [GEO] " + e));
  fail(`검사 실패 ${errors.length}건 — 아무 파일도 바꾸지 않았습니다.`);
}
// 실제 페이지를 한 번 그려 보고 alt·H2 를 다시 확인 (헤더·푸터 로고는 빌드 때 보정)
const page = G.enforceAlts(R.renderPost(post, {}, []));
const pageH2 = [...page.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)].map((m) => G.textOf(m[1])).filter((h) => !G.isQuestion(h));
if (pageH2.length) fail("페이지에 질문형이 아닌 H2 가 있습니다: " + pageH2.join(", "));

if (flags.has("--check")) {
  console.log(`✓ 검사 통과 — ${post.slug} "${post.title}" (바꾼 파일 없음)`);
  process.exit(0);
}
R.writePost(post);
console.log(`✓ 저장: ${path.relative(R.ROOT, path.join(R.DATA_DIR, post.slug + ".json"))} · 발행일 ${today}`);
console.log(`  커밋 메시지: 칼럼 발행: ${post.title}`);
