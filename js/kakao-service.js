/**
 * in8 - Kakao Service
 * 카카오 로그인 및 공유 관련 함수
 */

/**
 * 카카오 로그인
 */
function kakaoLogin() {
    if (typeof Kakao === 'undefined' || !Kakao.isInitialized()) {
        alert('⚠️ 카카오 SDK가 로드되지 않았습니다.\n잠시 후 다시 시도해주세요.');
        return;
    }
    
    Kakao.Auth.login({
        throughTalk: false,
        success: function(authObj) {
            console.log('✅ 카카오 로그인 성공:', authObj);
            
            // 사용자 정보 가져오기
            Kakao.API.request({
                url: '/v2/user/me',
                success: function(response) {
                    console.log('✅ 카카오 사용자 정보:', response);
                    handleKakaoLoginSuccess(response);
                },
                fail: function(error) {
                    console.error('❌ 카카오 사용자 정보 가져오기 실패:', error);
                    alert('⚠️ 사용자 정보를 가져오는데 실패했습니다.');
                }
            });
        },
        fail: function(err) {
            console.error('❌ 카카오 로그인 실패:', err);
            alert('⚠️ 카카오 로그인에 실패했습니다.\n다시 시도해주세요.');
        }
    });
}

/**
 * 카카오 로그인 성공 처리
 */
async function handleKakaoLoginSuccess(kakaoUser) {
    try {
        const userId = 'kakao_' + kakaoUser.id;
        const userData = {
            loginId: userId,
            name: kakaoUser.kakao_account?.profile?.nickname || '카카오 사용자',
            email: kakaoUser.kakao_account?.email || `${userId}@kakao.temp`,
            profileImage: kakaoUser.kakao_account?.profile?.profile_image_url || null,
            loginType: 'kakao',
            kakaoId: kakaoUser.id,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            surveyCount: 0
        };
        
        // 현재 사용자 설정
        currentUser = {
            type: 'user',
            loginId: userId,
            displayName: userData.name,
            email: userData.email,
            name: userData.name,
            profileImage: userData.profileImage,
            loginType: 'kakao'
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
                `✅ 환영합니다, ${userData.name}님!\n\n` +
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
        alert(`✅ 환영합니다, ${userData.name}님!\n카카오 로그인이 완료되었습니다.`);
        
        // Firebase에서 최신 설문 데이터 로드
        await initSurveyData();
        
        // 설문 화면으로 이동
        currentQuestionIndex = 0;
        answers = {};
        showScreen('surveyScreen');
        displayQuestion();
        updateUserInfo();
        
    } catch (error) {
        console.error('❌ 카카오 로그인 처리 실패:', error);
        alert('⚠️ 로그인 처리 중 오류가 발생했습니다.');
    }
}

/**
 * 카카오 로그아웃
 */
function kakaoLogout() {
    if (typeof Kakao === 'undefined' || !Kakao.isInitialized()) {
        return;
    }
    
    if (currentUser && currentUser.loginType === 'kakao') {
        Kakao.Auth.logout(function() {
            console.log('✅ 카카오 로그아웃 완료');
        });
    }
}

/**
 * 카카오톡 메시지 전송
 */
function sendKakaoMessage() {
    const lastResult = getLastSurveyResult();
    
    if (!lastResult) {
        alert('⚠️ 공유할 검사 결과가 없습니다.');
        return;
    }
    
    // 카카오 SDK가 초기화되지 않은 경우 클립보드 복사로 대체
    if (typeof Kakao === 'undefined' || !Kakao.isInitialized()) {
        alert('💡 카카오톡 API를 사용할 수 없어 클립보드 복사 방식으로 진행합니다.');
        copyResultForKakao(lastResult);
        return;
    }
    
    const constitutionDetail = constitutionInfo[lastResult.topConstitution.constitution];
    const shareUrl = window.location.href;
    
    try {
Kakao.Share.sendDefault({
    objectType: 'text',
    text: `🎉 in8 진단 완료!

👤 ${currentUser.name}님의 결과
🎯 ${lastResult.topConstitution.constitution} 체질 (${lastResult.topConstitution.score}점)

✅ 좋은 음식
${constitutionDetail.goodFoods.slice(0, 4).join(', ')} 등

⚠ 피할 음식
${constitutionDetail.badFoods.slice(0, 4).join(', ')} 등

🏃‍♂️ 좋은 운동
${constitutionDetail.goodExercise.slice(0, 3).join(', ')} 등

⚠️ 피할 운동
${constitutionDetail.badExercise.slice(0, 3).join(', ')} 등

💡 ${constitutionDetail.description}

━━━━━━━━━━━━━━━
👇 나도 진단받으려면 아래 버튼 클릭!

${APP_CONFIG.version} | © 2025 Infobank`,
    link: {
        webUrl: window.location.href,
        mobileWebUrl: window.location.href
    },
    buttonTitle: '나도 진단하기'
});

        console.log('✅ 카카오톡 메시지 전송 완료');
        
    } catch (error) {
        console.error('❌ 카카오톡 공유 오류:', error);
        alert('💡 카카오톡 직접 공유가 불가하여\n클립보드 복사 방식으로 진행합니다.\n\n(PC 환경에서는 클립보드 복사가 더 편할 수 있어요!)');
        copyResultForKakao(lastResult);
    }
}

/**
 * 카카오톡 수동 공유용 클립보드 복사
 */
function copyResultForKakao(result) {
    const constitutionDetail = constitutionInfo[result.topConstitution.constitution];
    
    const kakaoContent = `🎉 in8 진단 완료!

👤 ${currentUser.name}님의 결과
📅 ${result.timestamp.toLocaleString('ko-KR')}

🎯 ${result.topConstitution.constitution} 체질 (${result.topConstitution.score}점)
회원님의 체질일 가능성이 가장 높습니다

📊 체질별 점수 (전체)
${result.scores.map((score, index) => 
    `${index + 1}. ${score.constitution}${index === 0 ? ' (최고 점수) 🏆' : ''}: ${score.score}점`
).join('\n')}

🌟 ${result.topConstitution.constitution} 체질 특성
${constitutionDetail.description}

✅ 좋은 음식
${constitutionDetail.goodFoods.map(food => `• ${food}`).join('\n')}

⚠ 피해야 할 음식
${constitutionDetail.badFoods.map(food => `• ${food}`).join('\n')}

🏃‍♂️ 좋은 운동
${constitutionDetail.goodExercise.map(exercise => `• ${exercise}`).join('\n')}

⚠️ 피해야 할 운동
${constitutionDetail.badExercise.map(exercise => `• ${exercise}`).join('\n')}

💡 참고사항
본 진단 결과는 음식 선호도를 기반으로 한 체질 분석입니다. 
더 정확한 진단을 위해서는 전문의와 상담하시기 바랍니다.

체질에 맞는 음식과 운동을 꾸준히 실천하시면 
건강한 생활을 유지하는데 도움이 됩니다.

    in8 v${APP_CONFIG.version} | © 2025 Infobank`;

    try {
        navigator.clipboard.writeText(kakaoContent).then(() => {
            alert('📱 카카오톡 공유용 내용이 복사되었습니다!\n\n카카오톡을 열고 원하는 채팅방에서\n붙여넣기(Ctrl+V)하여 공유하세요.\n\n💡 개별 메시지나 단체 채팅 모두 가능합니다!');
        }).catch(() => {
            showKakaoModal(kakaoContent);
        });
    } catch (error) {
        showKakaoModal(kakaoContent);
    }
}

/**
 * 카카오톡 공유용 모달창
 */
function showKakaoModal(content) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.8); z-index: 10000; display: flex; 
        align-items: center; justify-content: center; padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; padding: 30px; max-width: 500px; max-height: 80%; overflow-y: auto; position: relative;">
            <h3 style="margin-bottom: 20px; color: #FEE500; background: #3C1E1E; padding: 10px; border-radius: 8px; text-align: center;">📱 카카오톡 공유하기</h3>
            <textarea readonly style="width: 100%; height: 350px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; font-size: 13px; resize: none; line-height: 1.4;" id="kakaoContent">${content}</textarea>
            <div style="margin-top: 20px; text-align: center;">
                <button onclick="copyFromKakaoModal()" style="background: #FEE500; color: #3C1E1E; border: none; padding: 12px 24px; border-radius: 8px; margin-right: 10px; cursor: pointer; font-weight: 600;">📋 복사하기</button>
                <button onclick="closeKakaoModal()" style="background: #95a5a6; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer;">닫기</button>
            </div>
            <p style="margin-top: 15px; font-size: 0.9rem; color: #666; text-align: center;">
                📱 복사 후 카카오톡에서 원하는 채팅방에<br>
                붙여넣기하여 공유하세요!
            </p>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    window.copyFromKakaoModal = function() {
        const textarea = document.getElementById('kakaoContent');
        textarea.select();
        document.execCommand('copy');
        alert('📱 카카오톡 공유용 내용이 복사되었습니다!\n\n카카오톡을 열고 원하는 채팅방에서\n붙여넣기(Ctrl+V)하여 공유하세요!');
    };
    
    window.closeKakaoModal = function() {
        document.body.removeChild(modal);
        delete window.copyFromKakaoModal;
        delete window.closeKakaoModal;
    };
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            window.closeKakaoModal();
        }
    });
}

/**
 * 마지막 설문 결과 가져오기
 */
function getLastSurveyResult() {
    if (surveyResults && surveyResults.length > 0) {
        return surveyResults[surveyResults.length - 1];
    }
    return null;
}
