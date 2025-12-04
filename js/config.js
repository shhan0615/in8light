/**
 * in8 - 설정 파일
 * Firebase 및 Kakao SDK 설정
 */

// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyB63_vIokYjKSlDHu36SQmfZG2Zx6J4Lcw",
    authDomain: "in8-diagnosis.firebaseapp.com",
    projectId: "in8-diagnosis",
    storageBucket: "in8-diagnosis.firebasestorage.app",
    messagingSenderId: "471864468565",
    appId: "1:471864468565:web:bdfcb98773863fb41d60dc",
    measurementId: "G-MH4PLL9YP6"
};

// Kakao JavaScript 앱 키
const KAKAO_APP_KEY = "a7fb2ef11d936b855929f90a3de9cfe6"; // 실제 앱 키로 변경 필요

// Anthropic API 키 (AI 챗봇용)
const ANTHROPIC_API_KEY = ""; // Anthropic API 키를 입력하세요. 비워두면 로컬 응답 시스템 사용

// 앱 버전 (전역 변수)
const APP_VERSION = "0.8.91";

// 관리자 UID 목록 (Firebase Authentication UID)
const ADMIN_UIDS = [
    "ADMIN_UID_1", // 실제 관리자 UID로 변경
];

// 관리자 이메일 목록 (간편 로그인용)
const ADMIN_EMAILS = [
    "infobankadmin@infobank.net"
];

// 애플리케이션 설정
const APP_CONFIG = {
    version: "0.8.91",
    releaseDate: "2025.11.27",
    minQuestions: 16,
    maxQuestions: 50,
    enableDebug: true, // 개발 중에는 true, 프로덕션에서는 false
    enableDevTools: false // 개발자 도구(F12, 소스보기) 차단 여부 (디버깅 시 true로 변경)
};

// Firebase 초기화
try {
    firebase.initializeApp(firebaseConfig);
    console.log("✅ Firebase 초기화 완료");
} catch (error) {
    console.error("❌ Firebase 초기화 실패:", error);
}

// Kakao SDK 초기화
// try {
//     if (typeof Kakao !== 'undefined') {
//         Kakao.init(KAKAO_APP_KEY);
//         console.log("✅ Kakao SDK 초기화 완료:", Kakao.isInitialized());
//     } else {
//         console.warn("⚠️ Kakao SDK가 로드되지 않았습니다.");
//     }
// } catch (error) {
//     console.error("❌ Kakao SDK 초기화 실패:", error);
// }
// ===== 카카오 SDK 초기화 (안전한 버전) =====
function initKakaoSDK() {
    if (typeof Kakao === 'undefined') {
        console.warn('⚠️ Kakao SDK가 로드되지 않았습니다.');
        return false;
    }

    // 이미 초기화되었으면 재초기화하지 않음
    if (Kakao.isInitialized()) {
        console.log('ℹ️ Kakao SDK 이미 초기화됨');
        return true;
    }

    // 초기화
    try {
        Kakao.init('a7fb2ef11d936b855929f90a3de9cfe6'); // 실제 앱 키로 변경
        console.log('✅ Kakao SDK 초기화 완료');
        return true;
    } catch (error) {
        console.error('❌ Kakao SDK 초기화 실패:', error);
        return false;
    }
}

// SDK 로드 후 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initKakaoSDK);
} else {
    initKakaoSDK();
}

/**
 * Firebase 설정 가이드:
 * 
 * 1. Firebase Console (https://console.firebase.google.com/) 접속
 * 2. 새 프로젝트 생성 또는 기존 프로젝트 선택
 * 3. 프로젝트 설정 > 일반 > 내 앱 > 웹 앱 추가
 * 4. Firebase SDK 구성 정보 복사하여 위의 firebaseConfig에 붙여넣기
 * 5. Authentication 활성화:
 *    - Firebase Console > Authentication > Sign-in method
 *    - 이메일/비밀번호 및 Google 제공업체 활성화
 * 6. Firestore Database 생성:
 *    - Firebase Console > Firestore Database > 데이터베이스 만들기
 *    - 테스트 모드로 시작 (나중에 보안 규칙 설정)
 * 7. 보안 규칙 설정 (Firestore):
 *    
 *    rules_version = '2';
 *    service cloud.firestore {
 *      match /databases/{database}/documents {
 *        // 사용자 데이터
 *        match /users/{userId} {
 *          allow read, write: if request.auth != null && request.auth.uid == userId;
 *        }
 *        
 *        // 진단 결과
 *        match /surveys/{surveyId} {
 *          allow read: if request.auth != null;
 *          allow write: if request.auth != null && request.resource.data.userId == request.auth.uid;
 *        }
 *        
 *        // 관리자 전용
 *        match /admin/{document=**} {
 *          allow read, write: if request.auth != null && 
 *            request.auth.token.email in ['infobankadmin@infobank.net', 'shhan@infobank.net'];
 *        }
 *      }
 *    }
 */

/**
 * Kakao 설정 가이드:
 * 
 * 1. Kakao Developers (https://developers.kakao.com/) 접속
 * 2. 내 애플리케이션 > 애플리케이션 추가하기
 * 3. 앱 설정 > 플랫폼 > Web 플랫폼 등록
 *    - 사이트 도메인 등록 (http://localhost:3000, https://yourdomain.com)
 * 4. 제품 설정 > 카카오 로그인 활성화
 *    - Redirect URI 설정
 * 5. 앱 키 > JavaScript 키 복사하여 위의 KAKAO_APP_KEY에 붙여넣기
 * 6. 동의항목 설정:
 *    - 닉네임 (필수)
 *    - 프로필 사진 (선택)
 *    - 카카오계정(이메일) (선택)
 */
