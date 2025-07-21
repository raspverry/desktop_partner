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
        initializeApp: () => void;
        agentManager: any;
        performanceMonitor: any;
        avatarCustomizer: any;
    }
}

// AI 시스템 imports
import { AIConversationSystem } from './ai-conversation.js';
import { MemoryManager } from './memory-manager.js';
import { EmotionChart } from './emotion-chart';
import { LipsyncManager } from './lipsync-manager';
import { CameraController } from './camera-controller';
import { CameraUI } from './camera-ui';
import { ToolCallUI } from './tool-call-ui';
import { PerformanceMonitor } from './performance-monitor';
import { PerformanceOptimizer } from './performance-optimizer';

// 전역 변수들
let aiConversation: AIConversationSystem;
let memoryManager: MemoryManager;
let emotionChart: EmotionChart | null = null;
let lipsyncManager: LipsyncManager | null = null;
let cameraController: CameraController | null = null;
let cameraUI: CameraUI | null = null;
let toolCallUI: ToolCallUI | null = null;
let performanceMonitor: PerformanceMonitor | null = null;
let performanceOptimizer: PerformanceOptimizer | null = null;
let isStreamingResponse = false;

// UI 요소 DOM 참조
let topBar: HTMLElement | null;
let videoContainer: HTMLElement | null;
let micButton: HTMLElement | null;
let favorabilityBar: HTMLElement | null;
let transcriptContainer: HTMLElement | null;
let transcriptText: HTMLElement | null;
let transcriptStatus: HTMLElement | null;
let analysisToolButton: HTMLElement | null;
let actionMenuButton: HTMLElement | null;
let bottomSheet: HTMLElement | null;
let menuContainer: HTMLElement | null;
let overlay: HTMLElement | null;
let sentimentInput: HTMLInputElement | null;
let analyzeButton: HTMLElement | null;
let sentimentResult: HTMLElement | null;
let localMicButton: HTMLElement | null;
let localAsrResult: HTMLElement | null;

// 비디오 관련 변수
let video1: HTMLVideoElement | null;
let video2: HTMLVideoElement | null;
let activeVideo: HTMLVideoElement;
let inactiveVideo: HTMLVideoElement;
const videoList = [
    'video_assets/3d_modeling_image_creation.mp4',
    'video_assets/2025-07-16-1043-smile_elegant_sway_then_chin_rest.mp4',
    'video_assets/2025-07-16-4437-v_pose_smile.mp4',
    'video_assets/cheer_video.mp4',
    'video_assets/dance_video.mp4',
    'negative/2025-07-16-9418-hands_hips_pout_angry.mp4'
];
const positiveVideos = videoList.slice(1, 5);
const negativeVideo = videoList[5];

// 호감도 시스템
let favorability = 65;

// 음성 인식 관련
let recognition: any;
let isListening = false;
let recognizer: any = null;
let mediaRecorder: MediaRecorder | null = null;
let isLocalRecording = false;

// 다국어 키워드
const keywordsByLang = {
    'ko-KR': { 
        positive: ['기쁘다', '좋다', '사랑', '훌륭하다', '안녕', '예쁘다', '최고야', '아름다워', '귀여워'], 
        negative: ['슬프다', '화난다', '싫다', '나쁘다', '별로야', '못생겼어'] 
    },
    'en-US': { 
        positive: ['happy', 'good', 'love', 'great', 'hello', 'pretty', 'beautiful', 'awesome', 'cute'], 
        negative: ['sad', 'angry', 'hate', 'bad', 'terrible', 'ugly'] 
    },
    'ja-JP': { 
        positive: ['嬉しい', 'いいね', '愛してる', '素晴らしい', 'こんにちは', '可愛い', '綺麗', '最高'], 
        negative: ['悲しい', '怒る', '嫌だ', '悪い', 'ひどい', '不細工'] 
    },
    'zh-CN': { 
        positive: ['高兴', '好', '爱', '太棒了', '你好', '漂亮', '可爱'], 
        negative: ['伤心', '生气', '讨厌', '不好', '糟糕', '难看'] 
    }
};

// 메인 초기화 함수 - 전역으로 노출
window.initializeApp = function() {
    console.log('initializeApp 함수 호출됨');
    
    try {
        // DOM 요소 초기화
        initializeDOMElements();
        
        // UI 초기화
        initializeUI();
        
        // 시스템 초기화
        initializeAIConversation();
        setupChatEventListeners();
        initializeEmotionChart();
        initializeLipsyncManager();
        setupSpeechRecognitionWithLipsync();
        initializeCameraController();
        initializeToolCallUI();
        initializePerformanceSystems();
        initializeMemoryManager();
        setupMemoryEventListeners();
        
        console.log('모든 시스템 초기화 완료!');
    } catch (error) {
        console.error('초기화 중 오류:', error);
        throw error;
    }
};

// DOM 요소 초기화
function initializeDOMElements() {
    console.log('DOM 요소 초기화 시작...');
    
    topBar = document.getElementById('top-bar');
    videoContainer = document.getElementById('video-container');
    micButton = document.getElementById('mic-button');
    favorabilityBar = document.getElementById('favorability-bar');
    transcriptContainer = document.getElementById('transcript-container');
    transcriptText = document.getElementById('transcript');
    transcriptStatus = document.getElementById('transcript-status');
    analysisToolButton = document.getElementById('analysis-tool-button');
    actionMenuButton = document.getElementById('action-menu-button');
    bottomSheet = document.getElementById('bottom-sheet');
    menuContainer = document.getElementById('menu-container');
    overlay = document.getElementById('overlay');
    sentimentInput = document.getElementById('sentiment-input') as HTMLInputElement;
    analyzeButton = document.getElementById('analyze-button');
    sentimentResult = document.getElementById('sentiment-result');
    localMicButton = document.getElementById('local-mic-button');
    localAsrResult = document.getElementById('local-asr-result');
    
    video1 = document.getElementById('video1') as HTMLVideoElement;
    video2 = document.getElementById('video2') as HTMLVideoElement;
    activeVideo = video1!;
    inactiveVideo = video2!;
    
    console.log('DOM 요소 초기화 완료');
}

// UI 초기화
function initializeUI() {
    console.log('UI 초기화 시작...');
    
    // 초기 설정
    updateFavorability(0);
    showTopBarTemporarily(4000);
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    // 비디오 재생 시작
    if (activeVideo) {
        activeVideo.addEventListener('ended', switchVideo, { once: true });
    }
    
    console.log('UI 초기화 완료');
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 마이크 버튼
    if (micButton) {
        micButton.addEventListener('click', toggleSpeechRecognition);
    }
    
    // 비디오 컨테이너 클릭
    if (videoContainer) {
        videoContainer.addEventListener('click', () => showTopBarTemporarily());
    }
    
    // 분석 도구 버튼
    if (analysisToolButton) {
        analysisToolButton.addEventListener('click', () => toggleBottomSheet(true));
    }
    
    // 액션 메뉴 버튼
    if (actionMenuButton) {
        actionMenuButton.addEventListener('click', () => toggleActionMenu(true));
    }
    
    // 오버레이
    if (overlay) {
        overlay.addEventListener('click', () => {
            toggleBottomSheet(false);
            toggleActionMenu(false);
        });
    }
    
    // 메뉴 아이템들
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            const videoSrc = this.getAttribute('data-video');
            if (videoSrc) {
                playVideo(videoSrc);
                toggleActionMenu(false);
            }
        });
    });
    
    // 탭 버튼들
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            button.classList.add('active');
            const targetContent = document.getElementById(`${targetTab}-tab`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
    
    // 언어 선택
    const languageSelect = document.getElementById('language-select') as HTMLSelectElement;
    if (languageSelect) {
        languageSelect.addEventListener('change', function() {
            const selectedLang = this.value;
            if (recognition) {
                recognition.lang = selectedLang;
            }
            showNotification(`언어가 ${this.options[this.selectedIndex].text}로 변경되었습니다.`, 'success');
        });
    }
    
    // 감정 분석 버튼
    if (analyzeButton) {
        analyzeButton.addEventListener('click', analyzeButtonClick);
    }
    
    // 로컬 음성 인식 버튼
    if (localMicButton) {
        localMicButton.addEventListener('click', localMicButtonClick);
    }
    
    // 테마 토글
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

// 호감도 업데이트
function updateFavorability(change: number) {
    favorability = Math.max(0, Math.min(100, favorability + change));
    if (favorabilityBar) {
        favorabilityBar.style.width = favorability + '%';
        if (favorability >= 80) {
            favorabilityBar.style.background = 'linear-gradient(90deg, #4CAF50, #45a049)';
        } else if (favorability >= 50) {
            favorabilityBar.style.background = 'linear-gradient(90deg, #ff9a9e, #fecfef)';
        } else {
            favorabilityBar.style.background = 'linear-gradient(90deg, #f44336, #d32f2f)';
        }
    }
    
    if (change !== 0) showTopBarTemporarily();
}

// 상단 바 일시적 표시
function showTopBarTemporarily(duration = 3000) {
    if (topBar) {
        topBar.classList.add('visible');
        setTimeout(() => topBar.classList.remove('visible'), duration);
    }
}

// 하단 시트 토글
function toggleBottomSheet(show: boolean) {
    if (bottomSheet) bottomSheet.classList.toggle('visible', show);
    if (overlay) overlay.classList.toggle('visible', show);
}

// 액션 메뉴 토글
function toggleActionMenu(show: boolean) {
    if (menuContainer) menuContainer.classList.toggle('visible', show);
    if (overlay) overlay.classList.toggle('visible', show);
}

// 비디오 전환
function switchVideo() {
    const currentVideoSrc = activeVideo.querySelector('source')?.getAttribute('src');
    let nextVideoSrc = currentVideoSrc;
    while (nextVideoSrc === currentVideoSrc) {
        const randomIndex = Math.floor(Math.random() * videoList.length);
        nextVideoSrc = videoList[randomIndex];
    }
    playVideo(nextVideoSrc);
}

// 감정별 비디오 전환
function switchVideoByEmotion(emotion: string) {
    let nextVideoSrc = (emotion === 'positive') 
        ? positiveVideos[Math.floor(Math.random() * positiveVideos.length)]
        : negativeVideo;
    playVideo(nextVideoSrc);
}

// 비디오 재생
function playVideo(src: string) {
    const currentSrc = activeVideo.querySelector('source')?.getAttribute('src');
    if (src === currentSrc) return;
    
    const source = inactiveVideo.querySelector('source');
    if (source) {
        source.setAttribute('src', src);
        inactiveVideo.load();
        
        inactiveVideo.addEventListener('canplaythrough', function onCanPlayThrough() {
            inactiveVideo.removeEventListener('canplaythrough', onCanPlayThrough);
            activeVideo.pause();
            inactiveVideo.play().catch(e => console.error("Video play failed", e));
            activeVideo.classList.remove('active');
            inactiveVideo.classList.add('active');
            [activeVideo, inactiveVideo] = [inactiveVideo, activeVideo];
            activeVideo.addEventListener('ended', switchVideo, { once: true });
        }, { once: true });
    }
}

// 음성 인식 초기화
function initializeSpeechRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.lang = 'ko-KR'; 
        recognition.interimResults = true;

        recognition.onstart = () => {
            if (micButton) micButton.classList.add('is-listening');
            if (transcriptContainer) transcriptContainer.classList.add('visible');
            if (transcriptText) transcriptText.textContent = '';
            if (transcriptStatus) transcriptStatus.textContent = '듣는 중...';
        };

        recognition.onend = () => {
            if (micButton) micButton.classList.remove('is-listening');
            if (transcriptText && !transcriptText.textContent) {
                if (transcriptContainer) transcriptContainer.classList.remove('visible');
            }
        };

        recognition.onresult = (event: any) => {
            let final_transcript = '';
            let interim_transcript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) final_transcript += event.results[i][0].transcript;
                else interim_transcript += event.results[i][0].transcript;
            }
            if (transcriptText) {
                transcriptText.textContent = final_transcript || interim_transcript;
            }
            if (final_transcript && transcriptStatus) {
                transcriptStatus.textContent = '인식 완료';
                analyzeAndReact(final_transcript);
                setTimeout(() => {
                    if (transcriptContainer) transcriptContainer.classList.remove('visible');
                }, 3000);
            }
        };
    }
}

// 음성 인식 토글
function toggleSpeechRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
        showNotification('브라우저가 음성 인식을 지원하지 않습니다.', 'error');
        return;
    }
    
    if (!recognition) {
        initializeSpeechRecognition();
    }
    
    isListening = !isListening;
    if (isListening) {
        const languageSelect = document.getElementById('language-select') as HTMLSelectElement;
        if (languageSelect) {
            recognition.lang = languageSelect.value;
        }
        recognition.start();
    } else {
        recognition.stop();
    }
}

// 텍스트 분석 및 반응
function analyzeAndReact(text: string) {
    const languageSelect = document.getElementById('language-select') as HTMLSelectElement;
    const selectedLang = languageSelect?.value || 'ko-KR';
    const keywords = (keywordsByLang as any)[selectedLang];
    if (!keywords) return;
    
    let reaction = 'neutral';
    const lowerCaseText = text.toLowerCase();
    
    if (keywords.positive.some((word: string) => lowerCaseText.includes(word))) {
        reaction = 'positive';
        updateFavorability(2);
    } else if (keywords.negative.some((word: string) => lowerCaseText.includes(word))) {
        reaction = 'negative';
        updateFavorability(-2);
    }
    
    if (reaction !== 'neutral') {
        switchVideoByEmotion(reaction);
    }
}

// 감정 분석 버튼 클릭
async function analyzeButtonClick() {
    if (!sentimentInput || !sentimentResult || !analyzeButton) return;
    
    const text = sentimentInput.value.trim();
    if (!text) {
        showNotification('분석할 텍스트를 입력해주세요.', 'warning');
        return;
    }
    
    (analyzeButton as HTMLButtonElement).disabled = true;
    sentimentResult.textContent = '분석 중...';
    
    try {
        if (!classifier) {
            console.log('Transformers.js 모델 로딩 중...');
            classifier = await pipeline('sentiment-analysis');
            console.log('Transformers.js 모델 로딩 완료');
        }
        
        const result = await classifier(text);
        const primaryEmotion = result[0];
        sentimentResult.textContent = `감정: ${primaryEmotion.label}, 점수: ${primaryEmotion.score.toFixed(2)}`;
        
        // 감정에 따른 처리
        handleEmotionResult(primaryEmotion.label, primaryEmotion.score, text);
        
    } catch (error) {
        console.error('Transformers.js 감정 분석 실패:', error);
        // 로컬 대체 분석 사용
        const result = await analyzeSentimentForMessage(text);
        sentimentResult.textContent = `감정: ${result}, 점수: 0.70 (로컬 분석)`;
        handleEmotionResult(result.toUpperCase(), 0.7, text);
    } finally {
        (analyzeButton as HTMLButtonElement).disabled = false;
    }
}

// 감정 결과 처리
function handleEmotionResult(emotion: string, score: number, text: string) {
    // 감정 히스토리에 추가
    if (window.emotionHistory) {
        window.emotionHistory.addEmotion(emotion.toLowerCase(), score, text);
    }
    
    // 애니메이션 재생
    const emotionMap: { [key: string]: string } = {
        'POSITIVE': 'happy',
        'NEGATIVE': 'sad',
        'NEUTRAL': 'neutral',
        'HAPPY': 'happy',
        'SAD': 'sad'
    };
    
    const animationEmotion = emotionMap[emotion] || 'neutral';
    playEmotionAnimation(animationEmotion);
    
    // 호감도 변화
    if (emotion === 'POSITIVE' || emotion === 'HAPPY') {
        updateFavorability(3);
        showNotification('긍정적인 감정이 감지되었습니다!', 'success');
    } else if (emotion === 'NEGATIVE' || emotion === 'SAD') {
        updateFavorability(-3);
        showNotification('부정적인 감정이 감지되었습니다.', 'warning');
    }
}

// 로컬 음성 인식 버튼 클릭
async function localMicButtonClick() {
    if (!localAsrResult || !localMicButton) return;
    
    if (isLocalRecording) {
        mediaRecorder?.stop();
        return;
    }

    if (!recognizer) {
        localAsrResult.textContent = '음성 모델 로딩 중...';
        (localMicButton as HTMLButtonElement).disabled = true;
        try {
            recognizer = await pipeline('automatic-speech-recognition');
            localAsrResult.textContent = '모델 로딩 완료. 녹음을 시작하세요.';
        } catch (error) {
            console.error("ASR model failed to load", error);
            localAsrResult.textContent = '모델 로딩 실패';
            showNotification('음성 인식 모델 로딩에 실패했습니다.', 'error');
            return;
        } finally {
            (localMicButton as HTMLButtonElement).disabled = false;
        }
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        const audioChunks: BlobPart[] = [];

        mediaRecorder.addEventListener("dataavailable", event => audioChunks.push(event.data));
        mediaRecorder.addEventListener("stop", async () => {
            isLocalRecording = false;
            localMicButton.innerHTML = '<i class="fas fa-play"></i> 음성 인식 시작';
            stream.getTracks().forEach(track => track.stop());

            const audioBlob = new Blob(audioChunks);
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            
            if (arrayBuffer.byteLength === 0) return;

            localAsrResult.textContent = '인식 중...';
            try {
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                const rawAudio = audioBuffer.getChannelData(0);
                const output = await recognizer(rawAudio);
                localAsrResult.textContent = output.text || '인식된 내용이 없습니다.';
            } catch(e) {
                console.error('Audio processing failed:', e);
                localAsrResult.textContent = '오디오 처리 오류.';
                showNotification('오디오 처리에 실패했습니다.', 'error');
            }
        });

        mediaRecorder.start();
        isLocalRecording = true;
        localMicButton.innerHTML = '<i class="fas fa-stop"></i> 녹음 중지';
    } catch (error) {
        console.error('Could not start recording', error);
        showNotification('마이크에 접근할 수 없습니다.', 'error');
    }
}

// 테마 토글
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// 알림 표시
function showNotification(message: string, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    const wrapper = document.getElementById('mobile-view-wrapper');
    if (wrapper) {
        wrapper.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }
}

// 감정 애니메이션 재생
function playEmotionAnimation(emotion: string) {
    if (window.avatarViewer) {
        window.avatarViewer.playEmotionAnimation(emotion);
    }
}

// AI 대화 시스템 초기화
function initializeAIConversation() {
    aiConversation = new AIConversationSystem();
    console.log('AI 대화 시스템 초기화 완료');
}

// 채팅 이벤트 리스너 설정
function setupChatEventListeners() {
    const sendButton = document.getElementById('send-button');
    const chatInput = document.getElementById('chat-input') as HTMLInputElement;
    
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }
    
    if (chatInput) {
        chatInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        });
    }
}

// 메시지 전송
async function sendMessage() {
    const chatInput = document.getElementById('chat-input') as HTMLInputElement;
    const sendButton = document.getElementById('send-button');
    
    if (!chatInput || !aiConversation) return;
    
    const message = chatInput.value.trim();
    if (!message) return;
    
    addChatMessage(message, true);
    chatInput.value = '';
    
    if (sendButton) {
        (sendButton as HTMLButtonElement).disabled = true;
    }
    
    try {
        isStreamingResponse = true;
        const stream = await aiConversation.startStreamingResponse(message);
        await displayStreamingResponse(stream);
        
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

// 채팅 메시지 추가
function addChatMessage(content: string, isUser: boolean = false) {
    const chatMessages = document.getElementById('chat-messages');
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
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 스트리밍 응답 표시
async function displayStreamingResponse(stream: ReadableStream) {
    const chatMessages = document.getElementById('chat-messages');
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
            
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    } catch (error) {
        console.error('스트리밍 응답 읽기 실패:', error);
        messageContent.textContent += '\n[응답 생성 중 오류가 발생했습니다.]';
    } finally {
        reader.releaseLock();
    }
}

// 메시지 감정 분석
async function analyzeSentimentForMessage(message: string): Promise<string> {
    try {
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

        if (window.emotionHistory) {
            window.emotionHistory.addEmotion(emotion, confidence, message);
        }

        return emotion;
    } catch (error) {
        console.error('메시지 감정 분석 실패:', error);
        return 'neutral';
    }
}

// 나머지 초기화 함수들
function initializeEmotionChart() {
    const chartContainer = document.querySelector('.emotion-chart-container');
    if (chartContainer && window.emotionHistory) {
        emotionChart = new EmotionChart(chartContainer as HTMLElement, window.emotionHistory);
        console.log('감정 차트 초기화 완료');
    }
}

function initializeLipsyncManager() {
    lipsyncManager = new LipsyncManager();
    console.log('립싱크 시스템 초기화 완료');
}

function setupSpeechRecognitionWithLipsync() {
    if (!window.avatarViewer) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    const lipsyncRecognition = new SpeechRecognition();
    
    lipsyncRecognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        
        addChatMessage(transcript, true);
        await window.avatarViewer.processSpeechRecognition(transcript);
        
        const response = await aiConversation.processUserInput(transcript);
        addChatMessage(response, false);
        
        await window.avatarViewer.playLipsync(response);
    };
}

function initializeCameraController() {
    const avatarContainer = document.querySelector('.avatar-container') as HTMLElement;
    if (avatarContainer && window.avatarViewer?.camera) {
        cameraController = new CameraController(window.avatarViewer.camera);
        cameraController.setupMouseControls(avatarContainer);
        cameraController.setupTouchControls(avatarContainer);
        
        const uiContainer = document.querySelector('.camera-ui-container') as HTMLElement;
        if (uiContainer) {
            cameraUI = new CameraUI(uiContainer, cameraController);
        }
        
        console.log('카메라 제어 시스템 초기화 완료');
    }
}

function initializeToolCallUI() {
    const toolCallContainer = document.querySelector('.tool-call-container') as HTMLElement;
    if (toolCallContainer) {
        toolCallUI = new ToolCallUI(toolCallContainer);
        console.log('도구 호출 UI 초기화 완료');
    }
}

function initializePerformanceSystems() {
    performanceMonitor = new PerformanceMonitor();
    performanceMonitor.startMonitoring();
    
    performanceOptimizer = new PerformanceOptimizer(performanceMonitor);
    
    window.addEventListener('performanceAlert', (event: Event) => {
        const customEvent = event as CustomEvent;
        const alerts = customEvent.detail.alerts;
        
        alerts.forEach((alert: any) => {
            console.warn('성능 알림:', alert.message);
            
            if (window.showNotification) {
                window.showNotification(alert.message, alert.type);
            }
        });
    });
    
    console.log('성능 모니터링 및 최적화 시스템 초기화 완료');
    
    startPerformanceUIUpdates();
}

function initializeMemoryManager() {
    memoryManager = new MemoryManager();
    console.log('메모리 관리 시스템 초기화 완료');
}

function setupMemoryEventListeners() {
    const memoryButton = document.getElementById('memory-button');
    const memoryPanel = document.getElementById('memory-panel');
    const closeMemoryButton = document.getElementById('close-memory');
    const memorySearchInput = document.getElementById('memory-search-input') as HTMLInputElement;
    const memorySearchButton = document.getElementById('memory-search-button');

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

    if (memorySearchButton && memorySearchInput) {
        memorySearchButton.addEventListener('click', async () => {
            const query = memorySearchInput.value.trim();
            if (!query) return;

            const results = await memoryManager.searchMemory(query);
            displayMemoryResults(results);
        });
    }

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

function displayMemoryResults(results: any[]) {
    const memoryResultsDiv = document.getElementById('memory-results');
    if (!memoryResultsDiv) return;

    memoryResultsDiv.innerHTML = '';

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

function startPerformanceUIUpdates() {
    setInterval(() => {
        if (performanceMonitor && performanceOptimizer) {
            updatePerformanceMetrics();
        }
    }, 1000);
    
    setupPerformanceTabListeners();
}

function updatePerformanceMetrics() {
    if (!performanceMonitor || !performanceOptimizer) return;
    
    const stats = performanceMonitor.getPerformanceStats();
    const optimizationStats = performanceOptimizer.getOptimizationStats();
    
    const currentFpsElement = document.getElementById('current-fps');
    const currentMemoryElement = document.getElementById('current-memory');
    const currentCpuElement = document.getElementById('current-cpu');
    const currentResponseTimeElement = document.getElementById('current-response-time');
    
    if (currentFpsElement) currentFpsElement.textContent = `${stats.current.fps} FPS`;
    if (currentMemoryElement) currentMemoryElement.textContent = `${stats.current.memoryUsage} MB`;
    if (currentCpuElement) currentCpuElement.textContent = `${stats.current.cpuUsage.toFixed(1)}%`;
    if (currentResponseTimeElement) currentResponseTimeElement.textContent = `${stats.current.responseTime}ms`;
    
    const avgFpsElement = document.getElementById('avg-fps');
    const avgMemoryElement = document.getElementById('avg-memory');
    const avgCpuElement = document.getElementById('avg-cpu');
    
    if (avgFpsElement) avgFpsElement.textContent = `${stats.average.fps} FPS`;
    if (avgMemoryElement) avgMemoryElement.textContent = `${stats.average.memoryUsage} MB`;
    if (avgCpuElement) avgCpuElement.textContent = `${stats.average.cpuUsage.toFixed(1)}%`;
    
    const qualityLevelElement = document.getElementById('quality-level');
    const cacheSizeElement = document.getElementById('cache-size');
    const optimizationStatusElement = document.getElementById('optimization-status');
    
    if (qualityLevelElement) qualityLevelElement.textContent = optimizationStats.qualityLevel;
    if (cacheSizeElement) cacheSizeElement.textContent = `${optimizationStats.cacheSize} MB`;
    if (optimizationStatusElement) optimizationStatusElement.textContent = optimizationStats.isOptimizing ? '최적화 중' : '대기 중';
    
    updatePerformanceAlerts(stats.alerts);
    updatePerformanceRecommendations(stats.recommendations);
}

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

function setupPerformanceTabListeners() {
    const refreshBtn = document.getElementById('refresh-metrics-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            updatePerformanceMetrics();
        });
    }
    
    const clearCacheBtn = document.getElementById('clear-cache-btn');
    if (clearCacheBtn && performanceOptimizer) {
        clearCacheBtn.addEventListener('click', () => {
            performanceOptimizer!.dispose();
            console.log('캐시가 정리되었습니다.');
        });
    }
    
    const optimizeBtn = document.getElementById('optimize-now-btn');
    if (optimizeBtn && performanceOptimizer) {
        optimizeBtn.addEventListener('click', () => {
            performanceOptimizer!.updateSettings({
                adaptiveRendering: true
            });
            console.log('즉시 최적화가 실행되었습니다.');
        });
    }
}

// 전역 함수로 노출
window.showNotification = showNotification;
window.updateFavorability = updateFavorability;

// 음성 인식 초기화
initializeSpeechRecognition();