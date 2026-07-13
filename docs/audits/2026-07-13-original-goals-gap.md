# 초기 목표 대비 구현 갭 — 2026-07-13

## 확인 범위

- 최초 커밋 `0b93ef0`
- 전체 14개 커밋 이력
- `EVENT.md`, `SUBMISSION.md`, `README.md`, `DESIGN.md`
- 기존 디자인 리뷰와 최종 QA
- 7월 11일 프로젝트 회고

## 구현 완료

| 초기 방향 | 현재 상태 | 근거 |
| --- | --- | --- |
| Codex에게 결과물이 없는 짧은 휴가 제공 | 완료 | 60초에서 30초로 정제된 핵심 경험 |
| 마우스·키보드 조작 | 완료 | cursor, arrow/WASD |
| 모바일 터치 조작 | 완료 | press-and-drag, pointer capture |
| 수집 결과가 개인화된 장면으로 남음 | 완료 | bloom 위치와 수량, 결과 문장·pace |
| 설치·로그인·API 키 없는 공개 데모 | 완료 | 단일 HTML, Cloudflare Pages |
| 결과 이미지와 소셜 공유 | 완료 | 1200×630 PNG, native/LinkedIn/X/Telegram/KakaoTalk handoff |
| 디자인 기준의 외부 문서화 | 완료 | `DESIGN.md`와 프로젝트 로컬 OmD 파일럿 |

## 부분 구현 또는 새로 드러난 갭

| 항목 | 판단 | 다음 결정 |
| --- | --- | --- |
| 기기별 성능 안전성 | ADR-0002 보호장치 적용 완료, 실기기 재확인 필요 | Chrome Beta·Samsung Internet 일반 모바일 모드 확인 |
| 밝은 플레이 화면 | `Light field / Night field` 구현 완료 | 실제 Galaxy S24 대비와 가독성 확인 |
| 관찰 가능성과 평가 기준 | `?debug=1`, 픽셀 예산·목표 FPS 명문화 완료; 자동 회귀 기준 없음 | 콘솔 오류와 예산을 자동 검증에 추가 |
| 정적 HTML 제출 번들 | 루트 ZIP이 6월 18일 구버전 | 최신 커밋으로 재생성하거나 저장소에서 제외 |
| GitHub 프로젝트 설명 | 30초 설명과 라이브 주소로 변경 완료 | 유지 |
| 제출 완료 기록 | `SUBMISSION.md` 체크리스트 다수가 미완료 | 제출 여부를 사실 기준으로 정리 |
| 실기기 브라우저 매트릭스 | 390×844 자동 검증은 있으나 Chrome Beta 데스크톱 사이트와 Samsung Internet이 빠짐 | Chrome Stable/Beta와 Samsung Internet 일반 모바일 모드 확인 |

## 아이디어였지만 프로젝트 요구로 확정되지 않은 항목

- WebGPU/GPGPU 렌더러
- 음성·음악·실시간 API를 결합한 멀티모달 경험
- 여러 에이전트가 역할을 나누는 제작 워크플로
- 사용자 계정, 기록 저장 또는 장기적인 개인화

이 항목들은 `SUBMISSION.md`에서 향후 워크숍 관심사로 언급됐거나 대화에서 탐색된 방향이다. 현재 Afterglow의 필수 기능으로 약속된 기록은 찾지 못했다. 특히 WebGPU는 기술적 흥미와 별개로 현재 장면의 성능 문제를 직접 해결하는 기본 선택이 아니다.

## 권장 로드맵

1. Chrome Beta·Samsung Internet 실기기 확인
2. 구버전 ZIP 정리
3. 대표 스크린샷과 시각 이력 유지
4. 제출 상태와 행사 결과를 프로젝트 연대기에 확정 기록
5. 그 뒤에만 WebGPU 실험, 사운드 또는 멀티모달 확장을 별도 브랜치에서 평가
