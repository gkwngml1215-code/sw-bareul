/**
 * 공통 헤더/푸터/공통 블록 삽입 + GNB 동작 + 서브페이지 탭 활성화 + 숫자 카운터 + 질환 탭
 * - 반드시 http://localhost 같은 로컬 서버로 열어야 fetch가 동작합니다.
 *   (파일 더블클릭 file:// 로 열면 브라우저 보안 정책상 헤더/푸터가 안 뜹니다)
 */
(function () {
  async function includeComponent(el, path) {
    if (!el) return;
    try {
      const res = await fetch(path);
      el.innerHTML = await res.text();
    } catch (e) {
      console.error("컴포넌트를 불러오지 못했습니다:", path, e);
    }
  }

  // 현재 페이지에 해당하는 1뎁스/2뎁스 메뉴에 active 표시
  function markActiveMenu() {
    const current = location.pathname.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
    document.querySelectorAll(".gnb-menu > li").forEach((li) => {
      const top = li.querySelector(":scope > a");
      const links = li.querySelectorAll("a");
      let hit = false;
      links.forEach((a) => {
        const href = (a.getAttribute("href") || "").replace(/\/index\.html$/, "/").replace(/\.html$/, "");
        if (href && href !== "/" && current === href) {
          a.closest("li").classList.add("active");
          hit = true;
        }
      });
      // 같은 카테고리 폴더면 1뎁스 active
      if (top) {
        const folder = (top.getAttribute("href") || "").replace(/[^/]*$/, "");
        if (folder && folder !== "/" && current.startsWith(folder)) hit = true;
      }
      if (hit) li.classList.add("active");
    });
  }

  function setupMobileMenu() {
    const header = document.getElementById("site-header");
    const toggle = document.getElementById("gnbToggle");
    if (!toggle || !header) return;

    toggle.addEventListener("click", () => {
      header.classList.toggle("is-open");
      document.body.style.overflow = header.classList.contains("is-open") ? "hidden" : "";
    });

    document.querySelectorAll(".gnb-menu > li").forEach((li) => {
      if (li.querySelector(".gnb-submenu")) li.classList.add("has-sub");
    });

    // 모바일: 1뎁스 클릭 시 2뎁스 아코디언 (데스크톱은 CSS hover)
    document.querySelectorAll(".gnb-menu > li.has-sub > a").forEach((a) => {
      a.addEventListener("click", (e) => {
        const isMobile = window.matchMedia("(max-width: 1024px)").matches;
        if (isMobile) {
          e.preventDefault();
          const li = a.parentElement;
          const open = li.classList.contains("is-expanded");
          document.querySelectorAll(".gnb-menu > li.is-expanded").forEach((x) => x.classList.remove("is-expanded"));
          if (!open) li.classList.add("is-expanded");
        }
      });
    });
  }

  // 서브페이지 2뎁스 탭: 현재 페이지 표시
  function markActiveTab() {
    const current = location.pathname.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
    document.querySelectorAll(".sub-tabs a").forEach((a) => {
      const href = (a.getAttribute("href") || "").replace(/\/index\.html$/, "/").replace(/\.html$/, "");
      if (href === current) a.parentElement.classList.add("active");
    });
  }

  // 맨 위로 버튼
  function setupTopButton() {
    const btn = document.querySelector(".floating .f-top");
    if (!btn) return;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // 숫자 카운터 (.stat-list .value[data-target])
  function setupCounters() {
    const els = document.querySelectorAll("[data-target]");
    if (!els.length) return;
    const fmt = (n) => n.toLocaleString("ko-KR");
    const run = (el) => {
      const target = Number(el.getAttribute("data-target")) || 0;
      const dur = 1600, start = performance.now();
      const num = el.querySelector(".num") || el;
      const tick = (t) => {
        const p = Math.min(1, (t - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        num.textContent = fmt(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if (!("IntersectionObserver" in window)) { els.forEach(run); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.3 });
    els.forEach((el) => io.observe(el));
  }

  // 질환 탭 (.tab-nav button[data-tab] ↔ .tab-panel[data-tab])
  function setupTabs() {
    document.querySelectorAll(".tab-nav").forEach((nav) => {
      const btns = nav.querySelectorAll("button[data-tab]");
      const wrap = nav.parentElement;
      const panels = wrap.querySelectorAll(".tab-panel");
      const activate = (key) => {
        btns.forEach((b) => b.classList.toggle("active", b.dataset.tab === key));
        panels.forEach((p) => p.classList.toggle("active", p.dataset.tab === key));
      };
      btns.forEach((b) => b.addEventListener("click", () => activate(b.dataset.tab)));
      if (btns.length && !nav.querySelector("button.active")) activate(btns[0].dataset.tab);
    });
  }

  // 히어로 영상: 자동재생 실패(저전력 모드 등) 시 포스터 이미지로 대체
  function setupHeroVideo() {
    const v = document.querySelector(".hero video");
    if (!v) return;
    const p = v.play && v.play();
    if (p && p.catch) p.catch(() => { v.style.display = "none"; });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await includeComponent(document.getElementById("site-header-placeholder"), "/components/header.html");
    await includeComponent(document.getElementById("site-footer-placeholder"), "/components/footer.html");
    // 공통 블록: <div data-include="/components/xxx.html"></div>
    await Promise.all([...document.querySelectorAll("[data-include]")].map((el) => includeComponent(el, el.getAttribute("data-include"))));
    markActiveMenu();
    setupMobileMenu();
    markActiveTab();
    setupTopButton();
    setupCounters();
    setupTabs();
    setupHeroVideo();
  });
})();
