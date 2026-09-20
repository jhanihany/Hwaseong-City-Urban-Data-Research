# 화성시 어린이 안전지도 웹

기본 화면에 **인터랙티브 어린이 안전지도**가 표시되고, 상단 리본 메뉴의 **발표 포스터 원본 보기** 버튼으로 포스터 뷰어를 전환할 수 있는 GitHub Pages용 정적 웹사이트입니다.

## 구성

```text
index.html
style.css
script.js
map.html
assets/
  poster.webp
  original.pdf
```

## 주요 기능

- 첫 화면: 화성시 어린이 안전지도
- 지도 핀 hover / 모바일 tap: 지역별 분석 결과 팝업
- 상단 리본 메뉴에서 `안전지도` / `발표 포스터 원본 보기` 전환
- 포스터 확대·축소, 화면 맞춤, 스크롤
- 원본 PDF 새 탭 열기
- 모바일 대응

## 배경지도

현재 `map.html`은 별도의 API 키가 필요하지 않는 OpenStreetMap Deutschland 타일을 사용하도록 구성했습니다.

이 타일 서비스는 비상업적이고 트래픽이 크지 않은 공개 웹 사용을 전제로 사용하세요. 향후 트래픽이 커지거나 상용 서비스로 전환하면 상용 지도 타일 공급자를 사용하는 것이 안전합니다.

## GitHub Pages

저장소 루트에 위 파일들을 그대로 업로드한 뒤:

1. `Settings`
2. `Pages`
3. `Deploy from a branch`
4. `main`
5. `/(root)`

를 선택하면 됩니다.
