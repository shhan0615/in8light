/**
 * in8 - Survey Service
 * 설문조사 관련 함수
 */

// 전역 변수
let currentQuestionIndex = 0;
let answers = {};
let surveyResults = [];
let surveyData = null;

/**
 * 타임스탬프를 연월일시분초 형식으로 포맷
 */
function formatTimestamp(timestamp) {
    try {
        const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return `${year}년 ${month}월 ${day}일 ${hours}시 ${minutes}분 ${seconds}초`;
    } catch (error) {
        console.error('타임스탬프 포맷 오류:', error);
        return '-';
    }
}

/**
 * 설문 데이터 초기화
 */
async function initSurveyData() {
    try {
        console.log('🔄 설문 데이터 동기화 중...');
        
        // Firebase에서 설문 데이터 가져오기
        const firebaseSurveyData = await getSurveyData();
        
        if (firebaseSurveyData && firebaseSurveyData.questions && firebaseSurveyData.questions.length > 0) {
            surveyData = firebaseSurveyData;
            console.log('✅ Firebase에서 설문 데이터 로드:', surveyData.questions.length, '개 질문');
            console.log('📊 업데이트 날짜:', firebaseSurveyData.updatedAt || '정보 없음');
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

/**
 * 질문 표시
 */
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
    
    container.innerHTML = `
        <div class="question-card">
            <div class="question-text">${question.text}</div>
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

/**
 * 옵션 선택
 */
function selectOption(optionIndex) {
    answers[currentQuestionIndex] = optionIndex;
    updateOptionStyles();
    
    // 마지막 질문 선택시 로딩 화면 표시
    if (currentQuestionIndex === surveyData.questions.length - 1) {
        setTimeout(() => {
            showLoadingAndComplete();
        }, 300);
        return;
    }
    
    setTimeout(() => {
        if (currentQuestionIndex < surveyData.questions.length - 1) {
            nextQuestion();
        }
    }, 300);
}

function showLoadingAndComplete() {
    const loadingMessages = [
        '🧬 AI가 체질 데이터를 분석하는 중...',
        '🍎 AI가 맞춤 음식을 선별하는 중...',
        '🏃‍♂️ AI가 최적의 운동을 찾는 중...',
        '✨ AI가 결과를 완성하는 중...'
    ];
    
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = `
        <div class="loading-content">
            <div class="loading-icon">🧬</div>
            <div class="loading-text" id="loadingText">AI가 분석 중입니다...</div>
            <div class="loading-subtext">체질별 맞춤 결과를 준비하고 있어요</div>
            <div class="loading-bar-container">
                <div class="loading-bar"></div>
            </div>
            <div class="loading-percentage" id="loadingPercentage">0%</div>
        </div>
    `;
    
    document.body.appendChild(loadingOverlay);
    
    // 메시지 변경
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
        messageIndex++;
        if (messageIndex < loadingMessages.length) {
            const loadingTextElement = document.getElementById('loadingText');
            if (loadingTextElement) {
                loadingTextElement.textContent = loadingMessages[messageIndex];
            }
        }
    }, 750);
    
    // 퍼센트 애니메이션
    let percentage = 0;
    const percentageInterval = setInterval(() => {
        percentage += 3.33;
        if (percentage > 100) percentage = 100;
        
        const percentageElement = document.getElementById('loadingPercentage');
        if (percentageElement) {
            percentageElement.textContent = Math.round(percentage) + '%';
        }
        
        if (percentage >= 100) {
            clearInterval(percentageInterval);
        }
    }, 100);
    
    // 3초 후 결과 표시
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

/**
 * 옵션 스타일 업데이트
 */
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

/**
 * 이전 질문
 */
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
}

/**
 * 다음 질문
 */
function nextQuestion() {
    if (answers[currentQuestionIndex] === undefined) {
        alert('답변을 선택해주세요.');
        return;
    }

    if (currentQuestionIndex < surveyData.questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    }
}

/**
 * 설문 완료
 */
async function completeSurvey() {
    // 모든 질문에 답변했는지 확인
    if (answers[currentQuestionIndex] === undefined) {
        alert('답변을 선택해주세요.');
        return;
    }

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
        
        // Firebase에 저장
        if (currentUser && currentUser.loginId) {
            await saveSurveyResult(currentUser.loginId, results);
            
            // currentUser에 최종 체질 즉시 업데이트
            currentUser.lastConstitution = results.topConstitution.constitution;
            currentUser.lastConstitutionScore = results.topConstitution.score;
            
            // localStorage에도 즉시 저장
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            console.log('✅ 프로필 체질 정보 localStorage 저장 완료:', currentUser.lastConstitution);
            
            // 저장된 설문 진행 상태 삭제 (완료되었으므로)
            clearSurveyProgress(currentUser.loginId);
        }
        
        // 로컬에 저장
        surveyResults.push(results);
        
        // 결과 표시
        displayResults(results);
        showScreen('resultScreen');
        
        // 알림 표시 후 프로필 실시간 업데이트
        setTimeout(() => {
            alert(
                `🎊 축하합니다! in8 진단이 완료되었습니다!\n\n` +
                `📋 진단 결과:\n` +
                `🏆 회원님의 체질: ${results.topConstitution.constitution} 체질\n` +
                `📊 점수: ${results.topConstitution.score}점\n\n` +
                `아래에서 상세한 결과를 확인하세요:\n` +
                `✅ 추천 음식 및 운동\n` +
                `⚠ 피해야 할 음식 및 운동\n` +
                `🌟 체질별 특성 설명\n\n` +
                `📱 결과를 카카오톡으로도 전송할 수 있습니다!\n\n` +
                `확인을 누르시면 프로필이 업데이트됩니다.`
            );
            
            // 알림 확인 후 프로필 UI 실시간 업데이트 (페이지 새로고침 없이)
            console.log('🔄 프로필 UI 실시간 업데이트 시작');
            
            // home.js의 전역 함수 호출
            if (typeof window.refreshUserConstitutionInfo === 'function') {
                window.refreshUserConstitutionInfo();
                console.log('✅ 체질 정보 새로고침 함수 호출 완료');
            } else if (typeof updateUserInterface === 'function' && currentUser) {
                updateUserInterface(currentUser);
                console.log('✅ 프로필 UI 업데이트 완료:', currentUser.lastConstitution);
            } else {
                console.warn('⚠️ 체질 정보 업데이트 함수를 찾을 수 없습니다.');
            }
        }, 500);
        
    } catch (error) {
        console.error('❌ 설문 완료 처리 실패:', error);
        alert('⚠️ 결과 저장 중 오류가 발생했습니다.');
    }
}

/**
 * 결과 계산
 */
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

/**
 * 결과 표시
 */
function displayResults(results) {
    const container = document.getElementById('resultContainer');
    if (!container) return;
    
    // 결과를 전역 변수에 저장 (카카오톡 공유용)
    window.lastSurveyResult = results;
    
    const constitutionDetail = constitutionInfo[results.topConstitution.constitution];
    
    container.innerHTML = `
        <div class="summary-card">
            <h3>🎯 ${results.topConstitution.constitution} 체질</h3>
            <p>회원님의 체질일 가능성이 가장 높습니다</p>
            <p><strong>${results.topConstitution.score}점</strong> / 총 ${results.totalQuestions}개 질문</p>
        </div>
        
        <div class="result-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h2>📊 체질별 점수</h2>
                <button class="btn btn-secondary" onclick="toggleDetailedScores()" id="toggleScoreBtn">📊 전체 점수 보기</button>
            </div>
            
            <div id="topScoreOnly" style="display: block;">
                <div class="result-item highest-score">
                    <div class="result-name">${results.topConstitution.constitution} (최고 점수)</div>
                    <div class="result-score">${results.topConstitution.score}점</div>
                </div>
            </div>
            
            <div id="allScoresDetail" style="display: none;">
                ${results.scores.map((result, index) => `
                    <div class="result-item ${index === 0 ? 'highest-score' : ''}">
                        <div class="result-name">${result.constitution} ${index === 0 ? '(최고 점수)' : ''}</div>
                        <div class="result-score">${result.score}점</div>
                    </div>
                `).join('')}
            </div>
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
            <small>🕐 검사 완료 시간: ${results.timestamp.toLocaleString('ko-KR')}</small>
        </div>
        
        <div class="alert alert-info" style="margin-top: 20px;">
            <h4>💡 참고사항</h4>
            <p>본 진단 결과는 음식 선호도를 기반으로 한 체질 분석입니다. 더 정확한 진단을 위해서는 전문의와 상담하시기 바랍니다.</p>
        </div>
    `;
}

/**
 * 상세 점수 토글
 */
function toggleDetailedScores() {
    const topScoreOnly = document.getElementById('topScoreOnly');
    const allScoresDetail = document.getElementById('allScoresDetail');
    const toggleBtn = document.getElementById('toggleScoreBtn');
    
    if (allScoresDetail.style.display === 'none') {
        topScoreOnly.style.display = 'none';
        allScoresDetail.style.display = 'block';
        toggleBtn.textContent = '📊 간단히 보기';
        toggleBtn.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
    } else {
        topScoreOnly.style.display = 'block';
        allScoresDetail.style.display = 'none';
        toggleBtn.textContent = '📊 전체 점수 보기';
        toggleBtn.style.background = 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)';
    }
}

/**
 * 진행률 업데이트
 */
function updateProgress() {
    const progress = ((currentQuestionIndex + 1) / surveyData.questions.length) * 100;
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const progressPercentage = document.getElementById('progressPercentage');
    
    if (progressBar) progressBar.style.width = progress + '%';
    if (progressText) progressText.textContent = `진행률 (${currentQuestionIndex + 1}/${surveyData.questions.length})`;
    if (progressPercentage) progressPercentage.textContent = Math.round(progress) + '%';
}

/**
 * 네비게이션 버튼 업데이트
 */
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const completeBtn = document.getElementById('completeBtn');

    if (prevBtn) {
        prevBtn.style.display = currentQuestionIndex === 0 ? 'none' : 'inline-block';
    }
    
    if (currentQuestionIndex === surveyData.questions.length - 1) {
        if (nextBtn) nextBtn.classList.add('hidden');
        if (completeBtn) completeBtn.classList.remove('hidden');
    } else {
        if (nextBtn) nextBtn.classList.remove('hidden');
        if (completeBtn) completeBtn.classList.add('hidden');
    }
}

/**
 * 검사 중단 (현재까지 결과 보기)
 */
function goHome() {
    const answeredCount = Object.keys(answers).length;
    const progress = Math.round((answeredCount / surveyData.questions.length) * 100);
    const remaining = surveyData.questions.length - answeredCount;
    
    if (answeredCount === 0) {
        const message = `🌟 아직 시작하지 않으셨네요!\n\n설문을 진행하시면 맞춤 건강 가이드를 받으실 수 있어요!\n\n정말 그만두시겠어요?`;
        
        if (confirm(message)) {
            // 진행 상태 저장
            if (currentUser && currentUser.loginId) {
                saveSurveyProgress();
            }
            
            answers = {};
            currentQuestionIndex = 0; 
            logout();
        }
        return;
    }
    
    const message = `🌟 잠깐만요!\n\n지금까지 ${progress}% 완료하셨어요!\n(${answeredCount}/${surveyData.questions.length}개 답변 완료)\n\n여기까지의 결과를 보시겠어요?\n\n✅ 확인: 여기까지 결과 보기\n❌ 취소: 계속 진행하기`;
    
    if (confirm(message)) {
        // 현재까지의 답변으로 부분 결과 계산
        const partialResults = calculatePartialResults();
        
        // 진행 상태 저장 (다음에 이어서 할 수 있도록)
        if (currentUser && currentUser.loginId) {
            saveSurveyProgress();
        }
        
        // 부분 결과 표시
        displayPartialResults(partialResults, answeredCount);
    }
}

/**
 * 부분 결과 계산 (답변한 질문만으로)
 */
function calculatePartialResults() {
    const constitutionScores = {
        '목양': 0, '목음': 0,
        '토양': 0, '토음': 0,
        '금양': 0, '금음': 0,
        '수양': 0, '수음': 0
    };

    // 답변한 질문들에 대해서만 점수 계산
    Object.keys(answers).forEach(questionIndex => {
        const question = surveyData.questions[parseInt(questionIndex)];
        const answerIndex = answers[questionIndex];
        const selectedOption = question.options[answerIndex];

        if (selectedOption && selectedOption.scores) {
            Object.keys(selectedOption.scores).forEach(constitution => {
                if (constitutionScores.hasOwnProperty(constitution)) {
                    constitutionScores[constitution] += selectedOption.scores[constitution];
                }
            });
        }
    });

    // 점수 기준으로 정렬
    const sortedScores = Object.entries(constitutionScores)
        .map(([constitution, score]) => ({ constitution, score }))
        .sort((a, b) => b.score - a.score);

    return {
        scores: sortedScores,
        topConstitution: sortedScores[0],
        timestamp: new Date(),
        isPartial: true,
        answeredCount: Object.keys(answers).length,
        totalQuestions: surveyData.questions.length
    };
}

/**
 * 부분 결과 표시
 */
function displayPartialResults(results, answeredCount) {
    const resultContainer = document.getElementById('resultContainer');
    const userInfoElement = document.getElementById('resultUserInfo');
    
    if (userInfoElement && currentUser) {
        userInfoElement.innerHTML = `👤 <strong>${currentUser.name || currentUser.displayName}</strong>님`;
    }
    
    const topConstitution = results.topConstitution;
    const info = constitutionInfo[topConstitution.constitution];
    
    if (!info) {
        resultContainer.innerHTML = `
            <div class="alert alert-info">
                <h3>⚠️ 오류</h3>
                <p>체질 정보를 불러올 수 없습니다.</p>
            </div>
        `;
        return;
    }

    resultContainer.innerHTML = `
        <div class="alert alert-info" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none;">
            <h3 style="color: white; margin-bottom: 10px;">📊 여기까지의 결과 (${answeredCount}/${results.totalQuestions}개 답변)</h3>
            <p style="color: white; opacity: 0.95;">
                완전한 결과는 아니지만, 지금까지의 답변을 분석한 결과입니다.<br>
                더 정확한 진단을 위해서는 모든 질문에 답변해주세요.
            </p>
        </div>

        <div class="result-card">
            <div class="result-header">
                <h2>🎯 예상 체질</h2>
                <div class="result-score">${topConstitution.score}점</div>
            </div>
            <div class="constitution-name">${topConstitution.constitution}</div>
            <p style="color: #666; margin-top: 10px; font-size: 0.95rem;">
                ⚠️ 이 결과는 ${answeredCount}개 질문만 답변한 부분 결과입니다.
            </p>
        </div>

        <div class="info-section">
            <h3>📖 ${topConstitution.constitution} 체질 특징</h3>
            <p>${info.description}</p>
        </div>

        <div class="info-section">
            <h3>✅ 좋은 음식 (일부)</h3>
            <div class="food-grid">
                ${info.goodFoods.slice(0, 8).map(food => `
                    <div class="food-item good">${food}</div>
                `).join('')}
            </div>
            <p style="color: #666; font-size: 0.9rem; margin-top: 10px;">
                ${info.goodFoods.length > 8 ? `외 ${info.goodFoods.length - 8}가지 더` : ''}
            </p>
        </div>

        <div class="info-section">
            <h3>⚠ 피해야 할 음식 (일부)</h3>
            <div class="food-grid">
                ${info.badFoods.slice(0, 8).map(food => `
                    <div class="food-item bad">${food}</div>
                `).join('')}
            </div>
            <p style="color: #666; font-size: 0.9rem; margin-top: 10px;">
                ${info.badFoods.length > 8 ? `외 ${info.badFoods.length - 8}가지 더` : ''}
            </p>
        </div>

        <div class="info-section">
            <h3>🏃‍♂️ 좋은 운동</h3>
            <div class="exercise-list">
                ${info.goodExercise.map(exercise => `
                    <div class="exercise-item good">✓ ${exercise}</div>
                `).join('')}
            </div>
        </div>

        <div class="info-section">
            <h3>⚠️ 피해야 할 운동</h3>
            <div class="exercise-list">
                ${info.badExercise.map(exercise => `
                    <div class="exercise-item bad">✗ ${exercise}</div>
                `).join('')}
            </div>
        </div>

        <div class="alert alert-info" style="margin-top: 30px;">
            <h4>💡 참고사항</h4>
            <p style="line-height: 1.6;">
                • 이 결과는 ${answeredCount}개 질문만 답변한 부분 결과입니다.<br>
                • 더 정확한 진단을 위해서는 모든 질문에 답변해주세요.<br>
                • 재로그인하면 이어서 진행할 수 있습니다.<br>
                • 본 진단은 음식 선호도를 기반으로 한 체질 분석입니다.<br>
                • 더 정확한 진단은 전문의와 상담하시기 바랍니다.
            </p>
        </div>

        <div style="margin-top: 30px; text-align: center;">
            <h3 style="margin-bottom: 15px;">📊 전체 체질별 점수</h3>
            ${results.scores.map((score, index) => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; margin: 8px 0; background: ${index === 0 ? 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)' : '#f8f9fa'}; color: ${index === 0 ? 'white' : '#333'}; border-radius: 8px; font-weight: ${index === 0 ? '600' : '400'};">
                    <span>${index + 1}. ${score.constitution}${index === 0 ? ' 🏆' : ''}</span>
                    <span>${score.score}점</span>
                </div>
            `).join('')}
        </div>
    `;
    
    // 결과 화면으로 전환하고 버튼 변경
    showScreen('resultScreen');
    
    // 부분 결과용 버튼으로 변경
    const navigationDiv = document.querySelector('#resultScreen .navigation');
    navigationDiv.innerHTML = `
        <button class="btn" onclick="continueFromPartialResult()">▶️ 이어서 진행하기</button>
        <button class="btn" onclick="sharePartialResult()" style="background: linear-gradient(135deg, #FEE500 0%, #FFCD00 100%); color: #3C1E1E;">📱 카카오톡 공유</button>
        <button class="btn btn-secondary" onclick="logoutFromPartialResult()">로그아웃</button>
    `;
    
    // 부분 결과를 전역 변수에 저장 (공유 시 사용)
    window.currentPartialResult = results;
}

/**
 * 부분 결과에서 이어서 진행하기
 */
function continueFromPartialResult() {
    showScreen('surveyScreen');
    displayQuestion();
    updateUserInfo();
}

/**
 * 부분 결과에서 로그아웃
 */
function logoutFromPartialResult() {
    if (confirm('🔄 로그아웃하시겠습니까?\n\n진행 상태가 저장되었으니\n다음에 로그인하시면 이어서 진행하실 수 있습니다.')) {
        // 진행 상태는 이미 저장되어 있음
        logout();
    }
}

/**
 * 부분 결과 카카오톡 공유
 */
function sharePartialResult() {
    const result = window.currentPartialResult;
    
    if (!result) {
        alert('⚠️ 공유할 결과가 없습니다.');
        return;
    }
    
    const constitutionDetail = constitutionInfo[result.topConstitution.constitution];
    
    // 카카오 SDK가 초기화되지 않은 경우 클립보드 복사로 대체
    if (typeof Kakao === 'undefined' || !Kakao.isInitialized()) {
        alert('💡 카카오톡 API를 사용할 수 없어 클립보드 복사 방식으로 진행합니다.');
        copyPartialResultForKakao(result, constitutionDetail);
        return;
    }
    
    try {
        Kakao.Share.sendDefault({
            objectType: 'text',
            text: `🎉 in8 부분 진단 결과! (${result.answeredCount}/${result.totalQuestions}개 답변)

👤 ${currentUser.name}님의 결과
🎯 예상 체질: ${result.topConstitution.constitution} (${result.topConstitution.score}점)

⚠️ 이 결과는 ${result.answeredCount}개 질문만 답변한 부분 결과입니다.
더 정확한 진단을 위해서는 모든 질문에 답변해주세요!

✅ 좋은 음식 (일부)
${constitutionDetail.goodFoods.slice(0, 4).join(', ')} 등

⚠ 피할 음식 (일부)
${constitutionDetail.badFoods.slice(0, 4).join(', ')} 등

🏃‍♂️ 좋은 운동
${constitutionDetail.goodExercise.slice(0, 3).join(', ')} 등

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
        alert('💡 카카오톡 직접 공유가 불가하여\n클립보드 복사 방식으로 진행합니다.');
        copyPartialResultForKakao(result, constitutionDetail);
    }
}

/**
 * 부분 결과 카카오톡 수동 공유용 클립보드 복사
 */
function copyPartialResultForKakao(result, constitutionDetail) {
    const kakaoContent = `🎉 in8 부분 진단 결과!

👤 ${currentUser.name}님의 결과
📅 ${result.timestamp.toLocaleString('ko-KR')}

⚠️ 이 결과는 ${result.answeredCount}/${result.totalQuestions}개 질문만 답변한 부분 결과입니다.
더 정확한 진단을 위해서는 모든 질문에 답변해주세요!

🎯 예상 체질: ${result.topConstitution.constitution} (${result.topConstitution.score}점)

📊 체질별 점수 (전체)
${result.scores.map((score, index) => 
    `${index + 1}. ${score.constitution}${index === 0 ? ' (최고 점수) 🏆' : ''}: ${score.score}점`
).join('\n')}

🌟 ${result.topConstitution.constitution} 체질 특성
${constitutionDetail.description}

✅ 좋은 음식 (일부)
${constitutionDetail.goodFoods.slice(0, 10).map(food => `• ${food}`).join('\n')}
${constitutionDetail.goodFoods.length > 10 ? `외 ${constitutionDetail.goodFoods.length - 10}가지 더` : ''}

⚠ 피해야 할 음식 (일부)
${constitutionDetail.badFoods.slice(0, 10).map(food => `• ${food}`).join('\n')}
${constitutionDetail.badFoods.length > 10 ? `외 ${constitutionDetail.badFoods.length - 10}가지 더` : ''}

🏃‍♂️ 좋은 운동
${constitutionDetail.goodExercise.map(exercise => `• ${exercise}`).join('\n')}

⚠️ 피해야 할 운동
${constitutionDetail.badExercise.map(exercise => `• ${exercise}`).join('\n')}

💡 참고사항
본 진단 결과는 부분 답변을 기반으로 한 체질 분석입니다. 
더 정확한 진단을 위해서는 모든 질문에 답변하시고,
전문의와 상담하시기 바랍니다.

체질에 맞는 음식과 운동을 꾸준히 실천하시면 
건강한 생활을 유지하는데 도움이 됩니다.

    in8 v${APP_CONFIG.version} | © 2025 Infobank`;

    try {
        navigator.clipboard.writeText(kakaoContent).then(() => {
            alert('📱 카카오톡 공유용 내용이 복사되었습니다!\n\n카카오톡을 열고 원하는 채팅방에서\n붙여넣기(Ctrl+V)하여 공유하세요.\n\n💡 개별 메시지나 단체 채팅 모두 가능합니다!');
        }).catch(() => {
            showPartialKakaoModal(kakaoContent);
        });
    } catch (error) {
        showPartialKakaoModal(kakaoContent);
    }
}

/**
 * 부분 결과 카카오톡 공유용 모달창
 */
function showPartialKakaoModal(content) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.8); z-index: 10000; display: flex; 
        align-items: center; justify-content: center; padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; padding: 30px; max-width: 500px; max-height: 80%; overflow-y: auto; position: relative;">
            <h3 style="margin-bottom: 20px; color: #FEE500; background: #3C1E1E; padding: 10px; border-radius: 8px; text-align: center;">📱 카카오톡 공유하기</h3>
            <textarea readonly style="width: 100%; height: 350px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; font-size: 13px; resize: none; line-height: 1.4;" id="partialKakaoContent">${content}</textarea>
            <div style="margin-top: 20px; text-align: center;">
                <button onclick="copyFromPartialKakaoModal()" style="background: #FEE500; color: #3C1E1E; border: none; padding: 12px 24px; border-radius: 8px; margin-right: 10px; cursor: pointer; font-weight: 600;">📋 복사하기</button>
                <button onclick="closePartialKakaoModal()" style="background: #95a5a6; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer;">닫기</button>
            </div>
            <p style="margin-top: 15px; font-size: 0.9rem; color: #666; text-align: center;">
                📱 복사 후 카카오톡에서 원하는 채팅방에<br>
                붙여넣기하여 공유하세요!
            </p>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    window.copyFromPartialKakaoModal = function() {
        const textarea = document.getElementById('partialKakaoContent');
        textarea.select();
        document.execCommand('copy');
        alert('📱 카카오톡 공유용 내용이 복사되었습니다!\n\n카카오톡을 열고 원하는 채팅방에서\n붙여넣기(Ctrl+V)하여 공유하세요!');
    };
    
    window.closePartialKakaoModal = function() {
        document.body.removeChild(modal);
        delete window.copyFromPartialKakaoModal;
        delete window.closePartialKakaoModal;
    };
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            window.closePartialKakaoModal();
        }
    });
}

/**
 * 설문 진행 상태 저장
 */
function saveSurveyProgress() {
    try {
        const progressData = {
            userId: currentUser.loginId,
            userName: currentUser.name,
            currentQuestionIndex: currentQuestionIndex,
            answers: answers,
            totalQuestions: surveyData.questions.length,
            savedAt: new Date().toISOString(),
            progress: Math.round(((currentQuestionIndex + 1) / surveyData.questions.length) * 100)
        };
        
        localStorage.setItem(`in8_survey_progress_${currentUser.loginId}`, JSON.stringify(progressData));
        console.log('✅ 설문 진행 상태 저장됨:', progressData.progress + '%');
    } catch (error) {
        console.error('❌ 설문 진행 상태 저장 실패:', error);
    }
}

/**
 * 저장된 설문 진행 상태 불러오기
 */
function loadSurveyProgress(userId) {
    try {
        const savedData = localStorage.getItem(`in8_survey_progress_${userId}`);
        if (savedData) {
            return JSON.parse(savedData);
        }
        return null;
    } catch (error) {
        console.error('❌ 설문 진행 상태 로드 실패:', error);
        return null;
    }
}

/**
 * 저장된 설문 진행 상태 삭제
 */
function clearSurveyProgress(userId) {
    try {
        localStorage.removeItem(`in8_survey_progress_${userId}`);
        console.log('✅ 설문 진행 상태 삭제됨');
    } catch (error) {
        console.error('❌ 설문 진행 상태 삭제 실패:', error);
    }
}

/**
 * 저장된 진행 상태에서 설문 재개
 */
function resumeSurvey(progressData) {
    try {
        currentQuestionIndex = progressData.currentQuestionIndex;
        answers = progressData.answers;
        
        showScreen('surveyScreen');
        displayQuestion();
        updateUserInfo();
        
        console.log('✅ 설문 재개됨:', progressData.progress + '%');
    } catch (error) {
        console.error('❌ 설문 재개 실패:', error);
        // 실패 시 처음부터 시작
        currentQuestionIndex = 0;
        answers = {};
        displayQuestion();
    }
}

/**
 * 검사 재시작
 */
async function restartSurvey() {
    if (confirm('🔄 새로운 검사를 시작하시겠습니까?')) {
        // 저장된 진행 상태 삭제
        if (currentUser && currentUser.loginId) {
            clearSurveyProgress(currentUser.loginId);
        }
        
        // Firebase에서 최신 설문 데이터 로드
        await initSurveyData();
        
        currentQuestionIndex = 0;
        answers = {};
        showScreen('surveyScreen');
        displayQuestion();
        updateUserInfo();
    }
}

/**
 * 새로운 검사 시작
 */
async function startNewSurvey() {
    // 저장된 진행 상태 삭제
    if (currentUser && currentUser.loginId) {
        clearSurveyProgress(currentUser.loginId);
    }
    
    // Firebase에서 최신 설문 데이터 로드
    await initSurveyData();
    
    currentQuestionIndex = 0;
    answers = {};
    showScreen('surveyScreen');
    displayQuestion();
    updateUserInfo();
}

/**
 * 검사 이력 보기
 */
function viewMyHistory() {
    showScreen('historyScreen');
    loadUserHistory();
    updateUserInfo();
}

/**
 * 사용자 검사 이력 로드
 */
async function loadUserHistory() {
    const container = document.getElementById('historyContainer');
    if (!container) return;
    
    if (!currentUser || !currentUser.loginId) {
        container.innerHTML = `
            <div class="alert alert-info">
                <h3>📋 로그인이 필요합니다</h3>
                <p>검사 이력을 보려면 로그인해주세요.</p>
            </div>
        `;
        return;
    }
    
    try {
        const history = await getUserSurveyHistory(currentUser.loginId);
        
        if (!history || history.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info">
                    <h3>📋 아직 검사 이력이 없습니다</h3>
                    <p>첫 번째 in8 진단을 시작해보세요!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div style="margin-bottom: 20px;">
                <h3>총 ${history.length}회 검사 완료</h3>
            </div>
            ${history.map((result, index) => `
                <div class="history-item" style="background: white; padding: 25px; border-radius: 12px; margin-bottom: 20px; border-left: 5px solid #667eea; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3>${history.length - index}회차 검사</h3>
                        <div style="color: #666; font-size: 0.9rem;">${result.timestamp ? formatTimestamp(result.timestamp) : '-'}</div>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <strong>🎯 진단 결과:</strong> 
                        <a href="javascript:void(0)" onclick="showConstitutionDetail('${result.topConstitution?.constitution || ''}')" style="color: #667eea; font-weight: bold; font-size: 1.3rem; text-decoration: underline; cursor: pointer;">
                            ${result.topConstitution?.constitution || '-'}
                        </a>
                    </div>
                    <details>
                        <summary style="cursor: pointer; color: #667eea; font-weight: 600; margin-bottom: 10px;">📊 전체 체질 패턴 보기</summary>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 15px;">
                            ${result.scores ? result.scores.map((score, idx) => `
                                <div style="background: ${idx === 0 ? 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)' : '#f8f9fa'}; color: ${idx === 0 ? 'white' : '#333'}; padding: 12px; border-radius: 8px; text-align: center;">
                                    <a href="javascript:void(0)" onclick="showConstitutionDetail('${score.constitution}')" style="font-weight: 600; text-decoration: none; color: inherit; display: block;">
                                        ${score.constitution}
                                    </a>
                                </div>
                            `).join('') : ''}
                        </div>
                    </details>
                </div>
            `).join('')}
        `;
    } catch (error) {
        console.error('❌ 검사 이력 로드 실패:', error);
        container.innerHTML = `
            <div class="alert alert-info">
                <h3>⚠️ 오류 발생</h3>
                <p>검사 이력을 불러오는 중 오류가 발생했습니다.</p>
            </div>
        `;
    }
}

// 키보드 이벤트 처리
document.addEventListener('keydown', function(e) {
    const currentScreen = document.querySelector('.card > div:not(.hidden)');
    if (!currentScreen || currentScreen.id !== 'surveyScreen') return;
    
    if (e.key === 'ArrowLeft' && currentQuestionIndex > 0) {
        previousQuestion();
    } else if (e.key === 'ArrowRight') {
        if (currentQuestionIndex === surveyData.questions.length - 1) {
            completeSurvey();
        } else {
            nextQuestion();
        }
    } else if (e.key >= '1' && e.key <= '3') {
        const optionIndex = parseInt(e.key) - 1;
        if (surveyData && surveyData.questions && surveyData.questions[currentQuestionIndex] && 
            optionIndex < surveyData.questions[currentQuestionIndex].options.length) {
            selectOption(optionIndex);
        }
    }
});

// 페이지 로드 시 설문 데이터 초기화
window.addEventListener('DOMContentLoaded', async function() {
    await initSurveyData();
    console.log('✅ in8 설문 시스템 초기화 완료');
});

/**
 * 체질 상세 정보 표시
 */
function showConstitutionDetail(constitutionName) {
    if (!constitutionName || !constitutionInfo[constitutionName]) {
        alert('⚠️ 체질 정보를 찾을 수 없습니다.');
        return;
    }
    
    const info = constitutionInfo[constitutionName];
    
    const detailMessage = 
        `🎯 ${constitutionName} 체질 상세 정보\n\n` +
        `📖 특징:\n${info.description}\n\n` +
        `✅ 유익한 음식:\n${info.goodFoods.slice(0, 15).join(', ')}${info.goodFoods.length > 15 ? ' 외 ' + (info.goodFoods.length - 15) + '가지' : ''}\n\n` +
        `❌ 해로운 음식:\n${info.badFoods.slice(0, 15).join(', ')}${info.badFoods.length > 15 ? ' 외 ' + (info.badFoods.length - 15) + '가지' : ''}\n\n` +
        `💪 권장 운동:\n${info.goodExercise.join(', ')}\n\n` +
        `⚠️ 주의할 운동:\n${info.badExercise.join(', ')}`;
    
    alert(detailMessage);
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
        
        Kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
                title: '🎉 in8 체질 진단 결과',
                description: `${userName}님의 체질은 ${topConstitution.constitution}입니다!\n\n개인의 체질에 따른 음식 선호도와 소화 능력을 분석하여 8가지 체질(목양, 목음, 금양, 금음, 토양, 토음, 수양, 수음) 중 가장 적합한 체질을 찾아드립니다.`,
                imageUrl: `${window.location.origin}/images/kakao-share-image.png`,
                imageWidth: 800,
                imageHeight: 600,
                link: {
                    mobileWebUrl: window.location.origin,
                    webUrl: window.location.origin
                }
            },
            buttons: [
                {
                    title: '나도 진단하기',
                    link: {
                        mobileWebUrl: window.location.origin,
                        webUrl: window.location.origin
                    }
                }
            ]
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

