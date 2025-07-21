/**
 * 립싱크 관리자
 * 음성과 아바타의 입 모양을 동기화합니다.
 */

export interface VisemeData {
  phoneme: string;
  startTime: number;
  endTime: number;
  intensity: number;
}

export interface LipsyncResult {
  visemes: VisemeData[];
  duration: number;
  audioUrl?: string;
}

export class LipsyncManager {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private isRecording = false;
  private visemeMap: Map<string, string> = new Map();

  constructor() {
    this.initializeVisemeMap();
  }

  /**
   * Viseme 매핑 초기화
   */
  private initializeVisemeMap(): void {
    // 한국어 음소-입 모양 매핑
    this.visemeMap.set('ㅏ', 'A');
    this.visemeMap.set('ㅑ', 'A');
    this.visemeMap.set('ㅓ', 'O');
    this.visemeMap.set('ㅕ', 'O');
    this.visemeMap.set('ㅗ', 'O');
    this.visemeMap.set('ㅛ', 'O');
    this.visemeMap.set('ㅜ', 'U');
    this.visemeMap.set('ㅠ', 'U');
    this.visemeMap.set('ㅡ', 'U');
    this.visemeMap.set('ㅣ', 'I');
    this.visemeMap.set('ㅐ', 'A');
    this.visemeMap.set('ㅒ', 'A');
    this.visemeMap.set('ㅔ', 'E');
    this.visemeMap.set('ㅖ', 'E');
    this.visemeMap.set('ㅘ', 'A');
    this.visemeMap.set('ㅙ', 'A');
    this.visemeMap.set('ㅚ', 'O');
    this.visemeMap.set('ㅝ', 'U');
    this.visemeMap.set('ㅞ', 'U');
    this.visemeMap.set('ㅟ', 'U');
    this.visemeMap.set('ㅢ', 'U');

    // 자음 매핑
    this.visemeMap.set('ㄱ', 'B');
    this.visemeMap.set('ㄴ', 'B');
    this.visemeMap.set('ㄷ', 'B');
    this.visemeMap.set('ㄹ', 'L');
    this.visemeMap.set('ㅁ', 'M');
    this.visemeMap.set('ㅂ', 'B');
    this.visemeMap.set('ㅅ', 'S');
    this.visemeMap.set('ㅇ', 'B');
    this.visemeMap.set('ㅈ', 'S');
    this.visemeMap.set('ㅊ', 'S');
    this.visemeMap.set('ㅋ', 'B');
    this.visemeMap.set('ㅌ', 'B');
    this.visemeMap.set('ㅍ', 'B');
    this.visemeMap.set('ㅎ', 'H');

    // 영어 음소 매핑
    this.visemeMap.set('a', 'A');
    this.visemeMap.set('e', 'E');
    this.visemeMap.set('i', 'I');
    this.visemeMap.set('o', 'O');
    this.visemeMap.set('u', 'U');
    this.visemeMap.set('b', 'B');
    this.visemeMap.set('p', 'B');
    this.visemeMap.set('m', 'M');
    this.visemeMap.set('f', 'F');
    this.visemeMap.set('v', 'F');
    this.visemeMap.set('w', 'W');
    this.visemeMap.set('l', 'L');
    this.visemeMap.set('s', 'S');
    this.visemeMap.set('z', 'S');
    this.visemeMap.set('t', 'T');
    this.visemeMap.set('d', 'T');
    this.visemeMap.set('n', 'N');
    this.visemeMap.set('k', 'K');
    this.visemeMap.set('g', 'K');
    this.visemeMap.set('h', 'H');
    this.visemeMap.set('r', 'R');
    this.visemeMap.set('y', 'Y');
  }

  /**
   * 음성 인식과 립싱크 연동
   */
  async processSpeechRecognition(transcript: string): Promise<LipsyncResult> {
    try {
      console.log('음성 인식 결과 처리:', transcript);
      
      // 음소 분석
      const phonemes = this.analyzePhonemes(transcript);
      
      // Viseme 생성
      const visemes = this.generateVisemes(phonemes);
      
      // 립싱크 결과 생성
      const result: LipsyncResult = {
        visemes,
        duration: this.calculateDuration(visemes)
      };

      console.log('립싱크 결과:', result);
      return result;

    } catch (error) {
      console.error('음성 인식 립싱크 처리 실패:', error);
      return this.createDefaultLipsync();
    }
  }

  /**
   * 텍스트를 음소로 분석
   */
  private analyzePhonemes(text: string): string[] {
    const phonemes: string[] = [];
    const lowerText = text.toLowerCase();
    
    // 간단한 음소 분석 (실제로는 더 정교한 분석 필요)
    for (let i = 0; i < lowerText.length; i++) {
      const char = lowerText[i];
      
      // 한글 자모 분석
      if (this.isKorean(char)) {
        const koreanPhonemes = this.analyzeKoreanPhonemes(char);
        phonemes.push(...koreanPhonemes);
      } else if (this.isEnglish(char)) {
        // 영어 음소 분석
        if (this.isVowel(char)) {
          phonemes.push(char);
        } else if (this.isConsonant(char)) {
          phonemes.push(char);
        }
      }
    }

    return phonemes;
  }

  /**
   * 한글 자모 분석
   */
  private analyzeKoreanPhonemes(char: string): string[] {
    const phonemes: string[] = [];
    
    // 한글 유니코드 범위 확인
    const code = char.charCodeAt(0);
    if (code >= 0xAC00 && code <= 0xD7AF) {
      // 한글 완성형 문자
      const base = code - 0xAC00;
      const jong = base % 28;
      const jung = ((base - jong) / 28) % 21;
      const cho = ((base - jong) / 28) / 21;

      // 초성
      const choList = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
      if (cho > 0) {
        phonemes.push(choList[cho - 1]);
      }

      // 중성
      const jungList = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
      phonemes.push(jungList[jung]);

      // 종성
      const jongList = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
      if (jong > 0) {
        phonemes.push(jongList[jong]);
      }
    }

    return phonemes;
  }

  /**
   * Viseme 생성
   */
  private generateVisemes(phonemes: string[]): VisemeData[] {
    const visemes: VisemeData[] = [];
    const frameDuration = 0.1; // 100ms per frame
    let currentTime = 0;

    for (let i = 0; i < phonemes.length; i++) {
      const phoneme = phonemes[i];
      const viseme = this.visemeMap.get(phoneme) || 'X';
      
      visemes.push({
        phoneme,
        startTime: currentTime,
        endTime: currentTime + frameDuration,
        intensity: 0.8
      });

      currentTime += frameDuration;
    }

    return visemes;
  }

  /**
   * 지속 시간 계산
   */
  private calculateDuration(visemes: VisemeData[]): number {
    if (visemes.length === 0) return 0;
    return visemes[visemes.length - 1].endTime;
  }

  /**
   * 기본 립싱크 생성
   */
  private createDefaultLipsync(): LipsyncResult {
    return {
      visemes: [
        {
          phoneme: 'X',
          startTime: 0,
          endTime: 0.5,
          intensity: 0.5
        }
      ],
      duration: 0.5
    };
  }

  /**
   * 실시간 립싱크 시작
   */
  async startRealTimeLipsync(): Promise<void> {
    try {
      // 오디오 컨텍스트 초기화
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // 마이크 접근
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 오디오 소스 생성
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      
      // 분석기 생성
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      
      // 연결
      this.microphone.connect(this.analyser);
      
      this.isRecording = true;
      this.startLipsyncLoop();
      
      console.log('실시간 립싱크 시작');
      
    } catch (error) {
      console.error('실시간 립싱크 시작 실패:', error);
      throw error;
    }
  }

  /**
   * 립싱크 루프
   */
  private startLipsyncLoop(): void {
    if (!this.analyser || !this.isRecording) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const processFrame = () => {
      if (!this.isRecording) return;
      
      this.analyser!.getByteFrequencyData(dataArray);
      
      // 주파수 분석으로 입 모양 결정
      const mouthShape = this.analyzeMouthShape(dataArray);
      
      // 아바타에 적용
      this.applyMouthShape(mouthShape);
      
      requestAnimationFrame(processFrame);
    };
    
    processFrame();
  }

  /**
   * 주파수 데이터로 입 모양 분석
   */
  private analyzeMouthShape(frequencyData: Uint8Array): string {
    // 저주파 대역 (0-1000Hz) 분석
    const lowFreq = frequencyData.slice(0, 10);
    const lowFreqAvg = lowFreq.reduce((sum, val) => sum + val, 0) / lowFreq.length;
    
    // 고주파 대역 (1000-4000Hz) 분석
    const highFreq = frequencyData.slice(10, 40);
    const highFreqAvg = highFreq.reduce((sum, val) => sum + val, 0) / highFreq.length;
    
    // 입 모양 결정
    if (lowFreqAvg > 100 && highFreqAvg > 50) {
      return 'A'; // 큰 입
    } else if (lowFreqAvg > 80) {
      return 'O'; // 둥근 입
    } else if (highFreqAvg > 60) {
      return 'I'; // 작은 입
    } else {
      return 'X'; // 기본
    }
  }

  /**
   * 아바타에 입 모양 적용
   */
  private applyMouthShape(shape: string): void {
    if (!window.avatarViewer) return;

    try {
      // BlendShape 값 설정
      const blendShapeValues: Record<string, number> = {
        'A': 0.8,
        'I': 0.6,
        'U': 0.7,
        'E': 0.5,
        'O': 0.9,
        'X': 0.0
      };

      const value = blendShapeValues[shape] || 0.0;
      
      // 아바타에 적용
      window.avatarViewer.setBlendShape('A', shape === 'A' ? value : 0);
      window.avatarViewer.setBlendShape('I', shape === 'I' ? value : 0);
      window.avatarViewer.setBlendShape('U', shape === 'U' ? value : 0);
      window.avatarViewer.setBlendShape('E', shape === 'E' ? value : 0);
      window.avatarViewer.setBlendShape('O', shape === 'O' ? value : 0);
      
    } catch (error) {
      console.error('아바타 입 모양 적용 실패:', error);
    }
  }

  /**
   * 립싱크 중지
   */
  stopRealTimeLipsync(): void {
    this.isRecording = false;
    
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    console.log('실시간 립싱크 중지');
  }

  /**
   * 유틸리티 함수들
   */
  private isKorean(char: string): boolean {
    const code = char.charCodeAt(0);
    return (code >= 0xAC00 && code <= 0xD7AF) || (code >= 0x1100 && code <= 0x11FF);
  }

  private isEnglish(char: string): boolean {
    return /[a-zA-Z]/.test(char);
  }

  private isVowel(char: string): boolean {
    return /[aeiouAEIOU]/.test(char);
  }

  private isConsonant(char: string): boolean {
    return /[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/.test(char);
  }

  /**
   * 립싱크 품질 설정
   */
  setLipsyncQuality(quality: 'low' | 'medium' | 'high'): void {
    const qualitySettings = {
      low: { frameRate: 10, precision: 0.5 },
      medium: { frameRate: 20, precision: 0.7 },
      high: { frameRate: 30, precision: 0.9 }
    };

    const settings = qualitySettings[quality];
    console.log(`립싱크 품질 설정: ${quality}`, settings);
  }

  /**
   * 립싱크 상태 확인
   */
  isLipsyncActive(): boolean {
    return this.isRecording;
  }
} 