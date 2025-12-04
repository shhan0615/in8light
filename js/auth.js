/**
 * in8 - Auth Service
 * 인증 및 사용자 관리
 */

// 전역 변수
let currentUser = null;

/**
 * 간편 로그인 (이름만 입력)
 */
async function simpleLogin() {
    const userName = document.getElementById('userName').value.trim();
    const userEmail = document.getElementById('eMail').value.trim();
    
    // 이름 유효성 검사
    if (!userName) {
        alert('⚠️ 이름을 입력해주세요.');
        document.getElementById('userName').focus();
        return;
    }
    
    // 이름 길이 검사 (2-20자)
    if (userName.length < 2) {
        alert('⚠️ 이름은 최소 2자 이상 입력해주세요.');
        document.getElementById('userName').focus();
        return;
    }
    
    if (userName.length > 20) {
        alert('⚠️ 이름은 최대 20자까지 입력 가능합니다.');
        document.getElementById('userName').focus();
        return;
    }
    
    // 이름 특수문자 검사 (한글, 영문, 숫자, 공백만 허용)
    const namePattern = /^[가-힣a-zA-Z0-9\s]+$/;
    if (!namePattern.test(userName)) {
        alert('⚠️ 이름은 한글, 영문, 숫자만 입력 가능합니다.\n특수문자는 사용할 수 없습니다.');
        document.getElementById('userName').focus();
        return;
    }
    
    // 이메일 유효성 검사
    if (!userEmail) {
        alert('⚠️ 이메일을 입력해주세요.');
        document.getElementById('eMail').focus();
        return;
    }
    
    // 이메일 형식 검사
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(userEmail)) {
        alert('⚠️ 올바른 이메일 형식을 입력해주세요.\n예) example@domain.com');
        document.getElementById('eMail').focus();
        return;
    }
    
    // 이메일 길이 검사 (최대 100자)
    if (userEmail.length > 100) {
        alert('⚠️ 이메일은 최대 100자까지 입력 가능합니다.');
        document.getElementById('eMail').focus();
        return;
    }
    
    try {
        const userId = 'simple_' + userName.toLowerCase().replace(/\s+/g, '_');
        const userData = {
            loginId: userId,
            name: userName,
            email: userEmail,
            loginType: 'simple',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            surveyCount: 0
        };
        
        // 관리자 체크 (대소문자 구분)
        if (userName === 'infoadmin' && userEmail === 'infobankadmin@infobank.net') {
            currentUser = { 
                type: 'admin', 
                loginId: 'infoadmin',
                displayName: 'infoadmin',
                email: 'infobankadmin@infobank.net',
                name: 'infoadmin',
                loginType: 'simple'
            };
            
            showScreen('adminScreen');
            updateAdminInfo();
            await loadUserList();
            await updateAdminStats();
            await updateResultStats(); // 결과 통계도 로드
            alert('✅ 관리자로 로그인되었습니다.');
            return;
        }
        
        // 일반 사용자 로그인
        currentUser = { 
            type: 'user', 
            loginId: userId,
            displayName: userName,
            email: userEmail,
            name: userName,
            loginType: 'simple'
        };
        
        // Firebase에 사용자 정보 저장
        await saveUserProfile(userId, userData);
        
        // 저장된 설문 진행 상태 확인
        const savedProgress = loadSurveyProgress(userId);
        
        if (savedProgress && savedProgress.currentQuestionIndex > 0) {
            // 저장된 진행 상태가 있는 경우
            const savedTime = new Date(savedProgress.savedAt);
            const timeDiff = new Date() - savedTime;
            const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
            const minutesDiff = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            
            let timeText = '';
            if (hoursDiff > 0) {
                timeText = `${hoursDiff}시간 ${minutesDiff}분 전`;
            } else {
                timeText = `${minutesDiff}분 전`;
            }
            
            const resumeMessage = 
                `✅ 환영합니다, ${userName}님!\n\n` +
                `🔄 이전에 진행하던 설문이 있습니다!\n\n` +
                `📊 진행률: ${savedProgress.progress}% (${savedProgress.currentQuestionIndex + 1}/${savedProgress.totalQuestions}개 완료)\n` +
                `🕐 저장 시간: ${timeText}\n\n` +
                `이어서 진행하시겠습니까?\n\n` +
                `✅ 확인: 이어서 하기\n` +
                `❌ 취소: 처음부터 다시 시작`;
            
            const shouldResume = confirm(resumeMessage);
            
            if (shouldResume) {
                // Firebase에서 최신 설문 데이터 로드
                await initSurveyData();
                
                // 진행 상태 복원
                resumeSurvey(savedProgress);
                
                alert(`✨ 설문이 복원되었습니다!\n\n${savedProgress.totalQuestions - savedProgress.currentQuestionIndex - 1}개의 질문만 더 답변하면 완료됩니다! 💪`);
                return;
            } else {
                // 처음부터 시작하기로 선택한 경우 저장된 진행 상태 삭제
                clearSurveyProgress(userId);
            }
        }
        
        // 이어하기 정보가 없으면 바로 설문 시작
        alert(`✅ 환영합니다, ${userName}님!`);
        
        // Firebase에서 최신 설문 데이터 로드
        await initSurveyData();
        
        currentQuestionIndex = 0;
        answers = {};
        showScreen('surveyScreen');
        displayQuestion();
        updateUserInfo();
        
    } catch (error) {
        console.error('❌ 간편 로그인 실패:', error);
        alert('⚠️ 로그인 처리 중 오류가 발생했습니다.');
    }
}

/**
 * 로그아웃
 */
async function logout() {
    try {
        // 카카오 로그아웃
        if (currentUser && currentUser.loginType === 'kakao') {
            kakaoLogout();
        }
        
        // Firebase 로그아웃 (향후 Firebase Auth 사용 시)
        // await auth.signOut();
        
        currentUser = null;
        answers = {};
        currentQuestionIndex = 0;
        surveyResults = [];
        document.getElementById('userName').value = '';
        document.getElementById('eMail').value = '';
        showScreen('loginScreen');
        
        console.log('✅ 로그아웃 완료');
    } catch (error) {
        console.error('❌ 로그아웃 실패:', error);
    }
}

/**
 * 회원탈퇴
 */
async function deleteAccount() {
    if (!currentUser || !currentUser.loginId) {
        alert('⚠️ 로그인 정보를 찾을 수 없습니다.');
        return;
    }
    
    const confirmMessage = 
        `⚠️ 정말로 회원탈퇴 하시겠습니까?\n\n` +
        `다음 정보가 영구적으로 삭제됩니다:\n` +
        `• 계정 정보\n` +
        `• 모든 진단 결과\n` +
        `• 저장된 이력\n\n` +
        `⚠️ 이 작업은 되돌릴 수 없습니다!\n\n` +
        `계속하시려면 "확인"을 눌러주세요.`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    // 한 번 더 확인
    const finalConfirm = confirm('⚠️ 최종 확인\n\n정말로 탈퇴하시겠습니까?');
    
    if (!finalConfirm) {
        return;
    }
    
    try {
        const userId = currentUser.loginId;
        
        // 회원 데이터 삭제
        await deleteMyAccount(userId);
        
        // 카카오 로그아웃
        if (currentUser.loginType === 'kakao') {
            kakaoLogout();
        }
        
        // 현재 사용자 정보 초기화
        currentUser = null;
        answers = {};
        currentQuestionIndex = 0;
        surveyResults = [];
        
        // 입력 필드 초기화
        document.getElementById('userName').value = '';
        document.getElementById('eMail').value = '';
        
        // 로그인 화면으로 이동
        showScreen('loginScreen');
        
        alert('✅ 회원탈퇴가 완료되었습니다.\n\n그동안 in8을 이용해 주셔서 감사합니다.');
        
    } catch (error) {
        console.error('❌ 회원탈퇴 실패:', error);
        alert('⚠️ 회원탈퇴 처리 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.');
    }
}

/**
 * 사용자 정보 업데이트 (UI)
 */
function updateUserInfo() {
    // 프로필 이미지 HTML 생성
    const profileImageHtml = currentUser.profileImage 
        ? `<img src="${currentUser.profileImage}" alt="프로필" class="user-profile-image" onerror="this.style.display='none'">` 
        : '';
    
    // 클릭 가능한 프로필 (설문/결과 화면용)
    const clickableUserInfoHtml = `
        <div class="user-profile" onclick="viewMyHistory()" title="클릭하여 내 검사 이력 보기">
            ${profileImageHtml}
            <strong>${currentUser.name}</strong>님의 in8 진단
        </div>
        <button class="share-button" onclick="shareApp()" title="in8 앱을 친구에게 공유하기">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            공유하기
        </button>
    `;
    
    // 클릭 불가능한 프로필 (히스토리 화면용)
    const staticUserInfoHtml = `
        <div class="user-profile" style="cursor: default;">
            ${profileImageHtml}
            <strong>${currentUser.name}</strong>님의 in8 진단
        </div>
        <button class="share-button" onclick="shareApp()" title="in8 앱을 친구에게 공유하기">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            공유하기
        </button>
    `;
    
    document.getElementById('currentUserInfo').innerHTML = clickableUserInfoHtml;
    document.getElementById('resultUserInfo').innerHTML = clickableUserInfoHtml;
    
    if (document.getElementById('historyUserInfo')) {
        document.getElementById('historyUserInfo').innerHTML = staticUserInfoHtml;
    }
}

/**
 * 관리자 정보 업데이트
 */
function updateAdminInfo() {
    if (document.getElementById('adminUserInfo')) {
        const profileImageHtml = currentUser.profileImage 
            ? `<img src="${currentUser.profileImage}" alt="프로필" class="user-profile-image" onerror="this.style.display='none'"> ` 
            : '';
        
        document.getElementById('adminUserInfo').innerHTML = profileImageHtml + currentUser.displayName;
    }
}

/**
 * 화면 전환
 */
function showScreen(screenId) {
    const screens = ['loginScreen', 'adminScreen', 'surveyScreen', 'resultScreen', 'historyScreen'];
    screens.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('hidden');
        }
    });
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
    }
}

/**
 * Enter 키 이벤트 처리
 */
function setupLoginKeyEvent() {
    const userNameInput = document.getElementById('userName');
    if (userNameInput) {
        userNameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                simpleLogin();
            }
        });
    }
}

/**
 * 앱 공유하기
 */
async function shareApp() {
    const appUrl = window.location.origin + window.location.pathname;
    const appTitle = 'in8 - 8체질 진단';
    const appDescription = '나의 체질을 알아보고 건강한 식습관을 찾아보세요! 🌿 음식 선호도 기반의 과학적인 8체질 진단 서비스입니다.';
    
    // 공유 이미지 URL - 실제 배포 서버의 이미지 경로
    const shareImageUrl = window.location.origin + '/images/share-image.png';
    
    // 카카오 공유 시도
    if (typeof Kakao !== 'undefined' && Kakao.isInitialized()) {
        try {
            Kakao.Share.sendDefault({
                objectType: 'feed',
                content: {
                    title: appTitle,
                    description: appDescription,
                    imageUrl: shareImageUrl,
                    link: {
                        mobileWebUrl: appUrl,
                        webUrl: appUrl
                    }
                },
                buttons: [
                    {
                        title: '✨ 진단 시작하기',
                        link: {
                            mobileWebUrl: appUrl,
                            webUrl: appUrl
                        }
                    }
                ]
            });
            console.log('✅ 카카오톡 공유 완료');
            return;
        } catch (error) {
            console.error('❌ 카카오톡 공유 실패:', error);
            // 카카오 공유 실패 시 웹 공유 API로 fallback
        }
    }
    
    // 웹 공유 API 시도
    const shareData = {
        title: appTitle,
        text: appDescription,
        url: appUrl
    };
    
    try {
        if (navigator.share) {
            await navigator.share(shareData);
            console.log('✅ 웹 공유 완료');
        } else {
            // 웹 공유 API 미지원 시 클립보드 복사
            await navigator.clipboard.writeText(appUrl);
            alert(`✅ 링크가 클립보드에 복사되었습니다!\n\n${appTitle}\n${appDescription}\n\n${appUrl}\n\n친구에게 링크를 공유해주세요!`);
        }
    } catch (error) {
        console.error('❌ 공유 실패:', error);
        // 공유 취소 또는 실패 시
        if (error.name !== 'AbortError') {
            // 수동 복사 안내
            const fallbackText = `${appTitle}\n\n${appDescription}\n\n${appUrl}`;
            prompt('아래 링크를 복사하여 공유해주세요:', appUrl);
        }
    }
}

// 페이지 로드 시 실행
window.addEventListener('DOMContentLoaded', function() {
    setupLoginKeyEvent();
    console.log('✅ in8 인증 시스템 초기화 완료');
});
