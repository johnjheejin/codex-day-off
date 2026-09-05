# 첫 화면 타이포와 구성 검토

사용자가 “Close the tabs. Open the sky.”가 익숙한 Codex 데모처럼 보이며 디자인 완성도를 검토해 달라고 한 피드백을 반영했다. 이는 브랜드와 타이포 방향에 대한 사용자 수정 요청으로 적용했으며, 추가 스킬이나 에이전트를 사용하지 않았다.

## 판단

기존안은 정렬과 대비가 정돈돼 있었지만, 같은 크기의 두 문장과 검정/회색 분리, 추상적인 eyebrow, 화살표만 있는 채팅 입력창형 시작 행동이 겹쳤다. 문장의 의미보다 범용 제품 랜딩 페이지의 형식이 먼저 보였다. 이는 시각적 판단이며 사용자 조사 결과로 주장하지 않는다.

이번에는 첫 문장을 작은 산세리프 도입으로 낮추고 `Open the / sky.`를 큰 세리프 제목으로 구분했다. 둘째 줄을 조금 안으로 들여 리듬을 만들고 꽃 선과 서체 곡선의 관계를 강조했다. 회색으로 반복하는 제목 강조와 일반적인 promotional eyebrow를 없앴다. 본문·버튼·결과 페이지에는 기존 산세리프를 유지한다.

시작 영역은 `Begin day off →`라는 명확한 버튼과 별도의 30초 안내로 바꿨다. “화살표를 보내는 입력창”처럼 읽힐 필요가 없는 실제 동작에 맞춘 것이다. 새 제목과 동작에 맞게 꽃 캡션과 설명도 짧게 다듬었다. 모바일과 세로 태블릿은 제목→꽃→시작 순서로 배치한다.

서체는 [Production Type의 Newsreader](https://productiontype.com/font/newsreader) Display 400을 사용한다. 공식 배포의 라틴 WOFF2 한 파일(21,704바이트)을 로컬로 포함하고 [출처와 라이선스](../../assets/fonts/README.md)를 보관했다. GPU 효과나 렌더링 루프를 추가하지 않는다.

## 화면 확인

- 1440×900, 768×1024, 390×844, 320×568에서 Night/Paper 화면을 캡처했다.
- 모든 캡처 프로필에서 제목과 화면에 가로 넘침이 없고, 시작 버튼이 첫 화면 안에 들어온다.
- 320px에서는 버튼과 소요 시간 안내가 함께 들어오도록 버튼 내부 여백과 열 간격을 줄였다.
- Newsreader 파일 요청을 차단한 390px 화면에서도 제목과 버튼이 표시되고 가로 넘침이 없다.
- 제목은 스크린리더에서 `Close the tabs. Open the sky.`라는 하나의 heading으로 읽힌다.
- 기존 첫 화면, 모션 줄이기, 꽃의 마우스·키보드 조작, 작은 화면/태블릿 검사를 다시 실행해 4개 모두 통과했다.
- 초기 시안 캡처에서 Night Sky에 남아 있던 예전 prompt 배경과 태블릿 캡션의 화살표 줄바꿈을 찾아 교정했다. 중복된 옛 prompt와 `h1 em` 스타일도 제거했다.
- runtime guard와 `git diff --check`를 통과했다. 서체·여백 변경에 별도의 구현을 그대로 따라 하는 단위 검사는 추가하지 않았다.

현재 사용자 미리보기 탭에도 새 구성을 반영했다. 로컬 변경이며 공개 배포 전이다. 실제 사용자의 미적 선호나 효과는 후속 피드백으로 확인할 부분이다.

## 캡처

후속 사용자 요청으로 결과·일시정지·공유 제목에도 이 서체와 위계를 확장했다. 이 첫 화면 기록 이후의 범위는 [장면·공유 검토](./2026-09-06-scenes.md)를 따른다.

[이전 데스크톱](../../assets/verification/2026-09-06-intro/desktop-paper-before.png) · [새 데스크톱 Paper Sky](../../assets/verification/2026-09-06-intro/desktop-paper.png) · [새 모바일 Paper Sky](../../assets/verification/2026-09-06-intro/mobile-paper.png) · [320px Night Sky](../../assets/verification/2026-09-06-intro/small-night.png) · [세로 태블릿](../../assets/verification/2026-09-06-intro/tablet-paper.png)

재현: 개발 서버 실행 후 `node scripts/capture-intro.mjs`. 화면과 경계 측정치는 `assets/verification/2026-09-06-intro/`에 저장된다.
