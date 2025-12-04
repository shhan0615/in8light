/**
 * in8 - Firebase Service
 * Firebase 데이터베이스 및 인증 관련 함수
 */

const db = firebase.firestore();
const auth = firebase.auth();

/**
 * 사용자 프로필 저장/업데이트
 */
async function saveUserProfile(userId, userData) {
    try {
        await db.collection('users').doc(userId).set({
            ...userData,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
            lastAccessDate: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        if (APP_CONFIG.enableDebug) {
            console.log('✅ 사용자 프로필 저장 완료:', userId);
        }
        return true;
    } catch (error) {
        console.error('❌ 사용자 프로필 저장 실패:', error);
        throw error;
    }
}

/**
 * 사용자 프로필 가져오기
 */
async function getUserProfile(userId) {
    try {
        const doc = await db.collection('users').doc(userId).get();
        
        if (doc.exists) {
            return doc.data();
        } else {
            return null;
        }
    } catch (error) {
        console.error('❌ 사용자 프로필 가져오기 실패:', error);
        throw error;
    }
}

/**
 * 진단 결과 저장
 */
async function saveSurveyResult(userId, resultData) {
    try {
        console.log('💾 진단 결과 저장 시작:', userId, resultData.topConstitution?.constitution);
        
        const surveyRef = await db.collection('surveys').add({
            userId: userId,
            ...resultData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ 진단 결과 저장 완료 - ID:', surveyRef.id);
        
        // 사용자의 surveyCount 증가 및 최종 체질 업데이트
        const updateData = {
            surveyCount: firebase.firestore.FieldValue.increment(1),
            lastSurveyDate: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // 최종 체질 정보 저장
        if (resultData.topConstitution?.constitution) {
            updateData.lastConstitution = resultData.topConstitution.constitution;
            updateData.lastConstitutionScore = resultData.topConstitution.score || 0;
            console.log('📌 최종 체질 업데이트:', resultData.topConstitution.constitution);
        }
        
        await db.collection('users').doc(userId).update(updateData);
        
        console.log('✅ 사용자 정보 업데이트 완료:', userId);
        
        if (APP_CONFIG.enableDebug) {
            console.log('✅ 진단 결과 저장 완료:', surveyRef.id);
        }
        
        return surveyRef.id;
    } catch (error) {
        console.error('❌ 진단 결과 저장 실패:', error);
        console.error('❌ userId:', userId);
        console.error('❌ resultData:', resultData);
        throw error;
    }
}

/**
 * 사용자의 진단 이력 가져오기
 */
async function getUserSurveyHistory(userId, limit = 50) {
    try {
        const snapshot = await db.collection('surveys')
            .where('userId', '==', userId)
            // .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();
        
        const history = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            history.push({
                id: doc.id,
                ...data,
                timestamp: data.createdAt?.toDate() || new Date()
            });
        });
        
        return history;
    } catch (error) {
        console.error('❌ 진단 이력 가져오기 실패:', error);
        throw error;
    }
}

/**
 * 모든 사용자 목록 가져오기 (관리자 전용)
 */
async function getAllUsers() {
    try {
        let usersSnapshot;
        
        // orderBy 시도 (인덱스가 있을 경우)
        try {
            usersSnapshot = await db.collection('users')
                .orderBy('createdAt', 'desc')
                .get();
            console.log('✅ users 데이터 정렬하여 조회 성공');
        } catch (orderError) {
            // orderBy 실패 시 (인덱스 없음) orderBy 없이 조회
            console.warn('⚠️ orderBy 실패, 정렬 없이 조회:', orderError.message);
            usersSnapshot = await db.collection('users').get();
            console.log('✅ users 데이터 조회 성공 (정렬 없음)');
        }
        
        const users = [];
        
        // 각 사용자별로 실제 진단 횟수 계산
        for (const doc of usersSnapshot.docs) {
            const userData = doc.data();
            const userId = doc.id;
            
            // surveys 컬렉션에서 실제 진단 횟수 계산
            let actualSurveyCount = 0;
            try {
                const surveysSnapshot = await db.collection('surveys')
                    .where('userId', '==', userId)
                    .get();
                actualSurveyCount = surveysSnapshot.size;
            } catch (surveyError) {
                console.warn(`⚠️ 사용자 ${userId}의 진단 횟수 조회 실패:`, surveyError.message);
            }
            
            users.push({
                id: userId,
                ...userData,
                actualSurveyCount: actualSurveyCount // 실제 진단 횟수
            });
        }
        
        // createdAt이 없는 경우를 대비한 클라이언트 측 정렬
        users.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB - dateA;
        });
        
        console.log(`✅ 총 ${users.length}명의 사용자 데이터 로드 완료`);
        return users;
    } catch (error) {
        console.error('❌ 사용자 목록 가져오기 실패:', error);
        throw error;
    }
}

/**
 * 전체 진단 통계 가져오기 (관리자 전용)
 */
async function getSurveyStatistics() {
    try {
        console.log('📊 진단 통계 조회 시작...');
        const snapshot = await db.collection('surveys').get();
        
        console.log('📊 전체 진단 결과 개수:', snapshot.size);
        
        const stats = {
            totalCount: 0,
            constitutionCounts: {},
            recentSurveys: []
        };
        
        const constitutions = ["목양", "목음", "금양", "금음", "토양", "토음", "수양", "수음"];
        constitutions.forEach(c => {
            stats.constitutionCounts[c] = 0;
        });
        
        const surveys = [];
        snapshot.forEach(doc => {
            try {
                const data = doc.data();
                console.log('📄 진단 결과:', doc.id, data.topConstitution?.constitution);
                surveys.push({
                    id: doc.id,
                    ...data,
                    timestamp: data.createdAt?.toDate() || new Date()
                });
            } catch (docError) {
                console.warn(`⚠️ 진단 결과 문서 ${doc.id} 처리 중 오류:`, docError.message);
            }
        });
        
        stats.totalCount = surveys.length;
        
        console.log('📊 총 진단 횟수:', stats.totalCount);
        
        // 체질별 카운트
        surveys.forEach(survey => {
            try {
                const constitution = survey.topConstitution?.constitution;
                if (constitution && stats.constitutionCounts[constitution] !== undefined) {
                    stats.constitutionCounts[constitution]++;
                }
            } catch (countError) {
                console.warn('⚠️ 체질 카운트 중 오류:', countError.message);
            }
        });
        
        console.log('📊 체질별 통계:', stats.constitutionCounts);
        
        // 최근 10개 진단
        try {
            stats.recentSurveys = surveys
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 10);
        } catch (sortError) {
            console.warn('⚠️ 최근 진단 정렬 중 오류:', sortError.message);
            stats.recentSurveys = surveys.slice(0, 10);
        }
        
        console.log('✅ 진단 통계 조회 완료');
        return stats;
    } catch (error) {
        console.error('❌ 진단 통계 가져오기 실패:', error);
        console.error('에러 세부정보:', error.message, error.code);
        throw error;
    }
}

/**
 * 설문 데이터 저장 (관리자 전용)
 */
async function saveSurveyData(surveyData) {
    try {
        await db.collection('admin').doc('surveyData').set({
            data: surveyData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        if (APP_CONFIG.enableDebug) {
            console.log('✅ 설문 데이터 저장 완료');
        }
        
        return true;
    } catch (error) {
        console.error('❌ 설문 데이터 저장 실패:', error);
        throw error;
    }
}

/**
 * 설문 데이터 가져오기
 */
async function getSurveyData() {
    const maxRetries = 3;
    const timeoutMs = 10000; // 10초로 증가
    
    // Firebase 초기화 확인
    if (typeof firebase === 'undefined' || !firebase.firestore) {
        console.error('❌ Firebase가 초기화되지 않았습니다.');
        return tryLoadFromLocalStorageBackup() || null;
    }
    
    // 재시도 로직
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`📥 Firebase에서 설문 데이터 조회 중... (시도 ${attempt}/${maxRetries})`);
            
            // 타임아웃 설정
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('타임아웃: 서버 응답 시간 초과')), timeoutMs);
            });
            
            const dataPromise = db.collection('admin').doc('surveyData').get();
            
            // Promise.race로 타임아웃 처리
            const doc = await Promise.race([dataPromise, timeoutPromise]);
            
            if (doc && doc.exists) {
                const data = doc.data().data;
                if (data && data.questions && data.questions.length > 0) {
                    console.log('✅ Firebase 설문 데이터 조회 성공:', data.questions.length, '개 질문');
                    
                    // 로컬 스토리지에 백업 저장
                    try {
                        localStorage.setItem('surveyDataBackup', JSON.stringify(data));
                        localStorage.setItem('surveyDataBackupTime', new Date().toISOString());
                        console.log('💾 설문 데이터 백업 저장 완료');
                    } catch (e) {
                        console.warn('⚠️ 로컬 스토리지 백업 저장 실패:', e);
                    }
                    
                    return data;
                } else {
                    console.warn('⚠️ Firebase 데이터가 비어있거나 형식이 잘못되었습니다.');
                }
            } else {
                console.warn('⚠️ Firebase 문서가 존재하지 않습니다.');
            }
        } catch (error) {
            console.error(`❌ 설문 데이터 가져오기 실패 (시도 ${attempt}/${maxRetries}):`, error.message);
            
            // 마지막 시도가 아니면 잠시 대기 후 재시도
            if (attempt < maxRetries) {
                console.log(`⏳ ${attempt}초 후 재시도합니다...`);
                await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            }
        }
    }
    
    // 모든 시도 실패 시 로컬 스토리지 백업 시도
    console.log('⚠️ Firebase에서 데이터를 가져올 수 없습니다. 백업 데이터를 확인합니다...');
    const backupData = tryLoadFromLocalStorageBackup();
    
    if (backupData) {
        return backupData;
    }
    
    console.error('❌ 모든 데이터 소스에서 설문 데이터를 가져올 수 없습니다.');
    return null;
}

/**
 * 로컬 스토리지에서 백업 데이터 로드 시도
 */
function tryLoadFromLocalStorageBackup() {
    try {
        const backupData = localStorage.getItem('surveyDataBackup');
        const backupTime = localStorage.getItem('surveyDataBackupTime');
        
        if (backupData) {
            const data = JSON.parse(backupData);
            if (data && data.questions && data.questions.length > 0) {
                console.log('📦 백업 데이터 사용:', data.questions.length, '개 질문');
                if (backupTime) {
                    const backupDate = new Date(backupTime);
                    console.log('📅 백업 시간:', backupDate.toLocaleString('ko-KR'));
                }
                return data;
            }
        }
    } catch (error) {
        console.warn('⚠️ 백업 데이터 로드 실패:', error);
    }
    return null;
}

/**
 * 기본 설문 데이터 (Firebase에서 가져오기 실패 시)
 */
function getDefaultSurveyData() {
    return {
        questions: [
            {
                id: 1,
                text: "소고기에 대한 선호도는?",
                options: [
                    {
                        text: "소고기를 좋아하고, 소화도 잘 된다.",
                        scores: {"목양": 2, "목음": 2, "금양": 0, "금음": 0, "토양": 2, "토음": 0.5, "수양": 0.5, "수음": 2}
                    },
                    {
                        text: "소고기를 좋아하지 않거나, 많이 먹으면 속이 더부룩하거나 독한 방구가 나오거나 배탈이 난다.",
                        scores: {"목양": 0, "목음": 0, "금양": 2, "금음": 2, "토양": 0, "토음": 0.5, "수양": 0.5, "수음": 0}
                    },
                    {
                        text: "나와 무관하거나 해당사항 없거나 잘 모르겠다.",
                        scores: {"목양": 0, "목음": 0, "금양": 0, "금음": 0, "토양": 0, "토음": 0, "수양": 0, "수음": 0}
                    }
                ]
            },
            {
                id: 2,
                text: "돼지고기에 대한 선호도는?",
                options: [
                    {
                        text: "돼지고기를 좋아하고, 소화도 잘 된다.",
                        scores: {"목양": 0.5, "목음": 2, "금양": 0, "금음": 0, "토양": 2, "토음": 2, "수양": 0, "수음": 0}
                    },
                    {
                        text: "돼지고기를 좋아하지 않거나, 많이 먹으면 속이 더부룩하거나 독한 방구가 나오거나 배탈이 난다.",
                        scores: {"목양": 0.5, "목음": 0, "금양": 1, "금음": 2, "토양": 0, "토음": 0, "수양": 2, "수음": 2}
                    },
                    {
                        text: "나와 무관하거나 해당사항 없거나 잘 모르겠다.",
                        scores: {"목양": 0, "목음": 0, "금양": 0, "금음": 0, "토양": 0, "토음": 0, "수양": 0, "수음": 0}
                    }
                ]
            },
            {
                id: 3,
                text: "닭, 오리고기에 대한 선호도는?",
                options: [
                    {
                        text: "닭,오리고기를 좋아하고, 소화도 잘 된다.",
                        scores: {"목양": 1, "목음": 0.5, "금양": 0, "금음": 0, "토양": 0, "토음": 0, "수양": 2, "수음": 2}
                    },
                    {
                        text: "닭,오리고기를 좋아하지 않거나, 많이 먹으면 속이 더부룩하거나 독한 방구가 나오거나 배탈이 난다.",
                        scores: {"목양": 0, "목음": 0.5, "금양": 2, "금음": 2, "토양": 2, "토음": 2, "수양": 0, "수음": 0}
                    },
                    {
                        text: "나와 무관하거나 해당사항 없거나 잘 모르겠다.",
                        scores: {"목양": 0, "목음": 0, "금양": 0, "금음": 0, "토양": 0, "토음": 0, "수양": 0, "수음": 0}
                    }
                ]
            },
            {
                id: 4,
                text: "바다생선에 대한 선호도는?",
                options: [
                    {
                        text: "바다생선을 좋아하고, 회로 먹어도 소화가 잘 된다.",
                        scores: {"목양": 0, "목음": 0, "금양": 2, "금음": 2, "토양": 1, "토음": 1, "수양": 0.5, "수음": 0}
                    },
                    {
                        text: "바다생선은 좋아하지 않거나, 회로 먹거나 많이 먹으면 속이 불편하거나 설사 또는 배탈이 난다.",
                        scores: {"목양": 2, "목음": 2, "금양": 0, "금음": 0, "토양": 0, "토음": 0, "수양": 0.5, "수음": 1}
                    },
                    {
                        text: "나와 무관하거나 해당사항 없거나 잘 모르겠다.",
                        scores: {"목양": 0, "목음": 0, "금양": 0, "금음": 0, "토양": 0, "토음": 0, "수양": 0, "수음": 0}
                    }
                ]
            },
            {
                id: 5,
                text: "조개류에 대한 선호도는?",
                options: [
                    {
                        text: "조개류를 좋아하고, 소화도 잘 된다.",
                        scores: {"목양": 0, "목음": 0, "금양": 2, "금음": 2, "토양": 1, "토음": 1, "수양": 0, "수음": 0}
                    },
                    {
                        text: "조개류는 좋아하지 않거나, 많이 먹으면 속이 불편하거나 설사 또는 배탈이 난다.",
                        scores: {"목양": 2, "목음": 2, "금양": 0, "금음": 0, "토양": 0, "토음": 0, "수양": 1, "수음": 1}
                    },
                    {
                        text: "나와 무관하거나 해당사항 없거나 잘 모르겠다.",
                        scores: {"목양": 0, "목음": 0, "금양": 0, "금음": 0, "토양": 0, "토음": 0, "수양": 0, "수음": 0}
                    }
                ]
            },
            {
                id: 6,
                text: "갑각류(새우, 게 등)에 대한 선호도는?",
                options: [
                    {
                        text: "갑각류(새우, 게 등)를 좋아하고, 소화도 잘 된다.",
                        scores: {"목양": 0, "목음": 0, "금양": 1, "금음": 1, "토양": 1, "토음": 1, "수양": 0, "수음": 0}
                    },
                    {
                        text: "갑각류(새우, 게 등)는 좋아하지 않거나, 많이 먹으면 속이 불편하거나 설사 또는 배탈이 난다.",
                        scores: {"목양": 2, "목음": 2, "금양": 0, "금음": 0, "토양": 0, "토음": 0, "수양": 1, "수음": 2}
                    },
                    {
                        text: "나와 무관하거나 해당사항 없거나 잘 모르겠다.",
                        scores: {"목양": 0, "목음": 0, "금양": 0, "금음": 0, "토양": 0, "토음": 0, "수양": 0, "수음": 0}
                    }
                ]
            },
            {
                id: 7,
                text: "흰살생선에 대한 선호도는?",
                options: [
                    {
                        text: "흰살생선을 좋아하고, 회로 먹어도 소화가 잘 된다.",
                        scores: {"목양": 0, "목음": 0, "금양": 2, "금음": 2, "토양": 1, "토음": 1, "수양": 1, "수음": 0}
                    },
                    {
                        text: "흰살생선은 좋아하지 않거나, 회로 먹거나 많이 먹으면 속이 불편하거나 설사 또는 배탈이 난다.",
                        scores: {"목양": 2, "목음": 2, "금양": 0, "금음": 0, "토양": 0, "토음": 0, "수양": 0, "수음": 1}
                    },
                    {
                        text: "나와 무관하거나 해당사항 없거나 잘 모르겠다.",
                        scores: {"목양": 0, "목음": 0, "금양": 0, "금음": 0, "토양": 0, "토음": 0, "수양": 0, "수음": 0}
                    }
                ]
            },
            {
                id: 8,
                text: "붉은살생선에 대한 선호도는?",
                options: [
                    {
                        text: "붉은살생선을 좋아하고, 회로 먹어도 소화가 잘 된다.",
                        scores: {"목양": 0, "목음": 0, "금양": 1, "금음": 1, "토양": 0.5, "토음": 0.5, "수양": 0, "수음": 0}
                    },
                    {
                        text: "붉은살생선은 좋아하지 않거나, 회로 먹거나 많이 먹으면 속이 불편하거나 설사 또는 배탈이 난다.",
                        scores: {"목양": 2, "목음": 2, "금양": 0, "금음": 0, "토양": 0.5, "토음": 0.5, "수양": 1, "수음": 1}
                    },
                    {
                        text: "나와 무관하거나 해당사항 없거나 잘 모르겠다.",
                        scores: {"목양": 0, "목음": 0, "금양": 0, "금음": 0, "토양": 0, "토음": 0, "수양": 0, "수음": 0}
                    }
                ]
            },
            {
                id: 9,
                text: "복어에 대한 선호도는?",
                options: [
                    {
                        text: "복어를 좋아하고, 회로 또는 많이 먹어도 소화가 잘 된다.",
                        scores: {"목양": 0, "목음": 0, "금양": 1, "금음": 1, "토양": 2, "토음": 2, "수양": 0, "수음": 0}
                    },
                    {
                        text: "복어는 좋아하지 않거나, 먹으면 속이 불편하거나 설사 또는 배탈이 난다.",
                        scores: {"목양": 2, "목음": 2, "금양": 0, "금음": 0, "토양": 0, "토음": 0, "수양": 2, "수음": 2}
                    },
                    {
                        text: "나와 무관하거나 해당사항 없거나 잘 모르겠다.",
                        scores: {"목양": 0, "목음": 0, "금양": 0, "금음": 0, "토양": 0, "토음": 0, "수양": 0, "수음": 0}
                    }
                ]
            },
            {
                id: 10,
                text: "조개류, 갑각류, 복어에 대한 종합 선호도는?",
                options: [
                    {
                        text: "조개류, 갑각류(새우, 게 등), 복어를 좋아하고, 소화가 잘 된다.",
                        scores: {"목양": 0, "목음": 0, "금양": 2, "금음": 2, "토양": 2, "토음": 2, "수양": 0, "수음": 0}
                    },
                    {
                        text: "조개류, 갑각류(새우, 게 등), 복어는 좋아하지 않거나, 날로 또는 많이 먹으면 속이 불편하거나 설사 또는 배탈이 난다.",
                        scores: {"목양": 2, "목음": 2, "금양": 0, "금음": 0, "토양": 0, "토음": 0, "수양": 1, "수음": 2}
                    },
                    {
                        text: "나와 무관하거나 해당사항 없거나 잘 모르겠다.",
                        scores: {"목양": 0, "목음": 0, "금양": 0, "금음": 0, "토양": 0, "토음": 0, "수양": 0, "수음": 0}
                    }
                ]
            },
            {
                id: 11,
                text: "민물생선에 대한 선호도는?",
                options: [
                    {
                        text: "민물생선(미꾸라지 등)을 좋아하고, 소화도 잘 된다.",
                        scores: {"목양": 1, "목음": 1, "금양": 0, "금음": 0, "토양": 1, "토음": 0.5, "수양": 0.5, "수음": 1}
                    },
                    {
                        text: "민물생선(미꾸라지 등)은 좋아하지 않거나, 많이 먹으면 속이 불편하거나 설사 또는 배탈이 난다.",
                        scores: {"목양": 0, "목음": 0, "금양": 1, "금음": 1, "토양": 0, "토음": 0.5, "수양": 0.5, "수음": 0}
                    },
                    {
                        text: "나와 무관하거나 해당사항 없거나 잘 모르겠다.",
                        scores: {"목양": 0, "목음": 0, "금양": 0, "금음": 0, "토양": 0, "토음": 0, "수양": 0, "수음": 0}
                    }
                ]
            },
            {
                id: 12,
                text: "굴에 대한 선호도는?",
                options: [
                    {
                        text: "굴을 좋아하고, 생굴도 소화가 잘 된다.",
                        scores: {"목양": 0, "목음": 0, "금양": 1, "금음": 0.5, "토양": 1, "토음": 1, "수양": 0, "수음": 0}
                    },
                    {
                        text: "굴을 좋아하지 않거나, 생굴을 먹으면 배탈이 난다.",
                        scores: {"목양": 2, "목음": 2, "금양": 0, "금음": 0.5, "토양": 0, "토음": 0, "수양": 2, "수음": 2}
                    },
                    {
                        text: "나와 무관하거나 해당사항 없거나 잘 모르겠다.",
                        scores: {"목양": 0, "목음": 0, "금양": 0, "금음": 0, "토양": 0, "토음": 0, "수양": 0, "수음": 0}
                    }
                ]
            },
            {
                id: 13,
                text: "유제품에 대한 선호도는?",
                options: [
                    {
                        text: "유제품(우유,요거트)을 좋아하거나 소화도 잘 된다.",
                        scores: {"목양": 2, "목음": 2, "금양": 0, "금음": 0, "토양": 2, "토음": 0.5, "수양": 0.5, "수음": 0.5}
                    },
                    {
                        text: "유제품(우유,요거트)을 좋아하지 않거나, 많이 마시면 설사 또는 배탈이 난다.",
                        scores: {"목양": 0, "목음": 0, "금양": 2, "금음": 2, "토양": 0, "토음": 0.5, "수양": 0.5, "수음": 0.5}
                    },
                    {
                        text: "나와 무관하거나 해당사항 없거나 잘 모르겠다.",
                        scores: {"목양": 0, "목음": 0, "금양": 0, "금음": 0, "토양": 0, "토음": 0, "수양": 0, "수음": 0}
                    }
                ]
            },
            {
                id: 14,
                text: "버터에 대한 선호도는?",
                options: [
                    {
                        text: "버터를 좋아하고 많이 먹어도 소화가 잘 된다.",
                        scores: {"목양": 1, "목음": 1, "금양": 0, "금음": 0, "토양": 1, "토음": 0.5, "수양": 0.5, "수음": 1}
                    },
                    {
                        text: "버터를 좋아하지 않거나 많이 먹으면 배탈이 난다.",
                        scores: {"목양": 0, "목음": 0, "금양": 1, "금음": 1, "토양": 0, "토음": 0.5, "수양": 0.5, "수음": 0}
                    },
                    {
                        text: "나와 무관하거나 해당사항 없거나 잘 모르겠다.",
                        scores: {"목양": 0, "목음": 0, "금양": 0, "금음": 0, "토양": 0, "토음": 0, "수양": 0, "수음": 0}
                    }
                ]
            },
            {
                id: 15,
                text: "치즈에 대한 선호도는?",
                options: [
                    {
                        text: "치즈를 좋아하고 많이 먹어도 소화가 잘 된다.",
                        scores: {"목양": 1, "목음": 1, "금양": 0, "금음": 0, "토양": 1, "토음": 1, "수양": 0.5, "수음": 0.5}
                    },
                    {
                        text: "치즈를 좋아하지 않거나 많이 먹으면 배탈이 난다.",
                        scores: {"목양": 0, "목음": 0, "금양": 1, "금음": 1, "토양": 0, "토음": 0, "수양": 0.5, "수음": 0.5}
                    },
                    {
                        text: "나와 무관하거나 해당사항 없거나 잘 모르겠다.",
                        scores: {"목양": 0, "목음": 0, "금양": 0, "금음": 0, "토양": 0, "토음": 0, "수양": 0, "수음": 0}
                    }
                ]
            },
            {
                id: 16,
                text: "계란 노른자에 대한 선호도는?",
                options: [
                    {
                        text: "완숙계란의 노른자를 좋아하고 많이 먹어도 소화가 잘 된다.",
                        scores: {"목양": 1, "목음": 1, "금양": 0, "금음": 0, "토양": 1, "토음": 0.5, "수양": 1, "수음": 1}
                    },
                    {
                        text: "완숙계란의 흰자는 좋지만, 노른자는 좋아하지 않거나 많이 먹으면 속이 불편하다.",
                        scores: {"목양": 0, "목음": 0, "금양": 1, "금음": 1, "토양": 0, "토음": 0.5, "수양": 0, "수음": 0}
                    },
                    {
                        text: "나와 무관하거나 해당사항 없거나 잘 모르겠다.",
                        scores: {"목양": 0, "목음": 0, "금양": 0, "금음": 0, "토양": 0, "토음": 0, "수양": 0, "수음": 0}
                    }
                ]
            }
        ],
        constitutions: ["목양", "목음", "금양", "금음", "토양", "토음", "수양", "수음"]
    };
}

/**
 * 사용자 삭제 (관리자 전용)
 */
async function deleteUser(userId) {
    try {
        // 사용자 문서 삭제
        await db.collection('users').doc(userId).delete();
        
        // 사용자의 모든 진단 결과 삭제
        const surveysSnapshot = await db.collection('surveys')
            .where('userId', '==', userId)
            .get();
        
        const batch = db.batch();
        surveysSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        
        if (APP_CONFIG.enableDebug) {
            console.log('✅ 사용자 삭제 완료:', userId);
        }
        
        return true;
    } catch (error) {
        console.error('❌ 사용자 삭제 실패:', error);
        throw error;
    }
}

/**
 * 사용자 본인의 계정 삭제 (회원탈퇴)
 */
async function deleteMyAccount(userId) {
    try {
        console.log('🗑️ 회원탈퇴 시작:', userId);
        
        // 사용자 문서 삭제
        await db.collection('users').doc(userId).delete();
        
        // 사용자의 모든 진단 결과 삭제
        const surveysSnapshot = await db.collection('surveys')
            .where('userId', '==', userId)
            .get();
        
        const batch = db.batch();
        surveysSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        
        // LocalStorage에 저장된 진행 상태 삭제
        const progressKey = `in8_survey_progress_${userId}`;
        localStorage.removeItem(progressKey);
        
        console.log('✅ 회원탈퇴 완료:', userId);
        
        return true;
    } catch (error) {
        console.error('❌ 회원탈퇴 실패:', error);
        throw error;
    }
}

/**
 * 관리자 권한 확인
 */
function isAdmin(user) {
    if (!user) return false;
    
    // UID 체크
    if (ADMIN_UIDS.includes(user.uid)) return true;
    
    // 이메일 체크
    if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) return true;
    
    return false;
}

/**
 * 가족 구성원 저장 (Firebase)
 */
async function saveFamilyMembers(userId, familyMembers) {
    try {
        await db.collection('users').doc(userId).set({
            familyMembers: familyMembers,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        console.log('✅ 가족 정보 저장 완료:', userId, familyMembers.length, '명');
        return true;
    } catch (error) {
        console.error('❌ 가족 정보 저장 실패:', error);
        throw error;
    }
}

/**
 * 가족 구성원 가져오기 (Firebase)
 */
async function getFamilyMembers(userId) {
    try {
        const doc = await db.collection('users').doc(userId).get();
        
        if (doc.exists && doc.data().familyMembers) {
            console.log('✅ 가족 정보 로드 완료:', doc.data().familyMembers.length, '명');
            return doc.data().familyMembers;
        } else {
            console.log('ℹ️ 등록된 가족 없음');
            return [];
        }
    } catch (error) {
        console.error('❌ 가족 정보 가져오기 실패:', error);
        throw error;
    }
}

/**
 * 질문 게시글 저장
 */
async function saveQuestion(questionData) {
    try {
        const docRef = await db.collection('questions').add({
            ...questionData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            comments: []
        });
        
        console.log('✅ 질문 저장 완료:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ 질문 저장 실패:', error);
        throw error;
    }
}

/**
 * 질문 목록 가져오기
 */
async function getQuestions(limit = 50) {
    try {
        const snapshot = await db.collection('questions')
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();
        
        const questions = [];
        snapshot.forEach(doc => {
            questions.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log('✅ 질문 목록 로드 완료:', questions.length, '개');
        return questions;
    } catch (error) {
        console.error('❌ 질문 목록 가져오기 실패:', error);
        throw error;
    }
}

/**
 * 질문 상세 가져오기
 */
async function getQuestion(questionId) {
    try {
        const doc = await db.collection('questions').doc(questionId).get();
        
        if (doc.exists) {
            return {
                id: doc.id,
                ...doc.data()
            };
        } else {
            return null;
        }
    } catch (error) {
        console.error('❌ 질문 가져오기 실패:', error);
        throw error;
    }
}

/**
 * 질문 수정
 */
async function updateQuestion(questionId, updateData) {
    try {
        await db.collection('questions').doc(questionId).update({
            ...updateData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ 질문 수정 완료:', questionId);
        return true;
    } catch (error) {
        console.error('❌ 질문 수정 실패:', error);
        throw error;
    }
}

/**
 * 질문 삭제
 */
async function deleteQuestion(questionId) {
    try {
        await db.collection('questions').doc(questionId).delete();
        
        console.log('✅ 질문 삭제 완료:', questionId);
        return true;
    } catch (error) {
        console.error('❌ 질문 삭제 실패:', error);
        throw error;
    }
}

/**
 * 댓글 추가
 */
async function addComment(questionId, commentData) {
    try {
        const commentWithTimestamp = {
            ...commentData,
            commentId: Date.now().toString(),
            createdAt: new Date().toISOString()
        };
        
        await db.collection('questions').doc(questionId).update({
            comments: firebase.firestore.FieldValue.arrayUnion(commentWithTimestamp),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ 댓글 추가 완료:', questionId);
        return true;
    } catch (error) {
        console.error('❌ 댓글 추가 실패:', error);
        throw error;
    }
}

/**
 * 댓글 삭제
 */
async function deleteComment(questionId, commentId) {
    try {
        // 먼저 질문을 가져와서 댓글을 찾음
        const question = await getQuestion(questionId);
        if (!question) {
            throw new Error('질문을 찾을 수 없습니다.');
        }
        
        // 해당 댓글을 제외한 나머지 댓글들
        const updatedComments = question.comments.filter(c => c.commentId !== commentId);
        
        await db.collection('questions').doc(questionId).update({
            comments: updatedComments,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ 댓글 삭제 완료:', commentId);
        return true;
    } catch (error) {
        console.error('❌ 댓글 삭제 실패:', error);
        throw error;
    }
}

/**
 * ==================== 한의원 관리 함수 ====================
 */

/**
 * 한의원 정보 저장/업데이트
 */
async function saveHospitalInfo(hospitalData) {
    try {
        console.log('💾 한의원 정보 저장 시작:', hospitalData.name);
        
        const hospitalRef = await db.collection('hospitals').add({
            ...hospitalData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ 한의원 정보 저장 완료 - ID:', hospitalRef.id);
        return hospitalRef.id;
    } catch (error) {
        console.error('❌ 한의원 정보 저장 실패:', error);
        throw error;
    }
}

/**
 * 모든 한의원 목록 가져오기
 */
async function getAllHospitals() {
    try {
        const snapshot = await db.collection('hospitals')
            .orderBy('createdAt', 'desc')
            .get();
        
        const hospitals = [];
        snapshot.forEach(doc => {
            hospitals.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log('✅ 한의원 목록 가져오기 완료:', hospitals.length);
        return hospitals;
    } catch (error) {
        console.error('❌ 한의원 목록 가져오기 실패:', error);
        throw error;
    }
}

/**
 * 특정 한의원 정보 가져오기
 */
async function getHospitalInfo(hospitalId) {
    try {
        const doc = await db.collection('hospitals').doc(hospitalId).get();
        
        if (doc.exists) {
            return {
                id: doc.id,
                ...doc.data()
            };
        } else {
            return null;
        }
    } catch (error) {
        console.error('❌ 한의원 정보 가져오기 실패:', error);
        throw error;
    }
}

/**
 * 한의원 정보 업데이트
 */
async function updateHospitalInfo(hospitalId, hospitalData) {
    try {
        await db.collection('hospitals').doc(hospitalId).update({
            ...hospitalData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ 한의원 정보 업데이트 완료:', hospitalId);
        return true;
    } catch (error) {
        console.error('❌ 한의원 정보 업데이트 실패:', error);
        throw error;
    }
}

/**
 * 한의원 삭제
 */
async function deleteHospital(hospitalId) {
    try {
        await db.collection('hospitals').doc(hospitalId).delete();
        console.log('✅ 한의원 삭제 완료:', hospitalId);
        return true;
    } catch (error) {
        console.error('❌ 한의원 삭제 실패:', error);
        throw error;
    }
}

/**
 * 사용자가 선택한 한의원 저장
 */
async function saveUserSelectedHospital(userId, hospitalId) {
    try {
        await db.collection('users').doc(userId).update({
            selectedHospitalId: hospitalId,
            hospitalSelectedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ 사용자 한의원 선택 저장 완료:', userId, hospitalId);
        return true;
    } catch (error) {
        console.error('❌ 사용자 한의원 선택 저장 실패:', error);
        throw error;
    }
}
