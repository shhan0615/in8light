/**
 * in8 - Main Application
 * 메인 애플리케이션 로직
 */

// 보안 기능 활성화 - 우클릭 방지 및 F12 방지
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', function(e) {
    // if (e.key === 'F12' || 
    //     (e.ctrlKey && e.shiftKey && e.key === 'I') || 
    //     (e.ctrlKey && e.shiftKey && e.key === 'J') ||
    //     (e.ctrlKey && e.key === 'U')) {
    //     e.preventDefault();
    //     return false;
    // }
});

/**
 * 애플리케이션 초기화
 */
async function initializeApp() {
    try {
        console.log('🚀 in8 애플리케이션 시작...');
        
        // 버전 정보 표시
        updateVersionInfo();
        
        // 설문 데이터 초기화
        await initSurveyData();
        
        // 현재 설문 정보 표시
        updateCurrentSurveyInfo();
        
        console.log('✅ in8 애플리케이션 초기화 완료');
        console.log('%c🌿 in8 v' + APP_CONFIG.version, 'color: green; font-size: 20px; font-weight: bold;');
        console.log('%c💡 이름만 입력하면 바로 체질 진단을 시작할 수 있습니다!', 'color: blue; font-size: 14px;');
        
    } catch (error) {
        console.error('❌ 애플리케이션 초기화 실패:', error);
        alert('⚠️ 애플리케이션 초기화 중 오류가 발생했습니다.\n페이지를 새로고침해주세요.');
    }
}

/**
 * 버전 정보 업데이트
 */
function updateVersionInfo() {
    const versionElement = document.getElementById('versionInfo');
    if (versionElement && APP_CONFIG) {
        versionElement.textContent = `Version ${APP_CONFIG.version} (${APP_CONFIG.releaseDate})`;
    }
}

/**
 * 서비스 워커 등록 (PWA 지원)
 */
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('✅ Service Worker 등록 성공:', registration);
        } catch (error) {
            console.log('⚠️ Service Worker 등록 실패:', error);
        }
    }
}

/**
 * 온라인/오프라인 상태 모니터링
 */
function setupNetworkMonitoring() {
    window.addEventListener('online', () => {
        console.log('✅ 온라인 상태');
        // 필요시 알림 표시
    });

    window.addEventListener('offline', () => {
        console.log('⚠️ 오프라인 상태');
        alert('⚠️ 인터넷 연결이 끊어졌습니다.\n일부 기능이 제한될 수 있습니다.');
    });
}

/**
 * 에러 핸들링
 */
window.addEventListener('error', function(e) {
    console.error('❌ 전역 에러:', e.error);
    
    if (APP_CONFIG.enableDebug) {
        // 개발 모드에서는 상세 에러 표시
        alert(`⚠️ 오류 발생:\n${e.error?.message || '알 수 없는 오류'}`);
    }
});

/**
 * Promise rejection 핸들링
 */
window.addEventListener('unhandledrejection', function(e) {
    console.error('❌ Unhandled Promise Rejection:', e.reason);
    
    if (APP_CONFIG.enableDebug) {
        alert(`⚠️ 비동기 작업 오류:\n${e.reason?.message || '알 수 없는 오류'}`);
    }
});

/**
 * 페이지 가시성 변경 감지
 */
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        console.log('📱 앱이 백그라운드로 이동');
    } else {
        console.log('📱 앱이 포그라운드로 복귀');
    }
});

/**
 * 브라우저 호환성 체크
 */
function checkBrowserCompatibility() {
    const requiredFeatures = {
        'localStorage': typeof(Storage) !== "undefined",
        'fetch': typeof(fetch) !== "undefined",
        'Promise': typeof(Promise) !== "undefined"
    };
    
    const unsupportedFeatures = Object.entries(requiredFeatures)
        .filter(([, supported]) => !supported)
        .map(([feature]) => feature);
    
    if (unsupportedFeatures.length > 0) {
        console.warn('⚠️ 지원되지 않는 기능:', unsupportedFeatures);
        alert('⚠️ 현재 브라우저는 일부 기능을 지원하지 않습니다.\n최신 브라우저를 사용해주세요.');
    }
}

/**
 * 디바이스 정보 수집 (분석용)
 */
function getDeviceInfo() {
    return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        pixelRatio: window.devicePixelRatio,
        touchSupport: 'ontouchstart' in window
    };
}

/**
 * 애플리케이션 상태 저장 (로컬스토리지)
 */
function saveAppState() {
    try {
        const appState = {
            version: APP_CONFIG.version,
            lastAccess: new Date().toISOString(),
            currentUser: currentUser ? {
                loginId: currentUser.loginId,
                name: currentUser.name,
                loginType: currentUser.loginType
            } : null
        };
        
        localStorage.setItem('in8_state', JSON.stringify(appState));
    } catch (error) {
        console.error('❌ 앱 상태 저장 실패:', error);
    }
}

/**
 * 애플리케이션 상태 복원
 */
function restoreAppState() {
    try {
        const savedState = localStorage.getItem('in8_state');
        if (savedState) {
            const appState = JSON.parse(savedState);
            console.log('✅ 저장된 앱 상태 복원:', appState);
            
            // 버전 체크
            if (appState.version !== APP_CONFIG.version) {
                console.log('📦 앱 버전 업데이트 감지:', appState.version, '→', APP_CONFIG.version);
                // 필요시 마이그레이션 로직 실행
            }
            
            return appState;
        }
    } catch (error) {
        console.error('❌ 앱 상태 복원 실패:', error);
    }
    return null;
}

/**
 * 정기적인 자동 저장
 */
function setupAutoSave() {
    setInterval(() => {
        if (currentUser) {
            saveAppState();
        }
    }, 60000); // 1분마다 저장
}

/**
 * 페이지 언로드 시 정리 작업
 */
window.addEventListener('beforeunload', function(e) {
    // 진행 중인 설문이 있는 경우 경고
    if (currentUser && currentQuestionIndex > 0 && 
        currentQuestionIndex < (surveyData?.questions?.length || 0) - 1) {
        saveAppState();
        e.preventDefault();
        e.returnValue = '진행 중인 설문이 있습니다. 페이지를 나가시겠습니까?';
        return e.returnValue;
    }
    
    saveAppState();
});

/**
 * 디버그 정보 출력
 */
function printDebugInfo() {
    if (!APP_CONFIG.enableDebug) return;
    
    console.group('🔍 Debug Information');
    console.log('Version:', APP_CONFIG.version);
    console.log('Release Date:', APP_CONFIG.releaseDate);
    console.log('Current User:', currentUser);
    console.log('Survey Data:', surveyData);
    console.log('Device Info:', getDeviceInfo());
    console.groupEnd();
}

/**
 * 성능 모니터링
 */
function monitorPerformance() {
    if (window.performance && window.performance.timing) {
        window.addEventListener('load', function() {
            setTimeout(() => {
                const perfData = window.performance.timing;
                const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
                const connectTime = perfData.responseEnd - perfData.requestStart;
                const renderTime = perfData.domComplete - perfData.domLoading;
                
                console.group('⚡ Performance Metrics');
                console.log('Page Load Time:', pageLoadTime + 'ms');
                console.log('Connect Time:', connectTime + 'ms');
                console.log('Render Time:', renderTime + 'ms');
                console.groupEnd();
                
                // 성능이 느린 경우 경고
                if (pageLoadTime > 5000) {
                    console.warn('⚠️ 페이지 로드가 느립니다:', pageLoadTime + 'ms');
                }
            }, 0);
        });
    }
}

/**
 * 애널리틱스 초기화 (향후 Google Analytics 등 연동 시)
 */
function initAnalytics() {
    // TODO: Google Analytics 또는 다른 분석 도구 초기화
    if (APP_CONFIG.enableDebug) {
        console.log('📊 Analytics 초기화 (스텁)');
    }
}

/**
 * 푸시 알림 권한 요청 (향후 기능)
 */
async function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        try {
            const permission = await Notification.requestPermission();
            console.log('🔔 알림 권한:', permission);
        } catch (error) {
            console.log('⚠️ 알림 권한 요청 실패:', error);
        }
    }
}

// ============================================
// 메인 실행
// ============================================

// DOM이 로드되면 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📄 DOM 로드 완료');
    
    // 브라우저 호환성 체크
    checkBrowserCompatibility();
    
    // 앱 상태 복원
    restoreAppState();
    
    // 애플리케이션 초기화
    await initializeApp();
    
    // 자동 저장 설정
    setupAutoSave();
    
    // 네트워크 모니터링
    setupNetworkMonitoring();
    
    // 성능 모니터링
    monitorPerformance();
    
    // 디버그 정보 출력
    printDebugInfo();
    
    // 애널리틱스 초기화
    initAnalytics();
    
    // Service Worker 등록 (선택사항)
    // await registerServiceWorker();
    
    console.log('🎉 in8 애플리케이션 준비 완료!');
});

// 전역 스코프에 필요한 함수들 노출
window.in8 = {
    version: APP_CONFIG.version,
    getDeviceInfo,
    printDebugInfo,
    saveAppState,
    restoreAppState
};
