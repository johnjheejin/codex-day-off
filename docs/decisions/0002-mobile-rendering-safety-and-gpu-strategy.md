# ADR-0002: 모바일 렌더링 안전성과 GPU 전략

- 상태: 적용
- 결정일: 2026-07-13
- 계기: Galaxy S24 · Chrome Beta 데스크톱 사이트 전환 중 발열, 전체 시스템 지연과 System UI 재시작

## 문제

기존 구현은 화면 너비만으로 모바일과 데스크톱을 구분했다. Android의 데스크톱 사이트 요청은 휴대폰에서도 약 980px 가상 뷰포트를 만들 수 있으므로, 실제 터치 기기가 데스크톱 입자 수·생성 주기·DPR 상한을 사용했다.

또한 모든 `resize` 이벤트가 즉시 메인 캔버스, 배경 캔버스, 별과 글로우 스프라이트를 재생성했다. 전체 화면 SVG `feTurbulence`와 `mix-blend-mode`도 별도 합성 비용을 만들었다. 실기기 GPU 로그가 없어 단일 원인으로 확정할 수는 없지만, 이 경로는 반복 대형 할당과 GPU 합성 압박을 만들 수 있으므로 제거 대상으로 판단했다.

## 결정

### 기본 렌더러

Canvas 2D를 기본 렌더러로 유지한다.

현재 장면은 최대 수십 개의 입자, 별, 선으로 구성된다. 병목은 대규모 수치 계산보다 캔버스 버퍼 크기, 반복 할당과 전체 화면 합성에 있었다. 이 규모에서는 WebGL2 또는 WebGPU 파이프라인과 셰이더 관리가 줄여 주는 CPU 작업보다 초기화·호환성·컨텍스트 메모리 비용이 더 크다.

### 모바일 성능 프로필

- CSS 너비가 아니라 `pointer: coarse` 또는 터치 포인트로 휴대폰 성능 경로를 유지한다.
- 일반 휴대폰 레이아웃은 45fps를 목표로 한다.
- 터치 기기에서 뷰포트 너비가 760px를 넘으면 데스크톱 사이트 안전 경로로 보고 30fps를 목표로 한다.
- 대기·결과 화면은 터치 기기에서 12fps로 제한한다.
- 터치 기기 캔버스는 150만 픽셀, 일반 데스크톱은 320만 픽셀 예산 안에서 DPR을 계산한다.
- resize는 180ms 디바운스하며, 크기가 같으면 버퍼를 다시 만들지 않는다.
- 새 배경 버퍼를 만들기 전에 이전 버퍼를 1×1로 축소해 메모리 피크를 낮춘다.
- 글로우 스프라이트는 resize마다 다시 만들지 않는다.
- 전체 화면 procedural grain과 blend 레이어를 제거한다.
- 터치 환경에서는 `desynchronized` Canvas 2D 힌트를 사용하지 않는다.
- 페이지가 숨겨지거나 떠날 때 프레임 루프와 대형 배경 버퍼를 해제한다.

### 그래픽 품질

성능 저하는 다음 순서로 적용한다.

1. 전체 캔버스 내부 픽셀 수
2. 장식 합성 레이어
3. 대기 화면 프레임 빈도
4. 터치 데스크톱 사이트의 플레이 프레임 빈도

꽃의 형태, 다섯 이벤트 색상, 수집 피드백과 결과 장면 구성은 유지한다. 일반 모바일에서는 30fps로 일괄 하향하지 않고 45fps를 목표로 한다.

## WebGL2·WebGPU·GPGPU 평가

### WebGPU

Android 12 이상의 Qualcomm·ARM GPU를 사용하는 Chrome에서는 Chrome 121부터 WebGPU가 기본 활성화됐다. 2026년 Chrome 146은 Android에서 OpenGL ES 3.1 기반 compatibility mode도 도입했다.

장점:

- 입자 수가 수백~수천 개로 증가할 때 compute shader로 위치 갱신 가능
- CPU draw-call 비용 감소
- 후처리와 대규모 GPGPU 확장에 적합

현재 채택하지 않는 이유:

- WebGPU는 여전히 모든 주요 브라우저에서 Baseline이 아니다.
- Samsung Internet Android가 같은 기능을 공식 보장한다는 문서를 확인하지 못했다.
- GPU 장치 초기화·파이프라인·device loss 처리와 fallback이 단일 HTML 프로젝트의 코드와 테스트 범위를 크게 늘린다.
- 이번 사고는 계산량보다 버퍼 크기와 반복 할당이 핵심 위험이다. WebGPU로 옮겨도 무제한 텍스처와 resize 재할당은 같은 문제를 만든다.

### WebGL2

WebGPU보다 폭넓은 fallback 후보지만, 현재의 소규모 2D 선화에는 셰이더·버퍼·컨텍스트 복구 비용이 크다. GPU 컨텍스트 손실 대응과 Canvas 2D 결과 이미지 생성 경로를 이중 관리해야 한다.

### 전환 조건

다음 중 하나가 실제 제품 목표가 될 때 별도 실험 브랜치에서 WebGPU compatibility mode를 평가한다.

- 동시에 움직이는 입자 500개 이상
- bloom 후처리, 유체장 또는 수천 개의 연결선
- 사용자 입력을 기반으로 한 실시간 생성 모델이나 대규모 GPGPU 계산
- Canvas 2D가 픽셀 예산을 지킨 상태에서도 목표 기기에서 30fps를 지속적으로 달성하지 못함

실험 렌더러는 feature detection과 Canvas 2D fallback을 필수로 하며, 모바일에서 자동 활성화하지 않는다.

## 출처

- Chrome Android 데스크톱 모드와 980px 뷰포트: <https://developer.chrome.com/blog/desktop-mode>
- Android WebGPU 기본 지원: <https://developer.chrome.com/blog/new-in-webgpu-121>
- Chrome 146 compatibility mode: <https://developer.chrome.com/blog/new-in-webgpu-146>
- WebGPU 제한적 가용성 및 GPGPU 개요: <https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API>
- Android 렌더러 종료와 메모리 회수: <https://developer.android.com/develop/ui/views/layout/webapps/managing-webview>

## 검증 한계

브라우저 자동화로 레이아웃, 캔버스 크기, 테마, 30초 완료와 콘솔 오류를 확인할 수 있지만 Galaxy S24의 실제 열·GPU 드라이버·System UI 상태를 재현하지 않는다. 배포 전후 Chrome Beta와 Samsung Internet의 실기기 확인은 안전한 일반 모바일 모드에서 한 번씩 수행한다. 데스크톱 사이트 재현은 긴급 패치가 배포된 뒤에도 선택 사항이며 필수 검증으로 요구하지 않는다.
