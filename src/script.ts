// Transformers.js 로컬 import
import { pipeline } from '@xenova/transformers';

// 전역 변수 선언
let classifier: any = null;

// 전역 타입 선언
declare global {
    interface Window {
        avatarViewer: any;
        showNotification: (message: string, type: string) => void;
        updateFavorability: (change: number) => void;
        emotionHistory: any;
    }
}

function playEmotionAnimation(emotion: string) {
    if (window.avatarViewer) {
        window.avatarViewer.playEmotionAnimation(emotion);
    }
}

// 감정 분석 버튼 개선 - 애니메이션 추가
const analyzeButton = document.getElementById('analyze-button');
if (analyzeButton) {
    analyzeButton.addEventListener('click', async () => {
        const textInput = document.getElementById('sentiment-input') as HTMLInputElement;
        const sentimentResult = document.getElementById('sentiment-result');
        
        if (!textInput.value.trim()) {
            if (typeof window.showNotification === 'function') {
                window.showNotification('분석할 텍스트를 입력해주세요.', 'warning');
            }
            return;
        }
        
        (analyzeButton as HTMLButtonElement).disabled = true;
        if (sentimentResult) {
            sentimentResult.textContent = '분석 중...';
        }
        
        try {
            // Transformers.js 로컬 모델 사용 (개선된 에러 처리)
            if (!classifier) {
                console.log('Transformers.js 모델 로딩 중...');
                try {
                    classifier = await pipeline('sentiment-analysis');
                    console.log('Transformers.js 모델 로딩 완료');
                } catch (modelError) {
                    console.error('Transformers.js 모델 로딩 실패:', modelError);
                    throw new Error('모델 로딩에 실패했습니다. 로컬 분석을 사용합니다.');
                }
            }
            
            console.log('텍스트 분석 시작:', textInput.value.trim());
            const result = await classifier(textInput.value.trim());
            console.log('감정 분석 결과:', result);
            
            const primaryEmotion = result[0];
            if (sentimentResult) {
                sentimentResult.textContent = `감정: ${primaryEmotion.label}, 점수: ${primaryEmotion.score.toFixed(2)}`;
            }
            
            // 감정에 따른 애니메이션 재생
            const emotionMap: { [key: string]: string } = {
                'POSITIVE': 'happy',
                'NEGATIVE': 'sad',
                'NEUTRAL': 'neutral'
            };
            
            const animationEmotion = emotionMap[primaryEmotion.label] || 'neutral';
            playEmotionAnimation(animationEmotion);
            
            // 감정 히스토리에 추가
            if (window.emotionHistory) {
                window.emotionHistory.addEmotion(primaryEmotion.label.toLowerCase(), primaryEmotion.score, textInput.value.trim());
            }

            // 감정에 따른 호감도 변화
            if (primaryEmotion.label === 'POSITIVE') {
                if (typeof window.updateFavorability === 'function') {
                    window.updateFavorability(3);
                }
                if (typeof window.showNotification === 'function') {
                    window.showNotification('긍정적인 감정이 감지되었습니다!', 'success');
                }
            } else if (primaryEmotion.label === 'NEGATIVE') {
                if (typeof window.updateFavorability === 'function') {
                    window.updateFavorability(-3);
                }
                if (typeof window.showNotification === 'function') {
                    window.showNotification('부정적인 감정이 감지되었습니다.', 'warning');
                }
            }
            
        } catch (error) {
            console.error('Transformers.js 감정 분석 실패:', error);
            
            // 로컬 대체 분석 사용
            console.log('로컬 감정 분석으로 대체...');
            const result = await analyzeSentimentForMessage(textInput.value.trim());
            const confidence = 0.7; // 로컬 분석의 기본 신뢰도
            
            if (sentimentResult) {
                sentimentResult.textContent = `감정: ${result}, 점수: ${confidence.toFixed(2)} (로컬 분석)`;
            }
            
            // 감정 히스토리에 추가
            if (window.emotionHistory) {
                window.emotionHistory.addEmotion(result, confidence, textInput.value.trim());
            }
            
            // 감정에 따른 애니메이션 재생
            const emotionMap: { [key: string]: string } = {
                'happy': 'happy',
                'sad': 'sad',
                'neutral': 'neutral'
            };
            
            const animationEmotion = emotionMap[result] || 'neutral';
            playEmotionAnimation(animationEmotion);
            
            // 감정에 따른 호감도 변화
            if (result === 'happy') {
                if (typeof window.updateFavorability === 'function') {
                    window.updateFavorability(3);
                }
                if (typeof window.showNotification === 'function') {
                    window.showNotification('긍정적인 감정이 감지되었습니다!', 'success');
                }
            } else if (result === 'sad') {
                if (typeof window.updateFavorability === 'function') {
                    window.updateFavorability(-3);
                }
                if (typeof window.showNotification === 'function') {
                    window.showNotification('부정적인 감정이 감지되었습니다.', 'warning');
                }
            }
            
        } finally {
            (analyzeButton as HTMLButtonElement).disabled = false;
        }
    });
}

// AI 대화 시스템 통합
import { AIConversationSystem } from './ai-conversation.js';

// 전역 변수로 AI 대화 시스템 추가
let aiConversation: AIConversationSystem;
let isStreamingResponse = false;

// AI 대화 시스템 초기화
function initializeAIConversation() {
    aiConversation = new AIConversationSystem();
    console.log('AI 대화 시스템 초기화 완료');
}

// 대화 UI 요소들
const chatContainer = document.getElementById('chat-container');
const chatInput = document.getElementById('chat-input') as HTMLInputElement;
const sendButton = document.getElementById('send-button');
const chatMessages = document.getElementById('chat-messages');

// 채팅 메시지 추가 함수
function addChatMessage(content: string, isUser: boolean = false) {
    if (!chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isUser ? 'user-message' : 'ai-message'}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = content;
    
    const timestamp = document.createElement('div');
    timestamp.className = 'message-timestamp';
    timestamp.textContent = new Date().toLocaleTimeString();
    
    messageDiv.appendChild(messageContent);
    messageDiv.appendChild(timestamp);
    chatMessages.appendChild(messageDiv);
    
    // 스크롤을 맨 아래로
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 스트리밍 응답 표시 함수
async function displayStreamingResponse(stream: ReadableStream) {
    if (!chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message ai-message';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = '';
    
    const timestamp = document.createElement('div');
    timestamp.className = 'message-timestamp';
    timestamp.textContent = new Date().toLocaleTimeString();
    
    messageDiv.appendChild(messageContent);
    messageDiv.appendChild(timestamp);
    chatMessages.appendChild(messageDiv);
    
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            messageContent.textContent += chunk;
            
            // 스크롤을 맨 아래로
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    } catch (error) {
        console.error('스트리밍 응답 읽기 실패:', error);
        messageContent.textContent += '\n[응답 생성 중 오류가 발생했습니다.]';
    } finally {
        reader.releaseLock();
    }
}

// 메시지 전송 함수
async function sendMessage() {
    if (!chatInput || !aiConversation) return;
    
    const message = chatInput.value.trim();
    if (!message) return;
    
    // 사용자 메시지 표시
    addChatMessage(message, true);
    chatInput.value = '';
    
    // 전송 버튼 비활성화
    if (sendButton) {
        (sendButton as HTMLButtonElement).disabled = true;
    }
    
    try {
        // 스트리밍 응답 시작
        isStreamingResponse = true;
        const stream = await aiConversation.startStreamingResponse(message);
        await displayStreamingResponse(stream);
        
        // 감정 분석으로 아바타 반응
        const emotion = await analyzeSentimentForMessage(message);
        if (window.avatarViewer) {
            window.avatarViewer.setEmotion(emotion);
            window.avatarViewer.playEmotionAnimation(emotion);
        }
        
    } catch (error) {
        console.error('메시지 전송 실패:', error);
        addChatMessage('죄송해요, 응답을 생성할 수 없습니다. 잠시 후 다시 시도해주세요.', false);
    } finally {
        isStreamingResponse = false;
        if (sendButton) {
            (sendButton as HTMLButtonElement).disabled = false;
        }
    }
}

// 메시지 감정 분석 (간단한 버전)
async function analyzeSentimentForMessage(message: string): Promise<string> {
    try {
        // 간단한 키워드 기반 감정 분석
        const positiveWords = ['좋아', '행복', '기뻐', '감사', '사랑', '멋져', '최고'];
        const negativeWords = ['싫어', '슬퍼', '화나', '짜증', '힘들', '어려워', '실패'];
        
        const lowerMessage = message.toLowerCase();
        
        const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
        const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;
        
        let emotion: string;
        let confidence: number;
        
        if (positiveCount > negativeCount) {
            emotion = 'happy';
            confidence = Math.min(0.9, 0.5 + (positiveCount * 0.1));
        } else if (negativeCount > positiveCount) {
            emotion = 'sad';
            confidence = Math.min(0.9, 0.5 + (negativeCount * 0.1));
        } else {
            emotion = 'neutral';
            confidence = 0.5;
        }

        // 감정 히스토리에 추가
        if (window.emotionHistory) {
            window.emotionHistory.addEmotion(emotion, confidence, message);
        }

        return emotion;
    } catch (error) {
        console.error('메시지 감정 분석 실패:', error);
        return 'neutral';
    }
}

// 이벤트 리스너 설정
function setupChatEventListeners() {
    // 전송 버튼 클릭
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }
    
    // 엔터 키 입력
    if (chatInput) {
        chatInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        });
    }
}

// 감정 차트 초기화
import { EmotionChart } from './emotion-chart';
import { LipsyncManager } from './lipsync-manager';
import { CameraController } from './camera-controller';
import { CameraUI } from './camera-ui';
import { ToolCallUI } from './tool-call-ui';
import { PerformanceMonitor } from './performance-monitor';
import { PerformanceOptimizer } from './performance-optimizer';

let emotionChart: EmotionChart | null = null;
let lipsyncManager: LipsyncManager | null = null;
let cameraController: CameraController | null = null;
let cameraUI: CameraUI | null = null;
let toolCallUI: ToolCallUI | null = null;
let performanceMonitor: PerformanceMonitor | null = null;
let performanceOptimizer: PerformanceOptimizer | null = null;

function initializeEmotionChart() {
    const chartContainer = document.querySelector('.emotion-chart-container');
    if (chartContainer && window.emotionHistory) {
        emotionChart = new EmotionChart(chartContainer as HTMLElement, window.emotionHistory);
        console.log('감정 차트 초기화 완료');
    }
}

// 초기화 함수에 AI 대화 시스템 추가
function initializeApp() {
    // 기존 초기화 코드...
    
    // AI 대화 시스템 초기화
    initializeAIConversation();
    setupChatEventListeners();
    
    // 감정 차트 초기화
    initializeEmotionChart();
    
    // 립싱크 시스템 초기화
    initializeLipsyncManager();
    setupSpeechRecognitionWithLipsync();
    
    // 카메라 제어 시스템 초기화
    initializeCameraController();
    
    // 도구 호출 UI 초기화
    initializeToolCallUI();
    
    // 성능 모니터링 및 최적화 시스템 초기화
    initializePerformanceSystems();
    
    console.log('AI 대화 시스템이 준비되었습니다!');
}

// 메모리 관리 통합
import { MemoryManager } from './memory-manager.js';

// 전역 변수로 메모리 매니저 추가
let memoryManager: MemoryManager;

// 메모리 관리 초기화
function initializeMemoryManager() {
    memoryManager = new MemoryManager();
    console.log('메모리 관리 시스템 초기화 완료');
}

// 메모리 UI 이벤트 리스너
function setupMemoryEventListeners() {
    const memoryButton = document.getElementById('memory-button');
    const memoryPanel = document.getElementById('memory-panel');
    const closeMemoryButton = document.getElementById('close-memory');
    const memorySearchInput = document.getElementById('memory-search-input') as HTMLInputElement;
    const memorySearchButton = document.getElementById('memory-search-button');

    // 메모리 패널 열기/닫기
    if (memoryButton && memoryPanel) {
        memoryButton.addEventListener('click', () => {
            memoryPanel.classList.add('active');
            updateMemoryStats();
        });
    }

    if (closeMemoryButton && memoryPanel) {
        closeMemoryButton.addEventListener('click', () => {
            memoryPanel.classList.remove('active');
        });
    }

    // 메모리 검색
    if (memorySearchButton && memorySearchInput) {
        memorySearchButton.addEventListener('click', async () => {
            const query = memorySearchInput.value.trim();
            if (!query) return;

            const results = await memoryManager.searchMemory(query);
            displayMemoryResults(results);
        });
    }

    // 엔터 키로 검색
    if (memorySearchInput) {
        memorySearchInput.addEventListener('keypress', async (event) => {
            if (event.key === 'Enter') {
                const query = memorySearchInput.value.trim();
                if (!query) return;

                const results = await memoryManager.searchMemory(query);
                displayMemoryResults(results);
            }
        });
    }
}

// 메모리 통계 업데이트
async function updateMemoryStats() {
    if (!memoryManager) return;

    const stats = await memoryManager.getMemoryStats();
    if (stats) {
        const memoryCountElement = document.getElementById('memory-count');
        const conversationCountElement = document.getElementById('conversation-count');
        if (memoryCountElement) memoryCountElement.textContent = stats.total_memories.toString();
        if (conversationCountElement) conversationCountElement.textContent = stats.conversation_count.toString();
    }
}

// 메모리 결과 표시 함수
function displayMemoryResults(results: any[]) {
    const memoryResultsDiv = document.getElementById('memory-results');
    if (!memoryResultsDiv) return;

    memoryResultsDiv.innerHTML = ''; // 기존 결과 지우기

    if (results.length === 0) {
        memoryResultsDiv.innerHTML = '<p>검색 결과가 없습니다.</p>';
        return;
    }

    results.forEach(item => {
        const memoryItemDiv = document.createElement('div');
        memoryItemDiv.className = 'memory-item';

        const contentText = document.createElement('div');
        contentText.className = 'memory-content-text';
        contentText.textContent = item.content;

        const metadata = document.createElement('div');
        metadata.className = 'memory-metadata';
        metadata.textContent = `ID: ${item.id}, 타입: ${item.metadata?.type || 'N/A'}, 타임스탬프: ${new Date(item.timestamp).toLocaleString()}`;

        memoryItemDiv.appendChild(contentText);
        memoryItemDiv.appendChild(metadata);
        memoryResultsDiv.appendChild(memoryItemDiv);
    });
}



// 립싱크 매니저 초기화
function initializeLipsyncManager() {
    lipsyncManager = new LipsyncManager();
    console.log('립싱크 시스템 초기화 완료');
}

// 음성 인식과 립싱크 연동
function setupSpeechRecognitionWithLipsync() {
    if (!window.avatarViewer) return;

    // 기존 음성 인식 이벤트에 립싱크 추가
    const recognition = new ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)();
    
    recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        
        // 음성 인식 결과 표시
        addChatMessage(transcript, true);
        
        // 립싱크 재생
        await window.avatarViewer.processSpeechRecognition(transcript);
        
        // AI 응답 생성
        const response = await aiConversation.processUserInput(transcript);
        addChatMessage(response, false);
        
        // AI 응답 립싱크 재생
        await window.avatarViewer.playLipsync(response);
    };
}

// 카메라 제어 시스템 초기화
function initializeCameraController() {
    const avatarContainer = document.querySelector('.avatar-container') as HTMLElement;
    if (avatarContainer && window.avatarViewer?.camera) {
        cameraController = new CameraController(window.avatarViewer.camera);
        cameraController.setupMouseControls(avatarContainer);
        cameraController.setupTouchControls(avatarContainer);
        
        // 카메라 UI 초기화
        const uiContainer = document.querySelector('.camera-ui-container') as HTMLElement;
        if (uiContainer) {
            cameraUI = new CameraUI(uiContainer, cameraController);
        }
        
        console.log('카메라 제어 시스템 초기화 완료');
    }
}

// 도구 호출 UI 초기화
function initializeToolCallUI() {
    const toolCallContainer = document.querySelector('.tool-call-container') as HTMLElement;
    if (toolCallContainer) {
        toolCallUI = new ToolCallUI(toolCallContainer);
        console.log('도구 호출 UI 초기화 완료');
    }
}

// 성능 모니터링 및 최적화 시스템 초기화
function initializePerformanceSystems() {
    // 성능 모니터링 초기화
    performanceMonitor = new PerformanceMonitor();
    performanceMonitor.startMonitoring();
    
    // 성능 최적화 시스템 초기화
    performanceOptimizer = new PerformanceOptimizer(performanceMonitor);
    
    // 성능 알림 이벤트 리스너
    window.addEventListener('performanceAlert', (event: Event) => {
        const customEvent = event as CustomEvent;
        const alerts = customEvent.detail.alerts;
        
        alerts.forEach((alert: any) => {
            console.warn('성능 알림:', alert.message);
            
            // 사용자에게 알림 표시
            if (window.showNotification) {
                window.showNotification(alert.message, alert.type);
            }
        });
    });
    
    console.log('성능 모니터링 및 최적화 시스템 초기화 완료');
    
    // 성능 모니터링 UI 업데이트 시작
    startPerformanceUIUpdates();
}

// 성능 모니터링 UI 업데이트
function startPerformanceUIUpdates() {
    // 1초마다 성능 메트릭 업데이트
    setInterval(() => {
        if (performanceMonitor && performanceOptimizer) {
            updatePerformanceMetrics();
        }
    }, 1000);
    
    // 성능 모니터링 탭 이벤트 리스너
    setupPerformanceTabListeners();
}

// 성능 메트릭 UI 업데이트
function updatePerformanceMetrics() {
    if (!performanceMonitor || !performanceOptimizer) return;
    
    const stats = performanceMonitor.getPerformanceStats();
    const optimizationStats = performanceOptimizer.getOptimizationStats();
    
    // 실시간 메트릭 업데이트
    const currentFpsElement = document.getElementById('current-fps');
    const currentMemoryElement = document.getElementById('current-memory');
    const currentCpuElement = document.getElementById('current-cpu');
    const currentResponseTimeElement = document.getElementById('current-response-time');
    
    if (currentFpsElement) currentFpsElement.textContent = `${stats.current.fps} FPS`;
    if (currentMemoryElement) currentMemoryElement.textContent = `${stats.current.memoryUsage} MB`;
    if (currentCpuElement) currentCpuElement.textContent = `${stats.current.cpuUsage.toFixed(1)}%`;
    if (currentResponseTimeElement) currentResponseTimeElement.textContent = `${stats.current.responseTime}ms`;
    
    // 평균 메트릭 업데이트
    const avgFpsElement = document.getElementById('avg-fps');
    const avgMemoryElement = document.getElementById('avg-memory');
    const avgCpuElement = document.getElementById('avg-cpu');
    
    if (avgFpsElement) avgFpsElement.textContent = `${stats.average.fps} FPS`;
    if (avgMemoryElement) avgMemoryElement.textContent = `${stats.average.memoryUsage} MB`;
    if (avgCpuElement) avgCpuElement.textContent = `${stats.average.cpuUsage.toFixed(1)}%`;
    
    // 최적화 상태 업데이트
    const qualityLevelElement = document.getElementById('quality-level');
    const cacheSizeElement = document.getElementById('cache-size');
    const optimizationStatusElement = document.getElementById('optimization-status');
    
    if (qualityLevelElement) qualityLevelElement.textContent = optimizationStats.qualityLevel;
    if (cacheSizeElement) cacheSizeElement.textContent = `${optimizationStats.cacheSize} MB`;
    if (optimizationStatusElement) optimizationStatusElement.textContent = optimizationStats.isOptimizing ? '최적화 중' : '대기 중';
    
    // 알림 업데이트
    updatePerformanceAlerts(stats.alerts);
    
    // 권장사항 업데이트
    updatePerformanceRecommendations(stats.recommendations);
}

// 성능 알림 UI 업데이트
function updatePerformanceAlerts(alerts: any[]) {
    const container = document.getElementById('alerts-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    alerts.slice(-5).forEach(alert => {
        const alertElement = document.createElement('div');
        alertElement.className = `alert-item alert-${alert.type}`;
        alertElement.innerHTML = `
            <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
            <span>${alert.message}</span>
            <small>${new Date(alert.timestamp).toLocaleTimeString()}</small>
        `;
        container.appendChild(alertElement);
    });
}

// 성능 권장사항 UI 업데이트
function updatePerformanceRecommendations(recommendations: string[]) {
    const container = document.getElementById('recommendations-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    recommendations.forEach(recommendation => {
        const recElement = document.createElement('div');
        recElement.className = 'recommendation-item';
        recElement.innerHTML = `
            <i class="fas fa-lightbulb" aria-hidden="true"></i>
            <span>${recommendation}</span>
        `;
        container.appendChild(recElement);
    });
}

// 성능 모니터링 탭 이벤트 리스너 설정
function setupPerformanceTabListeners() {
    // 메트릭 새로고침 버튼
    const refreshBtn = document.getElementById('refresh-metrics-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            updatePerformanceMetrics();
        });
    }
    
    // 캐시 정리 버튼
    const clearCacheBtn = document.getElementById('clear-cache-btn');
    if (clearCacheBtn && performanceOptimizer) {
        clearCacheBtn.addEventListener('click', () => {
            performanceOptimizer.dispose();
            console.log('캐시가 정리되었습니다.');
        });
    }
    
    // 즉시 최적화 버튼
    const optimizeBtn = document.getElementById('optimize-now-btn');
    if (optimizeBtn && performanceOptimizer) {
        optimizeBtn.addEventListener('click', () => {
            // 즉시 최적화 실행
            performanceOptimizer.updateSettings({
                adaptiveRendering: true
            });
            console.log('즉시 최적화가 실행되었습니다.');
        });
    }
}


