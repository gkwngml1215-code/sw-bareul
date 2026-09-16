/**
 * 어드민 폴더(admin/) 를 저장소의 admin 브랜치로 올립니다.
 * ------------------------------------------------------------
 * Cloudflare Pages "sw-bareul-admin" 프로젝트는 admin 브랜치에 연결되어 있어서,
 * 이 스크립트를 실행하면 1~2분 뒤 어드민 주소에 반영됩니다.
 *
 * 실행:  사이트 폴더에서  node tools/sync-admin.js
 *  - admin/ 안의 파일(index.html, config.json, _worker.js, logo/, README.md)만 admin 브랜치에 들어갑니다.
 *  - 지금 작업 중인 main 브랜치와 작업 폴더는 건드리지 않습니다 (임시 인덱스로 커밋을 만듭니다).
 */
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "admin");
const BRANCH = "admin";
const tmpIndex = path.join(os.tmpdir(), "sw-bareul-admin-index-" + process.pid);
const env = { ...process.env, GIT_INDEX_FILE: tmpIndex };
const git = (args, extra = {}) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8", env, ...extra }).trim();

try {
  git(["fetch", "origin", "--prune"]);
  let parent = "";
  try { parent = git(["rev-parse", "--verify", "--quiet", "origin/" + BRANCH]); } catch (e) { parent = ""; }

  // admin/ 폴더를 작업 트리로 삼아 임시 인덱스에 담고 트리 객체를 만든다
  git(["read-tree", "--empty"]);
  git(["--work-tree=" + SRC, "add", "-A", "--", "."]);
  const tree = git(["write-tree"]);

  if (parent && git(["rev-parse", parent + "^{tree}"]) === tree) {
    console.log("admin 브랜치에 바뀐 내용이 없습니다.");
  } else {
    const msg = "어드민 갱신 " + new Date().toISOString().slice(0, 16).replace("T", " ");
    const commit = git(["commit-tree", tree, ...(parent ? ["-p", parent] : []), "-m", msg]);
    git(["update-ref", "refs/heads/" + BRANCH, commit]);
    execFileSync("git", ["push", "-u", "origin", BRANCH + ":" + BRANCH], { cwd: ROOT, stdio: "inherit" });
    console.log(`admin 브랜치 푸시 완료 (${commit.slice(0, 7)}) → Cloudflare Pages 가 1~2분 뒤 어드민을 다시 배포합니다.`);
  }
} finally {
  try { fs.unlinkSync(tmpIndex); } catch (e) {}
}
