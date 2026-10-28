/**
 * GEO 칼럼 작성원칙(geo-v1) 공통 도구 — column-render.js · build.js · publish-column.js 가 사용합니다.
 * (바를정한방병원 신림 · 수원 바를정한의원 · 울산 정한의원 세 사이트가 같은 파일을 씁니다.
 *  사이트마다 다른 값은 admin/config.json 의 "geo" 항목에 있습니다.)
 *
 *  작성원칙 순서 (새 칼럼은 반드시 이 순서·개수)
 *    질문형 H1(제목) → 핵심 답변 → 질문형 H2 8개(본문, <caption> 있는 비교표 2개 포함)
 *    → 참고자료 3개 → FAQ 6개 → 감수 원장 박스 → 최종 수정일
 *
 *  날짜 원칙 (예약 발행 흔적 방지)
 *    · 발행일 = 실제로 공개되는 날. 미래 날짜를 데이터에 미리 넣어 두지 않는다
 *    · 수정일은 발행일보다 앞설 수 없다 (화면·구조화 데이터·사이트맵 모두)
 *    · 주소(slug)에 날짜·연도를 넣지 않는다
 *
 *  이미지 원칙
 *    · 모든 <img alt> 에 지역 키워드(geo.region 중 하나)가 들어간다. 없으면 빌드 때 자동으로 앞에 붙인다.
 *
 *  제목 방식 (admin/config.json geo.titleStyle)
 *    · "region-first"(기본, 울산): 제목 앞쪽에 지역 키워드 1회. 예) 울산 턱관절병원, …일까요?
 *    · "main-keyword"(신림·수원): 제목은 메인 키워드(질환·주제)로 시작하고 지역을 제목 앞에 두지 않는다.
 *      지역은 제목 끝 꼬리표 geo.clinicTag(예: [바를정한방병원 신림]) 또는 본문에 넣는다.
 *      질문형 검사는 꼬리표를 뺀 앞부분으로 한다. 예) 구안와사 회복이 늦을 때 무엇을 확인해야 할까요? [바를정한방병원 신림]
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const FORMAT = "geo-v1";
const RULES = { H2: 8, TABLES: 2, REFS: 3, FAQS: 6, MIN_CHARS: 2500 };
const REF_SECTION = "이 글은 어떤 자료를 참고했나요?";
const FAQ_SECTION = "환자분들이 자주 묻는 질문은 무엇인가요?";
// 의료법 제56조(의료광고) 위반 소지가 큰 표현 — 새 칼럼에서 발견되면 발행을 멈춘다
const BANNED = ["완치", "100%", "부작용 없", "부작용이 없", "최고의", "유일한", "유일하게", "보장합니다", "확실하게 낫", "재발 없", "재발이 없", "흉터 없이", "통증 없이", "무통"];

const flat = (s) => String(s == null ? "" : s).replace(/\s+/g, " ").trim();
// 제목 끝의 [병원명 지역] 꼬리표를 뺀 본제목
const titleCore = (s) => flat(s).replace(/\s*\[[^\]]*\]\s*$/, "");
function loadGeo() {
  let cfg = {};
  try { cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "admin", "config.json"), "utf8")).geo || {}; } catch (e) {}
  return {
    region: cfg.region || [],
    reviewer: cfg.reviewer || {},
    referenceSources: cfg.referenceSources || [],
    titleStyle: cfg.titleStyle === "main-keyword" ? "main-keyword" : "region-first",
    clinicTag: flat(cfg.clinicTag || "")
  };
}
const GEO = loadGeo();

function esc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function unesc(s) {
  return String(s == null ? "" : s).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
}
const textOf = (html) => flat(unesc(String(html || "").replace(/<[^>]+>/g, " ")));
const isQuestion = (s) => /\?\s*$/.test(textOf(s));
function todayKST() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}
function koDate(iso) {
  const [y, m, d] = String(iso || "").split("-").map(Number);
  return y ? `${y}년 ${m}월 ${d}일` : "";
}
// 화면·구조화 데이터에 쓰는 수정일: 발행일보다 앞서면 발행일
function effectiveModified(post) {
  const pub = String(post.published || "");
  const mod = String(post.modified || "");
  return mod && mod > pub ? mod : pub;
}

/* ---------- 지역 키워드 alt ---------- */
function regionAlt(alt, fallback) {
  const a = flat(alt);
  const kws = GEO.region;
  if (!kws.length) return a;
  if (a && kws.some((k) => a.includes(k))) return a;
  return `${kws[0]} ${a || fallback || ""}`.trim();
}
function enforceAlts(html, fallback) {
  return String(html || "").replace(/<img\b[^>]*>/gi, (tag) => {
    const m = /\salt="([^"]*)"/i.exec(tag);
    if (m) return tag.replace(m[0], ` alt="${esc(regionAlt(unesc(m[1]), fallback))}"`);
    return tag.replace(/<img\b/i, `<img alt="${esc(regionAlt("", fallback))}"`);
  });
}
// 빌드 결과 폴더의 모든 html 에 적용 (헤더·푸터 로고 등 공통 조각까지)
function enforceAltsInTree(dir, fallback) {
  let changed = 0;
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (!/^(node_modules|\.git)$/.test(e.name)) walk(p); continue; }
      if (!e.name.endsWith(".html")) continue;
      const html = fs.readFileSync(p, "utf8");
      const out = enforceAlts(html, fallback);
      if (out !== html) { fs.writeFileSync(p, out); changed++; }
    }
  })(dir);
  return changed;
}
function altsMissingRegion(html) {
  const out = [];
  String(html || "").replace(/<img\b[^>]*>/gi, (tag) => {
    const m = /\salt="([^"]*)"/i.exec(tag);
    const alt = m ? unesc(m[1]) : "";
    if (!GEO.region.some((k) => alt.includes(k))) out.push(alt || "(alt 없음)");
    return tag;
  });
  return out;
}

/* ---------- 참고자료 ---------- */
// 문자열(HTML)·객체({source,title,url}) 둘 다 받아 <li> 안에 들어갈 HTML 로
function refItems(refs) {
  return (refs || []).filter(Boolean).map((r) => {
    if (typeof r === "string") return r;
    const src = flat(r.source), title = flat(r.title), url = flat(r.url);
    const label = title && title !== src ? `${esc(src)} — ${esc(title)}` : esc(src || title);
    return url ? `<a href="${esc(url)}" target="_blank" rel="noopener nofollow">${label}</a>` : label;
  });
}
function refObjects(refs) {
  return (refs || []).filter(Boolean).map((r) => {
    if (typeof r !== "string") return { source: flat(r.source), title: flat(r.title), url: flat(r.url) };
    return { source: "", title: textOf(r), url: ((/href="([^"]+)"/.exec(r) || [])[1] || "") };
  });
}

/* ---------- 감수 원장 박스 + 최종 수정일 ---------- */
function reviewerHtml(post, opts) {
  const rv = Object.assign({}, GEO.reviewer, opts || {});
  const name = rv.name || "";
  const title = rv.title || "대표원장";
  const modified = effectiveModified(post);
  return `      <aside class="author-box geo-reviewer" aria-label="감수 원장">
        <img src="${esc(rv.photo || "")}" alt="${esc(regionAlt(`${rv.clinic || ""} ${name} ${title}`.trim()))}" width="96" height="96" loading="lazy">
        <div>
          <p class="geo-reviewer-label">감수 원장</p>
          <h3>${esc(name)} ${esc(title)} <span>(${esc(rv.license || "한의사")})</span></h3>
          <p>${esc(rv.bio || "")}${rv.url ? ` <a href="${esc(rv.url)}">의료진 소개 보기</a>` : ""}</p>
          <p class="geo-reviewer-note">이 글은 ${esc(rv.clinic || "")} ${esc(name)} ${esc(title)}이 진료 경험과 위 참고자료를 바탕으로 작성·감수했습니다.</p>
        </div>
      </aside>
      <p class="geo-modified">최종 수정일 <time datetime="${esc(modified)}">${koDate(modified)}</time></p>`;
}

/* ---------- 검사 ---------- */
function validateGeo(post) {
  const out = [];
  const title = flat(post.title);
  const content = String(post.content || "");
  const core = titleCore(title);
  if (!isQuestion(core)) out.push("제목(H1)이 질문형(?로 끝남)이 아닙니다." + (core !== title ? " (끝의 [병원명 지역] 꼬리표는 빼고 봅니다)" : ""));
  if (GEO.titleStyle === "main-keyword") {
    // 메인 키워드 제목: 지역을 제목 앞에 두지 않는다. 지역은 꼬리표(clinicTag) 또는 본문에
    const startsWithRegion = GEO.region.some((k) => core.startsWith(k));
    if (startsWithRegion) out.push(`제목이 지역 키워드로 시작합니다 — 메인 키워드(질환·주제)로 시작하고, 지역은 제목 끝 ${GEO.clinicTag || "[병원명 지역]"} 꼬리표나 본문에 넣습니다.`);
    const hasTag = !!GEO.clinicTag && title.endsWith(GEO.clinicTag);
    const bracket = /\[[^\]]*\]\s*$/.exec(title);
    if (bracket && !hasTag) out.push(`제목 끝 꼬리표는 정확히 ${GEO.clinicTag || "[병원명 지역]"} 로 씁니다 (지금: ${bracket[0]}).`);
    const inBody = GEO.region.some((k) => textOf(content).includes(k));
    if (!hasTag && !inBody) out.push(`지역 키워드(${GEO.region.join("/")})가 제목 끝 꼬리표에도 본문에도 없습니다.`);
  } else if (GEO.region.length && !GEO.region.some((k) => title.includes(k))) {
    out.push(`제목에 지역 키워드(${GEO.region.join("/")})가 없습니다.`);
  }
  if (/\d{4}-?\d{2}-?\d{2}|20\d{2}/.test(post.slug || "")) out.push("주소(slug)에 날짜·연도가 들어 있습니다.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug || "")) out.push("주소(slug)는 영문 소문자·숫자·하이픈만 씁니다.");
  const h2 = [...content.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)].map((m) => textOf(m[1]));
  if (h2.length !== RULES.H2) out.push(`본문 H2가 ${h2.length}개입니다 (정확히 ${RULES.H2}개).`);
  const notQ = h2.filter((h) => !isQuestion(h));
  if (notQ.length) out.push(`질문형이 아닌 H2: ${notQ.map((h) => `"${h}"`).join(", ")}`);
  if (/<h1\b/i.test(content)) out.push("본문에 <h1>이 있습니다.");
  const tables = [...content.matchAll(/<table\b[\s\S]*?<\/table>/gi)].map((m) => m[0]);
  if (tables.length !== RULES.TABLES) out.push(`비교표가 ${tables.length}개입니다 (정확히 ${RULES.TABLES}개).`);
  tables.forEach((t, i) => {
    if (!/<caption\b/i.test(t)) out.push(`비교표 ${i + 1}에 <caption>이 없습니다.`);
    if (!/<th\b/i.test(t)) out.push(`비교표 ${i + 1}에 <th>가 없습니다.`);
  });
  const chars = textOf(content).length;
  if (chars < RULES.MIN_CHARS) out.push(`본문이 짧습니다 (${chars}자, 최소 ${RULES.MIN_CHARS}자).`);
  const refs = refObjects(post.references);
  if (refs.length !== RULES.REFS) out.push(`참고자료가 ${refs.length}개입니다 (정확히 ${RULES.REFS}개).`);
  refs.forEach((r, i) => { if (!/^https:\/\//.test(r.url)) out.push(`참고자료 ${i + 1}의 주소가 https 로 시작하지 않습니다.`); });
  if (GEO.referenceSources.length && refs.length) {
    const missing = GEO.referenceSources.filter((src) => !refs.some((r) => (r.source + " " + r.title).includes(src)));
    if (missing.length) out.push(`참고자료에 꼭 들어가야 할 출처가 빠졌습니다: ${missing.join(", ")}`);
  }
  const faqs = (post.faqs || []).filter((f) => f && (f.q || f.a));
  if (faqs.length !== RULES.FAQS) out.push(`FAQ가 ${faqs.length}개입니다 (정확히 ${RULES.FAQS}개).`);
  faqs.forEach((f, i) => {
    if (!isQuestion(f.q)) out.push(`FAQ ${i + 1} 질문이 ?로 끝나지 않습니다.`);
    if (!flat(f.a)) out.push(`FAQ ${i + 1} 답변이 비었습니다.`);
  });
  if (!(post.summary || []).filter(Boolean).length) out.push("핵심 답변(summary)이 비었습니다.");
  const all = [title, content, (post.summary || []).join(" "), faqs.map((f) => f.q + " " + f.a).join(" ")].join(" ");
  const banned = BANNED.filter((w) => all.includes(w));
  if (banned.length) out.push(`의료광고 금지 소지 표현: ${banned.map((w) => `"${w}"`).join(", ")}`);
  if (post.published && post.published > todayKST()) out.push(`발행일(${post.published})이 미래입니다 — 예약 날짜를 넣지 않습니다.`);
  return out;
}

module.exports = {
  FORMAT, RULES, REF_SECTION, FAQ_SECTION, BANNED, GEO,
  esc, unesc, flat, textOf, titleCore, isQuestion, todayKST, koDate, effectiveModified,
  regionAlt, enforceAlts, enforceAltsInTree, altsMissingRegion,
  refItems, refObjects, reviewerHtml, validateGeo
};
