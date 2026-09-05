# ADR-0003: Three.js와 측정 기반 프레임 조절

- 날짜: 2026-09-05
- 상태: 구현 및 공개 배포 완료(2026-09-06). [공개 검증](../verification/2026-09-06-deployment.md). 실기기 열 검증은 별도 미완료.
- 사용자 요청: Three.js로 경험을 발전시키되, 과거 모바일 발열 원인을 조사하고 디바이스별로 높은 프레임을 유지하도록 최적화한다.
- ADR-0002의 Canvas 기본 렌더러와 고정 45/30fps 정책을 대체한다. 픽셀 예산, 리사이즈 디바운스, 백그라운드 중단 원칙은 유지한다.

## 과거 사고에서 확인할 수 있는 범위

Galaxy S24 사고 기록은 데스크톱 사이트 전환 직후 지연·발열·System UI 재시작이 있었다고 기록한다. 당시 코드에는 화면 너비만으로 기기를 분류하는 경로, 연속 resize에서 두 개의 대형 버퍼를 다시 만드는 경로, fullscreen turbulence와 blend 합성이 있었다. 실제 GPU·온도 로그가 없으므로 이 중 하나를 확정 원인이라고 말할 수 없다. 브라우저나 OS 드라이버 결함도 배제할 수 없다.

이번 구현은 확인 가능한 비용 경로를 직접 제한한다. Three.js가 빠르다는 가정만으로 기존 화면을 GPU로 이식하지 않는다.

## 장면과 자원

- 시작 화면은 느리게 회전하는 3D 선화 꽃이다. 플레이 중 loose thoughts는 흰색 결정으로 떠다니고, 수집하면 기존 다섯 색상의 입체 선화 꽃과 짧은 파문이 생긴다.
- 꽃의 4가지 꽃잎 geometry, orbit geometry, seed geometry를 재사용한다. loose thoughts는 한 InstancedMesh로 묶는다. 작은 점들은 고정 용량 버퍼를 갱신한다.
- GPU 렌더러가 활성화되면 입력용 Canvas 2D를 1×1로 축소하고 2D 배경 버퍼를 해제한다. 입력 요소의 CSS 크기와 접근성은 유지한다.
- fullscreen 후처리, render target, 텍스처, 그림자, depth/stencil, MSAA를 사용하지 않는다. `preserveDrawingBuffer`도 꺼 둔다. PNG는 렌더 직후 같은 캔버스를 읽어 만든다.
- resize는 180ms 디바운스하고 같은 크기는 건너뛴다. Three.js의 `setDrawingBufferSize`로 크기와 DPR을 함께 변경한다.
- 터치 기기는 150만 픽셀, 데스크톱은 320만 픽셀 이내다. 최소 DPR 강제를 없애 8K 화면에서도 상한이 유지된다. 정상 모바일은 최대 DPR 2까지 선명도를 사용하되 실제 픽셀 상한이 항상 우선한다.
- 이 상한은 drawing buffer의 픽셀 수다. 브라우저 전체 VRAM 사용량이나 온도의 상한을 보장하는 값은 아니다.

## 프레임 선택

1. 모든 기기는 플레이 60fps로 시작한다. 화면 너비나 터치 여부로 30/45fps를 강제하지 않는다.
2. 플레이의 RAF 간격에서 주사율을 추정한다. CPU 작업의 90백분위와 지원되는 경우 비동기 `EXT_disjoint_timer_query_webgl2` GPU 시간을 수집한다. GPU query는 15 렌더마다 하나, 미완료 query는 최대 4개이며 대기나 `gl.finish`를 하지 않는다.
3. 1.5초 이상·24개 이상의 샘플 창으로 판단한다. 한 번 느린 프레임에 해상도를 바꾸지 않는다.
4. 두 창 연속 부하가 높으면 DPR 배율을 0.15씩, 0.6까지 낮춘다. 그래도 지속되면 프레임을 낮춘다.
5. 세 창 연속 여유가 있으면 높은 주사율을 우선 회복하고, 다음으로 DPR을 0.1씩 회복한다. 프레임 타깃은 화면 주사율의 약수로 선택해 120Hz 화면에서 불규칙한 90fps 간격을 만들지 않는다.
6. GPU 타이머가 없는 브라우저는 CPU와 RAF 간격을 사용한다. GPU 시간은 `n/a`로 표시한다.
7. 대기·결과는 모든 기기에서 12fps 이하이며 타이머로 깨운다. 숨겨진 페이지는 RAF와 idle timer를 취소한다. 입력 보간은 프레임 수가 아닌 경과 시간으로 계산한다.

기기 온도를 직접 측정하지 않는다. CPU/GPU 시간, 지연 프레임, 버퍼 크기와 자원 수를 제한해 불필요한 부하를 줄이는 정책이다. 실제 열 안정성은 실기기에서 별도로 확인해야 한다.

## 실패와 복귀

번들은 프로젝트 안에 고정 버전으로 포함되어 외부 CDN 장애에 의존하지 않는다. 번들 실패, WebGL 초기화 실패, context loss 시 같은 게임 데이터를 Canvas 2D로 이어서 그린다. GPU 오류 뒤 자동 재시도를 반복하지 않는다. 페이지 이탈 시 geometry·material·query·renderer를 해제하고 bfcache 복귀 시 다시 초기화한다. 공유 기능과 Night/Paper 장면은 양쪽 경로에 남는다.

## 근거

- [S24 사고 기록](../incidents/2026-07-13-galaxy-s24-rendering.md)
- [로컬 검증 결과](../verification/2026-09-05-threejs.md)
- [Three.js WebGLRenderer 공식 문서](https://threejs.org/docs/pages/WebGLRenderer.html)
- [Three.js 설치 공식 문서](https://threejs.org/manual/en/installation.html)
