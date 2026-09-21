/**
 * 예약 발행 스케줄러 (Cloudflare Worker, 크론 전용)
 *
 * 매일 한국 시간 오전 9시쯤 실행됩니다. 홈페이지의 build-info.json 에 적힌
 * "가장 가까운 예약 날짜(nextScheduled)" 가 오늘이거나 지났으면 Cloudflare Pages
 * 배포 훅을 눌러 홈페이지를 다시 빌드합니다. 빌드할 때 그 날짜의 예약 글이 공개됩니다.
 * 예약 글이 없으면 아무 일도 하지 않습니다.
 *
 * 설정값
 *   SITE_URL    (wrangler.toml vars)  홈페이지 주소
 *   DEPLOY_HOOK (secret)              Pages 프로젝트 sw-bareul 의 배포 훅 주소
 */
function todayKST() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

async function run(env) {
  const res = await fetch(`${env.SITE_URL}/build-info.json?t=${Date.now()}`, { cf: { cacheTtl: 0 } });
  if (!res.ok) throw new Error(`build-info.json ${res.status}`);
  const info = await res.json();
  const next = info.nextScheduled || "";
  if (!next || next > todayKST()) return { built: false, next, today: todayKST() };
  const hook = await fetch(env.DEPLOY_HOOK, { method: "POST" });
  if (!hook.ok) throw new Error(`deploy hook ${hook.status}`);
  return { built: true, next, today: todayKST() };
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(run(env).then((r) => console.log(JSON.stringify(r))));
  },
  // 주소로 직접 열 일은 없음 (workers_dev = false). 혹시 연결되더라도 아무것도 하지 않음.
  async fetch() {
    return new Response("sw-bareul scheduler", { status: 200 });
  },
};
