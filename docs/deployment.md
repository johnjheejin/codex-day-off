# GitHub에서 공개 도메인까지

공개 주소는 [dayoff.tmcowork.com](https://dayoff.tmcowork.com/)이며 기존 Cloudflare Pages `codex-day-off` 프로젝트를 사용한다. 프로젝트의 Git Provider는 No지만, [GitHub Actions](https://github.com/johnjheejin/codex-day-off/actions/workflows/publish.yml)가 직접 업로드를 수행하도록 구성했다.

## 실행 상태

2026-09-06 **라이브 결과·랜딩 복원과 짧은 터치 보완까지 GitHub 자동 배포로 공개했다.** 사용자가 발급을 승인한 Pages Edit 토큰을 GitHub 저장소 비밀값에 연결했다. 개인 Wrangler 로그인 없이 GitHub Actions가 기존 프로젝트에 공개 배포를 수행한다.

- [성공한 push 실행](https://github.com/johnjheejin/codex-day-off/actions/runs/34002305780), source `f76230e`. 빌드·번들 일치·단위 21개·브라우저 32개(총 53개)를 통과한 뒤 게시했다.
- Cloudflare production: `31bc3596-3a51-4544-b8c7-3c92790d3413`, [고정 배포 주소](https://31bc3596.codex-day-off.pages.dev). 고정 주소의 8개 파일(713,184바이트)과 브라우저 32개를 GitHub에서 검증했다.
- Pages API에서 공개 도메인이 활성 상태이고, 프로젝트의 실제 production 배포가 이번 커밋과 고정 URL에 일치함을 확인했다.
- **GitHub에서 공개 도메인의 전체 콘텐츠 검증은 보안 challenge로 미완료다.** HTML과 서체 README 요청은 HTTP 403 / `cf-mitigated: challenge`, 나머지 6개 파일은 일치했다. 이 상태는 경고와 `matches: false` 기록으로 남기며, 공개 도메인 브라우저 검사 성공으로 취급하지 않는다.
- 같은 공개 도메인을 이 컴퓨터에서 검사하면 8개 파일이 모두 일치하고 Chrome Beta 브라우저 32개도 통과한다. 최종 소스의 로컬 소프트웨어 WebGL 검사도 32개 전체를 통과했다. 보안 설정을 바꾸거나 challenge를 우회하지 않았다.
- [CI 배포·도메인 연결·환경별 파일 대조·공개 브라우저 기록](../assets/verification/2026-09-06-kept-sky/production.json). Actions의 `verification`과 `production-verification` 아티팩트는 14일 보관한다. [이전 자동 배포 기록](../assets/verification/2026-09-06-living-sky/production/github-actions.json)은 이력으로 보존한다.
- 이후 런타임·테스트·배포 설정에 관련된 `main` push는 같은 절차로 자동 게시된다. 문서와 캡처만 바뀌면 재배포하지 않는다.

연결 전 [실행](https://github.com/johnjheejin/codex-day-off/actions/runs/33990631243)은 토큰 확인에서 멈췄다. 토큰 연결 후 [첫 실행](https://github.com/johnjheejin/codex-day-off/actions/runs/33997862488)은 실제 배포에 성공했지만 공개 도메인 검사에서 403으로 실패했다. [읽기 전용 진단](https://github.com/johnjheejin/codex-day-off/actions/runs/33998329644)으로 Node와 Chromium 모두 보안 확인 응답을 받는 것을 확인했다. 배포 검증과 공개 도메인 보안 응답을 분리한 [실행 33998524892](https://github.com/johnjheejin/codex-day-off/actions/runs/33998524892)으로 자동화를 완료했다.

라이브 결과의 [첫 배포 후 검사](https://github.com/johnjheejin/codex-day-off/actions/runs/34001562773)에서는 모바일 PNG 준비의 5초 대기 한 건이 실패했다. 같은 배포의 해당 검사를 로컬에서 두 번 통과했고, [다음 전체 실행](https://github.com/johnjheejin/codex-day-off/actions/runs/34001970345)도 통과했다. 그 대기 실패의 원인은 재현하지 못했으므로 단정하지 않는다. 추가 소프트웨어 WebGL 검사에서 짧은 터치가 첫 반응 전에 끝나는 경우를 찾아 단위 회귀 검사와 입력 보존을 추가했다. 최종 실행은 실제 터치 입력으로 검사하며 PNG 준비 대기와 내보내기 검증은 유지한다.

## 동작

1. 런타임·테스트·워크플로와 관련된 `main` push 또는 수동 실행이 시작점이다. PR은 검사만 수행한다.
2. Node 24에서 `npm ci`, 재빌드 후 체크인 번들과 일치 확인, 정책·단위·브라우저 검사를 실행한다. Linux에서는 소프트웨어 WebGL을 사용하므로 물리 GPU 성능을 증명하지 않는다.
3. 검사 성공 뒤 `scripts/prepare-pages.mjs`가 필요한 8개 파일만 `dist/`에 모은다. 테스트 결과, 인증 파일, 옛 ZIP과 개발 의존성은 업로드하지 않는다.
4. Wrangler 4.129.0이 동일 Pages 프로젝트의 `main`으로 게시하고 Git 커밋을 배포에 기록한다.
5. 고정 배포 URL의 8개 파일을 SHA-256으로 대조하고 브라우저 32개를 실행한다. 이후 Pages API의 `canonical_deployment`와 활성 custom domain을 조회해 배포 URL·전체 Git SHA·공개 도메인의 연결을 확인한다.
6. 공개 도메인의 파일도 대조한다. 공개 HTML에는 직접 확인한 Cloudflare 삽입 코드 두 부분만 제거해 비교한다. `403`과 `cf-mitigated: challenge`가 함께 있으면 내용 검증 미완료(exit 2)로 기록하고 Actions 경고를 남긴다. 파일 불일치, 일반 403, 서버 오류와 네트워크 오류는 실패(exit 1)다.
7. 배포 해시는 `release-results/`, 브라우저 자료는 `test-results/`에 분리해 Playwright 초기화로 기록이 지워지지 않게 한다. 자료는 14일 보관한다. 게시 후 검사가 실패해도 배포를 자동 롤백하지는 않는다.

Actions는 공식 저장소의 고정 커밋을 사용한다. Wrangler 4.129.0도 package-lock.json에 고정했다. 토큰이 없으면 배포 전에 명시적인 오류를 남긴다. 기본 권한은 `contents: read`; 게시 작업에만 `deployments: write`를 준다. PR 작업은 배포 비밀을 받지 않는다. 배포 중인 작업은 새 push로 취소하지 않는다. 문서와 캡처만 바뀌면 자동 재배포하지 않는다.

## 연결 값

- GitHub repository variable: `CLOUDFLARE_ACCOUNT_ID` — `2e0929da074ae7dd3cb8bef799acf5c0`
- GitHub repository secret: `CLOUDFLARE_API_TOKEN`
- Cloudflare 토큰 권한: 지정 계정의 **Account / Cloudflare Pages / Edit**만. 이 권한은 Cloudflare가 제공하는 계정 단위이며 개별 Pages 프로젝트 단위 제한은 아니다. 다른 계정·DNS·Workers 권한을 추가하지 않는다.
- 개인 Wrangler OAuth/refresh token은 GitHub에 저장하지 않는다. 토큰 원문을 커밋·일지·로그에 남기지 않는다.

[Cloudflare의 CI 직접 업로드 안내](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/), [production 배포 API](https://developers.cloudflare.com/api/resources/pages/subresources/projects/methods/get/), [challenge 응답 식별](https://developers.cloudflare.com/cloudflare-challenges/challenge-types/challenge-pages/detect-response/)을 기준으로 구성했다.

## 재실행과 확인

```bash
gh workflow run publish.yml --ref main
gh run list --workflow publish.yml --limit 5
node scripts/prepare-pages.mjs
node scripts/check-deployment.mjs https://dayoff.tmcowork.com
AFTERGLOW_BASE_URL=https://dayoff.tmcowork.com AFTERGLOW_EVIDENCE_DIR=test-results/public-evidence npx playwright test
```

API 토큰이 폐기되거나 만료되면 Pages Edit 범위로 새 토큰을 발급해 같은 GitHub secret을 교체한 뒤 수동 실행한다. 공개 확인이 실패하면 Actions 로그의 실패 파일·시나리오를 확인하고 고친 커밋을 push한다. Challenge 경고가 나오면 고정 배포 검증과 공개 도메인 검증을 구분하고, 위 로컬 공개 확인 명령으로 실제 접속을 검사한다. 필요하면 `gh workflow run inspect-public.yml`로 배포 없이 GitHub 접속 상태만 진단한다. 긴급 복구는 Cloudflare의 이전 production 배포로 롤백할 수 있다. 실패를 성공으로 기록하거나 검사를 생략해 자동 배포가 완료됐다고 보고하지 않는다.
