# 2026-09-06 라이브 하늘과 기본 소리

완성 결과에서 Explore sky를 열면 Touch the sky / Turn in 3D 모드로 원래 꽃과 연결선을 탐색한다. 화면상의 가까운 꽃에만 반응하며, 회전은 공유하는 YXZ 월드 행렬을 적용한다. 별도 보기 복사본을 사용하므로 원래 꽃 데이터와 PNG는 변하지 않는다. Canvas 대체 렌더러도 같은 행렬·꽃 곡선을 사용한다.

## 확인 결과

- 런타임 guard + 단위 16개 + Chrome Beta 브라우저 28개 통과(총 44개). 최종 캡처에서 라이브 뷰 4개를 다시 확인했다. 후속 4K 회전 검사 1개가 추가로 통과해 현재 검사 범위는 총 45개다. 큰 화면에서는 카메라 깊이 범위를 뷰포트에 맞춰 가장자리 꽃이 잘리지 않게 한다.
- 포인터 반응, 드래그 회전, 방향키·R·Escape, 초점 복귀, 원본 객체와 PNG 주소 보존을 검사했다.
- 320×568 터치·DPR 3 환경에서 네 조작부가 모두 화면 안에 있고 44px 이상이다. 모바일 캡처에서 상단 제목 겹침을 찾아 교정했다.
- 입력 복귀 후 프레임 수가 더 늘지 않는다. 모션 줄이기에서 자동 흔들림 없이 직접 회전 가능하며 숨김 상태는 렌더링하지 않는다.
- GPU 컨텍스트 손실 후 같은 작품을 Canvas로 계속 회전할 수 있다. 터치 렌더 버퍼는 150만 픽셀 이내이며 활성 전체 화면 버퍼는 하나다.
- 첫 방문 소리는 켜져 있지만 시작 전 AudioContext는 생성하지 않는다. 시작 후 수집 음이 재생되고, 음소거 시 엔진을 해제한다. 직접 끈 선택은 새로고침 후에도 유지한다. localStorage 차단 시에도 진입 가능하다.
- 기존 `afterglow-sound`는 기본값까지 저장해 의도를 구별할 수 없으므로 새 `afterglow-sound-preference`에는 사용자 조작만 저장한다. 기존 자동 음소거는 이 업데이트의 기본값으로 초기화된다.
- 공유 API와 외부 팝업은 모의 처리했다. 실제 외부 게시나 메시지는 보내지 않았다.

## 캡처

[Night touch](../../assets/verification/2026-09-06-living-sky/night-live-touch.png) · [Night 3D](../../assets/verification/2026-09-06-living-sky/night-live-turned.png) · [모바일 Night](../../assets/verification/2026-09-06-living-sky/mobile-night-turned.png) · [모바일 Paper](../../assets/verification/2026-09-06-living-sky/mobile-paper-live.png) · [Canvas 대체 표시](../../assets/verification/2026-09-06-living-sky/mobile-paper-canvas-live.png)

## 범위

라이브 뷰는 현재 완료한 페이지 안에서 동작한다. 새로고침 후 복원과 작품별 라이브 공유 링크는 아직 구현하지 않았다. 실제 Galaxy S24 온도·전력·장시간 GPU 부하는 별도 검증이 필요하다. 자동화 Chromium 결과를 실기기 열 안정성으로 해석하지 않는다.

공개 상태와 실제 CI 실행은 [배포 운영 문서](../deployment.md)를 따른다.
