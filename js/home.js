// in8 Home Screen JavaScript - Version 1.6

// 현재 사용자 상태
let currentUser = null;

// 앱 버전 (업데이트 시 이 값을 변경)
const APP_CURRENT_VERSION = '0.6.2';

/**
 * 타임스탬프를 연월일시분초 형식으로 포맷
 */
function formatTimestamp(timestamp) {
    try {
        let date;
        
        // Firebase Timestamp 객체 처리
        if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
            // Firebase Timestamp: seconds를 밀리초로 변환
            date = new Date(timestamp.seconds * 1000);
        } else if (timestamp instanceof Date) {
            // 이미 Date 객체인 경우
            date = timestamp;
        } else if (typeof timestamp === 'number') {
            // Unix timestamp (밀리초)
            date = new Date(timestamp);
        } else if (typeof timestamp === 'string') {
            // 문자열 날짜
            date = new Date(timestamp);
        } else {
            // 기타 경우 현재 시간
            date = new Date();
        }
        
        // 유효한 날짜인지 확인
        if (isNaN(date.getTime())) {
            console.error('유효하지 않은 날짜:', timestamp);
            return '-';
        }
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return `${year}년 ${month}월 ${day}일 ${hours}시 ${minutes}분 ${seconds}초`;
    } catch (error) {
        console.error('타임스탬프 포맷 오류:', error, timestamp);
        return '-';
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    checkVersionAndClearCache();
    initializeHome();
    checkUserStatus();
    updateVersionInfo();
});

// 버전 체크 및 캐시 삭제
function checkVersionAndClearCache() {
    const savedVersion = localStorage.getItem('appVersion');
    
    if (savedVersion !== APP_CURRENT_VERSION) {
        console.log(`🔄 앱 업데이트 감지: ${savedVersion} → ${APP_CURRENT_VERSION}`);
        
        // 설문 데이터 캐시 삭제
        localStorage.removeItem('surveyDataCache');
        localStorage.removeItem('surveyDataTimestamp');
        
        // 설문 데이터 백업도 삭제 (최신 서버 데이터를 가져오기 위함)
        localStorage.removeItem('surveyDataBackup');
        localStorage.removeItem('surveyDataBackupTime');
        
        // 새 버전 저장
        localStorage.setItem('appVersion', APP_CURRENT_VERSION);
        
        console.log('✅ 캐시 및 백업 데이터 삭제 완료 - 최신 설문 데이터를 서버에서 가져옵니다');
        
        // 브라우저 캐시 강제 삭제 및 새로고침
        if (savedVersion) {
            console.log('🔄 브라우저 캐시를 삭제하고 페이지를 새로고침합니다...');
            
            // Service Worker 캐시 삭제
            if ('caches' in window) {
                caches.keys().then(function(cacheNames) {
                    return Promise.all(
                        cacheNames.map(function(cacheName) {
                            console.log('🗑️ 캐시 삭제:', cacheName);
                            return caches.delete(cacheName);
                        })
                    );
                }).then(function() {
                    console.log('✅ Service Worker 캐시 삭제 완료');
                });
            }
            
            // 1초 후 강제 새로고침 (캐시 무시)
            setTimeout(() => {
                console.log('🔄 페이지 강제 새로고침 중...');
                window.location.reload(true);
            }, 1000);
        }
    }
}

// 홈 화면 초기화
function initializeHome() {
    console.log('Home screen initialized - Version 1.6');
    
    // Firebase 연결 상태 확인
    checkFirebaseConnection();
}

// Firebase 연결 상태 확인
function checkFirebaseConnection() {
    setTimeout(() => {
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase SDK가 로드되지 않았습니다.');
            return;
        }
        
        if (typeof db === 'undefined' || !db) {
            console.error('❌ Firestore 데이터베이스가 초기화되지 않았습니다.');
            return;
        }
        
        console.log('✅ Firebase 연결 상태: 정상');
    }, 1000);
}

// 버전 정보 업데이트
function updateVersionInfo() {
    const version = typeof APP_VERSION !== 'undefined' ? APP_VERSION : '1.6.0';
    const releaseDate = typeof APP_CONFIG !== 'undefined' && APP_CONFIG.releaseDate ? APP_CONFIG.releaseDate : '2025.11.04';
    const drawerVersionInfo = document.getElementById('drawerVersionInfo');
    if (drawerVersionInfo) {
        drawerVersionInfo.textContent = `Version ${version} (${releaseDate})`;
    }
}

// 홈 화면 전용 간편 로그인 함수
async function simpleLogin() {
    const userName = document.getElementById('userName').value.trim();
    const userEmail = document.getElementById('eMail').value.trim();
    
    // 이름 유효성 검사
    if (!userName) {
        alert('⚠️ 이름을 입력해주세요.');
        document.getElementById('userName').focus();
        return;
    }
    
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
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(userEmail)) {
        alert('⚠️ 올바른 이메일 형식을 입력해주세요.\n예) example@domain.com');
        document.getElementById('eMail').focus();
        return;
    }
    
    if (userEmail.length > 100) {
        alert('⚠️ 이메일은 최대 100자까지 입력 가능합니다.');
        document.getElementById('eMail').focus();
        return;
    }
    
    // 로딩 표시
    showLoadingOverlay('로그인 중...');
    
    try {
        // 관리자 체크 - 바로 로그인
        if (userName === 'infoadmin' && userEmail === 'infobankadmin@infobank.net') {
            const adminUserId = 'admin_infoadmin';
            const adminData = {
                loginId: adminUserId,
                name: userName,
                email: userEmail,
                loginType: 'simple',
                isAdmin: true,
                createdAt: new Date().toISOString(),
                surveyCount: 0
            };
            
            // 관리자 정보 저장
            currentUser = { 
                type: 'admin',
                loginId: adminUserId,
                displayName: userName,
                email: userEmail,
                name: userName,
                loginType: 'simple',
                isAdmin: true
            };
            
            // Firebase에 관리자 정보 저장
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                await firebase.firestore().collection('users').doc(adminUserId).set(adminData, { merge: true });
            }
            
            // 로컬 스토리지에 저장
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            hideLoadingOverlay();
            alert(`✅ 관리자로 로그인되었습니다, ${userName}님!`);
            
            // UI 업데이트 (관리자 화면이 자동으로 표시됨)
            updateUserInterface(currentUser);
            
            // 로그인 화면 닫기 (updateUserInterface에서 관리자 화면이 표시되므로 showHomeContent 호출 안 함)
            const loginContent = document.getElementById('loginContent');
            if (loginContent) loginContent.classList.add('hidden');
            return;
        }
        
        const userId = 'simple_' + userName.toLowerCase().replace(/\s+/g, '_');
        
        // Firebase에서 기존 사용자 정보 확인
        let existingUserData = null;
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            try {
                const userDoc = await firebase.firestore().collection('users').doc(userId).get();
                if (userDoc.exists) {
                    existingUserData = userDoc.data();
                    console.log('✅ 기존 사용자 정보 로드:', existingUserData);
                }
            } catch (error) {
                console.warn('⚠️ 사용자 정보 조회 실패:', error);
            }
        }
        
        const userData = {
            loginId: userId,
            name: userName,
            email: userEmail,
            loginType: 'simple',
            createdAt: existingUserData?.createdAt || new Date().toISOString(),
            surveyCount: existingUserData?.surveyCount || 0,
            lastAccessDate: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // 기존 체질 정보 유지
        if (existingUserData?.lastConstitution) {
            userData.lastConstitution = existingUserData.lastConstitution;
        }
        if (existingUserData?.lastConstitutionScore) {
            userData.lastConstitutionScore = existingUserData.lastConstitutionScore;
        }
        if (existingUserData?.lastSurveyDate) {
            userData.lastSurveyDate = existingUserData.lastSurveyDate;
        }
        
        // 사용자 정보 저장
        currentUser = { 
            type: 'user', 
            loginId: userId,
            displayName: userName,
            email: userEmail,
            name: userName,
            loginType: 'simple',
            lastConstitution: existingUserData?.lastConstitution || null,
            lastConstitutionScore: existingUserData?.lastConstitutionScore || null
        };
        
        console.log('📌 currentUser 설정:', currentUser);
        
        // Firebase에 사용자 정보 저장
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            await firebase.firestore().collection('users').doc(userId).set(userData, { merge: true });
        }
        
        // 로컬 스토리지에 저장
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // 로딩 숨김
        hideLoadingOverlay();
        
        alert(`✅ 환영합니다, ${userName}님!`);
        
        // UI 업데이트
        updateUserInterface(currentUser);
        
        // 로그인 화면 닫고 홈 화면 표시
        showHomeContent();
        
        // 한의원 정보 로드 및 선택 팝업 표시 (v0.6.0)
        await loadUserHospitalInfo();
        
        // 등록된 한의원이 있고 사용자가 선택하지 않았으면 팝업 표시
        if (!currentUser.selectedHospitalId) {
            const hospitals = await getAllHospitals();
            if (hospitals.length > 0) {
                setTimeout(() => {
                    showHospitalSelectPopup();
                }, 500);
            }
        }
        
    } catch (error) {
        console.error('❌ 간편 로그인 실패:', error);
        hideLoadingOverlay();
        alert('⚠️ 로그인 처리 중 오류가 발생했습니다.');
    }
}

// 홈 화면 전용 카카오 로그인 함수
async function kakaoLogin() {
    if (typeof Kakao === 'undefined' || !Kakao.isInitialized()) {
        alert('⚠️ 카카오 SDK를 불러오는 중입니다.\n잠시 후 다시 시도해주세요.');
        return;
    }

    try {
        Kakao.Auth.login({
            success: async function(authObj) {
                // 로딩 표시
                showLoadingOverlay('카카오 로그인 중...');
                
                try {
                    // 사용자 정보 요청
                    Kakao.API.request({
                        url: '/v2/user/me',
                        success: async function(response) {
                            const kakaoAccount = response.kakao_account;
                            const profile = kakaoAccount.profile;
                            
                            const userId = 'kakao_' + response.id;
                            const userData = {
                                loginId: userId,
                                name: profile.nickname || '카카오 사용자',
                                email: kakaoAccount.email || '',
                                loginType: 'kakao',
                                kakaoId: response.id,
                                profileImage: profile.profile_image_url || profile.thumbnail_image_url || '',
                                createdAt: new Date().toISOString(),
                                surveyCount: 0
                            };
                            
                            currentUser = {
                                type: 'user',
                                loginId: userId,
                                displayName: profile.nickname || '카카오 사용자',
                                email: kakaoAccount.email || '',
                                name: profile.nickname || '카카오 사용자',
                                loginType: 'kakao',
                                kakaoId: response.id,
                                profileImage: profile.profile_image_url || profile.thumbnail_image_url || ''
                            };
                            
                            // Firebase에 사용자 정보 저장
                            if (typeof firebase !== 'undefined' && firebase.firestore) {
                                await firebase.firestore().collection('users').doc(userId).set(userData, { merge: true });
                            }
                            
                            // 로컬 스토리지에 저장
                            localStorage.setItem('currentUser', JSON.stringify(currentUser));
                            
                            // 로딩 숨김
                            hideLoadingOverlay();
                            
                            alert(`✅ 환영합니다, ${currentUser.displayName}님!`);
                            
                            // UI 업데이트
                            updateUserInterface(currentUser);
                            
                            // 로그인 화면 닫고 홈 화면 표시
                            showHomeContent();
                            
                            // 한의원 정보 로드 및 선택 팝업 표시 (v0.6.0)
                            await loadUserHospitalInfo();
                            
                            // 등록된 한의원이 있고 사용자가 선택하지 않았으면 팝업 표시
                            if (!currentUser.selectedHospitalId) {
                                const hospitals = await getAllHospitals();
                                if (hospitals.length > 0) {
                                    setTimeout(() => {
                                        showHospitalSelectPopup();
                                    }, 500);
                                }
                            }
                        },
                        fail: function(error) {
                            console.error('카카오 사용자 정보 요청 실패:', error);
                            hideLoadingOverlay();
                            alert('⚠️ 카카오 로그인에 실패했습니다.');
                        }
                    });
                } catch (error) {
                    console.error('카카오 로그인 처리 실패:', error);
                    hideLoadingOverlay();
                    alert('⚠️ 로그인 처리 중 오류가 발생했습니다.');
                }
            },
            fail: function(error) {
                console.error('카카오 로그인 실패:', error);
                alert('⚠️ 카카오 로그인에 실패했습니다.');
            }
        });
    } catch (error) {
        console.error('카카오 로그인 오류:', error);
        alert('⚠️ 카카오 로그인 중 오류가 발생했습니다.');
    }
}

// 사용자 상태 확인
async function checkUserStatus() {
    // 로컬 스토리지에서 사용자 정보 확인
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            
            // Firebase에서 최신 사용자 정보 가져오기 (체질 정보 및 병원 정보 포함)
            if (currentUser.loginId && typeof firebase !== 'undefined' && firebase.firestore) {
                try {
                    const userDoc = await firebase.firestore().collection('users').doc(currentUser.loginId).get();
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        console.log('🔄 Firebase에서 최신 사용자 정보 로드:', userData);
                        
                        // 체질 정보 업데이트
                        if (userData.lastConstitution) {
                            currentUser.lastConstitution = userData.lastConstitution;
                            currentUser.lastConstitutionScore = userData.lastConstitutionScore || null;
                            console.log('✅ 체질 정보 업데이트:', currentUser.lastConstitution);
                        }
                        
                        // 병원 정보 업데이트
                        if (userData.selectedHospitalId) {
                            currentUser.selectedHospitalId = userData.selectedHospitalId;
                            console.log('✅ 병원 정보 업데이트:', currentUser.selectedHospitalId);
                        }
                        
                        // 로컬 스토리지 업데이트
                        localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    }
                } catch (error) {
                    console.warn('⚠️ Firebase 사용자 정보 로드 실패:', error);
                }
            }
            
            updateUserInterface(currentUser);
            
            // 병원 정보 로드 및 헤더에 표시
            if (currentUser.selectedHospitalId) {
                await loadUserHospitalInfo();
            }
        } catch (error) {
            console.error('사용자 정보 로드 오류:', error);
            updateGuestInterface();
        }
    } else {
        updateGuestInterface();
    }
    
    // Firebase 인증 상태도 확인 (카카오 로그인용)
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user && !currentUser) {
                try {
                    // Firestore에서 사용자 전체 데이터 가져오기
                    const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
                    let userData = userDoc.exists ? userDoc.data() : {};
                    
                    currentUser = {
                        type: 'user',
                        displayName: user.displayName || user.email,
                        email: user.email,
                        uid: user.uid,
                        selectedHospitalId: userData.selectedHospitalId || null,
                        lastConstitution: userData.lastConstitution || null,
                        lastConstitutionScore: userData.lastConstitutionScore || null,
                        isAdmin: userData.isAdmin || false
                    };
                    
                    updateUserInterface(currentUser);
                    
                    // 병원 정보 로드 및 헤더에 표시
                    if (currentUser.selectedHospitalId) {
                        await loadUserHospitalInfo();
                    }
                    
                    console.log('✅ Firebase 인증 상태 복원 및 병원 정보 로드 완료');
                } catch (error) {
                    console.error('❌ 사용자 데이터 로드 실패:', error);
                    currentUser = {
                        type: 'user',
                        displayName: user.displayName || user.email,
                        email: user.email,
                        uid: user.uid
                    };
                    updateUserInterface(currentUser);
                }
            }
        });
    }
}

// 사용자 인터페이스 업데이트 (로그인 후)
function updateUserInterface(user) {
    // 프로필 정보 업데이트
    const profileAvatar = document.getElementById('profileAvatar');
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileConstitution = document.getElementById('profileConstitution');
    const profileLoginTime = document.getElementById('profileLoginTime');
    const loginBtn = document.getElementById('loginBtn');
    const drawerLoginItem = document.getElementById('drawerLoginItem');
    const historyMenuItem = document.getElementById('historyMenuItem');
    const deleteAccountMenuItem = document.getElementById('deleteAccountMenuItem');
    const guestActions = document.getElementById('guestActions');
    const userActions = document.getElementById('userActions');

    // 프로필 이미지 업데이트 (카카오 로그인 시)
    if (profileAvatar) {
        if (user.profileImage) {
            profileAvatar.innerHTML = `<img src="${user.profileImage}" alt="프로필" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
            profileAvatar.textContent = '👤';
        }
    }
    
    if (profileName) {
        const userName = user.displayName || user.email || '사용자';
        profileName.textContent = `${userName}님 반갑습니다 😊`;
    }
    if (profileEmail) {
        profileEmail.textContent = user.email || '';
    }
    // 체질 정보 표시
    if (profileConstitution) {
        console.log('🔍 체질 정보 확인:', user.lastConstitution);
        if (user.lastConstitution) {
            profileConstitution.textContent = `🌿 나의 체질: ${user.lastConstitution}`;
            profileConstitution.style.display = 'block';
            profileConstitution.style.color = '#ffffff';
            profileConstitution.style.fontWeight = '600';
            console.log('✅ 프로필에 체질 표시:', user.lastConstitution);
        } else {
            profileConstitution.textContent = '';
            profileConstitution.style.display = 'none';
            console.log('ℹ️ 체질 정보 없음 - 표시 안 함');
        }
    }
    // 접속 시간 업데이트
    if (profileLoginTime) {
        const now = new Date();
        const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        profileLoginTime.textContent = `접속: ${dateStr} ${timeStr}`;
    }
    if (loginBtn) {
        loginBtn.textContent = '로그아웃';
        loginBtn.style.background = '#000000';
        loginBtn.style.borderColor = '#000000';
        loginBtn.style.color = 'white';
        loginBtn.onclick = () => logout();
    }
    if (drawerLoginItem) {
        const icon = drawerLoginItem.querySelector('.drawer-icon');
        const text = drawerLoginItem.querySelector('span:not(.drawer-icon)');
        if (icon) icon.textContent = '🚪';
        if (text) text.textContent = '로그아웃';
        drawerLoginItem.onclick = () => { logout(); closeDrawer(); return false; };
    }
    if (historyMenuItem) {
        historyMenuItem.style.display = 'flex';
    }
    // 관리자 메뉴 항목 표시
    const adminMenuItem = document.getElementById('adminMenuItem');
    if (adminMenuItem) {
        if (user.isAdmin || user.type === 'admin') {
            adminMenuItem.classList.remove('hidden');
            adminMenuItem.style.display = 'flex';
        } else {
            adminMenuItem.classList.add('hidden');
            adminMenuItem.style.display = 'none';
        }
    }
    if (deleteAccountMenuItem) {
        deleteAccountMenuItem.style.display = 'flex';
    }
    if (guestActions) {
        guestActions.classList.add('hidden');
    }
    if (userActions) {
        userActions.classList.remove('hidden');
    }

    // 관리자인 경우 관리자 화면 표시
    if (user.isAdmin || user.type === 'admin') {
        showAdminContent();
    } else {
        // 일반 사용자는 홈 화면 표시
        showHomeContent();
    }
}

// 게스트 인터페이스 업데이트 (로그인 전)
function updateGuestInterface() {
    const profileAvatar = document.getElementById('profileAvatar');
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileConstitution = document.getElementById('profileConstitution');
    const profileLoginTime = document.getElementById('profileLoginTime');
    const loginBtn = document.getElementById('loginBtn');
    const drawerLoginItem = document.getElementById('drawerLoginItem');
    const historyMenuItem = document.getElementById('historyMenuItem');
    const deleteAccountMenuItem = document.getElementById('deleteAccountMenuItem');
    const guestActions = document.getElementById('guestActions');
    const userActions = document.getElementById('userActions');

    if (profileAvatar) {
        profileAvatar.textContent = '👤';
    }
    if (profileName) {
        profileName.textContent = '게스트';
    }
    if (profileEmail) {
        profileEmail.textContent = '로그인이 필요합니다';
    }
    if (profileConstitution) {
        profileConstitution.textContent = '';
        profileConstitution.style.display = 'none';
    }
    if (profileLoginTime) {
        profileLoginTime.textContent = '';
    }
    if (loginBtn) {
        loginBtn.textContent = '로그인';
        loginBtn.style.background = 'white';
        loginBtn.style.borderColor = '#000000';
        loginBtn.style.color = '#000000';
        loginBtn.onclick = () => toggleLoginScreen();
    }
    if (drawerLoginItem) {
        const icon = drawerLoginItem.querySelector('.drawer-icon');
        const text = drawerLoginItem.querySelector('span:not(.drawer-icon)');
        if (icon) icon.textContent = '🔐';
        if (text) text.textContent = '로그인';
        drawerLoginItem.onclick = () => { toggleLoginScreen(); closeDrawer(); return false; };
    }
    if (historyMenuItem) {
        historyMenuItem.style.display = 'none';
    }
    // 관리자 메뉴 숨기기
    const adminMenuItem = document.getElementById('adminMenuItem');
    if (adminMenuItem) {
        adminMenuItem.classList.add('hidden');
        adminMenuItem.style.display = 'none';
    }
    if (deleteAccountMenuItem) {
        deleteAccountMenuItem.style.display = 'none';
    }
    if (guestActions) {
        guestActions.classList.remove('hidden');
    }
    if (userActions) {
        userActions.classList.add('hidden');
    }
}

// 로그인 화면 토글
function toggleLoginScreen() {
    const homeContent = document.getElementById('homeContent');
    const loginContent = document.getElementById('loginContent');
    const surveyContent = document.getElementById('surveyContent');
    const resultContent = document.getElementById('resultContent');
    const historyContent = document.getElementById('historyContent');
    const adminContent = document.getElementById('adminContent');
    const dietTableContent = document.getElementById('dietTableContent');
    const familyContent = document.getElementById('familyContent');
    const questionContent = document.getElementById('questionContent');
    const aiChatContent = document.getElementById('aiChatContent');
    
    if (loginContent && loginContent.classList.contains('hidden')) {
        // 로그인 화면 표시
        if (homeContent) homeContent.classList.add('hidden');
        if (surveyContent) surveyContent.classList.add('hidden');
        if (resultContent) resultContent.classList.add('hidden');
        if (historyContent) historyContent.classList.add('hidden');
        if (adminContent) adminContent.classList.add('hidden');
        if (dietTableContent) dietTableContent.classList.add('hidden');
        if (familyContent) familyContent.classList.add('hidden');
        if (questionContent) questionContent.classList.add('hidden');
        if (aiChatContent) aiChatContent.classList.add('hidden');
    
        loginContent.classList.remove('hidden');
    } else {
        // 홈 화면 표시
        showHomeContent();
    }
}

// 홈 화면 표시
function showHomeContent() {
    const homeContent = document.getElementById('homeContent');
    const loginContent = document.getElementById('loginContent');
    const surveyContent = document.getElementById('surveyContent');
    const resultContent = document.getElementById('resultContent');
    const historyContent = document.getElementById('historyContent');
    const adminContent = document.getElementById('adminContent');
    const dietTableContent = document.getElementById('dietTableContent');
    const familyContent = document.getElementById('familyContent');
    const questionContent = document.getElementById('questionContent');
    const hospitalContent = document.getElementById('hospitalContent');
    const aiChatContent = document.getElementById('aiChatContent');
    
    if (loginContent) loginContent.classList.add('hidden');
    if (surveyContent) surveyContent.classList.add('hidden');
    if (resultContent) resultContent.classList.add('hidden');
    if (historyContent) historyContent.classList.add('hidden');
    if (adminContent) adminContent.classList.add('hidden');
    if (dietTableContent) dietTableContent.classList.add('hidden');
    if (familyContent) familyContent.classList.add('hidden');
    if (questionContent) questionContent.classList.add('hidden');
    if (hospitalContent) hospitalContent.classList.add('hidden');
    if (aiChatContent) aiChatContent.classList.add('hidden');
    if (homeContent) homeContent.classList.remove('hidden');
    
    // 로그인 상태이고 병원이 선택되어 있으면 헤더에 병원 정보 표시
    if (currentUser && selectedHospital) {
        displayHospitalLogoInHeader(selectedHospital);
    }
    
    // 하단 네비게이션 활성화 상태 업데이트
    updateBottomNav('home');
}

// 서랍 메뉴 토글
async function toggleDrawer() {
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('drawerOverlay');
    
    if (drawer && overlay) {
        const isOpening = !drawer.classList.contains('active');
        
        drawer.classList.toggle('active');
        overlay.classList.toggle('active');
        
        // 서랍이 열릴 때 실시간으로 서버에서 체질 정보 가져오기
        if (isOpening && currentUser && currentUser.loginId) {
            console.log('🔄 서랍 메뉴 열림 - 서버에서 최신 체질 정보 로드 시작');
            await refreshUserConstitutionFromServer();
        }
    }
}

/**
 * 서버에서 최신 체질 정보를 가져와서 프로필 업데이트
 */
async function refreshUserConstitutionFromServer() {
    if (!currentUser || !currentUser.loginId) {
        console.log('ℹ️ 로그인된 사용자 없음 - 체질 정보 업데이트 생략');
        return;
    }
    
    try {
        console.log('🔍 Firebase에서 최신 체질 정보 조회 중...', currentUser.loginId);
        
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            const userDoc = await firebase.firestore()
                .collection('users')
                .doc(currentUser.loginId)
                .get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                console.log('📦 서버 데이터:', userData);
                
                // 체질 정보 업데이트
                if (userData.lastConstitution) {
                    const oldConstitution = currentUser.lastConstitution;
                    currentUser.lastConstitution = userData.lastConstitution;
                    currentUser.lastConstitutionScore = userData.lastConstitutionScore || null;
                    
                    // 로컬 스토리지 업데이트
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    
                    if (oldConstitution !== userData.lastConstitution) {
                        console.log(`✅ 체질 정보 업데이트: ${oldConstitution || '없음'} → ${userData.lastConstitution}`);
                    } else {
                        console.log('✅ 체질 정보 동기화 완료 (변경 없음):', userData.lastConstitution);
                    }
                    
                    // 프로필 UI 즉시 업데이트
                    const profileConstitution = document.getElementById('profileConstitution');
                    if (profileConstitution) {
                        profileConstitution.textContent = `🌿 나의 체질: ${userData.lastConstitution}`;
                        profileConstitution.style.display = 'block';
                        profileConstitution.style.color = '#ffffff';
                        profileConstitution.style.fontWeight = '600';
                    }
                } else {
                    console.log('ℹ️ 서버에 저장된 체질 정보 없음');
                    currentUser.lastConstitution = null;
                    currentUser.lastConstitutionScore = null;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    
                    // 프로필 UI에서 체질 정보 숨기기
                    const profileConstitution = document.getElementById('profileConstitution');
                    if (profileConstitution) {
                        profileConstitution.textContent = '';
                        profileConstitution.style.display = 'none';
                    }
                }
            } else {
                console.warn('⚠️ 사용자 문서를 찾을 수 없습니다:', currentUser.loginId);
            }
        } else {
            console.warn('⚠️ Firebase가 초기화되지 않았습니다');
        }
    } catch (error) {
        console.error('❌ 서버에서 체질 정보 로드 실패:', error);
    }
}

// 서랍 메뉴 닫기
function closeDrawer() {
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('drawerOverlay');
    
    if (drawer && overlay) {
        drawer.classList.remove('active');
        overlay.classList.remove('active');
    }
}

// 로그아웃
function logout() {
    // 로그아웃 확인 팝업
    if (!confirm('로그아웃 하시겠습니까?')) {
        return;
    }
    
    // 로컬 스토리지에서 사용자 정보 삭제
    localStorage.removeItem('currentUser');
    
    // 카카오 로그아웃
    if (currentUser && currentUser.loginType === 'kakao' && typeof Kakao !== 'undefined') {
        Kakao.Auth.logout(() => {
            console.log('카카오 로그아웃 완료');
        });
    }
    
    // Firebase 로그아웃 (있을 경우)
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().signOut().then(() => {
            console.log('Firebase 로그아웃 완료');
        }).catch((error) => {
            console.error('Firebase 로그아웃 오류:', error);
        });
    }
    
    // 일반 로그인 입력 필드 초기화
    const userNameInput = document.getElementById('userName');
    const userEmailInput = document.getElementById('eMail');
    if (userNameInput) userNameInput.value = '';
    if (userEmailInput) userEmailInput.value = '';
    
    // 한의원 정보 초기화
    selectedHospital = null;
    
    // 헤더의 한의원 버튼 숨기기
    const hospitalInfoHeader = document.getElementById('hospitalInfoHeader');
    if (hospitalInfoHeader) {
        hospitalInfoHeader.style.display = 'none';
    }
    
    alert('로그아웃되었습니다.');
    currentUser = null;
    updateGuestInterface();
    showHomeContent();
    closeDrawer();
    
    // 화면 새로고침하여 IN8 아이콘/텍스트로 업데이트 (v0.8.7)
    setTimeout(() => {
        location.reload();
    }, 100);
}

// 페이지 이동 함수들
function goToHome() {
    showHomeContent();
}

function goToHomeMain() {
    // 하단 네비게이션 홈 버튼 클릭 시 항상 기본 홈 화면으로
    showHomeContent();
    updateBottomNav('home');
}

function goToHistory() {
    closeDrawer();
    if (!currentUser) {
        alert('로그인이 필요한 서비스입니다.');
        toggleLoginScreen();
        return;
    }
    
    // 홈 화면의 중간 영역에 검사기록 표시
    showHistoryContent();
}

function goToAdmin() {
    closeDrawer();
    if (!currentUser) {
        alert('로그인이 필요한 서비스입니다.');
        toggleLoginScreen();
        return;
    }
    
    // 관리자 권한 확인
    if (!currentUser.isAdmin && currentUser.type !== 'admin') {
        alert('관리자만 접근할 수 있습니다.');
        return;
    }
    
    // 관리자 화면 표시
    showAdminContent();
}

function goToSurvey() {
    if (!currentUser) {
        alert('로그인이 필요한 서비스입니다.');
        toggleLoginScreen();
        return;
    }
    startSurvey();
}

async function startSurvey() {
    if (!currentUser) {
        alert('로그인이 필요한 서비스입니다.');
        toggleLoginScreen();
        return;
    }
    
    // 서랍 메뉴 닫기 (v0.8.1)
    closeDrawer();
    
    // 기존 캐시된 데이터 무효화
    surveyData = null;
    
    // 로딩 표시
    showLoadingOverlay('서버에서 최신 설문항목을 불러옵니다...<br><small>최대 30초 소요될 수 있습니다.</small>');
    
    let dataSource = '';
    
    try {
        // 최신 서버 데이터 강제 업데이트 (캐시 사용 안 함)
        console.log('📡 최신 설문 데이터 가져오는 중... (캐시 무시)');
        const latestData = await getSurveyData();
        
        // 서버 데이터 검증
        if (latestData && latestData.questions && latestData.questions.length > 0) {
            surveyData = latestData;
            dataSource = 'server';
            console.log('✅ 최신 서버 데이터 로드 완료:', surveyData.questions.length, '개 질문');
        } else {
            console.log('⚠️ 서버 데이터 없음 - 기본 데이터 사용');
            surveyData = getDefaultSurveyData();
            dataSource = 'default';
        }
    } catch (error) {
        console.error('❌ 서버 데이터 가져오기 실패:', error);
        // 에러 발생 시 기본 데이터 사용
        surveyData = getDefaultSurveyData();
        dataSource = 'default';
        console.log('⚠️ 기본 설문 데이터로 진행합니다');
    } finally {
        // 로딩 숨김
        hideLoadingOverlay();
    }
    
    // surveyData 최종 검증
    if (!surveyData || !surveyData.questions || surveyData.questions.length === 0) {
        alert('❌ 설문 데이터를 불러올 수 없습니다.\n\n네트워크 연결을 확인하고 잠시 후 다시 시도해주세요.\n\n문제가 계속되면 관리자에게 문의해주세요.');
        showHomeContent();
        return;
    }
    
    // 데이터 소스에 따른 알림
    if (dataSource === 'default') {
        // 기본 데이터 사용 시 사용자에게 알림 (선택사항)
        console.warn('⚠️ 기본 설문 데이터를 사용합니다 (', surveyData.questions.length, '개 질문)');
        // alert('⚠️ 서버 연결에 문제가 있어 기본 설문으로 진행합니다.\n(' + surveyData.questions.length + '개 질문)');
    }
    
    // 저장된 설문 진행 상태 확인
    const savedProgress = await loadSurveyProgress();
    
    if (savedProgress && savedProgress.answers && Object.keys(savedProgress.answers).length > 0) {
        const answeredCount = Object.keys(savedProgress.answers).length;
        const continueMsg = `이전에 진행하던 설문이 있습니다.\n(${answeredCount}개 질문 답변 완료)\n\n이어서 하시겠습니까?`;
        
        if (confirm(continueMsg)) {
            // 이어하기
            currentQuestionIndex = savedProgress.currentQuestionIndex || 0;
            answers = savedProgress.answers || {};
        } else {
            // 새로 시작
            currentQuestionIndex = 0;
            answers = {};
            if (currentUser && currentUser.loginId) {
                clearSurveyProgress(currentUser.loginId);
            }
        }
    } else {
        // 처음 시작
        currentQuestionIndex = 0;
        answers = {};
    }
    
    // 설문 화면 표시
    showSurveyContent();
    
    // 질문 표시
    displayQuestion();
}

// 설문 진행 상태 저장
async function saveSurveyProgress() {
    if (!currentUser || !currentUser.loginId) return;
    
    const progress = {
        userId: currentUser.loginId,
        currentQuestionIndex: currentQuestionIndex,
        answers: answers,
        timestamp: new Date().toISOString()
    };
    
    try {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            await firebase.firestore()
                .collection('surveyProgress')
                .doc(currentUser.loginId)
                .set(progress);
        }
        
        // 로컬 스토리지에도 저장
        localStorage.setItem('surveyProgress_' + currentUser.loginId, JSON.stringify(progress));
    } catch (error) {
        console.error('설문 진행 상태 저장 실패:', error);
    }
}

// 설문 진행 상태 불러오기
async function loadSurveyProgress() {
    if (!currentUser || !currentUser.loginId) return null;
    
    try {
        // Firebase에서 먼저 시도
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            const doc = await firebase.firestore()
                .collection('surveyProgress')
                .doc(currentUser.loginId)
                .get();
            
            if (doc.exists) {
                return doc.data();
            }
        }
        
        // 로컬 스토리지에서 시도
        const saved = localStorage.getItem('surveyProgress_' + currentUser.loginId);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (error) {
        console.error('설문 진행 상태 불러오기 실패:', error);
    }
    
    return null;
}

// 설문 진행 상태 삭제
async function clearSurveyProgress(userId) {
    if (!userId) return;
    
    try {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            await firebase.firestore()
                .collection('surveyProgress')
                .doc(userId)
                .delete();
        }
        
        localStorage.removeItem('surveyProgress_' + userId);
    } catch (error) {
        console.error('설문 진행 상태 삭제 실패:', error);
    }
}

// 앱 공유하기
function shareApp() {
    closeDrawer();
    
    if (navigator.share) {
        navigator.share({
            title: 'in8 - 8체질 진단',
            text: '나의 체질을 확인하고 건강을 관리해보세요!',
            url: window.location.origin
        }).catch((error) => {
            console.log('공유 취소:', error);
        });
    } else {
        // Web Share API를 지원하지 않는 경우
        const message = `in8 앱을 공유해주세요!\n${window.location.origin}`;
        copyToClipboard(window.location.origin);
        alert('링크가 클립보드에 복사되었습니다!\n친구들에게 공유해주세요.');
    }
}

// 카카오톡 앱 공유
function shareKakaoApp() {
    // Kakao SDK가 로드되었는지 확인
    if (typeof Kakao === 'undefined') {
        alert('카카오톡 공유 기능을 불러오는 중입니다.\n잠시 후 다시 시도해주세요.');
        return;
    }

    // Kakao SDK 초기화 확인
    if (!Kakao.isInitialized()) {
        // config.js에서 카카오 앱 키 가져오기
        if (typeof KAKAO_APP_KEY !== 'undefined') {
            Kakao.init(KAKAO_APP_KEY);
        } else {
            console.error('Kakao App Key not found');
            alert('카카오톡 공유 기능을 사용할 수 없습니다.');
            return;
        }
    }

    Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
            title: 'in8 - 나의 8체질 진단',
            description: '개인의 체질에 맞는 건강 관리 방법을 찾아보세요!\n\n © 2025 Infobank',
            imageUrl: window.location.origin + '/images/kakao-share-image.png',
            link: {
                mobileWebUrl: window.location.origin,
                webUrl: window.location.origin,
            },
        },
        buttons: [
            {
                title: '체질 진단 시작하기',
                link: {
                    mobileWebUrl: window.location.origin,
                    webUrl: window.location.origin,
                },
            },
        ],
    });
}

// 준비중 메시지 표시
function showComingSoon(feature) {
    closeDrawer();
    alert(`${feature} 기능은 준비중입니다.\n빠른 시일 내에 제공하겠습니다!`);
    // 홈 화면으로 돌아가기
    showHomeContent();
}

// 앱 버전 표시
function showAppVersion() {
    closeDrawer();
    const version = typeof APP_VERSION !== 'undefined' ? APP_VERSION : '1.6.0';
    alert(`in8 앱 버전: ${version}\n\n최신 버전을 사용하고 계십니다.`);
}

// 앱 권한 정보
function showAppPermissions() {
    closeDrawer();
    const permissions = `
앱 권한 정보:

📱 필수 권한:
- 인터넷 연결: 데이터 저장 및 동기화

🔐 선택 권한:
- 카메라/사진: 프로필 사진 업로드 (준비중)
- 알림: 건강 관리 알림 (준비중)

* 선택 권한은 거부하셔도 앱 사용이 가능합니다.
    `.trim();
    
    alert(permissions);
}

// 문의하기
function showContact() {
    closeDrawer();
    const contact = `
문의하기:

📧 이메일: shhan@infobank.net
📞 전화: 준비중
⏰ 운영시간: 평일 09:00 - 18:00

궁금하신 사항이 있으시면
이메일로 문의해주세요!
    `.trim();
    
    alert(contact);
}

// 회원탈퇴 (서랍메뉴에서)
function deleteAccountFromDrawer() {
    closeDrawer();
    
    if (!currentUser) {
        alert('로그인이 필요한 기능입니다.');
        return;
    }
    
    const confirmed = confirm(
        '정말 탈퇴하시겠습니까?\n\n' +
        '탈퇴 시 모든 검사 기록이 삭제되며\n' +
        '복구할 수 없습니다.'
    );
    
    if (confirmed) {
        const doubleConfirm = confirm('정말로 탈퇴하시겠습니까?\n마지막 확인입니다.');
        
        if (doubleConfirm) {
            deleteUserAccount();
        }
    }
}

// 사용자 계정 삭제 처리
async function deleteUserAccount() {
    try {
        const user = firebase.auth().currentUser;
        const userId = user.uid;
        
        // Firestore에서 사용자 데이터 삭제
        await firebase.firestore().collection('users').doc(userId).delete();
        
        // 사용자 인증 삭제
        await user.delete();
        
        alert('회원탈퇴가 완료되었습니다.\n그동안 이용해주셔서 감사합니다.');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('계정 삭제 오류:', error);
        
        if (error.code === 'auth/requires-recent-login') {
            alert('보안을 위해 다시 로그인이 필요합니다.\n로그인 후 다시 시도해주세요.');
            firebase.auth().signOut();
            updateGuestInterface();
            showHomeContent();
        } else {
            alert('회원탈퇴 처리 중 오류가 발생했습니다.\n다시 시도해주세요.');
        }
    }
}

// 클립보드에 복사
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
    } else {
        // 구형 브라우저 지원
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('복사 실패:', err);
        }
        document.body.removeChild(textArea);
    }
}

// ESC 키로 서랍 닫기
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeDrawer();
    }
});

// ===== 설문 관련 함수들 =====

// 설문 변수
let currentQuestionIndex = 0;
let answers = {};
let surveyData = null;

// 설문 화면 표시
function showSurveyContent() {
    const homeContent = document.getElementById('homeContent');
    const loginContent = document.getElementById('loginContent');
    const surveyContent = document.getElementById('surveyContent');
    const resultContent = document.getElementById('resultContent');
    const historyContent = document.getElementById('historyContent');
    const adminContent = document.getElementById('adminContent');
    const dietTableContent = document.getElementById('dietTableContent');
    const familyContent = document.getElementById('familyContent');
    const questionContent = document.getElementById('questionContent');
    const hospitalContent = document.getElementById('hospitalContent');
    const aiChatContent = document.getElementById('aiChatContent');
    
    if (homeContent) homeContent.classList.add('hidden');
    if (loginContent) loginContent.classList.add('hidden');
    if (resultContent) resultContent.classList.add('hidden');
    if (historyContent) historyContent.classList.add('hidden');
    if (adminContent) adminContent.classList.add('hidden');
    if (dietTableContent) dietTableContent.classList.add('hidden');
    if (familyContent) familyContent.classList.add('hidden');
    if (questionContent) questionContent.classList.add('hidden');
    if (hospitalContent) hospitalContent.classList.add('hidden');
    if (aiChatContent) aiChatContent.classList.add('hidden');

    if (surveyContent) surveyContent.classList.remove('hidden');
    
    // 하단 네비게이션 활성화 상태 업데이트
    updateBottomNav('survey');
}

// 결과 화면 표시
function showResultContent() {
    const homeContent = document.getElementById('homeContent');
    const loginContent = document.getElementById('loginContent');
    const surveyContent = document.getElementById('surveyContent');
    const resultContent = document.getElementById('resultContent');
    const historyContent = document.getElementById('historyContent');
    const adminContent = document.getElementById('adminContent');
    const dietTableContent = document.getElementById('dietTableContent');
    const familyContent = document.getElementById('familyContent');
    const questionContent = document.getElementById('questionContent');
    const hospitalContent = document.getElementById('hospitalContent');
    const aiChatContent = document.getElementById('aiChatContent');
    
    if (homeContent) homeContent.classList.add('hidden');
    if (loginContent) loginContent.classList.add('hidden');
    if (surveyContent) surveyContent.classList.add('hidden');
    if (historyContent) historyContent.classList.add('hidden');
    if (adminContent) adminContent.classList.add('hidden');
    if (dietTableContent) dietTableContent.classList.add('hidden');
    if (familyContent) familyContent.classList.add('hidden');
    if (questionContent) questionContent.classList.add('hidden');
    if (hospitalContent) hospitalContent.classList.add('hidden');
    if (aiChatContent) aiChatContent.classList.add('hidden');

    if (resultContent) resultContent.classList.remove('hidden');
}

// 하단 네비게이션 활성화 상태 업데이트
function updateBottomNav(active) {
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    if (active === 'home') {
        navItems[0]?.classList.add('active');
    } else if (active === 'survey') {
        navItems[1]?.classList.add('active');
    } else if (active === 'dietTable') {
        navItems[3]?.classList.add('active');
    }
}

// 설문 데이터 초기화
async function initSurveyData() {
    try {
        console.log('🔄 설문 데이터 동기화 중...');
        
        // Firebase에서 설문 데이터 가져오기
        const firebaseSurveyData = await getSurveyData();
        
        if (firebaseSurveyData && firebaseSurveyData.questions && firebaseSurveyData.questions.length > 0) {
            surveyData = firebaseSurveyData;
            console.log('✅ Firebase에서 설문 데이터 로드:', surveyData.questions.length, '개 질문');
        } else {
            // 기본 설문 데이터 사용
            surveyData = getDefaultSurveyData();
            console.log('⚠️ Firebase 데이터 없음 - 기본 설문 데이터 사용:', surveyData.questions.length, '개 질문');
        }
        
        return surveyData;
    } catch (error) {
        console.error('❌ 설문 데이터 초기화 실패:', error);
        surveyData = getDefaultSurveyData();
        return surveyData;
    }
}

// 질문 표시
function displayQuestion() {
    if (!surveyData || !surveyData.questions || currentQuestionIndex >= surveyData.questions.length) {
        console.error('❌ 유효하지 않은 설문 데이터');
        return;
    }

    const question = surveyData.questions[currentQuestionIndex];
    const container = document.getElementById('questionContainer');
    
    if (!container) {
        console.error('❌ questionContainer 요소를 찾을 수 없습니다');
        return;
    }
    
    // 질문 텍스트에서 "질문 X" 패턴 제거
    let questionText = question.text;
    questionText = questionText.replace(/^질문\s*\d+\s*[\n\r]*/i, '').trim();
    
    container.innerHTML = `
        <div class="question-card">
            <div class="question-header">
                <div class="question-progress">${currentQuestionIndex + 1} / ${surveyData.questions.length}</div>
            </div>
            <div class="question-text">${questionText}</div>
            <div class="options">
                ${question.options.map((option, index) => `
                    <div class="option" onclick="selectOption(${index})">
                        <input type="radio" name="question${question.id}" value="${index}" ${answers[currentQuestionIndex] === index ? 'checked' : ''}>
                        <div class="option-text">${option.text}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    updateProgress();
    updateNavigationButtons();
    updateOptionStyles();
}

// 옵션 선택
function selectOption(optionIndex) {
    answers[currentQuestionIndex] = optionIndex;
    updateOptionStyles();
    
    // 설문 진행 상태 저장
    saveSurveyProgress();
    
    // 마지막 질문 선택시 로딩 화면 표시 후 완료 처리
    if (currentQuestionIndex === surveyData.questions.length - 1) {
        setTimeout(() => {
            showLoadingAndComplete();
        }, 300);
        return;
    }
    
    // 자동으로 다음 질문으로
    setTimeout(() => {
        if (currentQuestionIndex < surveyData.questions.length - 1) {
            nextQuestion();
        }
    }, 300);
}

// 로딩 화면 표시 후 설문 완료
function showLoadingAndComplete() {
    const loadingMessages = [
        '🧬 AI가 체질 데이터를 분석하는 중...',
        '🍎 AI가 맞춤 음식을 선별하는 중...',
        '🏃‍♂️ AI가 최적의 운동을 찾는 중...',
        '✨ AI가 결과를 완성하는 중...'
    ];
    
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    loadingOverlay.innerHTML = `
        <div class="loading-content" style="text-align: center; color: white;">
            <div class="loading-icon" style="font-size: 60px; margin-bottom: 20px; animation: pulse 1.5s ease-in-out infinite;">🧬</div>
            <div class="loading-text" id="loadingText" style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">AI 분석중입니다...</div>
            <div class="loading-subtext" style="font-size: 16px; color: #aaa; margin-bottom: 30px;">체질별 맞춤 결과를 준비하고 있어요</div>
            <div class="loading-bar-container" style="width: 300px; height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px; overflow: hidden; margin: 0 auto 15px;">
                <div class="loading-bar" style="height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); border-radius: 3px; width: 0%; animation: loadingProgress 5s ease-out forwards;"></div>
            </div>
            <div class="loading-percentage" id="loadingPercentage" style="font-size: 18px; font-weight: bold;">0%</div>
        </div>
        <style>
            @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.8; }
            }
            @keyframes loadingProgress {
                0% { width: 0%; }
                100% { width: 100%; }
            }
        </style>
    `;
    
    document.body.appendChild(loadingOverlay);
    
    // 메시지 변경 (천천히)
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
        messageIndex++;
        if (messageIndex < loadingMessages.length) {
            const loadingTextElement = document.getElementById('loadingText');
            if (loadingTextElement) {
                loadingTextElement.textContent = loadingMessages[messageIndex];
            }
        }
    }, 1250);
    
    // 퍼센트 애니메이션 (5초에 맞춰 조정)
    let percentage = 0;
    const percentageInterval = setInterval(() => {
        percentage += 2;
        if (percentage > 100) percentage = 100;
        
        const percentageElement = document.getElementById('loadingPercentage');
        if (percentageElement) {
            percentageElement.textContent = Math.round(percentage) + '%';
        }
        
        if (percentage >= 100) {
            clearInterval(percentageInterval);
        }
    }, 100);
    
    // 5초 후 결과 표시
    setTimeout(() => {
        // 모든 interval 정리
        clearInterval(messageInterval);
        clearInterval(percentageInterval);
        
        // 로딩 오버레이 제거
        if (document.body.contains(loadingOverlay)) {
            document.body.removeChild(loadingOverlay);
        }
        
        // 결과 계산 및 표시
        completeSurvey();
    }, 5000);
}

// 옵션 스타일 업데이트
function updateOptionStyles() {
    const options = document.querySelectorAll('.option');
    options.forEach((option, index) => {
        const radio = option.querySelector('input[type="radio"]');
        if (answers[currentQuestionIndex] === index) {
            option.classList.add('selected');
            if (radio) radio.checked = true;
        } else {
            option.classList.remove('selected');
            if (radio) radio.checked = false;
        }
    });
}

// 이전 질문
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
        saveSurveyProgress();
    }
}

// 다음 질문
function nextQuestion() {
    if (answers[currentQuestionIndex] === undefined) {
        alert('답변을 선택해주세요.');
        return;
    }

    if (currentQuestionIndex < surveyData.questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
        saveSurveyProgress();
    }
}

// 진행률 업데이트
function updateProgress() {
    const progress = ((currentQuestionIndex + 1) / surveyData.questions.length) * 100;
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const progressPercentage = document.getElementById('progressPercentage');
    
    if (progressBar) progressBar.style.width = progress + '%';
    if (progressText) progressText.textContent = `진행률 (${currentQuestionIndex + 1}/${surveyData.questions.length})`;
    if (progressPercentage) progressPercentage.textContent = Math.round(progress) + '%';
}

// 네비게이션 버튼 업데이트
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (prevBtn) {
        prevBtn.style.display = currentQuestionIndex === 0 ? 'none' : 'inline-block';
    }
}

// 설문 그만하기
function quitSurvey() {
    const answeredCount = Object.keys(answers).length;
    const progress = Math.round((answeredCount / surveyData.questions.length) * 100);
    
    if (answeredCount === 0) {
        if (confirm('설문을 그만두시겠습니까?')) {
            showHomeContent();
        }
        return;
    }
    
    const message = `지금까지 ${progress}% 완료하셨어요!\n\n설문을 그만두시겠습니까?\n(진행 상태는 저장됩니다)`;
    
    if (confirm(message)) {
        // 진행 상태 저장
        saveSurveyProgress();
        // 홈으로 이동
        showHomeContent();
    }
}

// 설문 완료
async function completeSurvey() {
    // 모든 질문에 답변했는지 확인
    for (let i = 0; i < surveyData.questions.length; i++) {
        if (answers[i] === undefined) {
            alert(`${i + 1}번 질문에 답변이 누락되었습니다.`);
            currentQuestionIndex = i;
            displayQuestion();
            return;
        }
    }

    try {
        // 결과 계산
        const results = calculateResults();
        
        // 전역 변수에 저장 (카카오톡 공유용)
        window.lastSurveyResult = results;
        
        // Firebase에 저장
        if (currentUser && currentUser.loginId) {
            await saveSurveyResult(currentUser.loginId, results);
            // 저장된 설문 진행 상태 삭제 (완료되었으므로)
            clearSurveyProgress(currentUser.loginId);
        }
        
        // 결과 표시
        displayResults(results);
        showResultContent();
        
        setTimeout(() => {
            alert('🎉 축하합니다! in8 진단이 완료되었습니다!');
        }, 500);
        
    } catch (error) {
        console.error('❌ 설문 완료 처리 실패:', error);
        alert('⚠️ 결과 저장 중 오류가 발생했습니다.');
    }
}

// 결과 계산
function calculateResults() {
    const scores = {};
    surveyData.constitutions.forEach(constitution => {
        scores[constitution] = 0;
    });

    // 각 답변의 점수 합산
    for (let questionIndex in answers) {
        const question = surveyData.questions[questionIndex];
        const selectedOptionIndex = answers[questionIndex];
        const selectedOption = question.options[selectedOptionIndex];

        for (let constitution in selectedOption.scores) {
            scores[constitution] += selectedOption.scores[constitution];
        }
    }

    // 점수 정렬
    const sortedResults = Object.entries(scores)
        .sort(([,a], [,b]) => b - a)
        .map(([constitution, score]) => ({ constitution, score }));

    return {
        timestamp: new Date(),
        userInfo: { ...currentUser },
        scores: sortedResults,
        topConstitution: sortedResults[0],
        totalQuestions: surveyData.questions.length,
        answers: { ...answers }
    };
}

// 결과 표시
function displayResults(results) {
    const container = document.getElementById('resultContainer');
    if (!container) return;
    
    // 전역 변수에 저장 (카카오톡 공유용)
    window.lastSurveyResult = results;
    
    const constitutionDetail = constitutionInfo[results.topConstitution.constitution];
    
    container.innerHTML = `
        <div class="summary-card">
            <h3>🎯 ${results.topConstitution.constitution} 체질</h3>
            <p>회원님의 체질일 가능성이 가장 높습니다</p>
            <p><strong>${results.topConstitution.score}점</strong> / 총 ${results.totalQuestions}개 질문</p>
        </div>
        
        <div class="result-section">
            <h2>📊 체질별 점수</h2>
            ${results.scores.map((result, index) => `
                <div class="result-item ${index === 0 ? 'highest-score' : ''}">
                    <div class="result-name">${result.constitution} ${index === 0 ? '(최고 점수)' : ''}</div>
                    <div class="result-score">${result.score}점</div>
                </div>
            `).join('')}
        </div>

        <div class="constitution-details">
            <h3>🌟 ${results.topConstitution.constitution} 체질 특성</h3>
            <p style="margin-bottom: 20px; line-height: 1.6;">${constitutionDetail.description}</p>
            
            <div class="constitution-category">
                <h4>✅ 좋은 음식</h4>
                <ul>
                    ${constitutionDetail.goodFoods.map(food => `<li>${food}</li>`).join('')}
                </ul>
            </div>
            
            <div class="constitution-category">
                <h4>⚠ 피해야 할 음식</h4>
                <ul>
                    ${constitutionDetail.badFoods.map(food => `<li>${food}</li>`).join('')}
                </ul>
            </div>
            
            <div class="constitution-category">
                <h4>🏃‍♂️ 좋은 운동</h4>
                <ul>
                    ${constitutionDetail.goodExercise.map(exercise => `<li>${exercise}</li>`).join('')}
                </ul>
            </div>
            
            <div class="constitution-category">
                <h4>⚠️ 피해야 할 운동</h4>
                <ul>
                    ${constitutionDetail.badExercise.map(exercise => `<li>${exercise}</li>`).join('')}
                </ul>
            </div>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 12px; text-align: center;">
            <small>🕐 검사 완료 시간: ${formatTimestamp(results.timestamp)}</small>
        </div>
        
        <div class="alert alert-info" style="margin-top: 20px;">
            <h4>💡 참고사항</h4>
            <p>본 진단 결과는 음식 선호도를 기반으로 한 체질 분석입니다. 더 정확한 진단을 위해서는 전문의와 상담하시기 바랍니다.</p>
        </div>
    `;
}

/**
 * 최종 결과 카카오톡 공유
 */
function shareFinalResult() {
    // 현재 표시된 결과 가져오기
    const resultContainer = document.getElementById('resultContainer');
    if (!resultContainer || !window.lastSurveyResult) {
        alert('⚠️ 공유할 결과가 없습니다.');
        return;
    }
    
    const result = window.lastSurveyResult;
    const topConstitution = result.topConstitution;
    const constitutionDetail = constitutionInfo[topConstitution.constitution];
    
    if (!constitutionDetail) {
        alert('⚠️ 체질 정보를 찾을 수 없습니다.');
        return;
    }
    
    // 카카오 SDK가 초기화되지 않은 경우 클립보드 복사로 대체
    if (typeof Kakao === 'undefined' || !Kakao.isInitialized()) {
        console.log('💡 카카오톡 API를 사용할 수 없어 클립보드 복사 방식으로 진행합니다.');
        copyFinalResultForKakao(result, constitutionDetail);
        return;
    }
    
    try {
        const userName = currentUser?.name || '사용자';
        
        // 상세 정보 준비
        const goodFoodsList = constitutionDetail.goodFoods.slice(0, 3).join(', ');
        const badFoodsList = constitutionDetail.badFoods.slice(0, 4).join(', ');
        const goodExerciseList = constitutionDetail.goodExercise.slice(0, 2).join(', ');
        const badExerciseList = constitutionDetail.badExercise.slice(0, 3).join(', ');
        
        Kakao.Share.sendDefault({
            objectType: 'text',
            text: `🎉 in8 진단 완료!

👤 ${userName}님의 결과
🎯 ${topConstitution.constitution} 체질 (${topConstitution.score}점)

✅ 좋은 음식
${goodFoodsList} 등

⚠ 피할 음식
${badFoodsList} 등

🏃 좋은 운동
${goodExerciseList} 등

⚠️ 피할 운동
${badExerciseList} 등

💡 ${constitutionDetail.description}

━━━━━━━━━━━━━━━
👇 나도 진단받으려면 아래 버튼 클릭!

${APP_CONFIG.version} | © 2025 Infobank`,
            link: {
                webUrl: window.location.origin,
                mobileWebUrl: window.location.origin
            },
            buttonTitle: '나도 진단하기'
        });

        console.log('✅ 카카오톡 공유 완료');
        
    } catch (error) {
        console.error('❌ 카카오톡 공유 오류:', error);
        alert('💡 카카오톡 직접 공유가 불가하여\n클립보드 복사 방식으로 진행합니다.');
        copyFinalResultForKakao(result, constitutionDetail);
    }
}

/**
 * 최종 결과 카카오톡 수동 공유용 클립보드 복사
 */
function copyFinalResultForKakao(result, constitutionDetail) {
    const userName = currentUser?.name || '사용자';
    const topConstitution = result.topConstitution;
    
    const shareText = `🎉 in8 체질 진단 결과!

👤 ${userName}님의 체질
🎯 ${topConstitution.constitution} (${topConstitution.score}점)

📖 특징
${constitutionDetail.description}

✅ 좋은 음식
${constitutionDetail.goodFoods.slice(0, 10).join(', ')} 등

⚠ 피할 음식
${constitutionDetail.badFoods.slice(0, 10).join(', ')} 등

🏃‍♂️ 좋은 운동
${constitutionDetail.goodExercise.join(', ')}

⚠️ 주의할 운동
${constitutionDetail.badExercise.join(', ')}

━━━━━━━━━━━━━━━
👇 나도 진단받으려면?
${window.location.origin}

${APP_CONFIG.version} | © 2025 Infobank`;

    // 클립보드에 복사
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareText)
            .then(() => {
                alert('📱 카카오톡 공유용 내용이 복사되었습니다!\n\n카카오톡을 열고 원하는 채팅방에서\n붙여넣기(Ctrl+V)하여 공유하세요.\n\n💡 개별 메시지나 단체 채팅 모두 가능합니다!');
            })
            .catch(err => {
                console.error('클립보드 복사 실패:', err);
                showManualCopyModal(shareText);
            });
    } else {
        // Clipboard API를 지원하지 않는 경우
        showManualCopyModal(shareText);
    }
}

/**
 * 수동 복사 모달 표시
 */
function showManualCopyModal(text) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 20px; max-width: 500px; width: 100%;">
            <h3 style="margin-bottom: 20px; color: #FEE500; background: #3C1E1E; padding: 10px; border-radius: 8px; text-align: center;">📱 카카오톡 공유하기</h3>
            <p style="margin-bottom: 15px; color: #666; font-size: 14px;">아래 내용을 복사하여 카카오톡에 공유하세요:</p>
            <textarea readonly style="width: 100%; height: 300px; padding: 15px; border: 2px solid #e1e5e9; border-radius: 10px; font-size: 13px; line-height: 1.6; resize: none;" onclick="this.select()">${text}</textarea>
            <div style="margin-top: 20px; display: flex; gap: 10px;">
                <button onclick="this.parentElement.parentElement.parentElement.remove()" style="flex: 1; padding: 12px; background: #667eea; color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 14px;">닫기</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 텍스트 영역 자동 선택
    const textarea = modal.querySelector('textarea');
    textarea.select();
    
    // 복사 시도
    try {
        document.execCommand('copy');
        alert('📱 카카오톡 공유용 내용이 복사되었습니다!\n\n카카오톡을 열고 원하는 채팅방에서\n붙여넣기(Ctrl+V)하여 공유하세요!');
        modal.remove();
    } catch (err) {
        console.error('복사 실패:', err);
    }
}

// 다시 검사
function restartSurvey() {
    if (confirm('새로운 검사를 시작하시겠습니까?')) {
        currentQuestionIndex = 0;
        answers = {};
        if (currentUser && currentUser.loginId) {
            clearSurveyProgress(currentUser.loginId);
        }
        startSurvey();
    }
}

// 결과 화면에서 홈으로
function showHomeFromResult() {
    showHomeContent();
}

// Firebase 관련 함수들 (firebase-service.js에 정의되어 있어야 함)
// getSurveyData, getDefaultSurveyData, saveSurveyResult 등


// ===== 검사기록 관련 함수들 =====

// 검사기록 화면 표시
function showHistoryContent() {
    const homeContent = document.getElementById('homeContent');
    const loginContent = document.getElementById('loginContent');
    const surveyContent = document.getElementById('surveyContent');
    const resultContent = document.getElementById('resultContent');
    const historyContent = document.getElementById('historyContent');
    const adminContent = document.getElementById('adminContent');
    const dietTableContent = document.getElementById('dietTableContent');
    const familyContent = document.getElementById('familyContent');
    const questionContent = document.getElementById('questionContent');
    const hospitalContent = document.getElementById('hospitalContent');
    const aiChatContent = document.getElementById('aiChatContent');
    
    if (homeContent) homeContent.classList.add('hidden');
    if (loginContent) loginContent.classList.add('hidden');
    if (surveyContent) surveyContent.classList.add('hidden');
    if (resultContent) resultContent.classList.add('hidden');
    if (adminContent) adminContent.classList.add('hidden');
    if (dietTableContent) dietTableContent.classList.add('hidden');
    if (familyContent) familyContent.classList.add('hidden');
    if (questionContent) questionContent.classList.add('hidden');
    if (hospitalContent) hospitalContent.classList.add('hidden');
    if (aiChatContent) aiChatContent.classList.add('hidden');

    if (historyContent) historyContent.classList.remove('hidden');
    
    // 검사기록 불러오기
    loadUserHistory();
}

// 사용자 검사기록 불러오기
async function loadUserHistory() {
    if (!currentUser || !currentUser.loginId) {
        alert('로그인이 필요한 서비스입니다.');
        showHomeContent();
        return;
    }
    
    const historyContainer = document.getElementById('historyContainer');
    if (!historyContainer) return;
    
    // 로딩 표시
    historyContainer.innerHTML = '<div style="text-align: center; padding: 40px;"><p>설문 기록을 불러오는 중...</p></div>';
    
    try {
        // Firebase에서 사용자의 검사 결과 가져오기
        const results = await getUserSurveyResults(currentUser.loginId);
        
        if (!results || results.length === 0) {
            historyContainer.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 20px;">📝</div>
                    <h3 style="color: #666; margin-bottom: 10px;">아직 설문 기록이 없습니다</h3>
                    <p style="color: #999;">첫 번째 8체질 검사를 시작해보세요!</p>
                </div>
            `;
            return;
        }
        
        // 검사 기록 표시
        displayUserHistory(results);
        
    } catch (error) {
        console.error('❌ 설문 기록 불러오기 실패:', error);
        historyContainer.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
                <h3 style="color: #666; margin-bottom: 10px;">설문 기록을 불러올 수 없습니다</h3>
                <p style="color: #999;">잠시 후 다시 시도해주세요.</p>
            </div>
        `;
    }
}

// 사용자의 검사 결과 가져오기 (Firebase)
async function getUserSurveyResults(userId) {
    if (!userId) return [];
    
    try {
        console.log('📊 사용자 설문 결과 조회:', userId);
        
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            const db = firebase.firestore();
            
            // 여러 쿼리 패턴 시도
            let snapshot;
            
            // 패턴 1: userInfo.loginId로 조회
            try {
                snapshot = await db.collection('surveys')
                    .where('userInfo.loginId', '==', userId)
                    .orderBy('timestamp', 'desc')
                    .limit(10)
                    .get();
                    
                if (!snapshot.empty) {
                    console.log('✅ 패턴 1 성공:', snapshot.size, '개 결과');
                }
            } catch (error) {
                console.log('⚠️ 패턴 1 실패, 패턴 2 시도');
                
                // 패턴 2: userId 필드로 조회
                try {
                    snapshot = await db.collection('surveys')
                        .where('userId', '==', userId)
                        .orderBy('timestamp', 'desc')
                        .limit(10)
                        .get();
                        
                    if (!snapshot.empty) {
                        console.log('✅ 패턴 2 성공:', snapshot.size, '개 결과');
                    }
                } catch (error2) {
                    console.log('⚠️ 패턴 2 실패, 전체 조회 시도');
                    
                    // 패턴 3: 전체 조회 후 필터링
                    snapshot = await db.collection('surveys')
                        .orderBy('timestamp', 'desc')
                        .limit(50)
                        .get();
                }
            }
            
            if (!snapshot || snapshot.empty) {
                console.log('⚠️ 설문 결과 없음');
                return [];
            }
            
            const results = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                // userId가 일치하는 결과만 필터링
                if (data.userInfo && 
                    (data.userInfo.loginId === userId || 
                     data.userId === userId)) {
                    results.push({
                        id: doc.id,
                        ...data
                    });
                }
            });
            
            console.log('✅ 최종 필터링 결과:', results.length, '개');
            return results;
        }
    } catch (error) {
        console.error('❌ Firebase에서 검사 결과 가져오기 실패:', error);
    }
    
    return [];
}

// 검사 기록 표시
function displayUserHistory(results) {
    const historyContainer = document.getElementById('historyContainer');
    if (!historyContainer) return;
    
    let historyHTML = '<div class="history-list">';
    
    results.forEach((result, index) => {
        const date = result.timestamp ? new Date(result.timestamp.seconds * 1000) : new Date();
        const dateStr = formatTimestamp(date);
        
        const topConstitution = result.topConstitution || result.scores[0];
        const constitutionName = topConstitution.constitution;
        const score = topConstitution.score;
        
        historyHTML += `
            <div class="history-item" onclick="viewHistoryDetail('${result.id}')">
                <div class="history-header">
                    <div class="history-number">#${index + 1}</div>
                    <div class="history-date">${dateStr}</div>
                </div>
                <div class="history-result">
                    <div class="history-constitution">${constitutionName} 체질</div>
                    <div class="history-score">${score}점</div>
                </div>
                <div class="history-footer">
                    <button class="view-detail-btn" onclick="event.stopPropagation(); viewHistoryDetail('${result.id}')">
                        상세보기 →
                    </button>
                </div>
            </div>
        `;
    });
    
    historyHTML += '</div>';
    historyContainer.innerHTML = historyHTML;
}

// 검사 기록 상세보기
async function viewHistoryDetail(resultId) {
    if (!resultId) return;
    
    try {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            const doc = await firebase.firestore()
                .collection('surveys')
                .doc(resultId)
                .get();
            
            if (doc.exists) {
                const result = doc.data();
                displayResults(result);
                showResultContent();
            }
        }
    } catch (error) {
        console.error('검사 결과 상세 정보 불러오기 실패:', error);
        alert('검사 결과를 불러올 수 없습니다.');
    }
}

// 검사기록에서 홈으로
function showHomeFromHistory() {
    showHomeContent();
}


// ===== 관리자 화면 관련 함수들 =====

// 관리자 화면 표시
function showAdminContent() {
    const homeContent = document.getElementById('homeContent');
    const loginContent = document.getElementById('loginContent');
    const surveyContent = document.getElementById('surveyContent');
    const resultContent = document.getElementById('resultContent');
    const historyContent = document.getElementById('historyContent');
    const adminContent = document.getElementById('adminContent');
    const dietTableContent = document.getElementById('dietTableContent');
    const familyContent = document.getElementById('familyContent');
    const questionContent = document.getElementById('questionContent');
    const hospitalContent = document.getElementById('hospitalContent');
    const aiChatContent = document.getElementById('aiChatContent');
    
    if (homeContent) homeContent.classList.add('hidden');
    if (loginContent) loginContent.classList.add('hidden');
    if (surveyContent) surveyContent.classList.add('hidden');
    if (resultContent) resultContent.classList.add('hidden');
    if (historyContent) historyContent.classList.add('hidden');
    if (dietTableContent) dietTableContent.classList.add('hidden');
    if (familyContent) familyContent.classList.add('hidden');
    if (questionContent) questionContent.classList.add('hidden');
    if (hospitalContent) hospitalContent.classList.add('hidden');
    if (aiChatContent) aiChatContent.classList.add('hidden');

    if (adminContent) adminContent.classList.remove('hidden');
    
    // 관리자 정보 표시
    if (currentUser) {
        const adminUserInfo = document.getElementById('adminUserInfo');
        if (adminUserInfo) {
            adminUserInfo.textContent = currentUser.displayName || currentUser.name || 'Admin';
        }
        
        // 관리자 데이터 로드
        loadAdminData();
        
        // 엑셀 드래그/드롭 초기화
        setTimeout(() => {
            if (typeof setupExcelDropZone === 'function') {
                setupExcelDropZone();
            }
        }, 100);
    }
}

// 관리자 데이터 로드
async function loadAdminData() {
    try {
        // 현재 설문 정보 로드
        const surveyData = await getSurveyData();
        const currentSurveyInfo = document.getElementById('currentSurveyInfo');
        if (currentSurveyInfo && surveyData && surveyData.questions) {
            currentSurveyInfo.textContent = `${surveyData.questions.length}개 질문`;
        }
    } catch (error) {
        console.error('관리자 데이터 로드 실패:', error);
        const currentSurveyInfo = document.getElementById('currentSurveyInfo');
        if (currentSurveyInfo) {
            currentSurveyInfo.textContent = '로드 실패';
        }
    }
}

// 관리자 화면에서 홈으로
function showHomeFromAdmin() {
    showHomeContent();
}


// ===== 로딩 오버레이 함수들 =====

function showLoadingOverlay(message = '로딩 중...') {
    // 기존 로딩 오버레이 제거
    hideLoadingOverlay();
    
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    `;
    
    overlay.innerHTML = `
        <div style="text-align: center; color: white;">
            <div class="loading-spinner" style="
                border: 4px solid #f3f3f3;
                border-top: 4px solid #4CAF50;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            "></div>
            <div style="font-size: 16px; font-weight: 500;">${message}</div>
        </div>
    `;
    
    // 애니메이션 추가
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(overlay);
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

// ==================== 바로가기 아이콘 생성 기능 ====================

// OS 감지 함수
function detectOS() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    // iOS 감지
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return 'iOS';
    }
    
    // Android 감지
    if (/android/i.test(userAgent)) {
        return 'Android';
    }
    
    // Windows 감지
    if (/Windows/.test(userAgent)) {
        return 'Windows';
    }
    
    // Mac 감지
    if (/Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent)) {
        return 'Mac';
    }
    
    // Linux 감지
    if (/Linux/.test(userAgent)) {
        return 'Linux';
    }
    
    return 'PC';
}

// 브라우저 감지 함수
function detectBrowser() {
    const userAgent = navigator.userAgent;
    
    if (userAgent.indexOf("Chrome") > -1 && userAgent.indexOf("Edg") === -1) {
        return 'Chrome';
    } else if (userAgent.indexOf("Safari") > -1 && userAgent.indexOf("Chrome") === -1) {
        return 'Safari';
    } else if (userAgent.indexOf("Firefox") > -1) {
        return 'Firefox';
    } else if (userAgent.indexOf("Edg") > -1) {
        return 'Edge';
    } else if (userAgent.indexOf("Samsung") > -1) {
        return 'Samsung';
    }
    
    return 'Other';
}

// PWA 설치 가능 여부 확인
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('PWA 설치 가능');
});

// 설치 가이드 표시
function showInstallGuide() {
    const os = detectOS();
    const browser = detectBrowser();
    
    console.log('감지된 OS:', os);
    console.log('감지된 브라우저:', browser);
    
    // PWA 설치 프롬프트가 있으면 바로 실행
    if (deferredPrompt && (os === 'Android' || os === 'Windows' || os === 'Linux' || os === 'Mac')) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('사용자가 PWA 설치를 수락했습니다');
            } else {
                console.log('사용자가 PWA 설치를 거부했습니다');
            }
            deferredPrompt = null;
        });
        return;
    }
    
    // 모달 생성
    createInstallModal(os, browser);
}

// 설치 모달 생성
function createInstallModal(os, browser) {
    // 기존 모달 제거
    const existingModal = document.getElementById('installModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'installModal';
    modal.className = 'install-modal';
    
    let content = '';
    
    if (os === 'iOS') {
        content = getIOSInstallGuide(browser);
    } else if (os === 'Android') {
        content = getAndroidInstallGuide(browser);
    } else {
        content = getPCInstallGuide(os, browser);
    }
    
    modal.innerHTML = `
        <div class="install-modal-content">
            <button class="install-modal-close" onclick="closeInstallModal()">×</button>
            ${content}
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 애니메이션을 위해 약간의 지연
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    // 모달 외부 클릭시 닫기
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeInstallModal();
        }
    });
}

// iOS 설치 가이드
function getIOSInstallGuide(browser) {
    if (browser !== 'Safari') {
        return `
            <h2 class="install-modal-title">📱 Safari로 열어주세요</h2>
            <p class="install-modal-subtitle">iOS에서는 Safari 브라우저를 사용해야 홈 화면에 추가할 수 있습니다.</p>
            <div class="install-steps">
                <div class="install-step">
                    <span class="install-step-number">1</span>
                    <div class="install-step-content">
                        <div class="install-step-title">Safari 브라우저 열기</div>
                        <div class="install-step-description">
                            이 페이지 URL을 복사한 후 Safari 브라우저에서 열어주세요.
                        </div>
                    </div>
                </div>
                <div class="install-step">
                    <span class="install-step-number">2</span>
                    <div class="install-step-content">
                        <div class="install-step-title">아래 안내를 따라주세요</div>
                        <div class="install-step-description">
                            Safari에서 열면 홈 화면 추가 방법이 안내됩니다.
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    return `
        <h2 class="install-modal-title">📱 홈 화면에 추가하기</h2>
        <p class="install-modal-subtitle">iPhone/iPad 홈 화면에 in8 아이콘을 추가하세요</p>
        <div class="install-steps">
            <div class="install-step">
                <span class="install-step-number">1</span>
                <div class="install-step-content">
                    <div class="install-step-title">
                        <span class="install-step-icon">📤</span>
                        공유 버튼 누르기
                    </div>
                    <div class="install-step-description">
                        화면 하단 또는 상단의 <strong>공유</strong> 버튼을 누릅니다.
                    </div>
                </div>
            </div>
            <div class="install-step">
                <span class="install-step-number">2</span>
                <div class="install-step-content">
                    <div class="install-step-title">
                        <span class="install-step-icon">➕</span>
                        홈 화면에 추가 선택
                    </div>
                    <div class="install-step-description">
                        메뉴에서 <strong>"홈 화면에 추가"</strong>를 찾아 선택합니다.
                    </div>
                </div>
            </div>
            <div class="install-step">
                <span class="install-step-number">3</span>
                <div class="install-step-content">
                    <div class="install-step-title">
                        <span class="install-step-icon">✅</span>
                        추가 버튼 누르기
                    </div>
                    <div class="install-step-description">
                        우측 상단의 <strong>"추가"</strong> 버튼을 눌러 완료합니다.
                    </div>
                </div>
            </div>
        </div>
        <div class="install-note">
            <p class="install-note-text">
                💡 홈 화면에 추가하면 앱처럼 빠르게 실행할 수 있어요!
            </p>
        </div>
    `;
}

// Android 설치 가이드
function getAndroidInstallGuide(browser) {
    return `
        <h2 class="install-modal-title">📱 홈 화면에 추가하기</h2>
        <p class="install-modal-subtitle">Android 홈 화면에 in8 아이콘을 추가하세요</p>
        <div class="install-steps">
            <div class="install-step">
                <span class="install-step-number">1</span>
                <div class="install-step-content">
                    <div class="install-step-title">
                        <span class="install-step-icon">⋮</span>
                        메뉴 열기
                    </div>
                    <div class="install-step-description">
                        ${browser === 'Chrome' ? '화면 우측 상단의 <strong>점 3개 (⋮)</strong> 메뉴를 누릅니다.' : '브라우저 메뉴를 엽니다.'}
                    </div>
                </div>
            </div>
            <div class="install-step">
                <span class="install-step-number">2</span>
                <div class="install-step-content">
                    <div class="install-step-title">
                        <span class="install-step-icon">📲</span>
                        홈 화면에 추가 선택
                    </div>
                    <div class="install-step-description">
                        메뉴에서 <strong>"홈 화면에 추가"</strong> 또는 <strong>"앱 설치"</strong>를 선택합니다.
                    </div>
                </div>
            </div>
            <div class="install-step">
                <span class="install-step-number">3</span>
                <div class="install-step-content">
                    <div class="install-step-title">
                        <span class="install-step-icon">✅</span>
                        설치 확인
                    </div>
                    <div class="install-step-description">
                        팝업이 나타나면 <strong>"설치"</strong> 또는 <strong>"추가"</strong> 버튼을 눌러 완료합니다.
                    </div>
                </div>
            </div>
        </div>
        <div class="install-note">
            <p class="install-note-text">
                💡 설치 후 홈 화면에서 앱처럼 사용할 수 있어요!
            </p>
        </div>
    `;
}

// PC 설치 가이드
function getPCInstallGuide(os, browser) {
    let browserName = browser === 'Chrome' ? 'Chrome' : browser === 'Edge' ? 'Edge' : '브라우저';
    
    if (browser === 'Chrome' || browser === 'Edge') {
        return `
            <h2 class="install-modal-title">💻 바탕화면에 추가하기</h2>
            <p class="install-modal-subtitle">${os} ${browserName}에서 in8 바로가기를 만드세요</p>
            <div class="install-steps">
                <div class="install-step">
                    <span class="install-step-number">1</span>
                    <div class="install-step-content">
                        <div class="install-step-title">
                            <span class="install-step-icon">🔗</span>
                            주소창 확인
                        </div>
                        <div class="install-step-description">
                            주소창 우측에 <strong>설치 아이콘 (⊕ 또는 💻)</strong>이 있는지 확인합니다.
                        </div>
                    </div>
                </div>
                <div class="install-step">
                    <span class="install-step-number">2</span>
                    <div class="install-step-content">
                        <div class="install-step-title">
                            <span class="install-step-icon">⋮</span>
                            메뉴에서 설치
                        </div>
                        <div class="install-step-description">
                            아이콘이 없다면 우측 상단 <strong>점 3개 (⋮)</strong> 메뉴 → <strong>"앱 설치"</strong> 또는 <strong>"in8 설치"</strong>를 선택합니다.
                        </div>
                    </div>
                </div>
                <div class="install-step">
                    <span class="install-step-number">3</span>
                    <div class="install-step-content">
                        <div class="install-step-title">
                            <span class="install-step-icon">✅</span>
                            설치 완료
                        </div>
                        <div class="install-step-description">
                            팝업에서 <strong>"설치"</strong> 버튼을 클릭하면 바탕화면에 바로가기가 생성됩니다.
                        </div>
                    </div>
                </div>
            </div>
            <div class="install-note">
                <p class="install-note-text">
                    💡 설치하면 독립된 창에서 실행되어 더 편리해요!
                </p>
            </div>
        `;
    } else if (browser === 'Safari') {
        return `
            <h2 class="install-modal-title">💻 Dock에 추가하기</h2>
            <p class="install-modal-subtitle">Mac Safari에서 in8 바로가기를 만드세요</p>
            <div class="install-steps">
                <div class="install-step">
                    <span class="install-step-number">1</span>
                    <div class="install-step-content">
                        <div class="install-step-title">
                            <span class="install-step-icon">⌘</span>
                            북마크 추가
                        </div>
                        <div class="install-step-description">
                            <strong>Command(⌘) + D</strong>를 눌러 북마크를 추가합니다.
                        </div>
                    </div>
                </div>
                <div class="install-step">
                    <span class="install-step-number">2</span>
                    <div class="install-step-content">
                        <div class="install-step-title">
                            <span class="install-step-icon">📋</span>
                            북마크바에 저장
                        </div>
                        <div class="install-step-description">
                            위치를 <strong>"즐겨찾기"</strong>로 선택하여 저장합니다.
                        </div>
                    </div>
                </div>
            </div>
            <div class="install-note">
                <p class="install-note-text">
                    💡 즐겨찾기바에서 빠르게 접속할 수 있어요!
                </p>
            </div>
        `;
    } else {
        return `
            <h2 class="install-modal-title">💻 바로가기 만들기</h2>
            <p class="install-modal-subtitle">${os}에서 in8 바로가기를 만드세요</p>
            <div class="install-steps">
                <div class="install-step">
                    <span class="install-step-number">1</span>
                    <div class="install-step-content">
                        <div class="install-step-title">
                            <span class="install-step-icon">🔖</span>
                            북마크 추가
                        </div>
                        <div class="install-step-description">
                            <strong>Ctrl + D</strong> (Mac: Command + D)를 눌러 북마크를 추가합니다.
                        </div>
                    </div>
                </div>
                <div class="install-step">
                    <span class="install-step-number">2</span>
                    <div class="install-step-content">
                        <div class="install-step-title">
                            <span class="install-step-icon">📌</span>
                            바로가기 고정
                        </div>
                        <div class="install-step-description">
                            북마크바에 추가하거나 브라우저 설정에서 바탕화면 바로가기를 만듭니다.
                        </div>
                    </div>
                </div>
            </div>
            <div class="install-note">
                <p class="install-note-text">
                    💡 Chrome이나 Edge 브라우저를 사용하면 앱처럼 설치할 수 있어요!
                </p>
            </div>
        `;
    }
}

// 모달 닫기
function closeInstallModal() {
    const modal = document.getElementById('installModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

/**
 * 체질 정보 새로고침 함수 (전역 - survey.js에서 호출 가능)
 * 설문 완료 후 프로필에 체질 정보를 즉시 업데이트
 */
window.refreshUserConstitutionInfo = async function() {
    console.log('🔄 체질 정보 새로고침 시작');
    
    const savedUser = localStorage.getItem('currentUser');
    if (!savedUser) {
        console.log('⚠️ 저장된 사용자 정보 없음');
        return;
    }
    
    try {
        currentUser = JSON.parse(savedUser);
        
        // Firebase에서 최신 사용자 정보 가져오기
        if (currentUser.loginId && typeof firebase !== 'undefined' && firebase.firestore) {
            try {
                const userDoc = await firebase.firestore().collection('users').doc(currentUser.loginId).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    console.log('🔄 Firebase에서 최신 체질 정보 로드:', userData.lastConstitution);
                    
                    // 체질 정보 업데이트
                    if (userData.lastConstitution) {
                        currentUser.lastConstitution = userData.lastConstitution;
                        currentUser.lastConstitutionScore = userData.lastConstitutionScore || null;
                        
                        // 로컬 스토리지 업데이트
                        localStorage.setItem('currentUser', JSON.stringify(currentUser));
                        console.log('✅ 체질 정보 localStorage 업데이트 완료:', currentUser.lastConstitution);
                    }
                }
            } catch (error) {
                console.warn('⚠️ Firebase 체질 정보 로드 실패:', error);
            }
        }
        
        // UI 즉시 업데이트
        updateUserInterface(currentUser);
        console.log('✅ 프로필 UI 새로고침 완료');
        
    } catch (error) {
        console.error('❌ 체질 정보 새로고침 실패:', error);
    }
};

// ==================== 섭생표 관련 함수 ====================

// 섭생표로 이동
function goToDietTable() {
    showDietTableContent();
    closeDrawer();
}

// 섭생표 화면 표시
function showDietTableContent() {
    const homeContent = document.getElementById('homeContent');
    const loginContent = document.getElementById('loginContent');
    const surveyContent = document.getElementById('surveyContent');
    const resultContent = document.getElementById('resultContent');
    const historyContent = document.getElementById('historyContent');
    const adminContent = document.getElementById('adminContent');
    const dietTableContent = document.getElementById('dietTableContent');
    const familyContent = document.getElementById('familyContent');
    const questionContent = document.getElementById('questionContent');
    const hospitalContent = document.getElementById('hospitalContent');
    const aiChatContent = document.getElementById('aiChatContent');
    
    if (homeContent) homeContent.classList.add('hidden');
    if (loginContent) loginContent.classList.add('hidden');
    if (surveyContent) surveyContent.classList.add('hidden');
    if (resultContent) resultContent.classList.add('hidden');
    if (historyContent) historyContent.classList.add('hidden');
    if (adminContent) adminContent.classList.add('hidden');
    if (familyContent) familyContent.classList.add('hidden');
    if (questionContent) questionContent.classList.add('hidden');
    if (hospitalContent) hospitalContent.classList.add('hidden');
    if (aiChatContent) aiChatContent.classList.add('hidden');

    if (dietTableContent) dietTableContent.classList.remove('hidden');
    
    // 하단 네비게이션 활성화 상태 업데이트
    updateBottomNav('dietTable');
}

// 섭생표에서 홈으로
function showHomeFromDietTable() {
    showHomeContent();
}

// ==================== 우리가족 관련 함수 ====================

// 가족 데이터 키
const FAMILY_DATA_KEY = 'familyMembers';

// 선택된 체질 저장
let selectedFamilyConstitution = '';

// 우리가족으로 이동
function goToFamily() {
    // 로그인 체크
    if (!currentUser) {
        alert('로그인이 필요한 서비스입니다.');
        toggleLoginScreen();
        return;
    }
    
    showFamilyContent();
    closeDrawer();
    loadFamilyList();
}

// 우리가족 화면 표시
function showFamilyContent() {
    const homeContent = document.getElementById('homeContent');
    const loginContent = document.getElementById('loginContent');
    const surveyContent = document.getElementById('surveyContent');
    const resultContent = document.getElementById('resultContent');
    const historyContent = document.getElementById('historyContent');
    const adminContent = document.getElementById('adminContent');
    const dietTableContent = document.getElementById('dietTableContent');
    const familyContent = document.getElementById('familyContent');
    const questionContent = document.getElementById('questionContent');
    const hospitalContent = document.getElementById('hospitalContent');
    const aiChatContent = document.getElementById('aiChatContent');
    
    if (homeContent) homeContent.classList.add('hidden');
    if (loginContent) loginContent.classList.add('hidden');
    if (surveyContent) surveyContent.classList.add('hidden');
    if (resultContent) resultContent.classList.add('hidden');
    if (historyContent) historyContent.classList.add('hidden');
    if (adminContent) adminContent.classList.add('hidden');
    if (dietTableContent) dietTableContent.classList.add('hidden');
    if (questionContent) questionContent.classList.add('hidden');
    if (hospitalContent) hospitalContent.classList.add('hidden');
    if (aiChatContent) aiChatContent.classList.add('hidden');
    if (familyContent) familyContent.classList.remove('hidden');
}

// 우리가족에서 홈으로
function showHomeFromFamily() {
    showHomeContent();
    clearFamilySearch();
}

// 가족 등록 팝업 표시
function showAddFamilyPopup() {
    document.getElementById('addFamilyPopup').style.display = 'flex';
    document.getElementById('familyNameInput').value = '';
    selectedFamilyConstitution = '';
    
    // 모든 체질 버튼 선택 해제
    document.querySelectorAll('.constitution-select-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
}

// 가족 등록 팝업 닫기
function closeAddFamilyPopup() {
    document.getElementById('addFamilyPopup').style.display = 'none';
}

// 체질 선택
function selectFamilyConstitution(constitution) {
    selectedFamilyConstitution = constitution;
    
    // 모든 버튼에서 selected 클래스 제거
    document.querySelectorAll('.constitution-select-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // 선택한 버튼에 selected 클래스 추가
    event.target.closest('.constitution-select-btn').classList.add('selected');
}

// 가족 구성원 추가
async function addFamilyMember() {
    const nameInput = document.getElementById('familyNameInput');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('이름을 입력해주세요.');
        return;
    }
    
    if (!selectedFamilyConstitution) {
        alert('체질을 선택해주세요.');
        return;
    }
    
    try {
        // 가족 데이터 가져오기 (Firebase 우선, 없으면 localStorage)
        let familyMembers = [];
        
        if (currentUser && currentUser.loginId) {
            // 로그인한 경우 Firebase에서 가져오기
            try {
                familyMembers = await getFamilyMembers(currentUser.loginId);
            } catch (error) {
                console.warn('Firebase에서 가족 정보 로드 실패, localStorage 사용:', error);
                familyMembers = JSON.parse(localStorage.getItem(FAMILY_DATA_KEY) || '[]');
            }
        } else {
            // 로그인하지 않은 경우 localStorage 사용
            familyMembers = JSON.parse(localStorage.getItem(FAMILY_DATA_KEY) || '[]');
        }
        
        // 중복 이름 체크
        if (familyMembers.some(member => member.name === name)) {
            alert('이미 등록된 이름입니다.');
            return;
        }
        
        // 새 가족 구성원 추가
        const newMember = {
            id: Date.now().toString(),
            name: name,
            constitution: selectedFamilyConstitution,
            createdAt: new Date().toISOString()
        };
        
        familyMembers.push(newMember);
        
        // Firebase와 로컬스토리지 모두에 저장
        if (currentUser && currentUser.loginId) {
            // Firebase에 저장
            await saveFamilyMembers(currentUser.loginId, familyMembers);
        }
        
        // 로컬 스토리지에도 저장 (캐시)
        localStorage.setItem(FAMILY_DATA_KEY, JSON.stringify(familyMembers));
        
        // 팝업 닫기
        closeAddFamilyPopup();
        
        // 가족 목록 새로고침
        await loadFamilyList();
        
        alert(`${name}님이 등록되었습니다.`);
    } catch (error) {
        console.error('가족 추가 실패:', error);
        alert('가족 등록 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// 가족 목록 불러오기
async function loadFamilyList() {
    try {
        let familyMembers = [];
        
        // 로그인한 경우 Firebase에서 가져오기
        if (currentUser && currentUser.loginId) {
            try {
                familyMembers = await getFamilyMembers(currentUser.loginId);
                // 로컬스토리지에도 캐싱
                localStorage.setItem(FAMILY_DATA_KEY, JSON.stringify(familyMembers));
            } catch (error) {
                console.warn('Firebase에서 가족 정보 로드 실패, localStorage 사용:', error);
                familyMembers = JSON.parse(localStorage.getItem(FAMILY_DATA_KEY) || '[]');
            }
        } else {
            // 로그인하지 않은 경우 localStorage 사용
            familyMembers = JSON.parse(localStorage.getItem(FAMILY_DATA_KEY) || '[]');
        }
        
        const container = document.getElementById('familyListContainer');
        const noFamilyMessage = document.getElementById('noFamilyMessage');
        
        if (familyMembers.length === 0) {
            container.innerHTML = '';
            noFamilyMessage.style.display = 'block';
            return;
        }
        
        noFamilyMessage.style.display = 'none';
        
        // 체질 아이콘 매핑
        const constitutionIcons = {
            '목양': '🌳',
            '목음': '🌲',
            '토양': '🏔️',
            '토음': '⛰️',
            '금양': '⚡',
            '금음': '💫',
            '수양': '💧',
            '수음': '🌊'
        };
        
        container.innerHTML = familyMembers.map(member => `
            <div class="family-card" onclick="viewFamilyDietTable('${member.constitution}')">
                <button class="family-card-delete" onclick="event.stopPropagation(); deleteFamilyMember('${member.id}')">×</button>
                <div class="family-card-icon">${constitutionIcons[member.constitution] || '👤'}</div>
                <div class="family-card-name">${member.name}</div>
                <div class="family-card-constitution">${member.constitution}체질</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('가족 목록 로드 실패:', error);
        // 에러 발생 시 localStorage에서 시도
        const familyMembers = JSON.parse(localStorage.getItem(FAMILY_DATA_KEY) || '[]');
        const container = document.getElementById('familyListContainer');
        const noFamilyMessage = document.getElementById('noFamilyMessage');
        
        if (familyMembers.length === 0) {
            container.innerHTML = '';
            noFamilyMessage.style.display = 'block';
        }
    }
}

// 가족 구성원 삭제
async function deleteFamilyMember(memberId) {
    if (!confirm('정말 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        // 가족 데이터 가져오기
        let familyMembers = [];
        
        if (currentUser && currentUser.loginId) {
            // Firebase에서 가져오기
            try {
                familyMembers = await getFamilyMembers(currentUser.loginId);
            } catch (error) {
                console.warn('Firebase에서 가족 정보 로드 실패, localStorage 사용:', error);
                familyMembers = JSON.parse(localStorage.getItem(FAMILY_DATA_KEY) || '[]');
            }
        } else {
            // localStorage에서 가져오기
            familyMembers = JSON.parse(localStorage.getItem(FAMILY_DATA_KEY) || '[]');
        }
        
        // 해당 구성원 삭제
        familyMembers = familyMembers.filter(member => member.id !== memberId);
        
        // Firebase와 localStorage 모두 업데이트
        if (currentUser && currentUser.loginId) {
            await saveFamilyMembers(currentUser.loginId, familyMembers);
        }
        localStorage.setItem(FAMILY_DATA_KEY, JSON.stringify(familyMembers));
        
        // 목록 새로고침
        await loadFamilyList();
    } catch (error) {
        console.error('가족 삭제 실패:', error);
        alert('가족 삭제 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// 가족의 섭생표 보기
function viewFamilyDietTable(constitution) {
    // 섭생표로 이동
    showDietTableContent();
    
    // 해당 체질 자동 선택
    setTimeout(() => {
        selectConstitution(constitution);
    }, 100);
}

// 가족용 음식 검색
async function searchFoodForFamily() {
    const searchInput = document.getElementById('familySearchInput');
    const clearBtn = document.getElementById('familyClearBtn');
    const searchResults = document.getElementById('familySearchResults');
    const resultsContainer = document.getElementById('familySearchResultsContainer');
    
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (searchTerm) {
        clearBtn.style.display = 'flex';
    } else {
        clearBtn.style.display = 'none';
        searchResults.classList.add('hidden');
        return;
    }
    
    try {
        // 가족 구성원 가져오기 (Firebase 우선)
        let familyMembers = [];
        
        if (currentUser && currentUser.loginId) {
            try {
                familyMembers = await getFamilyMembers(currentUser.loginId);
            } catch (error) {
                console.warn('Firebase에서 가족 정보 로드 실패, localStorage 사용:', error);
                familyMembers = JSON.parse(localStorage.getItem(FAMILY_DATA_KEY) || '[]');
            }
        } else {
            familyMembers = JSON.parse(localStorage.getItem(FAMILY_DATA_KEY) || '[]');
        }
        
        if (familyMembers.length === 0) {
            resultsContainer.innerHTML = '<p style="text-align: center; color: #999;">등록된 가족이 없습니다.</p>';
            searchResults.classList.remove('hidden');
            return;
        }
        
        // 음식 데이터에서 검색
        const matchedFoods = dietData.filter(food => 
            food.음식명.toLowerCase().includes(searchTerm)
        );
        
        if (matchedFoods.length === 0) {
            resultsContainer.innerHTML = '<p style="text-align: center; color: #999;">검색 결과가 없습니다.</p>';
            searchResults.classList.remove('hidden');
            return;
        }
        
        // 검색 결과 표시 (최대 5개)
        const displayFoods = matchedFoods.slice(0, 5);
        
        resultsContainer.innerHTML = displayFoods.map(food => {
            const ratingsHtml = familyMembers.map(member => {
                const rating = food[member.constitution];
                const ratingClass = getRatingClass(rating);
                const ratingText = getRatingText(rating);
                
                return `
                    <div class="family-rating-item">
                        <span class="family-rating-name">${member.name}</span>
                        <span class="rating-badge ${ratingClass}">${ratingText}</span>
                    </div>
                `;
            }).join('');
            
            return `
                <div class="food-search-result-item">
                    <div class="food-search-result-name">${food.음식명}</div>
                    <div class="food-search-result-ratings">
                        ${ratingsHtml}
                    </div>
                </div>
            `;
        }).join('');
        
        searchResults.classList.remove('hidden');
    } catch (error) {
        console.error('음식 검색 실패:', error);
        resultsContainer.innerHTML = '<p style="text-align: center; color: #999;">검색 중 오류가 발생했습니다.</p>';
        searchResults.classList.remove('hidden');
    }
}

// 가족 검색 초기화
function clearFamilySearch() {
    document.getElementById('familySearchInput').value = '';
    document.getElementById('familyClearBtn').style.display = 'none';
    document.getElementById('familySearchResults').classList.add('hidden');
}

// ==================== 질문하기 게시판 관련 함수 ====================

// 현재 선택된 질문 ID
let currentQuestionId = null;

// 질문하기로 이동
function goToQuestion() {
    // 로그인 체크
    if (!currentUser) {
        alert('로그인이 필요한 서비스입니다.');
        toggleLoginScreen();
        return;
    }
    
    showQuestionContent();
    closeDrawer();
    loadQuestionList();
}

// 질문하기 화면 표시
function showQuestionContent() {
    const homeContent = document.getElementById('homeContent');
    const loginContent = document.getElementById('loginContent');
    const surveyContent = document.getElementById('surveyContent');
    const resultContent = document.getElementById('resultContent');
    const historyContent = document.getElementById('historyContent');
    const adminContent = document.getElementById('adminContent');
    const dietTableContent = document.getElementById('dietTableContent');
    const familyContent = document.getElementById('familyContent');
    const questionContent = document.getElementById('questionContent');
    const hospitalContent = document.getElementById('hospitalContent');
    const aiChatContent = document.getElementById('aiChatContent');
    
    if (homeContent) homeContent.classList.add('hidden');
    if (loginContent) loginContent.classList.add('hidden');
    if (surveyContent) surveyContent.classList.add('hidden');
    if (resultContent) resultContent.classList.add('hidden');
    if (historyContent) historyContent.classList.add('hidden');
    if (adminContent) adminContent.classList.add('hidden');
    if (dietTableContent) dietTableContent.classList.add('hidden');
    if (familyContent) familyContent.classList.add('hidden');
    if (hospitalContent) hospitalContent.classList.add('hidden');
    if (aiChatContent) aiChatContent.classList.add('hidden');

    if (questionContent) questionContent.classList.remove('hidden');
    
    // 게시글 목록 표시, 폼과 상세보기 숨김
    showQuestionList();
}

// 질문하기에서 홈으로
function showHomeFromQuestion() {
    showHomeContent();
}

// 게시글 목록 표시
function showQuestionList() {
    document.getElementById('questionList').classList.remove('hidden');
    document.getElementById('questionFormSection').classList.add('hidden');
    document.getElementById('questionDetailSection').classList.add('hidden');
}

// 게시글 목록 불러오기
async function loadQuestionList() {
    try {
        const questions = await getQuestions();
        const container = document.getElementById('questionListContainer');
        const noQuestionMessage = document.getElementById('noQuestionMessage');
        
        if (questions.length === 0) {
            container.innerHTML = '';
            noQuestionMessage.style.display = 'block';
            return;
        }
        
        noQuestionMessage.style.display = 'none';
        
        container.innerHTML = questions.map(q => {
            const createdDate = q.createdAt ? formatFirebaseTimestamp(q.createdAt) : '방금 전';
            const commentsCount = q.comments ? q.comments.length : 0;
            const preview = q.content.length > 100 ? q.content.substring(0, 100) + '...' : q.content;
            
            return `
                <div class="question-card" onclick="viewQuestionDetail('${q.id}')">
                    <div class="question-card-header">
                        <div class="question-card-title">${escapeHtml(q.title)}</div>
                    </div>
                    <div class="question-card-preview">${escapeHtml(preview)}</div>
                    <div class="question-card-footer">
                        <div class="question-card-meta">
                            <span class="question-card-author">${escapeHtml(q.authorName)}</span>
                            <span>${createdDate}</span>
                        </div>
                        <div class="question-card-stats">
                            <span>💬 ${commentsCount}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('게시글 목록 로드 실패:', error);
        alert('게시글 목록을 불러올 수 없습니다.');
    }
}

// 게시글 작성 폼 표시
function showWriteQuestionForm() {
    if (!currentUser) {
        alert('로그인이 필요한 서비스입니다.');
        toggleLoginScreen();
        return;
    }
    
    // 폼 초기화
    document.getElementById('formTitle').textContent = '질문 작성';
    document.getElementById('editQuestionId').value = '';
    document.getElementById('questionTitle').value = '';
    document.getElementById('questionContentInput').value = '';
    
    // 폼 표시, 목록과 상세보기 숨김
    document.getElementById('questionList').classList.add('hidden');
    document.getElementById('questionFormSection').classList.remove('hidden');
    document.getElementById('questionDetailSection').classList.add('hidden');
}

// 게시글 작성/수정 폼 취소
function cancelQuestionForm() {
    showQuestionList();
}

// 게시글 등록/수정
async function submitQuestion() {
    const title = document.getElementById('questionTitle').value.trim();
    const content = document.getElementById('questionContentInput').value.trim();
    const editQuestionId = document.getElementById('editQuestionId').value;
    
    if (!title) {
        alert('제목을 입력해주세요.');
        return;
    }
    
    if (!content) {
        alert('내용을 입력해주세요.');
        return;
    }
    
    if (!currentUser) {
        alert('로그인이 필요한 서비스입니다.');
        return;
    }
    
    try {
        if (editQuestionId) {
            // 수정
            await updateQuestion(editQuestionId, {
                title: title,
                content: content
            });
            alert('질문이 수정되었습니다.');
        } else {
            // 새 게시글 작성
            await saveQuestion({
                title: title,
                content: content,
                authorId: currentUser.loginId,
                authorName: currentUser.name || currentUser.loginId
            });
            alert('질문이 등록되었습니다.');
        }
        
        // 목록 새로고침
        await loadQuestionList();
        showQuestionList();
    } catch (error) {
        console.error('게시글 저장 실패:', error);
        alert('게시글 저장 중 오류가 발생했습니다.');
    }
}

// 게시글 상세보기
async function viewQuestionDetail(questionId) {
    try {
        currentQuestionId = questionId;
        const question = await getQuestion(questionId);
        
        if (!question) {
            alert('게시글을 찾을 수 없습니다.');
            return;
        }
        
        const container = document.getElementById('questionDetailContainer');
        const createdDate = question.createdAt ? formatFirebaseTimestamp(question.createdAt) : '방금 전';
        const updatedDate = question.updatedAt && question.updatedAt !== question.createdAt 
            ? ' (수정됨: ' + formatFirebaseTimestamp(question.updatedAt) + ')' 
            : '';
        
        // 작성자 권한 체크
        const isAuthor = currentUser && currentUser.loginId === question.authorId;
        
        let html = `
            <button class="back-to-list-btn" onclick="showQuestionList(); loadQuestionList();">
                ← 목록으로
            </button>
            <div class="question-detail-header">
                <div class="question-detail-title">${escapeHtml(question.title)}</div>
                <div class="question-detail-meta">
                    <span class="question-detail-author">${escapeHtml(question.authorName)}</span>
                    <span>${createdDate}${updatedDate}</span>
                </div>
            </div>
            <div class="question-detail-content">${escapeHtml(question.content)}</div>
        `;
        
        // 작성자인 경우 수정/삭제 버튼 표시
        if (isAuthor) {
            html += `
                <div class="question-detail-actions">
                    <button class="action-btn secondary" onclick="editQuestion('${questionId}')">수정</button>
                    <button class="action-btn secondary" onclick="deleteQuestionConfirm('${questionId}')" style="background: #dc3545; color: white; border-color: #dc3545;">삭제</button>
                </div>
            `;
        }
        
        // 댓글 섹션
        html += `
            <div class="comments-section">
                <div class="comments-title">
                    댓글 <span class="comments-count">${question.comments ? question.comments.length : 0}</span>
                </div>
        `;
        
        // 로그인한 경우 댓글 작성 폼 표시
        if (currentUser) {
            html += `
                <div class="comment-form">
                    <textarea class="comment-input" id="commentInput" placeholder="댓글을 입력하세요..."></textarea>
                    <button class="action-btn primary" onclick="submitComment('${questionId}')">댓글 작성</button>
                </div>
            `;
        } else {
            html += `
                <div class="comment-form" style="text-align: center; padding: 20px; color: #999;">
                    로그인 후 댓글을 작성할 수 있습니다.
                </div>
            `;
        }
        
        // 댓글 목록
        if (question.comments && question.comments.length > 0) {
            html += `<div class="comment-list">`;
            
            question.comments.forEach(comment => {
                const commentDate = comment.createdAt ? formatISODate(comment.createdAt) : '방금 전';
                const isCommentAuthor = currentUser && currentUser.loginId === comment.authorId;
                
                html += `
                    <div class="comment-item">
                        <div class="comment-header">
                            <span class="comment-author">${escapeHtml(comment.authorName)}</span>
                            <span class="comment-date">${commentDate}</span>
                        </div>
                        <div class="comment-content">${escapeHtml(comment.content)}</div>
                `;
                
                if (isCommentAuthor) {
                    html += `
                        <div class="comment-actions">
                            <button class="comment-delete-btn" onclick="deleteCommentConfirm('${questionId}', '${comment.commentId}')">삭제</button>
                        </div>
                    `;
                }
                
                html += `</div>`;
            });
            
            html += `</div>`;
        }
        
        html += `</div>`;
        
        container.innerHTML = html;
        
        // 상세보기 표시, 목록과 폼 숨김
        document.getElementById('questionList').classList.add('hidden');
        document.getElementById('questionFormSection').classList.add('hidden');
        document.getElementById('questionDetailSection').classList.remove('hidden');
    } catch (error) {
        console.error('게시글 상세보기 실패:', error);
        alert('게시글을 불러올 수 없습니다.');
    }
}

// 게시글 수정
async function editQuestion(questionId) {
    try {
        const question = await getQuestion(questionId);
        
        if (!question) {
            alert('게시글을 찾을 수 없습니다.');
            return;
        }
        
        if (!currentUser || currentUser.loginId !== question.authorId) {
            alert('수정 권한이 없습니다.');
            return;
        }
        
        // 폼에 기존 내용 채우기
        document.getElementById('formTitle').textContent = '질문 수정';
        document.getElementById('editQuestionId').value = questionId;
        document.getElementById('questionTitle').value = question.title;
        document.getElementById('questionContentInput').value = question.content;
        
        // 폼 표시
        document.getElementById('questionList').classList.add('hidden');
        document.getElementById('questionFormSection').classList.remove('hidden');
        document.getElementById('questionDetailSection').classList.add('hidden');
    } catch (error) {
        console.error('게시글 수정 폼 로드 실패:', error);
        alert('게시글을 불러올 수 없습니다.');
    }
}

// 게시글 삭제 확인
function deleteQuestionConfirm(questionId) {
    if (confirm('정말 삭제하시겠습니까?')) {
        deleteQuestionPost(questionId);
    }
}

// 게시글 삭제
async function deleteQuestionPost(questionId) {
    try {
        await deleteQuestion(questionId);
        alert('질문이 삭제되었습니다.');
        await loadQuestionList();
        showQuestionList();
    } catch (error) {
        console.error('게시글 삭제 실패:', error);
        alert('게시글 삭제 중 오류가 발생했습니다.');
    }
}

// 댓글 작성
async function submitComment(questionId) {
    const commentInput = document.getElementById('commentInput');
    const content = commentInput.value.trim();
    
    if (!content) {
        alert('댓글 내용을 입력해주세요.');
        return;
    }
    
    if (!currentUser) {
        alert('로그인이 필요한 서비스입니다.');
        return;
    }
    
    try {
        await addComment(questionId, {
            content: content,
            authorId: currentUser.loginId,
            authorName: currentUser.name || currentUser.loginId
        });
        
        // 댓글 입력창 초기화
        commentInput.value = '';
        
        // 게시글 상세보기 새로고침
        await viewQuestionDetail(questionId);
    } catch (error) {
        console.error('댓글 작성 실패:', error);
        alert('댓글 작성 중 오류가 발생했습니다.');
    }
}

// 댓글 삭제 확인
function deleteCommentConfirm(questionId, commentId) {
    if (confirm('정말 삭제하시겠습니까?')) {
        deleteCommentPost(questionId, commentId);
    }
}

// 댓글 삭제
async function deleteCommentPost(questionId, commentId) {
    try {
        await deleteComment(questionId, commentId);
        alert('댓글이 삭제되었습니다.');
        await viewQuestionDetail(questionId);
    } catch (error) {
        console.error('댓글 삭제 실패:', error);
        alert('댓글 삭제 중 오류가 발생했습니다.');
    }
}

// Firebase Timestamp 포맷팅
function formatFirebaseTimestamp(timestamp) {
    if (!timestamp) return '방금 전';
    
    try {
        let date;
        if (timestamp.toDate) {
            date = timestamp.toDate();
        } else if (timestamp.seconds) {
            date = new Date(timestamp.seconds * 1000);
        } else {
            date = new Date(timestamp);
        }
        
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return '방금 전';
        if (minutes < 60) return `${minutes}분 전`;
        if (hours < 24) return `${hours}시간 전`;
        if (days < 7) return `${days}일 전`;
        
        return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    } catch (error) {
        console.error('타임스탬프 포맷 오류:', error);
        return '알 수 없음';
    }
}

// ISO 날짜 포맷팅
function formatISODate(isoString) {
    try {
        const date = new Date(isoString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return '방금 전';
        if (minutes < 60) return `${minutes}분 전`;
        if (hours < 24) return `${hours}시간 전`;
        if (days < 7) return `${days}일 전`;
        
        return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    } catch (error) {
        console.error('날짜 포맷 오류:', error);
        return '알 수 없음';
    }
}

// HTML 이스케이프
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * ==================== 한의원 관련 함수 ====================
 */

// 선택된 한의원 정보
let selectedHospital = null;

/**
 * 모든 콘텐츠 숨기기
 */
function hideAllContent() {
    const homeContent = document.getElementById('homeContent');
    const loginContent = document.getElementById('loginContent');
    const surveyContent = document.getElementById('surveyContent');
    const resultContent = document.getElementById('resultContent');
    const historyContent = document.getElementById('historyContent');
    const adminContent = document.getElementById('adminContent');
    const dietTableContent = document.getElementById('dietTableContent');
    const familyContent = document.getElementById('familyContent');
    const questionContent = document.getElementById('questionContent');
    const hospitalContent = document.getElementById('hospitalContent');
    const aiChatContent = document.getElementById('aiChatContent');
    
    if (homeContent) homeContent.classList.add('hidden');
    if (loginContent) loginContent.classList.add('hidden');
    if (surveyContent) surveyContent.classList.add('hidden');
    if (resultContent) resultContent.classList.add('hidden');
    if (historyContent) historyContent.classList.add('hidden');
    if (adminContent) adminContent.classList.add('hidden');
    if (dietTableContent) dietTableContent.classList.add('hidden');
    if (familyContent) familyContent.classList.add('hidden');
    if (questionContent) questionContent.classList.add('hidden');
    if (hospitalContent) hospitalContent.classList.add('hidden');
    if (aiChatContent) aiChatContent.classList.add('hidden');
}

/**
 * 페이지 로드 시 한의원 정보 로드
 */
async function loadHospitalInfo() {
    try {
        // 사용자 정보에서 선택한 한의원 ID 가져오기
        if (currentUser && currentUser.selectedHospitalId) {
            const hospital = await getHospitalInfo(currentUser.selectedHospitalId);
            if (hospital) {
                selectedHospital = hospital;
                displayHospitalLogoInHeader(hospital);
            }
        }
    } catch (error) {
        console.error('❌ 한의원 정보 로드 실패:', error);
    }
}

/**
 * 홈 화면에 한의원 로고 표시
 * @deprecated v0.6.3부터 홈 화면에서 한의원 로고 영역 제거됨
 */
/*
function displayHospitalLogo(hospital) {
    const logoContainer = document.getElementById('hospitalLogoContainer');
    const logoImg = document.getElementById('hospitalLogoImg');
    const nameText = document.getElementById('hospitalNameText');
    
    if (logoContainer && logoImg && nameText && hospital.logoUrl) {
        logoImg.src = hospital.logoUrl;
        nameText.textContent = hospital.name;
        logoContainer.style.display = 'block';
    }
}
*/

/**
 * 한의원 선택 팝업 표시
 */
async function showHospitalSelectPopup() {
    try {
        const hospitals = await getAllHospitals();
        
        if (hospitals.length === 0) {
            // 등록된 한의원이 없으면 바로 닫기
            console.log('ℹ️ 등록된 한의원이 없습니다.');
            return;
        }
        
        const popup = document.getElementById('hospitalSelectPopup');
        const listContainer = document.getElementById('hospitalSelectList');
        
        if (!popup || !listContainer) {
            console.error('❌ 한의원 선택 팝업 요소를 찾을 수 없습니다.');
            return;
        }
        
        // 한의원 목록 생성
        listContainer.innerHTML = '';
        hospitals.forEach(hospital => {
            const item = document.createElement('div');
            item.className = 'hospital-select-item';
            item.onclick = () => selectHospital(hospital);
            
            item.innerHTML = `
                ${hospital.logoUrl ? `<img src="${hospital.logoUrl}" alt="${hospital.name}" class="hospital-select-item-logo">` : '<div class="hospital-select-item-logo" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; font-size: 2rem; color: white;">🏥</div>'}
                <div class="hospital-select-item-info">
                    <div class="hospital-select-item-name">${hospital.name}</div>
                    <div class="hospital-select-item-desc">${hospital.description ? (hospital.description.length > 50 ? hospital.description.substring(0, 50) + '...' : hospital.description) : '제휴 한의원입니다'}</div>
                </div>
            `;
            
            listContainer.appendChild(item);
        });
        
        popup.style.display = 'flex';
        console.log('✅ 한의원 선택 팝업 표시:', hospitals.length + '개');
    } catch (error) {
        console.error('❌ 한의원 선택 팝업 표시 실패:', error);
    }
}

/**
 * 한의원 선택
 */
async function selectHospital(hospital) {
    try {
        selectedHospital = hospital;
        
        // 사용자가 로그인한 경우 DB에 저장
        if (currentUser && currentUser.loginId) {
            // Firebase에 selectedHospitalId 저장
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                await firebase.firestore()
                    .collection('users')
                    .doc(currentUser.loginId)
                    .set({
                        selectedHospitalId: hospital.id
                    }, { merge: true });
                
                console.log('✅ Firebase에 병원 정보 저장:', hospital.id);
            }
            
            // currentUser 객체 업데이트
            currentUser.selectedHospitalId = hospital.id;
            
            // 로컬 스토리지 업데이트
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
        
        // 헤더에 한의원 정보 표시 (v0.6.0)
        displayHospitalLogoInHeader(hospital);
        
        // 팝업 닫기
        closeHospitalSelectPopup();
        
        console.log(`✅ ${hospital.name} 선택 완료`);
        
        // 홈 화면으로 이동 (v0.8.7)
        showHomeContent();
    } catch (error) {
        console.error('❌ 한의원 선택 실패:', error);
        alert('한의원 선택에 실패했습니다.');
    }
}

/**
 * 한의원 선택 팝업 닫기
 */
function closeHospitalSelectPopup() {
    const popup = document.getElementById('hospitalSelectPopup');
    if (popup) {
        popup.style.display = 'none';
    }
}

/**
 * 병원 소개 화면으로 이동
 */
async function goToHospital() {
    try {
        // 로그인 체크
        if (!currentUser || !currentUser.loginId) {
            alert('로그인이 필요한 서비스입니다.');
            return;
        }
        
        // 선택된 한의원이 없으면 선택 팝업 표시
        if (!selectedHospital) {
            // 모든 한의원 가져오기
            const hospitals = await getAllHospitals();
            
            if (hospitals.length === 0) {
                alert('등록된 한의원이 없습니다.');
                return;
            }
            
            if (hospitals.length === 1) {
                // 한 개만 있으면 자동 선택
                selectedHospital = hospitals[0];
            } else {
                // 여러 개 있으면 선택 팝업
                await showHospitalSelectPopup();
                return;
            }
        }
        
        // 모든 콘텐츠 숨기기
        hideAllContent();
        
        // 병원 소개 화면 표시
        const hospitalContent = document.getElementById('hospitalContent');
        
        // 한의원 콘텐츠 요소들 가져오기
        const logoContainer = document.getElementById('hospitalContentLogo');
        const nameElem = document.getElementById('hospitalContentName');
        const descElem = document.getElementById('hospitalContentDescription');
        const imageContainer = document.getElementById('hospitalContentImage');
        const imageElem = document.getElementById('hospitalImage');
        const websiteContainer = document.getElementById('hospitalContentWebsite');
        const websiteLink = document.getElementById('hospitalWebsiteLink');
        
        if (hospitalContent && nameElem && descElem) {
            // 로고 표시
            if (logoContainer) {
                if (selectedHospital.logoUrl) {
                    logoContainer.innerHTML = `<img src="${selectedHospital.logoUrl}" alt="${selectedHospital.name}">`;
                } else {
                    logoContainer.innerHTML = '<div style="width: 100%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; font-size: 4rem; color: white;">🏥</div>';
                }
            }
            
            // 이름 표시
            nameElem.textContent = selectedHospital.name;
            
            // 소개 표시
            descElem.textContent = selectedHospital.description || '소개글이 준비 중입니다.';
            
            // 한의원 사진 표시
            if (imageContainer && imageElem && selectedHospital.imageUrl) {
                imageElem.src = selectedHospital.imageUrl;
                imageContainer.style.display = 'block';
            } else if (imageContainer) {
                imageContainer.style.display = 'none';
            }
            
            // 웹사이트 링크 표시
            if (websiteContainer && websiteLink && selectedHospital.websiteUrl) {
                websiteLink.href = selectedHospital.websiteUrl;
                websiteContainer.style.display = 'block';
            } else if (websiteContainer) {
                websiteContainer.style.display = 'none';
            }
            
            // 한의원 콘텐츠 표시
            hospitalContent.classList.remove('hidden');
            
            console.log('✅ 한의원 소개 화면 표시:', selectedHospital.name);
        }
        
        // 하단 네비게이션 업데이트
        updateBottomNav('hospital');
        
        // 서랍 닫기
        closeDrawer();
    } catch (error) {
        console.error('❌ 병원 소개 화면 표시 실패:', error);
        alert('병원 정보를 불러오는데 실패했습니다.');
    }
}

/**
 * 병원 소개에서 홈으로
 */
function showHomeFromHospital() {
    hideAllContent();
    document.getElementById('homeContent').classList.remove('hidden');
    updateBottomNav('home');
}

/**
 * 하단 네비게이션 업데이트 확장
 */
function updateBottomNav(active) {
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    const activeButton = document.querySelector(`.bottom-nav .nav-item[onclick*="${active}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

// 초기화 함수 수정 - 한의원 선택 팝업 표시
const originalInitializeHome = initializeHome;
initializeHome = function() {
    originalInitializeHome();
    
    // 한의원 정보 로드
    loadHospitalInfo();
    
    // 한의원 선택 여부 확인 (로컬스토리지 사용)
    const hasSeenHospitalPopup = localStorage.getItem('hasSeenHospitalPopup');
    
    if (!hasSeenHospitalPopup) {
        // 1초 후에 한의원 선택 팝업 표시
        setTimeout(async () => {
            const hospitals = await getAllHospitals();
            if (hospitals.length > 0) {
                await showHospitalSelectPopup();
            }
            localStorage.setItem('hasSeenHospitalPopup', 'true');
        }, 1000);
    }
};

// ========================================
// 한의원 헤더 표시 함수 (v0.6.0)
// ========================================

/**
 * 홈 화면에 한의원 정보 표시 (v0.8.4: 헤더 제거, 홈 중간만 표시, v0.8.5: IN8 텍스트 전환)
 */
function displayHospitalLogoInHeader(hospital) {
    // 홈 화면 중간 아이콘 (v0.8.2)
    const defaultHeroLogo = document.getElementById('defaultHeroLogo');
    const hospitalHeroLogo = document.getElementById('hospitalHeroLogo');
    
    // 홈 화면 중간 텍스트 (v0.8.5)
    const defaultHeroName = document.getElementById('defaultHeroName');
    const hospitalHeroName = document.getElementById('hospitalHeroName');
    
    if (hospital) {
        // 홈 화면 중간에 병원 로고 표시 (v0.8.2)
        if (defaultHeroLogo && hospitalHeroLogo) {
            if (hospital.logoUrl) {
                // 병원 로고가 있으면 병원 로고 표시
                hospitalHeroLogo.src = hospital.logoUrl;
                hospitalHeroLogo.style.display = 'block';
                defaultHeroLogo.style.display = 'none';
                console.log('✅ 홈 화면 중간에 병원 로고 표시:', hospital.name);
            } else {
                // 병원 로고가 없으면 기본 IN8 로고 표시
                hospitalHeroLogo.style.display = 'none';
                defaultHeroLogo.style.display = 'block';
            }
        }
        
        // 홈 화면 중간 텍스트 전환 (v0.8.5)
        if (defaultHeroName && hospitalHeroName) {
            // IN8 텍스트 숨기고 병원명 표시
            defaultHeroName.style.display = 'none';
            hospitalHeroName.textContent = hospital.name;
            hospitalHeroName.style.display = 'block';
            console.log('✅ 홈 화면 중간에 병원명 표시:', hospital.name);
        }
    } else {
        // 로그아웃 시 IN8 아이콘과 텍스트 표시 (v0.8.5)
        if (defaultHeroLogo) {
            defaultHeroLogo.style.display = 'block';
        }
        if (hospitalHeroLogo) {
            hospitalHeroLogo.style.display = 'none';
        }
        if (defaultHeroName) {
            defaultHeroName.style.display = 'block';
        }
        if (hospitalHeroName) {
            hospitalHeroName.style.display = 'none';
        }
        console.log('✅ 홈 화면 중간에 IN8 아이콘과 텍스트 표시');
    }
}

/**
 * 한의원 소개 모달 표시
 */
/**
 * 한의원 소개 화면에서 홈으로
 */
function showHomeFromHospital() {
    showHomeContent();
    console.log('✅ 한의원 소개에서 홈으로 이동');
}

/**
 * 한의원 선택 건너뛰기
 */
function skipHospitalSelection() {
    closeHospitalSelectPopup();
    console.log('ℹ️ 한의원 선택 건너뛰기');
}

/**
 * 로그인 성공 후 한의원 정보 로드 및 표시
 */
async function loadUserHospitalInfo() {
    try {
        if (currentUser && currentUser.selectedHospitalId) {
            const hospital = await getHospitalInfo(currentUser.selectedHospitalId);
            if (hospital) {
                selectedHospital = hospital;
                displayHospitalLogoInHeader(hospital);
                console.log('✅ 사용자 선택 한의원 로드:', hospital.name);
            }
        }
    } catch (error) {
        console.error('❌ 한의원 정보 로드 실패:', error);
    }
}

// ===================================
// AI 챗봇 기능
// ===================================

// AI 챗봇 대화 이력 저장
let aiChatHistory = [];

/**
 * AI 챗봇 화면으로 이동
 */
function goToAIChat() {
    // 로그인 체크 (v0.8.1)
    if (!currentUser) {
        alert('로그인이 필요한 서비스입니다.');
        toggleLoginScreen();
        return;
    }
    
    hideAllContent();
    document.getElementById('aiChatContent').classList.remove('hidden');
    closeDrawer();
    
    // 첫 방문이면 환영 메시지 표시
    const messagesContainer = document.getElementById('aiChatMessages');
    const welcomeMessage = messagesContainer.querySelector('.welcome-message');
    
    console.log('✅ AI 챗봇 화면으로 이동');
}

/**
 * AI 챗봇에서 홈으로
 */
function showHomeFromAIChat() {
    hideAllContent();
    showHomeContent();
    console.log('✅ AI 챗봇에서 홈으로 이동');
}

/**
 * AI 메시지 전송
 */
async function sendAIMessage() {
    const input = document.getElementById('aiChatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // 사용자 메시지 추가
    addUserMessage(message);
    input.value = '';
    
    // 전송 버튼 비활성화
    const sendBtn = document.getElementById('aiChatSendBtn');
    sendBtn.disabled = true;
    
    // 타이핑 인디케이터 표시
    showTypingIndicator();
    
    try {
        // AI 응답 요청
        const response = await getAIResponse(message);
        
        // 타이핑 인디케이터 제거
        removeTypingIndicator();
        
        // AI 응답 추가
        addAIMessage(response);
        
    } catch (error) {
        console.error('❌ AI 응답 오류:', error);
        removeTypingIndicator();
        
        // 친절한 에러 메시지
        const errorMessage = `죄송합니다. 응답을 생성하는 중 오류가 발생했습니다.

**해결 방법:**
• 인터넷 연결 상태를 확인해주세요
• 잠시 후 다시 시도해주세요
• 문제가 계속되면 관리자에게 문의해주세요

💡 **참고:** Anthropic API 키를 설정하지 않은 경우, 기본 응답 시스템이 자동으로 작동합니다.`;
        
        addAIMessage(errorMessage);
    } finally {
        sendBtn.disabled = false;
    }
}

/**
 * 사용자 메시지 추가
 */
function addUserMessage(message) {
    const messagesContainer = document.getElementById('aiChatMessages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'user-message';
    messageDiv.innerHTML = `
        <div class="message-avatar">👤</div>
        <div class="message-bubble">
            <p>${escapeHtml(message)}</p>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
    
    // 대화 이력에 추가
    aiChatHistory.push({
        role: 'user',
        content: message
    });
}

/**
 * AI 메시지 추가
 */
function addAIMessage(message) {
    const messagesContainer = document.getElementById('aiChatMessages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'ai-message';
    messageDiv.innerHTML = `
        <div class="message-avatar">👩‍⚕️</div>
        <div class="message-bubble">
            ${formatAIMessage(message)}
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
    
    // 대화 이력에 추가
    aiChatHistory.push({
        role: 'assistant',
        content: message
    });
}

/**
 * AI 메시지 포맷팅 (줄바꿈, 리스트 등 처리)
 */
function formatAIMessage(message) {
    // 줄바꿈을 <p> 태그로 변환
    const paragraphs = message.split('\n\n').filter(p => p.trim());
    
    let formatted = '';
    for (const para of paragraphs) {
        if (para.trim().startsWith('•') || para.trim().startsWith('-')) {
            // 리스트 아이템
            const items = para.split('\n').map(item => {
                const cleaned = item.trim().replace(/^[•\-]\s*/, '');
                return cleaned ? `<li>${escapeHtml(cleaned)}</li>` : '';
            }).filter(item => item).join('');
            formatted += `<ul style="margin: 10px 0; padding-left: 20px;">${items}</ul>`;
        } else {
            // 일반 문단
            formatted += `<p>${escapeHtml(para)}</p>`;
        }
    }
    
    return formatted || `<p>${escapeHtml(message)}</p>`;
}

/**
 * HTML 이스케이프
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 타이핑 인디케이터 표시
 */
function showTypingIndicator() {
    const messagesContainer = document.getElementById('aiChatMessages');
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'ai-message typing-message';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="message-avatar">👩‍⚕️</div>
        <div class="message-bubble typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    
    messagesContainer.appendChild(typingDiv);
    scrollToBottom();
}

/**
 * 타이핑 인디케이터 제거
 */
function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

/**
 * 채팅 영역 하단으로 스크롤
 */
function scrollToBottom() {
    const messagesContainer = document.getElementById('aiChatMessages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * AI 응답 요청 (Anthropic API 또는 로컬 응답)
 */
async function getAIResponse(userMessage) {
    // Netlify Function을 통한 AI 응답 (v0.8.0)
    try {
        console.log('📤 Netlify Function으로 AI 요청 전송...');
        return await getNetlifyAIResponse(userMessage);
    } catch (error) {
        console.warn('⚠️ Netlify Function 호출 실패, 로컬 응답으로 전환:', error);
        return getLocalAIResponse(userMessage);
    }
}

/**
 * Netlify Function을 통한 AI 응답 (v0.8.0)
 */
async function getNetlifyAIResponse(userMessage) {
    try {
        // 자주 묻는 질문 추적
        trackFrequentQuestion(userMessage);
        
        // Netlify Function 엔드포인트 호출
        const response = await fetch('/api/ai-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: userMessage,
                chatHistory: aiChatHistory.slice(-10) // 최근 10개 대화만 전송
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Netlify Function 응답 성공');
        
        return data.response;
    } catch (error) {
        console.error('❌ Netlify Function 호출 오류:', error);
        throw error;
    }
}

/**
 * Anthropic API 호출
 */
/**
 * [레거시] Anthropic API 직접 호출 (v0.8.0부터 사용 안 함)
 * 
 * v0.8.0부터 Netlify Function을 통해 API를 호출합니다.
 * 이 함수는 참고용으로 남겨두었으며, getNetlifyAIResponse()를 사용하세요.
 */
/*
async function getAnthropicAPIResponse(userMessage) {
    const systemPrompt = `당신은 8체질 의학 전문 AI 상담사입니다. 권도원 박사님이 창시한 8체질 의학 이론에 기반하여 정확하고 상세한 답변을 제공합니다.

## 8체질 이론 배경
8체질 의학은 1965년 권도원 박사님이 창시한 한의학 이론으로, 사람의 체질을 8가지로 분류합니다:
- 목양(木陽), 목음(木陰), 금양(金陽), 금음(金陰), 토양(土陽), 토음(土陰), 수양(水陽), 수음(水陰)

각 체질은 오장육부(간, 심장, 비장, 폐, 신장)의 강약이 다르며, 이에 따라 적합한 음식, 운동, 생활습관이 다릅니다.

## 체질별 상세 특성

### 목양 체질
- 장기 강약: 간↑↑, 담낭↑, 폐↓↓, 대장↓
- 좋은 음식: 소고기, 돼지고기, 닭고기, 계란, 우유, 치즈, 버터, 맥주
- 나쁜 음식: 밀가루, 메밀, 쌀, 보리, 양배추, 배추, 무, 감자, 고구마
- 특정 음식: 당근(나쁨), 오이(나쁨), 사과(주의), 배(주의)

### 목음 체질
- 장기 강약: 간↑↑, 담낭↑, 폐↓↓, 대장↓
- 좋은 음식: 소고기, 돼지고기, 닭고기, 계란, 우유, 치즈
- 나쁜 음식: 생선류, 해물류, 밀가루, 찬 음식
- 특정 음식: 당근(나쁨), 고등어(나쁨), 조기(나쁨)

### 금양 체질
- 장기 강약: 폐↑↑, 대장↑, 간↓↓, 담낭↓
- 좋은 음식: 쌀, 보리, 밀가루, 팥, 녹두, 배추, 무, 오이, 상추, 가지, 사과, 배, 포도, 수박, 녹차
- 나쁜 음식: 소고기, 돼지고기, 닭고기, 계란, 우유, 치즈, 버터, 후추, 생강, 고추
- 특정 음식: 당근(좋음), 밀가루(좋음), 메밀(좋음)

### 금음 체질
- 장기 강약: 폐↑↑, 대장↑, 간↓↓, 담낭↓
- 좋은 음식: 쌀, 보리, 밀가루, 배추, 오이, 상추, 가지, 사과, 배, 포도, 흰살생선, 조개
- 나쁜 음식: 소고기, 돼지고기, 닭고기, 계란, 매운 음식, 기름진 음식
- 특정 음식: 당근(좋음), 밀가루(좋음), 고등어(주의)

### 토양 체질
- 장기 강약: 비장↑↑, 위장↑, 신장↓↓, 방광↓
- 좋은 음식: 쌀, 보리, 밀가루, 팥, 녹두, 배추, 무, 오이, 상추, 시금치, 사과, 배, 포도
- 나쁜 음식: 소고기, 돼지고기, 생선류, 해물류, 기름진 음식, 짠 음식
- 특정 음식: 당근(좋음), 밀가루(좋음), 고등어(나쁨)

### 토음 체질
- 장기 강약: 비장↑↑, 위장↑, 신장↓↓, 방광↓
- 좋은 음식: 쌀, 보리, 현미, 배추, 무, 오이, 호박, 조개류, 김, 미역
- 나쁜 음식: 소고기, 돼지고기, 닭고기, 계란, 자극적인 음식
- 특정 음식: 당근(좋음), 밀가루(좋음)

### 수양 체질
- 장기 강약: 신장↑↑, 방광↑, 비장↓↓, 위장↓
- 좋은 음식: 고등어, 꽁치, 참치, 연어, 새우, 게, 조개, 김, 미역, 소금
- 나쁜 음식: 쌀, 밀가루, 메밀, 보리, 배추, 무, 오이, 사과, 배, 녹차
- 특정 음식: 당근(나쁨), 밀가루(나쁨), 감자(나쁨)

### 수음 체질
- 장기 강약: 신장↑↑, 방광↑, 비장↓↓, 위장↓
- 좋은 음식: 생선류, 해물류, 소고기, 돼지고기(적당량), 김, 미역, 소금
- 나쁜 음식: 밀가루, 배추, 무, 사과, 배, 녹차, 찬 음식
- 특정 음식: 당근(나쁨), 밀가루(나쁨)

## 정확한 체질 검사 방법
1. **전문 한의원 방문**: 권도원 박사님의 8체질 의학을 전문으로 하는 한의원에서 정확한 검사를 받으세요.
2. **검사 방법**: 맥진(맥박 진단), 문진(질문), 체형 관찰을 통해 체질을 판단합니다.
3. **주의사항**: 온라인 설문이나 간단한 테스트는 참고용이며, 정확한 진단은 전문가 상담이 필요합니다.
4. **소요시간**: 일반적으로 30분~1시간 정도 소요됩니다.

## 8체질 의학의 신뢰성
- **학술적 근거**: 1965년 권도원 박사님이 창시하여 60년 가까이 임상 경험이 축적되었습니다.
- **임상 효과**: 많은 환자들이 체질에 맞는 식이요법으로 건강 개선 효과를 경험했습니다.
- **과학적 검증**: 일부 효과는 과학적으로 검증되었으나, 더 많은 연구가 필요한 분야입니다.
- **주의사항**: 8체질 의학은 보완의학이며, 심각한 질병의 경우 현대의학과 병행해야 합니다.

## 답변 원칙
1. 사용자 질문에 정확하고 구체적으로 답변합니다.
2. 특정 음식에 대한 질문(예: "당근은 금체질에 좋은가?")에는 위 정보를 바탕으로 명확히 답합니다.
3. 의학적 조언이 필요한 경우 전문의 상담을 권장합니다.
4. 친절하고 이해하기 쉬운 언어를 사용합니다.
5. 각 체질별 차이를 명확히 설명합니다.`;

    // 자주 묻는 질문 추적
    trackFrequentQuestion(userMessage);

    const messages = [
        ...aiChatHistory.slice(-10), // 최근 10개 대화만 포함
        { role: 'user', content: userMessage }
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: systemPrompt,
            messages: messages
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API 오류: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.content[0].text;
}
*/


/**
 * 로컬 AI 응답 시스템 (API 키 없을 때 사용)
 */
function getLocalAIResponse(userMessage) {
    const message = userMessage.toLowerCase();
    
    // 체질별 키워드 매칭
    const constitutionInfo = {
        '목양': {
            keywords: ['목양'],
            info: `목양 체질은 간 기능이 강하고 폐 기능이 약한 체질입니다.

**좋은 음식:**
• 육식: 소고기, 돼지고기, 닭고기
• 해물: 조개류, 굴
• 유제품: 우유, 치즈, 요구르트

**피해야 할 음식:**
• 곡식: 현미, 잡곡
• 채소: 과다 섭취 주의
• 밀가루 음식

**권장 운동:**
• 격렬한 운동: 축구, 농구, 테니스
• 근력 운동
• 활동적인 스포츠`
        },
        '목음': {
            keywords: ['목음'],
            info: `목음 체질은 간 기능이 강하고 폐 기능이 약한 체질입니다.

**좋은 음식:**
• 육식: 소고기, 닭고기
• 야채: 적당량
• 유제품

**피해야 할 음식:**
• 생선류: 주의 필요
• 해물류: 제한적 섭취
• 찬 음식

**권장 운동:**
• 중강도 운동: 조깅, 수영
• 요가, 필라테스
• 규칙적인 운동`
        },
        '금양': {
            keywords: ['금양'],
            info: `금양 체질은 폐 기능이 강하고 간 기능이 약한 체질입니다.

**좋은 음식:**
• 채소: 각종 녹황색 채소
• 과일: 사과, 배, 감
• 곡식: 현미, 잡곡
• 콩류, 두부

**피해야 할 음식:**
• 육식: 제한적 섭취
• 기름진 음식
• 매운 음식

**권장 운동:**
• 가벼운 유산소: 산책, 등산
• 요가, 명상
• 과격하지 않은 운동`
        },
        '금음': {
            keywords: ['금음'],
            info: `금음 체질은 폐 기능이 강하고 간 기능이 약한 체질입니다.

**좋은 음식:**
• 채소: 녹황색 채소 중심
• 과일: 각종 과일
• 생선: 흰살 생선
• 해물류

**피해야 할 음식:**
• 육식: 주의 필요
• 자극적인 음식
• 인스턴트 식품

**권장 운동:**
• 가벼운 운동: 산책, 걷기
• 스트레칭, 요가
• 호흡 운동`
        },
        '토양': {
            keywords: ['토양'],
            info: `토양 체질은 췌장 기능이 강하고 신장 기능이 약한 체질입니다.

**좋은 음식:**
• 곡식: 현미, 보리, 잡곡
• 채소: 각종 채소
• 과일: 사과, 배
• 콩류, 두부

**피해야 할 음식:**
• 육식: 제한적 섭취
• 생선류: 주의
• 기름진 음식

**권장 운동:**
• 가벼운 유산소: 걷기, 자전거
• 등산, 하이킹
• 규칙적인 운동`
        },
        '토음': {
            keywords: ['토음'],
            info: `토음 체질은 췌장 기능이 강하고 신장 기능이 약한 체질입니다.

**좋은 음식:**
• 곡식: 현미, 잡곡
• 채소: 다양한 채소
• 해물: 조개류
• 콩류

**피해야 할 음식:**
• 육식: 주의 필요
• 자극적인 음식
• 찬 음식

**권장 운동:**
• 가벼운 운동: 산책, 요가
• 스트레칭
• 과격하지 않은 운동`
        },
        '수양': {
            keywords: ['수양'],
            info: `수양 체질은 신장 기능이 강하고 췌장 기능이 약한 체질입니다.

**좋은 음식:**
• 생선: 등푸른 생선
• 해물: 새우, 게, 조개
• 바다 식물: 미역, 김
• 해조류

**피해야 할 음식:**
• 채소: 과다 섭취 주의
• 곡식: 제한적 섭취
• 밀가루 음식

**권장 운동:**
• 수영, 수중 운동
• 격렬한 운동 가능
• 활동적인 스포츠`
        },
        '수음': {
            keywords: ['수음'],
            info: `수음 체질은 신장 기능이 강하고 췌장 기능이 약한 체질입니다.

**좋은 음식:**
• 생선: 각종 생선
• 해물류
• 육식: 적당량
• 해조류

**피해야 할 음식:**
• 채소: 주의 필요
• 과일: 제한적 섭취
• 찬 음식

**권장 운동:**
• 중강도 운동: 조깅, 수영
• 규칙적인 운동
• 적당한 강도의 운동`
        }
    };
    
    // 체질별 정보 검색
    for (const [constitution, data] of Object.entries(constitutionInfo)) {
        for (const keyword of data.keywords) {
            if (message.includes(keyword)) {
                return data.info;
            }
        }
    }
    
    // 일반적인 질문 응답
    if (message.includes('운동') || message.includes('exercise')) {
        return `8체질에 따라 적합한 운동이 다릅니다.

**목양, 목음 체질:** 격렬한 운동이 적합합니다.
**금양, 금음 체질:** 가벼운 유산소 운동이 좋습니다.
**토양, 토음 체질:** 규칙적이고 온화한 운동을 권장합니다.
**수양, 수음 체질:** 수영과 같은 물과 관련된 운동이 좋습니다.

더 구체적인 정보를 원하시면 체질명을 함께 말씀해주세요! 예: "목양 체질 운동"`;
    }
    
    if (message.includes('음식') || message.includes('식단') || message.includes('먹') || message.includes('diet')) {
        return `8체질에 따라 좋은 음식과 피해야 할 음식이 다릅니다.

**육식 체질 (목양, 목음):** 육식이 좋고 채소는 제한
**채식 체질 (금양, 금음, 토양, 토음):** 채소와 곡식 중심 식단
**해식 체질 (수양, 수음):** 생선과 해물이 좋음

자세한 식단 정보를 알고 싶으시면 체질명을 말씀해주세요! 예: "금양 체질 음식"`;
    }
    
    if (message.includes('다이어트') || message.includes('살') || message.includes('체중')) {
        return `체질별 다이어트 방법이 다릅니다.

**육식 체질:** 육식 중심으로 단백질 섭취, 탄수화물 제한
**채식 체질:** 채소와 곡식 중심, 육식 제한
**해식 체질:** 생선과 해물 중심, 채소 제한

본인의 체질에 맞는 음식을 섭취하면 자연스럽게 건강한 체중을 유지할 수 있습니다. 체질을 알고 계신다면 "○○ 체질 다이어트"로 질문해주세요!`;
    }
    
    // 기본 응답
    return `안녕하세요! 8체질 AI 상담입니다.

8체질(목양, 목음, 금양, 금음, 토양, 토음, 수양, 수음)에 대해 궁금하신 점을 물어보세요.

**질문 예시:**
• "목양 체질에 좋은 음식은?"
• "금음 체질은 어떤 운동을 해야 하나요?"
• "토양 체질이 피해야 할 음식은?"

💡 **팁:** 현재는 기본 응답 시스템을 사용 중입니다. Anthropic API 키를 설정하면 더 자세하고 맞춤형 답변을 받으실 수 있습니다.`;
}

// ===================================
// 자주 묻는 질문 추적 시스템
// ===================================

// 자주 묻는 질문 저장소 (로컬 스토리지 사용)
function trackFrequentQuestion(question) {
    try {
        // 로컬 스토리지에서 기존 데이터 가져오기
        let frequentQuestions = JSON.parse(localStorage.getItem('frequentQuestions') || '{}');
        
        // 질문 정규화 (소문자, 공백 제거)
        const normalizedQuestion = question.toLowerCase().trim();
        
        // 카운트 증가
        frequentQuestions[normalizedQuestion] = (frequentQuestions[normalizedQuestion] || 0) + 1;
        
        // 로컬 스토리지에 저장
        localStorage.setItem('frequentQuestions', JSON.stringify(frequentQuestions));
        
        console.log('✅ 질문 추적:', normalizedQuestion, '횟수:', frequentQuestions[normalizedQuestion]);
    } catch (error) {
        console.error('❌ 질문 추적 실패:', error);
    }
}

/**
 * 자주 묻는 질문 Top 10 가져오기
 */
function getTop10FrequentQuestions() {
    try {
        const frequentQuestions = JSON.parse(localStorage.getItem('frequentQuestions') || '{}');
        
        // 객체를 배열로 변환하고 카운트로 정렬
        const sorted = Object.entries(frequentQuestions)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        return sorted;
    } catch (error) {
        console.error('❌ Top 10 질문 가져오기 실패:', error);
        return [];
    }
}

/**
 * 자주 묻는 질문 Top 10 표시
 */
function showTop10Questions() {
    const top10 = getTop10FrequentQuestions();
    
    if (top10.length === 0) {
        alert('아직 저장된 질문이 없습니다.');
        return;
    }
    
    let message = '📊 자주 묻는 질문 Top 10:\n\n';
    top10.forEach(([question, count], index) => {
        message += `${index + 1}. ${question} (${count}회)\n`;
    });
    
    alert(message);
}

/**
 * 대화 초기화
 */
function clearAIChat() {
    if (!confirm('대화 내역을 모두 삭제하시겠습니까?')) {
        return;
    }
    
    // 대화 이력 초기화
    aiChatHistory = [];
    
    // 메시지 컨테이너 초기화
    const messagesContainer = document.getElementById('aiChatMessages');
    messagesContainer.innerHTML = `
        <div class="ai-message welcome-message">
            <div class="message-avatar">👩‍⚕️</div>
            <div class="message-bubble">
                <p>안녕하세요! 8체질 AI 상담입니다.</p>
                <p style="margin-top: 10px;">저는 8체질 이론(목양, 목음, 금양, 금음, 토양, 토음, 수양, 수음)에 기반한 식이요법과 건강 관리에 대해 도움을 드립니다.</p>
                <p style="margin-top: 10px; font-size: 0.9rem; color: #666;">💡 질문 예시:</p>
                <ul style="margin-top: 5px; font-size: 0.9rem; color: #666; padding-left: 20px;">
                    <li>목양 체질에 좋은 음식은 무엇인가요?</li>
                    <li>금음 체질은 어떤 운동을 하면 좋을까요?</li>
                    <li>토양 체질이 피해야 할 음식은?</li>
                </ul>
            </div>
        </div>
    `;
    
    console.log('✅ AI 챗봇 대화 초기화');
}

/**
 * Enter 키 처리
 */
function handleAIChatKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendAIMessage();
    }
}

// ===================================
// 체질 요약 팝업 (v0.8.8)
// ===================================

/**
 * 체질별 핵심 요약 데이터
 */
const constitutionSummaries = {
    '목': {
        title: '목체질 (목양·목음)',
        subtitle: '🌳 간담의 기운 - 간과 담이 강한 체질',
        sections: [
            {
                icon: '✅',
                title: '좋은 음식',
                class: 'good-food',
                content: `<p><strong>육류와 뿌리채소가 최고예요!</strong> 🥩🥕</p>
<ul>
<li>🥩 <strong>쇠고기</strong>: 목양·목음 모두 매우 좋음!</li>
<li>🐷 <strong>돼지고기</strong>: 특히 목음에게 매우 좋아요</li>
<li>🥕 <strong>뿌리채소</strong>: 무, 당근, 연근, 우엉, 감자 - 간에 좋아요</li>
<li>🥚 <strong>계란</strong>: 단백질 공급원!</li>
<li>🥛 <strong>유제품(온)</strong>: 따뜻한 우유, 버터, 치즈 - 좋아요</li>
</ul>`
            },
            {
                icon: '⚠️',
                title: '피해야 할 음식',
                class: 'bad-food',
                content: `<p><strong>생선·해산물은 절대 금물!</strong> 🚫</p>
<ul>
<li>🐟 <strong>모든 생선</strong>: 바다생선, 민물생선 - 간에 해로워요</li>
<li>🦐 <strong>모든 해산물</strong>: 조개, 새우, 게, 굴 - 절대 피하세요</li>
<li>🥬 <strong>푸른잎채소 과다</strong>: 배추, 상추 등 - 많이 먹지 마세요</li>
<li>❄️ <strong>찬 음식</strong>: 냉유제품, 찬 음료 - 간을 차갑게 해요</li>
</ul>`
            },
            {
                icon: '💪',
                title: '장기의 강약',
                class: 'organ',
                content: `<p><strong>간과 담이 강해요!</strong> 💚</p>
<ul>
<li><strong>강한 장기</strong>: 간(肝), 담(膽) - 해독 능력이 뛰어나요</li>
<li><strong>약한 장기</strong>: 폐(肺), 대장(大腸) - 호흡기 조심하세요</li>
<li><strong>특징</strong>: 활동적이고 에너지가 넘치며, 육류를 잘 소화해요</li>
</ul>`
            },
            {
                icon: '🏃',
                title: '추천 활동',
                class: 'activity',
                content: `<p><strong>격렬한 운동이 잘 맞아요!</strong> 💪</p>
<ul>
<li>🏃 <strong>달리기·조깅</strong>: 에너지를 발산해요</li>
<li>⚽ <strong>구기 운동</strong>: 축구, 농구, 배구 - 재미있게!</li>
<li>🏋️ <strong>근력 운동</strong>: 웨이트 트레이닝 - 근육 만들기</li>
<li>🔥 <strong>격렬한 운동</strong>: 크로스핏, 복싱 - 스트레스 해소!</li>
<li><strong>좋아요</strong>: 사우나, 찜질방 - 땀 흘리기 좋아요!</li>
</ul>`
            }
        ]
    },
    '금': {
        title: '금체질 (금양·금음)',
        subtitle: '🏔️ 폐대장의 기운 - 폐와 대장이 강한 체질',
        sections: [
            {
                icon: '✅',
                title: '좋은 음식',
                class: 'good-food',
                content: `<p><strong>생선·조개류와 푸른잎채소가 최고예요!</strong> 🐟🥬</p>
<ul>
<li>🐟 <strong>바다생선</strong>: 흰살생선(명태, 가자미, 광어, 대구), 붉은살생선 - 폐에 좋아요</li>
<li>🦐 <strong>조개류·해산물</strong>: 조개, 새우, 게 - 매우 좋아요</li>
<li>🥬 <strong>푸른잎채소</strong>: 배추, 양배추, 상추, 시금치 - 대장을 깨끗하게!</li>
<li>🥚 <strong>계란흰자</strong>: 단백질 공급!</li>
<li>🍚 <strong>쌀·곡류</strong>: 현미, 백미, 잡곡 - 소화 잘 돼요</li>
</ul>`
            },
            {
                icon: '⚠️',
                title: '피해야 할 음식',
                class: 'bad-food',
                content: `<p><strong>모든 육류는 절대 금물!</strong> 🚫</p>
<ul>
<li>🥩 <strong>쇠고기</strong>: 폐에 해로워요 - 절대 피하세요</li>
<li>🐷 <strong>돼지고기</strong>: 대장에 나빠요 - 절대 피하세요</li>
<li>🍗 <strong>닭고기</strong>: 가금류 모두 - 절대 피하세요</li>
<li>🥕 <strong>뿌리채소</strong>: 무, 당근, 감자 - 소화가 안 돼요</li>
<li>🥛 <strong>유제품</strong>: 우유, 버터, 치즈 - 폐에 점액을 만들어요</li>
</ul>`
            },
            {
                icon: '💪',
                title: '장기의 강약',
                class: 'organ',
                content: `<p><strong>폐와 대장이 강해요!</strong> 🫁</p>
<ul>
<li><strong>강한 장기</strong>: 폐(肺), 대장(大腸) - 호흡이 깊고 튼튼해요</li>
<li><strong>약한 장기</strong>: 간(肝), 담(膽) - 간 기능 보호하세요</li>
<li><strong>특징</strong>: 맑고 깨끗한 것을 좋아하며, 생선을 잘 소화해요</li>
</ul>`
            },
            {
                icon: '🏃',
                title: '추천 활동',
                class: 'activity',
                content: `<p><strong>가볍고 맑은 운동이 좋아요!</strong> 🌿</p>
<ul>
<li>🚶 <strong>산책·걷기</strong>: 가벼운 유산소 운동</li>
<li>🧘 <strong>요가·명상</strong>: 마음을 평온하게</li>
<li>🏸 <strong>배드민턴·테니스</strong>: 가벼운 라켓 운동</li>
<li>🎨 <strong>예술 활동</strong>: 그림, 음악, 독서 - 마음 정화</li>
<li><strong>피하세요</strong>: 격렬한 운동, 과한 땀 - 무리하지 마세요</li>
</ul>`
            }
        ]
    },
    '토': {
        title: '토체질 (토양·토음)',
        subtitle: '⛰️ 비위의 기운 - 비장과 위장이 강한 체질',
        sections: [
            {
                icon: '✅',
                title: '좋은 음식',
                class: 'good-food',
                content: `<p><strong>쇠고기·돼지고기와 해산물이 좋아요!</strong> 🥩🐟</p>
<ul>
<li>🥩 <strong>쇠고기</strong>: 토양에게 매우 좋아요 (토음은 보통)</li>
<li>🐷 <strong>돼지고기</strong>: 토양·토음 모두 매우 좋아요!</li>
<li>🐟 <strong>바다생선</strong>: 흰살생선, 민물생선 - 소화 잘 돼요</li>
<li>🦐 <strong>조개류·해산물</strong>: 조개, 새우, 게, 굴 - 좋아요</li>
<li>🥬 <strong>푸른잎채소</strong>: 배추, 상추 - 비위에 좋아요</li>
<li>🥛 <strong>냉유제품</strong>: 찬 우유, 요거트 - 좋아요</li>
</ul>`
            },
            {
                icon: '⚠️',
                title: '피해야 할 음식',
                class: 'bad-food',
                content: `<p><strong>닭고기와 일부 뿌리채소는 조심!</strong> 🚫</p>
<ul>
<li>🍗 <strong>닭고기</strong>: 오리고기, 개고기 포함 - 절대 피하세요</li>
<li>🍖 <strong>염소고기</strong>: 흑염소중탕 - 절대 피하세요</li>
<li>🥕 <strong>일부 뿌리채소</strong>: 감자, 고구마, 마 - 위에 부담</li>
<li>☕ <strong>뜨거운 유제품</strong>: 따뜻한 우유 - 맞지 않아요</li>
<li>🌶️ <strong>자극적인 음식</strong>: 매운 음식 - 위를 자극해요</li>
</ul>`
            },
            {
                icon: '💪',
                title: '장기의 강약',
                class: 'organ',
                content: `<p><strong>비장과 위장이 강해요!</strong> 💛</p>
<ul>
<li><strong>강한 장기</strong>: 비(脾), 위(胃) - 소화 능력이 좋아요</li>
<li><strong>약한 장기</strong>: 신(腎), 방광(膀胱) - 하체 관리 중요해요</li>
<li><strong>특징</strong>: 안정적이고 차분하며, 해산물을 잘 소화해요</li>
</ul>`
            },
            {
                icon: '🏃',
                title: '추천 활동',
                class: 'activity',
                content: `<p><strong>온화하고 규칙적인 운동!</strong> 🌸</p>
<ul>
<li>🚶 <strong>걷기·산책</strong>: 가벼운 유산소 운동</li>
<li>🧘 <strong>요가·스트레칭</strong>: 몸과 마음을 부드럽게</li>
<li>🏊 <strong>수영</strong>: 관절에 무리 없는 운동</li>
<li>🎯 <strong>취미 활동</strong>: 정원 가꾸기, 낚시 - 마음의 안정</li>
<li><strong>피하세요</strong>: 격렬한 운동 - 무리하지 마세요</li>
</ul>`
            }
        ]
    },
    '수': {
        title: '수체질 (수양·수음)',
        subtitle: '💧 신방광의 기운 - 신장과 방광이 강한 체질',
        sections: [
            {
                icon: '✅',
                title: '좋은 음식',
                class: 'good-food',
                content: `<p><strong>닭고기와 뿌리채소가 좋아요!</strong> 🍗🥕</p>
<ul>
<li>🍗 <strong>닭고기</strong>: 오리고기, 개고기 포함 - 매우 좋아요!</li>
<li>🍖 <strong>염소고기</strong>: 흑염소중탕 - 매우 좋아요!</li>
<li>🥩 <strong>쇠고기</strong>: 수음에게 매우 좋음 (수양은 보통)</li>
<li>🥕 <strong>뿌리채소</strong>: 무, 당근, 감자, 고구마, 마 - 신장에 좋아요</li>
<li>🥚 <strong>계란</strong>: 노른자, 흰자 모두 좋아요</li>
<li>🥬 <strong>푸른잎채소</strong>: 배추, 상추 - 적당히 좋아요</li>
</ul>`
            },
            {
                icon: '⚠️',
                title: '피해야 할 음식',
                class: 'bad-food',
                content: `<p><strong>돼지고기와 조개류는 조심!</strong> 🚫</p>
<ul>
<li>🐷 <strong>돼지고기</strong>: 특히 수양은 절대 피하세요 (수음도 주의)</li>
<li>🦐 <strong>조개류</strong>: 조개, 굴 - 신장에 나빠요</li>
<li>🦀 <strong>새우·게</strong>: 갑각류 - 방광에 나빠요</li>
<li>🐟 <strong>일부 생선</strong>: 붉은살 생선 - 주의하세요</li>
<li>🥛 <strong>냉유제품</strong>: 찬 우유 - 맞지 않아요</li>
</ul>`
            },
            {
                icon: '💪',
                title: '장기의 강약',
                class: 'organ',
                content: `<p><strong>신장과 방광이 강해요!</strong> 💙</p>
<ul>
<li><strong>강한 장기</strong>: 신(腎), 방광(膀胱) - 수분 대사가 좋아요</li>
<li><strong>약한 장기</strong>: 비(脾), 위(胃) - 소화 기능 조심하세요</li>
<li><strong>특징</strong>: 차분하고 지혜로우며, 닭고기를 잘 소화해요</li>
</ul>`
            },
            {
                icon: '🏃',
                title: '추천 활동',
                class: 'activity',
                content: `<p><strong>적당한 강도의 운동!</strong> 💪</p>
<ul>
<li>🏃 <strong>조깅·달리기</strong>: 적당한 유산소 운동</li>
<li>🏋️ <strong>근력 운동</strong>: 웨이트 트레이닝 - 근육 만들기</li>
<li>⚽ <strong>구기 운동</strong>: 축구, 배구, 농구 - 재미있게!</li>
<li>🧘 <strong>하체 운동</strong>: 스쿼트, 런지 - 하체 강화</li>
<li><strong>좋아요</strong>: 사우나, 찜질방 - 땀 흘리기!</li>
</ul>`
            }
        ]
    }
};

/**
 * 체질 요약 팝업 표시
 */
function showConstitutionSummary(type) {
    const data = constitutionSummaries[type];
    if (!data) return;
    
    let sectionsHTML = '';
    data.sections.forEach(section => {
        sectionsHTML += `
            <div class="summary-section ${section.class}">
                <h4>${section.icon} ${section.title}</h4>
                ${section.content}
            </div>
        `;
    });
    
    const contentHTML = `
        <h2 class="constitution-summary-title">${data.title}</h2>
        <p class="constitution-summary-subtitle">${data.subtitle}</p>
        ${sectionsHTML}
    `;
    
    document.getElementById('constitutionSummaryContent').innerHTML = contentHTML;
    document.getElementById('constitutionSummaryPopup').style.display = 'flex';
    
    // 스크롤 초기화 (v0.8.9)
    setTimeout(() => {
        const popup = document.querySelector('.constitution-summary-popup');
        if (popup) {
            popup.scrollTop = 0;
        }
    }, 10);
    
    console.log(`✅ ${data.title} 요약 팝업 표시`);
}

/**
 * 체질 요약 팝업 닫기
 */
function closeConstitutionSummary() {
    document.getElementById('constitutionSummaryPopup').style.display = 'none';
    console.log('✅ 체질 요약 팝업 닫기');
}

