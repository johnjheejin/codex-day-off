# 2026-09-06 공개 배포 검증

- 공개 주소: [dayoff.tmcowork.com](https://dayoff.tmcowork.com/)
- 프로젝트: Cloudflare Pages `codex-day-off`, production branch `main`
- 배포 ID: `26f3a895-319c-4c76-b8fb-14b0ae90e1b0`
- 고정 배포 주소: [26f3a895.codex-day-off.pages.dev](https://26f3a895.codex-day-off.pages.dev)
- 개선 코드: GitHub commit `32633ae`; 배포 source ref: 당시 HEAD `3d4d23b`
- 이전 공개 배포: `1fb844c2-ea46-4e64-bc6f-d091ae485d72`, source `8ab59f1`
- 확인 시각: 2026-09-06 04:43 KST

## GitHub와 배포의 관계

실제 `wrangler pages project list --json`에서 `codex-day-off`의 `Git Provider`는 `No`다. GitHub에는 소스를 보관하지만 이 Pages 프로젝트는 직접 업로드 방식이다. 최신 두 커밋의 GitHub 배포·체크 기록도 없었고, push 이후 공개 HTML에는 새 서체와 garden 번들이 없었다.

사용자가 Chrome Beta에서 로그인한 후 기존 Wrangler 인증을 갱신했다. 계정·사용자 조회와 Pages 권한으로 기존 프로젝트에 배포했으며, Git 연동이나 다른 프로젝트 설정은 변경하지 않았다. 직접 업로드 절차는 [Cloudflare 공식 문서](https://developers.cloudflare.com/pages/get-started/direct-upload/)를 확인했다.

## 게시 파일과 일치 확인

HTML, `assets/afterglow-three.js`, `assets/afterglow-garden.js`, Three.js 라이선스 두 파일, Newsreader WOFF2·라이선스·출처 기록을 포함해 8개 파일, 총 693,423바이트를 준비했다. 준비 파일과 작업 파일의 SHA-256을 대조한 후 그 폴더만 업로드했다. 개발 의존성·인증 정보·옛 ZIP·테스트 캡처는 사이트 업로드에 포함하지 않았다.

- 고정 배포 주소의 8개 응답은 HTTP 200이며 전부 준비 파일과 SHA-256이 같다.
- 공개 도메인의 두 JS, WOFF2, 라이선스·출처 파일도 HTTP 200이며 SHA-256이 같다. JavaScript와 WOFF2의 Content-Type도 확인했다.
- 공개 도메인의 HTML 차이는 `<body>` 직후 Cloudflare의 숨겨진 `/cdn-cgi/content` 링크와 마지막 `/cdn-cgi/challenge-platform` 로더 두 부분뿐이다. 해당 두 부분만 제외하면 로컬 HTML과 완전히 일치한다. 보안 설정을 끄거나 우회하지 않았다.
- 무작위 쿼리를 붙여 캐시를 우회하지 않고 기본 공개 주소에서 확인했다.

[응답 대조 기록](../../assets/verification/2026-09-06-production/integrity.json)

## 브라우저 확인

배포 전 재빌드와 런타임 guard, 단위 13개·브라우저 24개가 통과했다. 게시 후 다음 명령으로 **공개 도메인에서 브라우저 24개를 다시 실행해 모두 통과**했다(약 1.6분).

```bash
AFTERGLOW_BASE_URL=https://dayoff.tmcowork.com AFTERGLOW_EVIDENCE_DIR=assets/verification/2026-09-06-production npx playwright test
```

확인 범위는 두 장면과 Three.js 로딩, 30초 실제 플레이·수집·완료·재시작, 손길별 꽃 모양, GPU 장애와 번들 실패 대체 표시, 모바일 및 데스크톱 사이트 모드의 픽셀 예산, 회전 후 PNG 비율 유지, 일시정지·숨김·결과에서 렌더링 정지, 모션 줄이기, 소리, 공유 파일 포함·취소·복사 실패·새 탭 차단이다. 외부 앱과 네이티브 공유는 모의 처리했으며 실제 게시나 메시지를 보내지 않았다.

공개 도메인에서 데스크톱 60fps 플레이를 관찰했다. 이 결과는 해당 브라우저와 측정 구간에 한정되며, Galaxy S24 실기기 발열이나 장시간 GPU 부하를 증명하지 않는다. S24 실기기 열 검증과 작품별 복원 링크는 아직 별도 작업이다.

[공개 첫 화면](../../assets/verification/2026-09-06-production/desktop-paper.png) · [모바일 결과](../../assets/verification/2026-09-06-production/mobile-result.png) · [실제 모바일 PNG](../../assets/verification/2026-09-06-production/mobile-paper-gesture-sky.png)

## 배포 이후 기록

이 문서와 README·세션 허브·공개 검증 캡처를 저장하는 후속 커밋은 런타임 파일을 바꾸지 않는다. 따라서 Pages의 source ref는 `3d4d23b`로 유지하며 문서만을 위해 중복 배포하지 않는다. 기존 `afterglow-static-html.zip`은 예전 파일 그대로다.
