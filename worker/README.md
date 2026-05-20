# tryonme-api — Cloudflare Worker

`tryonme.kimkim.io` 프론트엔드가 호출하는 FASHN AI 프록시. FASHN 키는 Worker 시크릿으로만 보관되어 브라우저에 절대 노출되지 않습니다.

## 한 번만 하는 셋업

```bash
cd worker
npm install
npx wrangler login                            # 브라우저 OAuth
npx wrangler kv:namespace create RATE_LIMIT   # 출력된 id를 wrangler.toml에 붙여넣기
npx wrangler secret put FASHN_API_KEY         # FASHN 키 붙여넣기
npx wrangler deploy
```

배포 후 `tryonme-api.<account>.workers.dev`로 접근 가능합니다. `tryonme-api.kimkim.io` 커스텀 도메인을 붙이려면 CF 대시보드 → Workers & Pages → tryonme-api → Settings → Triggers → Custom Domains에서 추가.

## 엔드포인트

| | |
|---|---|
| `POST /v1/run` | FASHN `/v1/run` 으로 그대로 forward + IP 일일 쿼터 차감 |
| `GET /v1/status/:id` | FASHN `/v1/status/:id` 로 forward (쿼터 영향 X) |
| `GET /v1/quota` | 현재 IP의 잔여 쿼터 조회 |

## 쿼터

기본 IP당 5회/일 (UTC). `src/index.js`의 `DAILY_LIMIT_PER_IP` 조절. 한도 초과 시 429 + 한국어 메시지.

## 비용 감각

- FASHN tryon-v1.6: 1회 ≈ $0.04
- IP당 5회/일 × 30 IP = 하루 약 $6 상한
- 더 빡빡하게 가두려면 KV에 일일 글로벌 카운터 추가하고 cap 두면 됨
