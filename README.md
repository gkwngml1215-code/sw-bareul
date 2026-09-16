# 정한의원 어드민

- 이 폴더(`main` 브랜치의 `admin/`)가 어드민의 원본입니다. 고친 뒤 사이트 폴더에서 `node tools/sync-admin.js` 를 실행하면 `admin` 브랜치로 복사되고, Cloudflare Pages 프로젝트 `junghani-admin` 이 1~2분 뒤 자동 배포합니다.
- `admin` 브랜치를 직접 고치지 마세요 (다음 동기화 때 덮어씁니다).
- `_worker.js` 는 아이디·비밀번호 잠금입니다. 지우거나 이름을 바꾸면 잠금이 풀립니다. 아이디·비밀번호는 Cloudflare 대시보드 Variables and Secrets 의 `ADMIN_USER` / `ADMIN_PASS` 입니다.
- `config.json` 에 저장소(owner/repo/branch)와 홈페이지 주소(siteUrl)가 있습니다.
- 로컬에서는 `node tools/admin-server.js` 로 `http://localhost:8080/admin/` 에서 같은 화면을 비밀번호로 씁니다.

<!-- 배포 갱신: 2026-09-16 21:13 -->
