# in8 - 8체질 진단 시스템 (v0.8.91)

개인의 체질에 따른 음식 선호도와 소화 능력을 분석하여 8가지 체질(목양, 목음, 금양, 금음, 토양, 토음, 수양, 수음) 중 가장 적합한 체질을 찾아드리는 웹 애플리케이션입니다.

## 📋 목차

- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [설치 및 실행](#설치-및-실행)
- [Firebase 설정](#firebase-설정)
- [Kakao 설정](#kakao-설정)
- [사용 방법](#사용-방법)
- [관리자 기능](#관리자-기능)
- [배포](#배포)
- [라이선스](#라이선스)

## 🌟 주요 기능

### 사용자 기능
- 🏠 **새로운 홈 화면**: 직관적인 네비게이션과 모던한 디자인 ⭐ NEW (v1.3)
- 📱 **하단 탭 네비게이션**: 설문, 식단, 마켓, 마이 메뉴 빠른 접근 ⭐ NEW (v1.3)
- 🤖 **AI 상담 챗봇**: 8체질 관련 질문에 AI가 실시간 답변 ⭐ NEW (v0.7.1)
- 📋 **게시판**: 사용자 질문 및 답변 게시판 (구 질문하기)
- 🍔 **서랍 메뉴**: 햄버거 메뉴를 통한 전체 기능 접근 ⭐ NEW (v1.3)
- ✅ **간편 로그인**: 이름과 이메일만 입력하면 바로 시작
- 📱 **카카오 로그인**: 카카오 계정으로 간편하게 로그인
- 📝 **16개 질문**: 음식 선호도 기반 체질 진단
- 📊 **실시간 결과**: 체질별 점수와 상세 정보 제공
- 🍽️ **맞춤 정보**: 체질에 맞는 음식과 운동 추천
- 📋 **검사 이력**: 과거 진단 결과 조회
- 💬 **카카오톡 공유**: 진단 결과를 카카오톡으로 공유
- 🔐 **회원탈퇴**: 사용자 데이터 완전 삭제

### 관리자 기능
- 👥 **회원 관리**: 전체 사용자 목록 및 통계
- 🔍 **회원 검색**: 이름, 이메일, 체질로 실시간 검색 ⭐ NEW (v0.7.0)
- ⏰ **실시간 시간**: 한국 시간대(KST) 기준 정확한 접속/설문 시간 표시 ⭐ NEW (v0.7.0)
- 📊 **통계 분석**: 체질별 분포 및 진단 통계
- 📁 **엑셀 관리**: 설문 데이터 엑셀 업로드/관리

## 🛠 기술 스택

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Responsive Design (Mobile-first)

### Backend & Database
- Firebase Authentication (사용자 인증)
- Firebase Firestore (NoSQL 데이터베이스)
- Firebase Hosting (배포)

### External APIs
- Kakao JavaScript SDK (카카오 로그인 및 공유)
- SheetJS (엑셀 파일 처리)

## 📁 프로젝트 구조

```
in8_1.3/
├── index.html              # 스플래시 화면
├── home.html              # 새로운 홈 화면 ⭐ NEW
├── main.html              # 기존 메인 화면 (로그인/설문)
├── about.html             # 앱 정보
├── terms.html             # 이용약관
├── privacy.html           # 개인정보처리방침
├── css/
│   ├── styles.css         # 공통 스타일시트
│   └── home.css          # 홈 화면 스타일 ⭐ NEW
├── js/
│   ├── config.js          # Firebase & Kakao 설정 (v1.3)
│   ├── firebase-service.js # Firebase 관련 함수
│   ├── kakao-service.js   # Kakao 관련 함수
│   ├── auth.js            # 인증 관리
│   ├── survey.js          # 설문 관리
│   ├── admin.js           # 관리자 기능
│   ├── main.js            # 메인 로직
│   ├── home.js            # 홈 화면 로직 ⭐ NEW
│   └── security.js        # 보안 관련 함수
├── data/
│   └── constitution-info.js # 체질 정보 데이터
├── images/
│   └── share-image.png    # 공유용 이미지
├── changelog.md           # 변경 이력
├── .gitignore             # Git 제외 파일 목록
└── README.md              # 프로젝트 문서
```

## 🚀 설치 및 실행

### 1. 저장소 클론

```bash
git clone https://github.com/yourusername/in8.git
cd in8
```

### 2. Firebase 프로젝트 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. 웹 앱 추가 및 구성 정보 복사
3. `js/config.js` 파일의 `firebaseConfig` 수정

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 3. Kakao Developers 설정

1. [Kakao Developers](https://developers.kakao.com/)에서 앱 생성
2. JavaScript 키 복사
3. `js/config.js` 파일의 `KAKAO_APP_KEY` 수정

```javascript
const KAKAO_APP_KEY = "YOUR_KAKAO_APP_KEY";
```

### 4. 로컬 서버 실행

```bash
# Python 3
python -m http.server 8000

# Node.js (http-server)
npx http-server -p 8000

# VS Code Live Server 확장 프로그램 사용
```

브라우저에서 `http://localhost:8000` 접속

## 🔥 Firebase 설정

### Authentication 활성화

1. Firebase Console > Authentication > Sign-in method
2. 이메일/비밀번호 및 Google 제공업체 활성화

### Firestore Database 생성

1. Firebase Console > Firestore Database
2. 데이터베이스 만들기 (테스트 모드로 시작)

### Firestore 보안 규칙

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 데이터
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 진단 결과
    match /surveys/{surveyId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     request.resource.data.userId == request.auth.uid;
    }
    
    // 관리자 전용
    match /admin/{document=**} {
      allow read, write: if request.auth != null && 
        request.auth.token.email in ['admin@in8.com', 'shhan@infobank.net'];
    }
  }
}
```

## 📱 Kakao 설정

### 앱 설정

1. Kakao Developers > 내 애플리케이션
2. 앱 설정 > 플랫폼 > Web 플랫폼 등록
3. 사이트 도메인 등록 (예: `http://localhost:8000`, `https://yourdomain.com`)

### 카카오 로그인 활성화

1. 제품 설정 > 카카오 로그인 활성화
2. Redirect URI 설정
3. 동의항목 설정:
   - 닉네임 (필수)
   - 프로필 사진 (선택)
   - 카카오계정(이메일) (선택)

## 📖 사용 방법

### 일반 사용자

1. **로그인**
   - 간편 로그인: 이름만 입력
   - 카카오 로그인: 카카오 계정으로 로그인

2. **체질 진단**
   - 16개 음식 선호도 질문에 답변
   - 각 질문당 3개 옵션 중 선택

3. **결과 확인**
   - 8가지 체질 중 가장 높은 점수의 체질 확인
   - 체질별 특성, 좋은 음식/운동, 피해야 할 음식/운동 확인

4. **결과 공유**
   - 카카오톡으로 진단 결과 공유
   - 검사 이력 조회

### 관리자

1. **로그인**
   - 이름에 "admin" 입력하여 관리자 모드 접속

2. **엑셀 관리**
   - 새로운 설문 데이터 엑셀 업로드
   - 현재 설문 정보 확인

3. **회원 관리**
   - 전체 사용자 목록 조회
   - 로그인 유형별 통계

4. **결과 통계**
   - 체질별 분포 차트
   - 가장 많은 체질 확인

## 🔧 주요 함수 설명

### Firebase Service (`firebase-service.js`)
- `saveUserProfile()`: 사용자 프로필 저장
- `getUserProfile()`: 사용자 프로필 조회
- `saveSurveyResult()`: 진단 결과 저장
- `getUserSurveyHistory()`: 사용자 진단 이력 조회
- `getSurveyStatistics()`: 전체 통계 조회

### Kakao Service (`kakao-service.js`)
- `kakaoLogin()`: 카카오 로그인
- `sendKakaoMessage()`: 카카오톡 메시지 전송
- `copyResultForKakao()`: 결과 클립보드 복사

### Auth (`auth.js`)
- `simpleLogin()`: 간편 로그인
- `logout()`: 로그아웃
- `updateUserInfo()`: 사용자 정보 UI 업데이트

### Survey (`survey.js`)
- `displayQuestion()`: 질문 표시
- `selectOption()`: 옵션 선택
- `completeSurvey()`: 설문 완료
- `calculateResults()`: 결과 계산
- `displayResults()`: 결과 표시

## 🌐 배포

### Firebase Hosting

```bash
# Firebase CLI 설치
npm install -g firebase-tools

# Firebase 로그인
firebase login

# 프로젝트 초기화
firebase init hosting

# 배포
firebase deploy
```

### GitHub Pages

```bash
# gh-pages 브랜치 생성 및 배포
git checkout -b gh-pages
git push origin gh-pages
```

Settings > Pages에서 gh-pages 브랜치 선택

## 🔒 보안

- 우클릭 방지 및 F12 개발자 도구 접근 제한
- Firebase Security Rules 적용
- API 키는 환경 변수로 관리 (`.env` 파일 사용 권장)

## 🐛 문제 해결

### Firebase 연결 오류
- `js/config.js`에서 Firebase 설정 확인
- Firebase Console에서 도메인 허용 목록 확인

### Kakao 로그인 오류
- Kakao Developers에서 JavaScript 키 확인
- 플랫폼 설정에서 사이트 도메인 확인

### CORS 에러
- 로컬 서버 사용 (`http://localhost` 대신)
- Firebase Hosting 또는 다른 호스팅 서비스 사용

## 📝 버전 히스토리

- **v0.7** (2025.10.26)
  - Firebase 통합
  - 카카오 로그인 추가
  - 소스 코드 모듈화

- **v0.5** (2025.10.15)
  - 간편 로그인 기능

- **v0.1** (초기 버전)
  - 기본 체질 진단 기능

## 👥 기여

버그 제보 및 기능 제안은 [Issues](https://github.com/yourusername/in8/issues)에 등록해주세요.

## 📄 라이선스

Copyright © 2025 Infobank. All rights reserved.

## 📧 문의

- 이메일: shhan@infobank.net
- 웹사이트: [in8](https://yourwebsite.com)

---

**Made with ❤️ by Infobank**
