/**
 * SEO / GEO / AEO 자동 주입 스크립트
 * ------------------------------------------------------------
 * 실행:  사이트 폴더(sw-bareul)에서  node tools/seo-inject.js
 *
 * 하는 일 (모든 .html 에 대해, _template.html · _category.html 제외)
 *  1. <head> 안의 <!-- seo:start --> ~ <!-- seo:end --> 블록을 새로 만든다
 *     - canonical, robots, Open Graph, Twitter Card
 *     - JSON-LD 구조화 데이터: MedicalClinic(병원), WebSite, WebPage/MedicalWebPage,
 *       BreadcrumbList(.breadcrumb 에서 추출), FAQPage(.faq details 에서 추출),
 *       BlogPosting(게시글 article.post 에서 추출), Physician(의료진)
 *  2. sitemap.xml, robots.txt, llms.txt 를 다시 만든다
 *
 * 사이트 주소는 admin/config.json 의 siteUrl (https://www.sw-bareul.co.kr) 에서 읽습니다.
 */
const fs = require("fs");
const path = require("path");

let CFG = {};
try { CFG = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "admin", "config.json"), "utf8")); } catch (e) {}
const SITE_URL = (process.env.URL || process.env.SITE_URL || CFG.siteUrl || "https://www.sw-bareul.co.kr").replace(/\/+$/, "");
// 예전 도메인 — 페이지 안에 남아 있으면 현재 주소로 바꿈
const OLD_URLS = ["https://danaan-sw.com", "http://danaan-sw.com", "https://www.bareuljung.co.kr"];
const { execFileSync } = require("child_process");

// 페이지별 keywords (네이버용). 게시글은 어드민 입력값을 씀
const KEYWORDS = {
  "/index.html": "수원 한의원, 인계동 한의원, 수원 이명 한의원, 수원 돌발성난청, 수원 구안와사, 수원 안면마비 한의원, 이명 입원치료, 바를정한의원",
  "/booking.html": "수원 바를정한의원 예약, 인계동 한의원 예약, 이명 입원 예약, 구안와사 입원, 네이버 예약 한의원",
  "/consult.html": "수원 한의원 온라인 상담, 이명 상담, 구안와사 상담, 카카오톡 한의원 상담",
  "/pages/ear/index.html": "수원 이명 치료, 이명 한의원, 이명 입원치료, MTM 이명도 검사, 미세청력검사, 소리재활치료, 수원 이명 잘하는 곳",
  "/pages/ear/hearing-loss.html": "수원 돌발성난청 한의원, 돌발성 난청 한방치료, 난청 입원치료, 스테로이드 안 듣는 돌발성난청, 수원 난청",
  "/pages/ear/dizziness.html": "수원 어지럼증 한의원, 메니에르 한방치료, 이석증 한의원, 전정신경염, 어지럼증 입원치료",
  "/pages/ear/faq.html": "이명 자주 묻는 질문, 돌발성난청 FAQ, 어지럼증 FAQ, 이명 추나요법",
  "/pages/face/index.html": "수원 구안와사 한의원, 안면신경마비 한방치료, 구안와사 후유증 매선, 연합운동 치료, 구안와사 입원치료, 벨마비",
  "/pages/face/spasm.html": "수원 안면경련 한의원, 눈떨림 치료, 안검경련 한방치료, 얼굴떨림 한의원",
  "/pages/face/trigeminal.html": "수원 삼차신경통 한의원, 삼차신경통 한방치료, 얼굴 통증 한의원",
  "/pages/face/eye.html": "수원 안구건조증 한의원, 황반변성 한방치료, 녹내장 한방, 눈충혈 한의원, 한방 안과",
  "/pages/face/brain.html": "수원 파킨슨 한의원, 두통 한의원, 공황장애 한방치료, 불면증 한의원, 다한증 한방치료",
  "/pages/face/faq.html": "구안와사 자주 묻는 질문, 안면마비 FAQ, 매선치료, 눈떨림 원인",
  "/pages/skin/wart.html": "수원 편평사마귀 제거, 편평사마귀 레이저, 어븀야그 레이저, 쥐젖 제거 수원, 비립종 제거, 편평사마귀 비용",
  "/pages/spine/traffic.html": "수원 교통사고 한의원, 교통사고 후유증 입원, 자동차보험 한방치료, 수원 교통사고 입원실",
  "/pages/spine/index.html": "수원 척추 한의원, 목디스크 한방치료, 허리디스크 추나, 일자목 거북목 교정, 디스크 입원치료",
  "/pages/spine/joint.html": "수원 관절 한의원, 턱관절 한방치료, 류마티스 한의원, 테니스엘보, 족저근막염 한방, 무릎관절 한의원",
  "/pages/spine/rehab.html": "수원 재활 한의원, 수술 후 재활, 산재 입원치료, 골절 입원 한의원, 재활클리닉",
  "/pages/internal/index.html": "수원 소화불량 한의원, 담적병 치료, 기능성 소화불량 첩약 건강보험, 위염 한방치료, 구취 한의원",
  "/pages/internal/women.html": "수원 치질 한방치료, 질염 냉대하 한의원, 갑상선 한방치료, 부인과 수술 후 회복 입원",
  "/pages/about/index.html": "수원 바를정한의원 소개, 인계동 한의원, 전국에서 찾아오는 한의원, 바를정 연혁",
  "/pages/about/doctor.html": "오민지 원장, 이진혁 원장, 김도경 원장, 이주현 원장, 한방 안이비인후피부과 전문의, 한방내과 전문의 수원",
  "/pages/about/papers.html": "바를정한의원 논문, 이명 논문, 구안와사 후유증 논문, 안면신경마비 연합운동 논문, 구안와사 후유증 한방 해결",
  "/pages/about/facility.html": "수원 한의원 입원실, 1인실 입원 한의원, 프리미엄 입원실, 한방병원급 입원실 수원",
  "/pages/about/location.html": "수원 바를정한의원 위치, 권광로 274, 수원시청역 한의원, 인계동 한의원 주차, 바를정 오시는 길",
  "/pages/columns/index.html": "바를정한의원 칼럼, 이명 칼럼, 구안와사 칼럼, 치료 후기, 공지사항",
  "/pages/columns/column.html": "바를정 칼럼, 이명 난청 칼럼, 구안와사 칼럼, 어지럼증 칼럼",
  "/pages/columns/cases.html": "이명 치료 전후, 돌발성 난청 청력검사 전후, 구안와사 치료 전후 사진, 안면마비 치료 사례",
  "/pages/columns/reviews.html": "바를정한의원 후기, 이명 치료 후기, 구안와사 치료 후기, 어지럼증 치료 후기",
  "/pages/columns/press.html": "바를정한의원 언론보도, 오민지 원장 한의학 이야기",
  "/pages/columns/notice.html": "바를정한의원 공지사항, 연휴 진료 안내, 입원실 운영 안내"
};

// 파일의 마지막 수정일: git 커밋 날짜 → 없으면 오늘
function lastModOf(file) {
  try {
    const d = execFileSync("git", ["log", "-1", "--format=%cs", "--", path.relative(ROOT, file)], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  } catch (e) {}
  return TODAY;
}

// 병원 기본 정보는 site.json (어드민 "홈페이지 설정") 에서 읽음. 없으면 아래 기본값
let SITE = {};
try { SITE = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "site.json"), "utf8")); } catch (e) {}
const SC = SITE.clinic || {}, SH = SITE.hours || {}, SCH = SITE.channels || {}, SSEO = SITE.seo || {};
const PHONE = SC.phone || "031-217-3375";

const CLINIC = {
  name: SC.name || "수원 바를정한의원",
  alternateName: "바를정한의원",
  legalName: "바를정한의원",
  telephone: "+82-" + PHONE.replace(/^0/, ""),
  email: SC.email || "",
  streetAddress: SC.street || "권광로 274 (인계동, 태현빌딩) 1층",
  addressLocality: SC.city || "수원시 팔달구",
  addressRegion: SC.region || "경기도",
  postalCode: "16488",
  lat: 37.2715501,
  lng: 127.0360048,
  founder: SC.doctor || "이진혁",
  foundingDate: "2014-01-01",
  logo: "/assets/img/logo/logo.png",
  image: "/assets/img/main/mv1.jpg",
  hasMap: SCH.naverMap || "https://map.naver.com/p/entry/place/34778565",
  sameAs: [SCH.blog, SCH.naverMap, SCH.kakao, SCH.naverBooking, SCH.youtube, SCH.instagram, SCH.cafe].filter(Boolean),
  openingHours: [
    { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: SH.weekdayOpen || "10:00", closes: SH.weekdayClose || "20:00" },
    { days: ["Saturday"], opens: SH.satOpen || "10:00", closes: SH.satClose || "15:00" },
    { days: ["Sunday", "PublicHolidays"], opens: SH.sunOpen || "10:00", closes: SH.sunClose || "15:00" }
  ],
  specialties: ["이명", "돌발성 난청", "메니에르 · 어지럼증 · 이석증", "구안와사 · 안면신경마비", "안검경련 · 안면경련", "삼차신경통", "눈 · 시야 질환", "신경 · 뇌 질환", "편평사마귀 레이저", "교통사고 후유증", "척추질환", "관절질환", "재활클리닉", "내과 · 소화기 질환", "항문 · 여성질환", "입원 집중치료"]
};
if (SSEO.naverVerify) CFG.naverVerify = SSEO.naverVerify;
if (SSEO.googleVerify) CFG.googleVerify = SSEO.googleVerify;

const DOCTORS = [
  { id: "doctor", name: "이진혁", jobTitle: "한방내과 전문의 · 대표원장", image: "/assets/img/sub/info02_con1_2.jpg", memberOf: ["척추신경추나의학회", "대한한의학회", "대한약침학회", "대한한방내과학회"] },
  { id: "doctor-oh", name: "오민지", jobTitle: "한방 안이비인후피부과 전문의 · 원장", image: "/assets/img/sub/info02_con1_1.jpg", memberOf: ["대한안면학회 학술이사", "대한 한방안이비인후피부과학회", "한국중경의학회"] },
  { id: "doctor-kim", name: "김도경", jobTitle: "한방내과 전문의 · 원장", image: "/assets/img/sub/info02_con1_3.jpg", memberOf: ["대한한의학회", "대한한방내과학회"] },
  { id: "doctor-lee", name: "이주현", jobTitle: "한방소아청소년과 전문의 · 한의학 박사 · 원장", image: "/assets/img/sub/info02_con1_4.jpg", memberOf: ["대한한의사협회"] }
];
const DOCTOR = DOCTORS[0];

const ROOT = path.resolve(__dirname, "..");
const TODAY = new Date().toISOString().slice(0, 10);

// ---------- 유틸 ----------
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return ["node_modules", "tools", "components", "admin", "_data", "dist", ".git"].includes(e.name) ? [] : walk(p);
    return [p];
  });
}
function decode(s) {
  return s.replace(/&nbsp;/g, " ").replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
}
function text(html) {
  return decode(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}
function attr(tag, name) {
  const m = tag.match(new RegExp(name + '\\s*=\\s*"([^"]*)"')) || tag.match(new RegExp(name + "\\s*=\\s*'([^']*)'"));
  return m ? decode(m[1]) : "";
}
// 주소 규칙 (Cloudflare Pages 와 동일): /dir/index.html → /dir/ , /page.html → /page
function cleanPath(p) {
  return p.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
}
function abs(p) {
  if (!p) return "";
  for (const old of OLD_URLS) if (p.startsWith(old)) p = p.slice(old.length);
  if (/^https?:/.test(p)) return p;
  return SITE_URL + (/\.(html)$/.test(p) ? cleanPath(p) : p);
}
function urlFor(file) {
  const rel = "/" + path.relative(ROOT, file).split(path.sep).join("/");
  return SITE_URL + cleanPath(rel);
}
function pick(html, re) {
  const m = html.match(re);
  return m ? m[1] : "";
}

// ---------- 추출 ----------
function extract(html, file) {
  const title = text(pick(html, /<title>([\s\S]*?)<\/title>/i));
  const description = attr(pick(html, /(<meta\s+name="description"[^>]*>)/i) || "", "content");
  const h1 = text(pick(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i));

  // breadcrumb: <div class="breadcrumb"> a > a > text
  const bcHtml = pick(html, /<div class="breadcrumb"[^>]*>([\s\S]*?)<\/div>/i);
  const crumbs = [];
  if (bcHtml) {
    const parts = bcHtml.split(/&gt;/);
    parts.forEach((p) => {
      const a = p.match(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
      if (a) crumbs.push({ name: text(a[2]), url: abs(a[1]) });
      else if (text(p)) crumbs.push({ name: text(p), url: "" });
    });
  }

  // FAQ
  const faqs = [];
  const faqBlock = html.match(/<div class="faq">([\s\S]*?)<\/div>\s*<\/div>/i);
  const faqHtml = faqBlock ? faqBlock[1] : "";
  const re = /<details>\s*<summary>([\s\S]*?)<\/summary>\s*<div class="a">([\s\S]*?)<\/div>\s*<\/details>/gi;
  let m;
  while ((m = re.exec(faqHtml))) faqs.push({ q: text(m[1]), a: text(m[2]) });

  // 게시글
  const artTag = pick(html, /(<article class="post"[^>]*>)/i);
  const article = artTag
    ? {
        category: attr(artTag, "data-category"),
        published: attr(artTag, "data-published"),
        modified: attr(artTag, "data-modified") || attr(artTag, "data-published"),
        image: attr(artTag, "data-image"),
        summary: (() => {
          const s = pick(html, /<section class="summary-box"[\s\S]*?<ul>([\s\S]*?)<\/ul>/i);
          return s ? s.split(/<\/li>/).map(text).filter(Boolean) : [];
        })(),
        body: text(pick(html, /<div class="post-body">([\s\S]*?)(?:<p class="ba-note">|<div class="author-box">)/i))
      }
    : null;

  // 대표 이미지: og:image 가 있으면 사용, 없으면 sub-hero 배경 또는 기본
  let image = attr(pick(html, /(<meta\s+property="og:image"[^>]*>)/i) || "", "content");
  if (!image) image = pick(html, /class="sub-hero"[^>]*background-image:url\('([^']+)'\)/i);
  if (!image && article) image = article.image;
  if (!image) image = CLINIC.image;

  return { title, description, h1, crumbs, faqs, article, image: abs(image) };
}

// ---------- JSON-LD ----------
function clinicNode() {
  const node = {
    "@type": ["MedicalClinic", "MedicalBusiness", "LocalBusiness"],
    "@id": SITE_URL + "/#clinic",
    name: CLINIC.name,
    alternateName: CLINIC.alternateName,
    legalName: CLINIC.legalName,
    url: SITE_URL + "/",
    telephone: CLINIC.telephone,
    image: abs(CLINIC.image),
    logo: abs(CLINIC.logo),
    foundingDate: CLINIC.foundingDate,
    founder: { "@id": SITE_URL + "/#doctor" },
    employee: DOCTORS.map((d) => ({ "@id": SITE_URL + "/#" + d.id })),
    medicalSpecialty: "한의학",
    availableService: CLINIC.specialties.map((s) => ({ "@type": "MedicalTherapy", name: s })),
    address: {
      "@type": "PostalAddress",
      streetAddress: CLINIC.streetAddress,
      addressLocality: CLINIC.addressLocality,
      addressRegion: CLINIC.addressRegion,
      postalCode: CLINIC.postalCode,
      addressCountry: "KR"
    },
    geo: { "@type": "GeoCoordinates", latitude: CLINIC.lat, longitude: CLINIC.lng },
    hasMap: CLINIC.hasMap,
    openingHoursSpecification: CLINIC.openingHours.map((o) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: o.days,
      opens: o.opens,
      closes: o.closes
    })),
    amenityFeature: [{ "@type": "LocationFeatureSpecification", name: "1~2인실 입원실", value: true }, { "@type": "LocationFeatureSpecification", name: "주차장", value: true }],
    sameAs: CLINIC.sameAs,
    areaServed: ["수원시", "경기도", "전국"],
    priceRange: "₩₩",
    currenciesAccepted: "KRW",
    paymentAccepted: "현금, 신용카드, 건강보험, 자동차보험, 실손보험",
    isAcceptingNewPatients: true
  };
  if (CLINIC.email) node.email = CLINIC.email;
  return node;
}
function doctorNode(d, full) {
  const n = {
    "@type": ["Physician", "Person"],
    "@id": SITE_URL + "/#" + d.id,
    name: d.name,
    jobTitle: d.jobTitle,
    url: SITE_URL + "/pages/about/doctor",
    image: abs(d.image),
    worksFor: { "@id": SITE_URL + "/#clinic" },
    medicalSpecialty: "한의학"
  };
  if (full) {
    n.memberOf = d.memberOf.map((o) => ({ "@type": "Organization", name: o }));
    n.knowsAbout = CLINIC.specialties;
  }
  return n;
}

function buildJsonLd(info, file, url) {
  const rel = "/" + path.relative(ROOT, file).split(path.sep).join("/");
  const isHome = rel === "/index.html";
  const isDoctor = rel.endsWith("/about/doctor.html");
  const graph = [clinicNode(), ...DOCTORS.map((d) => doctorNode(d, isDoctor))];

  if (isHome) {
    graph.push({
      "@type": "WebSite",
      "@id": SITE_URL + "/#website",
      url: SITE_URL + "/",
      name: CLINIC.name,
      publisher: { "@id": SITE_URL + "/#clinic" },
      inLanguage: "ko-KR"
    });
  }

  const page = {
    "@type": info.article ? "WebPage" : "MedicalWebPage",
    "@id": url + "#webpage",
    url,
    name: info.title,
    description: info.description,
    inLanguage: "ko-KR",
    isPartOf: { "@id": SITE_URL + "/#website" },
    about: { "@id": SITE_URL + "/#clinic" },
    primaryImageOfPage: info.image,
    dateModified: info.article ? info.article.modified : lastModOf(file)
  };
  if (info.crumbs.length) page.breadcrumb = { "@id": url + "#breadcrumb" };
  if (!info.article) {
    page.audience = { "@type": "MedicalAudience", audienceType: "Patient" };
    page.lastReviewed = TODAY;
    page.reviewedBy = { "@id": SITE_URL + "/#doctor" };
    page.speakable = { "@type": "SpeakableSpecification", cssSelector: ["h1", ".lead", ".key-answer", ".summary-box", ".goal-box"] };
  }
  graph.push(page);

  if (info.crumbs.length) {
    graph.push({
      "@type": "BreadcrumbList",
      "@id": url + "#breadcrumb",
      itemListElement: info.crumbs.map((c, i) => {
        const item = { "@type": "ListItem", position: i + 1, name: c.name };
        item.item = c.url || url;
        return item;
      })
    });
  }

  if (info.faqs.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": url + "#faq",
      mainEntity: info.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a }
      }))
    });
  }

  if (info.article) {
    const a = info.article;
    graph.push({
      "@type": ["BlogPosting", "MedicalScholarlyArticle"],
      "@id": url + "#article",
      headline: info.h1 || info.title,
      description: info.description,
      abstract: a.summary.join(" "),
      articleSection: a.category,
      image: info.image,
      datePublished: a.published,
      dateModified: a.modified,
      author: { "@id": SITE_URL + "/#clinic" },
      publisher: { "@id": SITE_URL + "/#clinic" },
      mainEntityOfPage: { "@id": url + "#webpage" },
      inLanguage: "ko-KR",
      wordCount: a.body.replace(/\s+/g, "").length,
      isAccessibleForFree: true,
      speakable: { "@type": "SpeakableSpecification", cssSelector: [".summary-box", ".key-answer"] }
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

// ---------- 주입 ----------
function inject(file) {
  let html = fs.readFileSync(file, "utf8");
  const url = urlFor(file);
  const rel = "/" + path.relative(ROOT, file).split(path.sep).join("/");
  // 이전에 자동 생성한 블록은 빼고 읽는다 (옛 블록의 og:image 등을 다시 물려받지 않도록)
  const info = extract(html.replace(/<!-- seo:start[\s\S]*?<!-- seo:end -->\n?/i, ""), file);
  const isArticle = !!info.article;
  const modified = isArticle ? info.article.modified : lastModOf(file);
  const keywords = attr(pick(html, /(<meta\s+name="keywords"[^>]*>)/i) || "", "content") || KEYWORDS[rel] || "";
  // 페이지에 직접 noindex 를 적어 두었으면(개인정보처리방침 등) 그 값을 존중한다
  const noindex = /<meta\s+name="robots"\s+content="noindex/i.test(html.replace(/<!-- seo:start[\s\S]*?<!-- seo:end -->\n?/i, ""));

  const block = [
    "<!-- seo:start (tools/seo-inject.js 가 자동 생성, 직접 수정하지 마세요) -->",
    `<link rel="canonical" href="${url}">`,
    noindex ? "" : `<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">`,
    keywords && !/name="keywords"/i.test(html.replace(/<!-- seo:start[\s\S]*?<!-- seo:end -->\n?/i, "")) ? `<meta name="keywords" content="${keywords.replace(/"/g, "&quot;")}">` : "",
    CFG.naverVerify ? `<meta name="naver-site-verification" content="${CFG.naverVerify}">` : "",
    CFG.googleVerify ? `<meta name="google-site-verification" content="${CFG.googleVerify}">` : "",
    `<meta name="author" content="${CLINIC.name}">`,
    `<meta name="geo.region" content="KR-41">`,
    `<meta name="geo.placename" content="경기도 수원시 팔달구 인계동">`,
    `<meta name="geo.position" content="${CLINIC.lat};${CLINIC.lng}">`,
    `<meta property="og:type" content="${isArticle ? "article" : "website"}">`,
    `<meta property="og:site_name" content="${CLINIC.name}">`,
    `<meta property="og:locale" content="ko_KR">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:title" content="${info.title.replace(/"/g, "&quot;")}">`,
    `<meta property="og:description" content="${info.description.replace(/"/g, "&quot;")}">`,
    `<meta property="og:image" content="${info.image}">`,
    isArticle ? `<meta property="article:published_time" content="${info.article.published}">` : "",
    isArticle ? `<meta property="article:modified_time" content="${info.article.modified}">` : "",
    isArticle ? `<meta property="article:author" content="${CLINIC.name}">` : "",
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${info.title.replace(/"/g, "&quot;")}">`,
    `<meta name="twitter:description" content="${info.description.replace(/"/g, "&quot;")}">`,
    `<meta name="twitter:image" content="${info.image}">`,
    `<script type="application/ld+json">${JSON.stringify(buildJsonLd(info, file, url))}</script>`,
    "<!-- seo:end -->"
  ]
    .filter(Boolean)
    .join("\n");

  // 기존 자동 블록 제거 + 손으로 넣어둔 og:* 제거(중복 방지)
  html = html.replace(/<!-- seo:start[\s\S]*?<!-- seo:end -->\n?/i, "");
  html = html.replace(/^\s*<meta property="og:(title|description|image)"[^>]*>\n/gim, "");
  html = html.replace(/<\/head>/i, block + "\n</head>");
  fs.writeFileSync(file, html);
  return { url, rel, title: info.title, description: info.description, faqs: info.faqs.length, crumbs: info.crumbs.length, article: isArticle, modified, category: info.article ? info.article.category : "", noindex };
}

// ---------- 실행 ----------
const files = walk(ROOT).filter((f) => f.endsWith(".html") && !path.basename(f).startsWith("_") && !/구현가이드/.test(f) && path.basename(f) !== "404.html");
const entries = [];
for (const f of files) {
  const r = inject(f);
  entries.push(r);
  console.log(`${r.url}  faq:${r.faqs} crumb:${r.crumbs}${r.article ? " article" : ""}`);
}

// sitemap.xml
const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  entries
    .filter((e) => !e.noindex)
    .map((e) => {
      const pri = e.url === SITE_URL + "/" ? "1.0" : e.article ? "0.7" : e.rel === "/privacy.html" ? "0.2" : "0.8";
      return `  <url><loc>${e.url}</loc><lastmod>${e.modified}</lastmod><changefreq>${e.article ? "monthly" : "weekly"}</changefreq><priority>${pri}</priority></url>`;
    })
    .join("\n") +
  `\n</urlset>\n`;
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemap);

// robots.txt — 검색엔진 + AI 검색 크롤러 허용, 데이터 수집용 Bytespider 는 차단
const AI_BOTS = ["GPTBot", "ChatGPT-User", "OAI-SearchBot", "Google-Extended", "PerplexityBot", "ClaudeBot", "anthropic-ai", "Applebot-Extended", "CCBot", "Yeti", "NaverBot"];
fs.writeFileSync(
  path.join(ROOT, "robots.txt"),
  `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /pages/columns/_data/\nDisallow: /pages/columns/_template.html\nDisallow: /pages/columns/_category.html\nDisallow: /components/\n\nSitemap: ${SITE_URL}/sitemap.xml\n\n` +
    AI_BOTS.map((b) => `User-agent: ${b}\nAllow: /\n`).join("\n") +
    `\nUser-agent: Bytespider\nDisallow: /\n`
);

// llms.txt — 생성형 AI 가 사이트를 요약해 인용할 때 읽는 파일
const pageOf = (rel) => entries.find((e) => e.rel === rel);
const line = (rel, label) => { const p = pageOf(rel); return p ? `- [${label || p.title.split("|")[0].trim()}](${p.url}): ${p.description}` : ""; };
const mainPages = [
  ["/pages/ear/index.html", "이명"], ["/pages/ear/hearing-loss.html", "돌발성 난청 · 난청"], ["/pages/ear/dizziness.html", "메니에르 · 어지럼 · 이석"],
  ["/pages/face/index.html", "구안와사 (안면신경마비)"], ["/pages/face/spasm.html", "안검경련 · 안면경련"], ["/pages/face/trigeminal.html", "삼차신경통"], ["/pages/face/eye.html", "눈 · 시야 질환"], ["/pages/face/brain.html", "신경 · 뇌 질환"],
  ["/pages/skin/wart.html", "편평사마귀 레이저"],
  ["/pages/spine/traffic.html", "교통사고 후유증"], ["/pages/spine/index.html", "척추질환"], ["/pages/spine/joint.html", "관절질환"], ["/pages/spine/rehab.html", "재활클리닉"],
  ["/pages/internal/index.html", "내과 · 소화기 질환"], ["/pages/internal/women.html", "항문 · 여성질환"],
  ["/pages/about/index.html", "전국에서 찾아오는 바를정"], ["/pages/about/doctor.html", "의료진"], ["/pages/about/papers.html", "의학 논문"], ["/pages/about/facility.html", "원내 시설 · 입원실"], ["/pages/about/location.html", "오시는 길"], ["/booking.html", "진료 예약 · 입원 안내"]
];
const posts = entries.filter((e) => e.article).map((e) => `- [${e.title.split("|")[0].trim()}](${e.url}) (${e.category}): ${e.description}`);
const hoursText = CLINIC.openingHours.map((o) => `${o.days.map((d) => ({ Monday: "월", Tuesday: "화", Wednesday: "수", Thursday: "목", Friday: "금", Saturday: "토", Sunday: "일", PublicHolidays: "공휴일" })[d]).join("·")} ${o.opens}-${o.closes}`).join(", ");
fs.writeFileSync(
  path.join(ROOT, "llms.txt"),
  `# ${CLINIC.name}\n\n> ${CLINIC.addressRegion} ${CLINIC.addressLocality} ${CLINIC.streetAddress}에 있는 한의원. 이명 · 돌발성 난청 · 메니에르 · 어지럼증과 구안와사(안면신경마비) · 안면경련 · 삼차신경통을 중점 진료하며, 1~2인실 입원실에서 하루 2회 이상 집중치료를 합니다. 한방 안이비인후피부과 전문의(오민지), 한방내과 전문의(이진혁 · 김도경), 한방소아청소년과 전문의 · 한의학 박사(이주현) 4인 협진. 신경외과 · 영상의학과와 양 · 한방 협진. 대표원장 ${DOCTOR.name}.\n\n` +
    `## 주요 정보\n${mainPages.map(([r, l]) => line(r, l)).filter(Boolean).join("\n")}\n\n` +
    `## 칼럼 · 사례 · 후기 · 공지\n- [상담 · 후기 전체 목록](${SITE_URL}/pages/columns/)\n${posts.join("\n")}\n\n` +
    `## 병원 정보\n- 외래 주소: ${CLINIC.addressRegion} ${CLINIC.addressLocality} ${CLINIC.streetAddress}\n- 입원실: ${SC.ward1 || ""} / ${SC.ward2 || ""}\n- 전화: ${PHONE}\n- 진료시간: ${hoursText}, 평일 점심 ${SH.lunchStart || "13:00"}-${SH.lunchEnd || "14:00"}, 연중무휴 · 입원실 365일\n- 대표원장: ${DOCTOR.name} (${DOCTOR.memberOf.join(", ")})\n- 의료진: ${DOCTORS.map((d) => `${d.name} (${d.jobTitle})`).join(", ")}\n- 사업자등록번호: ${SC.bizNo || "449-36-01300"}\n- 네이버 예약: ${SCH.naverBooking || ""}\n- 카카오톡 채널: ${SCH.kakao || ""}\n- 유튜브: ${SCH.youtube || ""}\n- 블로그: ${SCH.blog || ""}\n\n` +
    `## 안내\n- 사이트맵: ${SITE_URL}/sitemap.xml\n- 이 사이트의 의학 정보는 일반적인 안내이며 진단·치료를 대신하지 않습니다. 개인별 치료 결과는 다를 수 있습니다.\n`
);
console.log(`\n${entries.length} pages updated · sitemap.xml · robots.txt · llms.txt  (SITE_URL = ${SITE_URL})`);
