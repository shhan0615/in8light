/**
 * in8 - 보안 기능
 * F12 개발자 도구 및 소스보기 차단
 * 
 * config.js의 APP_CONFIG.enableDevTools 설정에 따라 활성화/비활성화
 * - enableDevTools: false (기본값) - 개발자 도구 차단 활성화
 * - enableDevTools: true - 개발자 도구 차단 비활성화 (디버깅용)
 */

(function() {
    'use strict';

    // config.js가 로드되지 않았거나 설정이 없으면 기본값 사용
    const isDevToolsEnabled = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.enableDevTools === true);

    // 디버깅 모드가 활성화되어 있으면 보안 기능 비활성화
    if (isDevToolsEnabled) {
        console.log('🔓 개발자 도구 차단이 비활성화되었습니다. (디버깅 모드)');
        return;
    }

    console.log('🔒 개발자 도구 차단이 활성화되었습니다.');

    // ===== 1. 우클릭 방지 =====
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });

    // ===== 2. 특정 키 조합 방지 =====
    document.addEventListener('keydown', function(e) {
        // F12
        if (e.keyCode === 123) {
            e.preventDefault();
            return false;
        }
        
        // Ctrl+Shift+I (개발자 도구)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
            e.preventDefault();
            return false;
        }
        
        // Ctrl+Shift+J (콘솔)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
            e.preventDefault();
            return false;
        }
        
        // Ctrl+U (소스보기)
        if (e.ctrlKey && e.keyCode === 85) {
            e.preventDefault();
            return false;
        }
        
        // Ctrl+Shift+C (요소 검사)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
            e.preventDefault();
            return false;
        }
        
        // Ctrl+S (저장)
        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
            return false;
        }

        // F12 (Mac)
        if (e.metaKey && e.altKey && e.keyCode === 73) {
            e.preventDefault();
            return false;
        }
        
        // Cmd+Option+J (Mac 콘솔)
        if (e.metaKey && e.altKey && e.keyCode === 74) {
            e.preventDefault();
            return false;
        }
        
        // Cmd+Option+C (Mac 요소 검사)
        if (e.metaKey && e.altKey && e.keyCode === 67) {
            e.preventDefault();
            return false;
        }
        
        // Cmd+U (Mac 소스보기)
        if (e.metaKey && e.keyCode === 85) {
            e.preventDefault();
            return false;
        }
    });

    // ===== 3. 개발자 도구 열림 감지 =====
    let devtoolsOpen = false;
    const threshold = 160; // 개발자 도구가 열렸다고 판단하는 크기 차이

    // 콘솔에 객체를 출력하면 개발자 도구가 열렸을 때 toString()이 호출됨
    const detectDevTools = () => {
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        
        if (widthThreshold || heightThreshold) {
            if (!devtoolsOpen) {
                devtoolsOpen = true;
                handleDevToolsOpen();
            }
        } else {
            devtoolsOpen = false;
        }
    };

    // 개발자 도구가 열렸을 때 처리
    function handleDevToolsOpen() {
        // 경고 메시지 표시 (선택사항)
        // alert('개발자 도구 사용이 제한되어 있습니다.');
        
        // 페이지를 다시 로드하거나 다른 페이지로 이동 (선택사항)
        // window.location.reload();
        
        console.clear();
    }

    // 주기적으로 개발자 도구 열림 확인
    setInterval(detectDevTools, 1000);

    // ===== 4. 텍스트 선택 방지 (선택사항) =====
    // CSS에서 처리하는 것이 더 효율적이므로 주석 처리
    /*
    document.addEventListener('selectstart', function(e) {
        e.preventDefault();
        return false;
    });
    */

    // ===== 5. 드래그 방지 =====
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
        return false;
    });

    // ===== 6. 콘솔 메시지 숨기기 (선택사항) =====
    // 프로덕션에서는 콘솔 로그를 비활성화할 수 있습니다
    if (typeof APP_CONFIG !== 'undefined' && !APP_CONFIG.enableDebug) {
        console.log = function() {};
        console.warn = function() {};
        console.error = function() {};
        console.info = function() {};
    }

    // ===== 7. debugger 문 비활성화 =====
    setInterval(function() {
        (function() {
            return false;
        })['constructor']('debugger')['call']();
    }, 50);

})();
