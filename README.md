# 수원 바를정한의원 홈페이지 (www.sw-bareul.co.kr) - 작업 안내

울산 정한의원(junghani) 홈페이지와 같은 구조입니다. 콘텐츠 · 메뉴 · 사진은 기존 홈페이지(danaan-sw.com)를 옮겨 왔고, 레이아웃은 바를연한의원(bareulyeon.com)을 참고했습니다.

## 1. 여는 방법 (중요)

헤더/푸터를 `components/header.html`, `components/footer.html`에서 `fetch`로 불러오는 구조라, **파일을 더블클릭해서 `file://`로 열면 메뉴가 안 뜹니다.** 반드시 로컬 서버로 여세요.

- 방법 A (권장): 사이트 폴더에서 `node tools/admin-server.js` 실행 → 홈페이지 `http://localhost:8080/`, 어드민 `http://localhost:8080/admin/`
- 방법 B: Claude에게 "홈페이지 크롬으로 열어줘" 또는 "어드민 켜줘"라고 요청
- 방법 C: VS Code 확장 **Live Server** (홈페이지만 볼 때. 어드민은 동작 안 함)

## 1-1. 어드민 (게시글 · 홈페이지 설정 관리)

- 주소: `http://localhost:8080/admin/` · 비밀번호: `tools/admin-config.json`의 `password` (처음 값 `bareul3375`)
- 게시글 5종을 하나의 화면에서 관리합니다. 글을 쓸 때 **카테고리**를 고르면 해당 게시판 목록에 자동으로 들어갑니다.

  | 카테고리 | 홈페이지 주소 | 목록 형태 |
  |---|---|---|
  | 바를정 칼럼 | `/pages/columns/column` | 카드 (썸네일 + 요약) |
  | 치료 전후 사례 | `/pages/columns/cases` | 사진 갤러리 |
  | 환자수기 | `/pages/columns/reviews` | 세로 사진 갤러리 |
  | 언론보도 | `/pages/columns/press` | 카드 |
  | 공지사항 | `/pages/columns/notice` | 줄 목록 |

  전체 목록은 `/pages/columns/` 입니다.
- 할 수 있는 것: 목록 보기, 새 글 쓰기(제목·작성자·카테고리·description·keywords·schema·내용 편집기·썸네일·alt값 + 핵심 요약·FAQ·참고 자료), 수정, 삭제, 임시저장, 미리보기, 전체 다시 생성, **홈페이지 설정**(전화·주소·입원실 주소·진료시간·예약/SNS 링크·검색 문구·공지 띠)
- 저장하면 글 HTML 생성 → 전체 목록 + 카테고리별 목록 갱신 → SEO 데이터·sitemap 갱신까지 자동
- **인터넷 어드민(배포 후):** `https://sw-bareul-admin.pages.dev` (Cloudflare Pages, `admin` 브랜치, `_worker.js` 아이디·비밀번호 잠금) 에서 GitHub 접속 키로 로그인하면 어느 컴퓨터에서나 글을 쓸 수 있습니다. 글은 GitHub `main` 의 `pages/columns/_data/` 에 저장되고, Cloudflare Pages 가 `node tools/build.js` 로 홈페이지를 자동 생성합니다. 설치 순서는 `배포가이드.md`.

## 2. 폴더 구조

```
index.html                  메인 페이지 (영상 히어로 · 진료과목 · 전후사례 · 유튜브 · 의료진 · 공지 · 오시는 길 · FAQ)
booking.html                진료예약 · 입원 안내
consult.html                온라인 상담 (카카오톡 · 문자 · 전화로 연결되는 빠른 상담신청)
privacy.html                개인정보처리방침
sitemap.xml, robots.txt, llms.txt   검색엔진 · AI 검색용 (tools/seo-inject.js 가 자동 생성)
site.json                   전화·주소·진료시간·링크·SEO 문구 (어드민 "홈페이지 설정"이 저장)
components/
  header.html               공통 헤더(GNB 7개 대메뉴 + 예약 버튼) — 메뉴 수정은 이 파일 하나만
  footer.html               공통 푸터 + 플로팅 버튼(치료효과/카톡/유튜브/오시는길/전화/TOP)
  promise.html              "전국에서 찾아오는 바를정 + 진료 약속" 공통 블록 (진료과목 페이지 하단)
  inpatient.html            프리미엄 입원실 안내 공통 블록
  collab.html               양방 협력병원 협진 공통 블록
assets/
  css/common.css            색상 변수(네이비 #1a3369 · 골드 #be9971 · 베이지), 헤더/푸터, 메인 섹션, 반응형
  css/page.css              서브페이지 템플릿 + 게시판 스타일
  js/nav.js                 헤더/푸터/공통 블록 삽입, 모바일 메뉴, 숫자 카운터, 질환 탭
  img/  logo/ main/ sub/ common/ papers/ board/ columns/   (기존 홈페이지에서 가져온 사진)
  video/mv.mp4              메인 히어로 배경 영상 (13MB)
pages/
  ear/        이명 · 난청: index(이명), hearing-loss(돌발성 난청), dizziness(메니에르·어지럼·이석), faq
  face/       안면 · 신경: index(구안와사), spasm(안검·안면경련), trigeminal(삼차신경통), eye(눈·시야), brain(신경·뇌), faq
  skin/       피부: wart(편평사마귀)
  spine/      척추 · 관절: traffic(교통사고 후유증), index(척추질환), joint(관절질환), rehab(재활클리닉)
  internal/   내과 · 면역: index(내과·소화기), women(항문·여성질환)
  about/      바를정 소개: index(전국에서 찾아오는 바를정), doctor(의료진), papers(의학 논문), facility(원내 시설), location(오시는 길)
  columns/    게시판: index(전체), column/cases/reviews/press/notice(카테고리별, 빌드가 생성), 날짜-슬러그.html(글), _data/(글 원본 JSON), _template.html, _category.html
admin/
  index.html                어드민 화면 (게시글 + 홈페이지 설정)
  config.json               GitHub 저장소 · 사이트 주소 · 카테고리 · 카테고리별 주소(slug) · 설명
tools/
  admin-server.js           로컬 서버 + 어드민 API (node tools/admin-server.js)
  column-render.js          게시글 JSON → HTML · 전체 목록 · 카테고리별 목록 생성기
  site-apply.js             site.json 값을 페이지 곳곳에 반영
  seo-inject.js             SEO/GEO/AEO 자동 주입 스크립트
  build.js                  Cloudflare Pages 빌드 (site-apply → 글 생성 → seo → dist/)
  sync-admin.js             admin/ 폴더를 admin 브랜치로 푸시
  admin-config.json         로컬 어드민 비밀번호 (git 제외)
```

## 3. 병원 기본 정보 (기존 홈페이지 · 네이버 플레이스 기준)

| 항목 | 내용 |
|---|---|
| 상호 | 수원 바를정한의원 |
| 대표 | 이진혁 |
| 사업자등록번호 | 449-36-01300 |
| 외래 | 경기도 수원시 팔달구 권광로 274 (인계동, 태현빌딩) 1층 |
| 입원 | 1병동 : 권광로 270 (인계동) 형석빌딩 3층 / 2병동 : 권광로 274 (인계동) 태현빌딩 3층 |
| 좌표 | 위도 37.2715501 / 경도 127.0360048 |
| 전화 | 031-217-3375 |
| 진료시간 | 월~금 10:00~20:00 (점심 13:00~14:00) / 토·일·공휴일 10:00~15:00 (점심 없음) / 연중무휴, 입원실 365일 |
| 의료진 | 오민지(한방 안이비인후피부과 전문의) · 이진혁(한방내과 전문의, 대표) · 김도경(한방내과 전문의) · 이주현(한방소아청소년과 전문의 · 한의학 박사) |
| 네이버 플레이스 | https://map.naver.com/p/entry/place/34778565 |
| 네이버 예약 | https://m.booking.naver.com/booking/13/bizes/304582 |
| 카카오톡 채널 | https://pf.kakao.com/_vAzCxd |
| 유튜브 | https://www.youtube.com/@jssljh |
| 블로그 · 카페 · 인스타 | blog.naver.com/wuminzhi · cafe.naver.com/nima32 · instagram.com/bareuljung.suwon |

전화번호·진료시간·링크가 바뀌면 어드민 **홈페이지 설정**에서 고치면 `site.json` → 전체 페이지에 자동 반영됩니다. (`data-site="…"` 자리)

## 4. SEO · GEO · AEO 구조

- 모든 페이지 `<head>`에 `<!-- seo:start -->` ~ `<!-- seo:end -->` 블록이 자동 생성됩니다: canonical, robots, Open Graph, Twitter Card, 지역 메타(geo.*), JSON-LD 구조화 데이터.
- JSON-LD에는 병원(MedicalClinic: 주소·좌표·진료시간·전화·채널·입원실), 의료진 4인(Physician), 페이지(MedicalWebPage), 경로(BreadcrumbList), FAQ(FAQPage — `.faq` 안의 질문/답에서 자동 추출), 게시글(BlogPosting)이 들어갑니다.
- **사이트 주소(SITE_URL)** 는 `admin/config.json` 의 `siteUrl` (`https://www.sw-bareul.co.kr`) 에서 읽습니다.
- 사이트를 올린 뒤 할 일: 네이버 서치어드바이저와 구글 서치콘솔에 사이트 등록 → `sitemap.xml` 제출. 네이버 플레이스·카카오 채널·유튜브의 홈페이지 주소를 새 도메인으로 바꾸기.

## 5. 남은 확인 사항

- 도메인 연결: Cloudflare Pages 커스텀 도메인 (`배포가이드.md` 3단계). 도메인 `sw-bareul.co.kr` 구매 · DNS 이전 필요
- 기존 홈페이지의 **치료 전후 사례 · 환자수기 게시글 본문**은 회원 전용이라 가져오지 못했습니다. 썸네일 사진과 제목만 옮겼으니, 필요한 글은 어드민에서 본문을 채워 넣으세요.
- 바를정 칼럼(블로그 글)은 기존 사이트에 요약만 있어 요약 그대로 옮겼습니다. 어드민에서 전문을 붙여 넣으면 검색에 더 유리합니다.
- 이메일 주소가 기존 홈페이지에 없어 비워 두었습니다. 어드민 홈페이지 설정에서 넣으면 푸터·구조화 데이터에 반영됩니다.
- 치료 전후 사진은 의료광고법상 환자 동의와 의료광고 심의 대상이 될 수 있으니 게시 전 확인 필요
- 편평사마귀 비급여 비용은 2026년 9월 기존 홈페이지 기준입니다. 바뀌면 `pages/skin/wart.html` 표를 수정하세요.
