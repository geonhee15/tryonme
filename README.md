# TRYONME

프롬프트 말고. 사진 한 장 올리고, **진짜 제품**을 골라 그대로 입어보는 가상 피팅.

다른 AI 트라이온 사이트들이 "이 사람한테 검은 셔츠 입혀줘" 같은 텍스트 프롬프트로 옷을 생성하는 것과 달리, TRYONME은 실제 브랜드의 실제 제품을 카탈로그에서 골라 그대로 입혀줍니다. 여러 벌 동시 선택도 가능하고, 카탈로그에 없는 옷은 프롬프트로도 추가할 수 있어요.

🌐 **Live: [tryonme.kimkim.io](https://tryonme.kimkim.io)**

## 어떻게 쓰나요

1. 전신 사진을 올리세요 (드래그 또는 클릭).
2. 카탈로그에서 원하는 상의를 골라요. 여러 개 선택 가능.
3. 카탈로그에 없으면 직접 설명도 OK.
4. **입혀보기** 버튼을 누르면 합성된 결과가 나옵니다.

## AI 엔진

기본은 **FASHN AI · `tryon-v1.6`** — 2025–2026 현재 시점의 SOTA 가상 피팅 모델입니다. (대안: Replicate IDM-VTON, fal.ai OOTDiffusion 등도 함수 시그니처 호환.)

- 우측 상단의 ⚙ **AI 설정** 버튼 → FASHN API 키 입력 → localStorage에 저장 (서버 미경유).
- 키 없으면 자동으로 **데모 모드**로 폴백 (사진 + 제품 썸네일 캔버스 합성).
- 여러 벌 선택 시 직렬 체이닝: 1번 옷 → 그 결과 위에 2번 옷 → ...

키 발급: [app.fashn.ai/api](https://app.fashn.ai/api)

## 카탈로그 (169 제품)

| 브랜드 | 수 |
|---|---|
| Uniqlo | 100 |
| Nike | 13 |
| Stüssy | 12 |
| BAPE | 8 |
| Aimé Leon Dore | 8 |
| Haven | 8 |
| Reigning Champ | 8 |
| Kith | 6 |
| Dover Street Market | 6 |

> ⓘ Adidas / Gucci는 적극적인 봇 보호로 직접 스크래핑이 어려워 다음 라운드(공식 API 또는 헤드리스 브라우저 경유)에서 추가 예정입니다.

모든 제품 이미지는 각 브랜드의 공식 CDN에서 직접 로드합니다.

## 카테고리 현황

- ✅ 상의 (티셔츠, 그래픽티, 후디, 셔츠, 폴로, 자켓, 코트, 니트 등)
- ⏳ 하의
- ⏳ 신발
- ⏳ 안경

## 로컬에서 띄우기

```bash
python3 -m http.server 5188
# → http://localhost:5188
```

`index.html` 한 장에 React/Babel CDN. 빌드 단계 없음.

## 배포

`tryonme.kimkim.io` 서브도메인 — 정적 호스팅 (GitHub Pages / Cloudflare Pages 등 어디든 OK).

## 참고

- UI 스타일: [대신콜](https://daesincall.jocoding.io/)의 디자인 언어 (warm cream + coral accent + Pretendard).
- 카탈로그 소스: Uniqlo Korea API, Nike US/KR `__NEXT_DATA__`, 각 브랜드의 Shopify `/products.json`.
