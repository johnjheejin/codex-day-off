# GitHub에서 공개 도메인까지

공개 주소는 [dayoff.tmcowork.com](https://dayoff.tmcowork.com/)이며 기존 Cloudflare Pages `codex-day-off` 프로젝트를 사용한다. 프로젝트의 Git Provider는 No지만, [GitHub Actions](https://github.com/johnjheejin/codex-day-off/actions/workflows/publish.yml)가 직접 업로드를 수행하도록 구성했다.

## 실행 상태

2026-09-06 공개 기능 반영 완료. 새 토큰 발급은 사용자 확인 대기 중이므로 **GitHub 자동 배포 연결은 미완료**다. 기존 로그인 인증으로 공개했으며 자동 배포 성공으로 보고하지 않는다.

- 공개 deployment: `6e0df2f1-5d25-4ed2-b2db-4a6d7e21f168`, source `07de646`, [고정 배포 주소](https://6e0df2f1.codex-day-off.pages.dev).
- [45개 검사의 GitHub 실행](https://github.com/johnjheejin/codex-day-off/actions/runs/33990186523): 빌드·번들 일치·단위 16개·브라우저 29개 성공. 게시 단계는 `CLOUDFLARE_API_TOKEN`이 없어 `Not logged in`으로 실패했다. 첫 [44개 실행](https://github.com/johnjheejin/codex-day-off/actions/runs/33989979717)도 같은 구분을 따른다.
- 기존 인증으로 게시 후 고정 배포 URL과 공개 도메인의 8개 파일(704,457바이트)을 대조했다. 공개 사이트 브라우저 29개도 모두 통과했다(약 1.9분).
- [공개 파일 대조](../assets/verification/2026-09-06-living-sky/production/integrity.json) · [공개 3D 화면](../assets/verification/2026-09-06-living-sky/production/night-live-turned.png) · [공개 모바일 Paper Sky](../assets/verification/2026-09-06-living-sky/production/mobile-paper-live.png).
- 후속 배포 도구·기록 커밋은 사이트 8개 파일을 바꾸지 않는다. 런타임 source ref는 `07de646`을 유지한다. 이전 공개본은 [앞선 배포 기록](./verification/2026-09-06-deployment.md)에 있다.


## 동작

1. 런타임·테스트·워크플로와 관련된 `main` push 또는 수동 실행이 시작점이다. PR은 검사만 수행한다.
2. Node 24에서 `npm ci`, 재빌드 후 체크인 번들과 일치 확인, 정책·단위·브라우저 검사를 실행한다. Linux에서는 소프트웨어 WebGL을 사용하므로 물리 GPU 성능을 증명하지 않는다.
3. 검사 성공 뒤 `scripts/prepare-pages.mjs`가 필요한 8개 파일만 `dist/`에 모은다. 테스트 결과, 인증 파일, 옛 ZIP과 개발 의존성은 업로드하지 않는다.
4. Wrangler 4.129.0이 동일 Pages 프로젝트의 `main`으로 게시하고 Git 커밋을 배포에 기록한다.
5. 고정 배포 URL과 공개 도메인 파일을 SHA-256으로 대조한다. 공개 HTML에 Cloudflare가 삽입한 것으로 직접 확인한 두 보안 조각만 제거해 비교한다. 그 외 차이는 실패다.
6. 공개 도메인에서 브라우저 검사 전체를 수행하고 검증 자료를 14일 보관한다. 배포 해시는 release-results/, 브라우저 자료는 test-results/에 분리해 Playwright의 폴더 초기화로 대조 기록이 지워지지 않게 한다. 이후 단계가 실패하면 Actions는 실패로 표시된다. 이미 게시된 배포를 자동으로 되돌리지는 않는다.

Actions는 공식 저장소의 고정 커밋을 사용한다. Wrangler 4.129.0도 package-lock.json에 고정했다. 토큰이 없으면 배포 전에 명시적인 오류를 남긴다. 기본 권한은 `contents: read`; 게시 작업에만 `deployments: write`를 준다. PR 작업은 배포 비밀을 받지 않는다. 배포 중인 작업은 새 push로 취소하지 않는다. 문서와 캡처만 바뀌면 자동 재배포하지 않는다.

## 연결 값

- GitHub repository variable: `CLOUDFLARE_ACCOUNT_ID` — `2e0929da074ae7dd3cb8bef799acf5c0`
- GitHub repository secret: `CLOUDFLARE_API_TOKEN`
- Cloudflare 토큰 권한: 지정 계정의 **Account / Cloudflare Pages / Edit**만. 이 권한은 Cloudflare가 제공하는 계정 단위이며 개별 Pages 프로젝트 단위 제한은 아니다. 다른 계정·DNS·Workers 권한을 추가하지 않는다.
- 개인 Wrangler OAuth/refresh token은 GitHub에 저장하지 않는다. 토큰 원문을 커밋·일지·로그에 남기지 않는다.

[Cloudflare의 CI 직접 업로드 안내](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/)를 기준으로 구성했다.

## 재실행과 확인

```bash
gh workflow run publish.yml --ref main
gh run list --workflow publish.yml --limit 5
node scripts/prepare-pages.mjs
node scripts/check-deployment.mjs https://dayoff.tmcowork.com
AFTERGLOW_BASE_URL=https://dayoff.tmcowork.com AFTERGLOW_EVIDENCE_DIR=test-results/public-evidence npx playwright test
```

API 토큰이 폐기되거나 만료되면 Pages Edit 범위로 새 토큰을 발급해 같은 GitHub secret을 교체한 뒤 수동 실행한다. 공개 확인이 실패하면 Actions 로그의 실패 파일·시나리오를 확인하고 고친 커밋을 push한다. 긴급 복구는 Cloudflare의 이전 production 배포로 롤백할 수 있다. 실패를 성공으로 기록하거나 검사를 생략해 자동 배포가 완료됐다고 보고하지 않는다.
