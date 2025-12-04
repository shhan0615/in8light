# IN8LIGHT Netlify 배포 가이드

## 📋 개요

IN8LIGHT v0.8.0부터 실제 AI 엔진(Anthropic Claude API)을 사용하여 더 정확하고 상세한 답변을 제공합니다. API 키는 Netlify Functions를 통해 안전하게 관리됩니다.

---

## 🚀 Netlify 배포 방법

### 1단계: GitHub 저장소 생성 (선택사항)

```bash
# GitHub에 저장소 생성 후
git init
git add .
git commit -m "Initial commit - v0.8.0"
git remote add origin https://github.com/your-username/in8light.git
git push -u origin main
```

### 2단계: Netlify에 배포

**방법 A: GitHub 연동 (권장)**

1. [Netlify](https://www.netlify.com) 로그인
2. "Add new site" → "Import an existing project"
3. GitHub 연동 선택
4. 저장소 선택
5. 빌드 설정:
   - Build command: `echo 'No build required'`
   - Publish directory: `.` (현재 디렉토리)
   - Functions directory: `netlify/functions`
6. "Deploy site" 클릭

**방법 B: 직접 업로드**

1. [Netlify](https://www.netlify.com) 로그인
2. "Add new site" → "Deploy manually"
3. 프로젝트 폴더를 드래그 앤 드롭
4. 배포 완료

### 3단계: Anthropic API 키 발급

1. [Anthropic Console](https://console.anthropic.com) 접속
2. 계정 생성/로그인
3. Settings → API Keys
4. "Create Key" 클릭
5. API 키 복사 (한 번만 표시됨!)

### 4단계: Netlify 환경변수 설정

1. Netlify 대시보드에서 배포한 사이트 선택
2. **Site settings** → **Environment variables** 메뉴
3. **Add a variable** 클릭
4. 다음 정보 입력:
   - **Key**: `ANTHROPIC_API_KEY`
   - **Value**: (복사한 API 키 붙여넣기)
   - **Scopes**: Production, Deploy Preview, Branch deploys 모두 체크
5. **Save** 클릭

### 5단계: 사이트 재배포

환경변수 설정 후 사이트를 재배포해야 합니다:

1. Netlify 대시보드 → **Deploys** 탭
2. **Trigger deploy** → **Deploy site** 클릭
3. 배포 완료 대기 (1-2분 소요)

---

## ✅ 배포 확인

### 1. 사이트 접속

배포 완료 후 Netlify가 제공한 URL로 접속:
- 예: `https://your-site-name.netlify.app`

### 2. AI 상담 테스트

1. 홈 화면에서 **AI 상담** 메뉴 선택
2. 질문 입력 (예: "당근은 금양 체질에 좋은가요?")
3. 전송 버튼 클릭
4. AI 응답 확인

### 3. 콘솔 로그 확인

브라우저 개발자 도구 (F12) → Console 탭:
- ✅ 성공 시: `✅ Netlify Function 응답 성공`
- ❌ 실패 시: `⚠️ Netlify Function 호출 실패, 로컬 응답으로 전환`

### 4. Netlify Function 로그 확인

Netlify 대시보드 → Functions → ai-chat:
- 요청 횟수 확인
- 에러 로그 확인
- 실행 시간 확인

---

## 🔧 문제 해결

### 문제 1: "API 키가 설정되지 않았습니다" 오류

**원인**: Netlify 환경변수가 설정되지 않음

**해결방법**:
1. Netlify 대시보드 → Site settings → Environment variables
2. `ANTHROPIC_API_KEY` 변수 확인
3. 없으면 추가 (위의 "4단계" 참조)
4. 사이트 재배포

### 문제 2: "로컬 응답으로 전환" 메시지

**원인**: Netlify Function 호출 실패

**해결방법**:
1. Netlify 대시보드 → Functions → ai-chat 확인
2. 함수가 정상 배포되었는지 확인
3. netlify.toml 파일 확인
4. netlify/functions/ai-chat.js 파일 존재 확인

### 문제 3: CORS 오류

**원인**: Functions 라우팅 문제

**해결방법**:
1. netlify.toml 파일 확인:
```toml
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```
2. 사이트 재배포

### 문제 4: "Function not found" 오류

**원인**: Functions 디렉토리 경로 문제

**해결방법**:
1. netlify.toml 확인:
```toml
[functions]
  directory = "netlify/functions"
```
2. ai-chat.js 파일이 `netlify/functions/` 안에 있는지 확인
3. 사이트 재배포

---

## 💰 비용 관리

### Anthropic API 요금

- Claude Sonnet 4: $3 / 1M input tokens, $15 / 1M output tokens
- 평균 대화: 약 1,000 tokens (입력 + 출력)
- 100회 대화: 약 $0.18

### 예상 월 비용

| 일일 사용자 | 일일 대화 | 월 비용 (예상) |
|------------|----------|--------------|
| 10명 | 50회 | $2.70 |
| 50명 | 250회 | $13.50 |
| 100명 | 500회 | $27.00 |

### 비용 절감 팁

1. **max_tokens 조절**: 현재 2048로 설정, 필요시 조절
2. **대화 이력 제한**: 현재 최근 10개로 제한
3. **캐싱 활용**: Anthropic API의 prompt caching 기능 활용
4. **사용량 모니터링**: Anthropic Console에서 실시간 모니터링

---

## 📊 모니터링

### Netlify 대시보드

- **Functions 탭**: 함수 호출 횟수, 실행 시간
- **Logs 탭**: 실시간 로그 확인
- **Analytics 탭**: 사이트 방문자 통계

### Anthropic Console

- **Usage 탭**: API 사용량, 비용
- **Keys 탭**: API 키 관리
- **Logs 탭**: API 요청 로그

---

## 🔐 보안 권장사항

1. **API 키 노출 방지**
   - ❌ 코드에 직접 입력 금지
   - ✅ Netlify 환경변수 사용

2. **Rate Limiting**
   - Netlify Functions는 기본적으로 rate limiting 제공
   - 필요시 추가 제한 구현

3. **CORS 설정**
   - 현재: 모든 도메인 허용 (`Access-Control-Allow-Origin: *`)
   - 프로덕션: 특정 도메인만 허용 권장

4. **로그 모니터링**
   - 비정상적인 트래픽 감지
   - 에러 패턴 분석

---

## 🆕 v0.8.0 변경사항

### 이전 버전 (v0.7.9)
- 클라이언트에서 직접 API 호출
- API 키를 `config.js`에 입력
- 병원 고객들이 개별적으로 API 키 설정 필요

### 현재 버전 (v0.8.0)
- Netlify Functions를 통한 API 호출
- API 키는 Netlify 환경변수로 안전하게 관리
- 병원 고객들은 API 키 설정 불필요
- 더 안전하고 관리하기 쉬움

---

## 📞 지원

**이메일**: infobankadmin@infobank.net

**문제 보고**:
- Netlify 배포 문제: [Netlify Support](https://www.netlify.com/support/)
- API 관련 문제: [Anthropic Support](https://support.anthropic.com/)

---

**마지막 업데이트**: 2025.11.26  
**버전**: 0.8.0
