// AI 대화 시스템
export interface ConversationMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}

export interface ConversationContext {
    messages: ConversationMessage[];
    userProfile?: {
        name: string;
        preferences: string[];
        conversationStyle: 'casual' | 'formal' | 'friendly';
    };
}

// 메모리 관리 시스템
export interface MemoryItem {
    id: string;
    content: string;
    metadata: Record<string, any>;
    timestamp: number;
    user_id: string;
}

export interface ConversationItem {
    id: string;
    user_message: string;
    ai_response: string;
    emotion: string;
    timestamp: number;
    user_id: string;
}

export interface MemoryStats {
    memory_count: number;
    conversation_count: number;
    total_items: number;
}

// 에이전트 시스템 통합
import { AgentManager } from './agent-manager.js';
import { MemoryManager } from './memory-manager.js';
import { pipeline } from '@xenova/transformers';

export class AIConversationSystem {
    private context: ConversationContext;
    private isStreaming: boolean = false;
    private currentStream: ReadableStream | null = null;
    private memoryManager: MemoryManager;
    private agentManager: AgentManager;
    private phi4Pipeline: any = null;

    constructor() {
        this.context = {
            messages: [
                {
                    role: 'system',
                    content: `당신은 친근하고 따뜻한 AI 파트너입니다. 
                    사용자와 자연스럽게 대화하며, 감정을 이해하고 공감하는 능력을 가지고 있습니다.
                    한국어로 대화하며, 때로는 재미있고 때로는 진지하게 대화할 수 있습니다.
                    항상 긍정적이고 도움이 되는 조언을 제공하력합니다.
                    이전 대화 내용을 기억하고 참고하여 더 개인화된 응답을 제공합니다.
                    필요할 때는 다양한 도구를 사용하여 사용자를 도울 수 있습니다.`,
                    timestamp: new Date()
                }
            ]
        };
        
        this.memoryManager = new MemoryManager();
        this.agentManager = new AgentManager();
        this.initializePhi4Mini();
    }

    private async initializePhi4Mini() {
        if (!this.phi4Pipeline) {
            this.phi4Pipeline = await pipeline('text-generation', 'microsoft/Phi-4-mini', {
                quantized: true
            });
        }
    }

    // 도구 호출이 필요한지 판단
    private async shouldUseTool(userInput: string): Promise<{ useTool: boolean; toolName?: string; parameters?: any }> {
        const toolKeywords = {
            'web_search': ['검색', '찾아', '정보', '알아', '조사'],
            'calculator': ['계산', '연산', '더하기', '빼기', '곱하기', '나누기'],
            'weather': ['날씨', '기온', '비', '맑음', '흐림'],
            'translation': ['번역', '영어', '일본어', '중국어', '한국어'],
            'image_generation': ['그림', '이미지', '사진', '생성', '만들어']
        };

        const lowerInput = userInput.toLowerCase();
        
        for (const [toolName, keywords] of Object.entries(toolKeywords)) {
            if (keywords.some(keyword => lowerInput.includes(keyword))) {
                return {
                    useTool: true,
                    toolName,
                    parameters: this.extractToolParameters(userInput, toolName)
                };
            }
        }
        
        return { useTool: false };
    }

    // 도구 파라미터 추출
    private extractToolParameters(userInput: string, toolName: string): any {
        switch (toolName) {
            case 'web_search':
                return { query: userInput.replace(/검색|찾아|정보|알아|조사/g, '').trim() };
            case 'calculator':
                // 수식 추출 로직
                const mathMatch = userInput.match(/(\d+[\+\-\*\/\s]+\d+)/);
                return { expression: mathMatch ? mathMatch[1] : '0' };
            case 'weather':
                return { location: '서울' }; // 기본값
            case 'translation':
                const langMatch = userInput.match(/(영어|일본어|중국어|한국어)/);
                return { 
                    text: userInput.replace(/번역|영어|일본어|중국어|한국어/g, '').trim(),
                    target_language: langMatch ? langMatch[1] : 'en'
                };
            case 'image_generation':
                return { prompt: userInput.replace(/그림|이미지|사진|생성|만들어/g, '').trim() };
            default:
                return {}; // 기본값
        }
    }

    // 프롬프트 분류 시스템 (임시: 길이 기반)
    private async classifyPrompt(userInput: string): Promise<'simple' | 'complex' | 'tool'> {
        // 간단한 분류: 길이/키워드 기반
        if (userInput.length < 30) return 'simple';
        if (userInput.includes('검색') || userInput.includes('계산') || userInput.includes('번역')) return 'tool';
        return 'complex';
    }

    // 간단한 응답 생성
    private async generateSimpleResponse(userInput: string): Promise<string> {
        const responses = {
            greeting: [
                '안녕하세요! 오늘도 좋은 하루 되세요 😊',
                '안녕! 무슨 일이야?',
                '반가워! 오늘 기분은 어때?'
            ],
            thanks: [
                '천만에요! 언제든 도움이 필요하면 말해줘 😄',
                '고마워! 나도 즐거웠어',
                '별 말씀을요! 더 도움이 필요하면 언제든지'
            ],
            positive: [
                '좋아! 그런 기분이 들 때가 가장 행복하지 😊',
                '정말 좋은 일이네! 함께 기뻐해',
                '와! 정말 멋진 일이야!'
            ],
            negative: [
                '괜찮아, 힘든 일이 있을 때는 나와 이야기해도 좋아',
                '그런 기분이 들 수 있어. 하지만 곧 좋아질 거야',
                '힘들 때는 쉬어도 괜찮아. 내가 옆에 있을게'
            ]
        };

        const input = userInput.toLowerCase();
        
        if (input.includes('안녕') || input.includes('hello')) {
            return responses.greeting[Math.floor(Math.random() * responses.greeting.length)];
        } else if (input.includes('고마워') || input.includes('감사')) {
            return responses.thanks[Math.floor(Math.random() * responses.thanks.length)];
        } else if (input.includes('좋아') || input.includes('좋은')) {
            return responses.positive[Math.floor(Math.random() * responses.positive.length)];
        } else {
            return responses.negative[Math.floor(Math.random() * responses.negative.length)];
        }
    }

    // ChatGPT API 호출
    private async callChatGPTAPI(messages: ConversationMessage[]): Promise<string> {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY || 'your-api-key'}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: messages.map(msg => ({
                        role: msg.role,
                        content: msg.content
                    })),
                    max_tokens: 500,
                    temperature: 0.7,
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`ChatGPT API 오류: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('ChatGPT API 호출 실패:', error);
            return '죄송해요, 지금은 응답하기 어려워요. 잠시 후 다시 시도해주세요.';
        }
    }

    // 스트리밍 응답 생성
    private async generateStreamingResponse(userInput: string): Promise<ReadableStream> {
        const encoder = new TextEncoder();
        
        return new ReadableStream({
            async start(controller) {
                try {
                    const response = await fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.OPENAI_API_KEY || 'your-api-key'}`
                        },
                        body: JSON.stringify({
                            model: 'gpt-3.5-turbo',
                            messages: [
                                {
                                    role: 'system',
                                    content: '당신은 친근하고 따뜻한 AI 파트너입니다. 한국어로 대화하세요.'
                                },
                                {
                                    role: 'user',
                                    content: userInput
                                }
                            ],
                            max_tokens: 500,
                            temperature: 0.7,
                            stream: true
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`ChatGPT API 오류: ${response.status}`);
                    }

                    const reader = response.body?.getReader();
                    if (!reader) {
                        throw new Error('응답 스트림을 읽을 수 없습니다.');
                    }

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = new TextDecoder().decode(value);
                        const lines = chunk.split('\n');

                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const data = line.slice(6);
                                if (data === '[DONE]') {
                                    controller.close();
                                    return;
                                }

                                try {
                                    const parsed = JSON.parse(data);
                                    const content = parsed.choices[0]?.delta?.content;
                                    if (content) {
                                        controller.enqueue(encoder.encode(content));
                                    }
                                } catch (e) {
                                    // 무시
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('스트리밍 응답 생성 실패:', error);
                    controller.enqueue(encoder.encode('죄송해요, 응답을 생성할 수 없습니다.'));
                    controller.close();
                }
            }
        });
    }

    // 메인 대화 처리 함수 개선 (메모리 통합)
    public async processUserInput(userInput: string): Promise<string> {
        try {
            // 1. 프롬프트 분류
            const classification = await this.classifyPrompt(userInput);
            
            // 2. 분류에 따른 처리
            switch (classification) {
                case 'simple':
                    return await this.callLocalLLM(userInput);
                case 'complex':
                    return await this.callRemoteLLM(userInput);
                case 'tool':
                    return await this.callAgent(userInput);
                default:
                    return await this.callLocalLLM(userInput);
            }
        } catch (error) {
            console.error('AI 대화 처리 실패:', error);
            return '죄송합니다. 오류가 발생했습니다.';
        }
    }

    // 메모리 기반 컨텍스트 생성
    private async createMemoryContext(userInput: string): Promise<string> {
        try {
            const memories = await this.memoryManager.searchMemory(userInput, 5);
            if (memories.length > 0) {
                return memories.map(m => m.content).join('\n');
            }
            return '';
        } catch (error) {
            console.error('메모리 컨텍스트 생성 실패:', error);
            return '';
        }
    }

    // 메시지 감정 분석
    private async analyzeMessageEmotion(message: string): Promise<string> {
        const positiveWords = ['좋아', '행복', '기뻐', '감사', '사랑', '멋져', '최고', '완벽'];
        const negativeWords = ['싫어', '슬퍼', '화나', '짜증', '힘들', '어려워', '실패', '스트레스'];
        
        const lowerMessage = message.toLowerCase();
        
        const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
        const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;
        
        if (positiveCount > negativeCount) {
            return 'happy';
        } else if (negativeCount > positiveCount) {
            return 'sad';
        } else {
            return 'neutral';
        }
    }

    // 중요한 정보 추출 및 저장
    private async extractAndStoreImportantInfo(userInput: string, aiResponse: string): Promise<void> {
        // 사용자 선호도, 관심사, 중요한 정보 추출
        const importantKeywords = [
            '좋아하는', '싫어하는', '관심', '취미', '직업', '학교', '가족', '친구',
            '목표', '꿈', '계획', '생일', '기념일', '선호', '알레르기', '병'
        ];

        const combinedText = userInput + ' ' + aiResponse;
        const lowerText = combinedText.toLowerCase();

        for (const keyword of importantKeywords) {
            if (lowerText.includes(keyword)) {
                await this.memoryManager.storeMemory(
                    `사용자 정보: ${keyword} 관련 내용`,
                    {
                        type: 'preference'
                    }
                );
                break;
            }
        }
    }

    // 메모리 기반 개인화된 응답 생성
    private async generatePersonalizedResponse(userInput: string): Promise<string> {
        try {
            // 사용자 관련 정보 검색
            const userMemories = await this.memoryManager.searchMemory(userInput, 5);
            
            if (userMemories.length > 0) {
                const memoryContext = userMemories
                    .map(memory => memory.content)
                    .join('\n');
                
                return `이전에 말씀해주신 내용을 기억하고 있어요. ${memoryContext}\n\n${await this.generateSimpleResponse(userInput)}`;
            }
            
            return await this.generateSimpleResponse(userInput);
        } catch (error) {
            console.error('개인화된 응답 생성 실패:', error);
            return await this.generateSimpleResponse(userInput);
        }
    }

    // 도구 요청 처리
    private async handleToolRequest(userInput: string): Promise<string> {
        const toolResult = await this.shouldUseTool(userInput);

        if (toolResult.useTool) {
            const toolName = toolResult.toolName!;
            const parameters = toolResult.parameters!;

            const agentResponse = await this.agentManager.executeTool({
                toolName,
                parameters,
                userId: 'default',
                sessionId: 'default'
            });

            if (agentResponse.success) {
                return `도구 결과: ${JSON.stringify(agentResponse.result, null, 2)}`;
            } else {
                return `도구 실행 실패: ${agentResponse.error}`;
            }
        } else {
            return '도구 호출이 필요하지 않습니다.';
        }
    }

    // 스트리밍 응답 시작
    public async startStreamingResponse(userInput: string): Promise<ReadableStream> {
        this.isStreaming = true;
        this.currentStream = await this.generateStreamingResponse(userInput);
        return this.currentStream;
    }

    // 스트리밍 중지
    public stopStreaming(): void {
        this.isStreaming = false;
        if (this.currentStream) {
            this.currentStream.cancel();
            this.currentStream = null;
        }
    }

    // 대화 이력 가져오기
    public getConversationHistory(): ConversationMessage[] {
        return this.context.messages;
    }

    // 대화 이력 초기화
    public clearConversation(): void {
        this.context.messages = [
            {
                role: 'system',
                content: `당신은 친근하고 따뜻한 AI 파트너입니다. 
                사용자와 자연스럽게 대화하며, 감정을 이해하고 공감하는 능력을 가지고 있습니다.
                한국어로 대화하며, 때로는 재미있고 때로는 진지하게 대화할 수 있습니다.
                항상 긍정적이고 도움이 되는 조언을 제공하력합니다.`,
                timestamp: new Date()
            }
        ];
    }

    // 로컬 LLM 직접 호출 (Transformers.js)
    private async callLocalLLM(userInput: string): Promise<string> {
        await this.initializePhi4Mini();
        const result = await this.phi4Pipeline(userInput, {
            max_new_tokens: 128,
            temperature: 0.7
        });
        const response = result[0]?.generated_text || '';
        await this.memoryManager.storeConversation(userInput, response, 'positive');
        return response;
    }

    private async callRemoteLLM(userInput: string): Promise<string> {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: '당신은 친근하고 도움이 되는 AI 파트너입니다.' },
                        { role: 'user', content: userInput }
                    ],
                    max_tokens: 512,
                    temperature: 0.7
                })
            });
            
            if (!response.ok) {
                throw new Error('원격 LLM 호출 실패');
            }
            
            const result = await response.json();
            const aiResponse = result.choices[0].message.content;
            
            // 메모리에 저장
            await this.memoryManager.storeConversation(userInput, aiResponse, 'positive');
            
            return aiResponse;
            
        } catch (error) {
            console.error('원격 LLM 호출 실패:', error);
            return '죄송합니다. 네트워크 오류가 발생했습니다.';
        }
    }

    private async callAgent(userInput: string): Promise<string> {
        try {
            const agentResponse = await this.agentManager.executeTool('general', { query: userInput });
            return agentResponse.result || '도구 실행이 완료되었습니다.';
        } catch (error) {
            console.error('에이전트 호출 실패:', error);
            return await this.callLocalLLM(userInput);
        }
    }

    // 감정 분석 (간단 규칙 기반)
    async analyzeSentiment(text: string): Promise<{ emotion: string; confidence: number }> {
        // 간단 규칙 기반 분석
        const positiveWords = ['좋아', '행복', '기뻐', '감사', '사랑', '멋져', '최고', '완벽'];
        const negativeWords = ['싫어', '슬퍼', '화나', '짜증', '힘들', '어려워', '실패', '스트레스'];
        const lower = text.toLowerCase();
        let score = 0;
        positiveWords.forEach(w => { if (lower.includes(w)) score += 1; });
        negativeWords.forEach(w => { if (lower.includes(w)) score -= 1; });
        let emotion = 'neutral';
        if (score > 0) emotion = 'happy';
        else if (score < 0) emotion = 'sad';
        return { emotion, confidence: Math.min(1, Math.abs(score) / 3) };
    }

    async getModelInfo(): Promise<any> {
        try {
            // phi4Endpoint 관련 fetch 코드 모두 제거 또는 주석 처리
            // 나머지 로직은 기존과 동일하게 유지
            // const response = await fetch(`${this.phi4Endpoint}/info`);
            // if (!response.ok) {
            //     throw new Error('모델 정보 조회 실패');
            // }
            // return await response.json();
            return {
                model_name: 'Phi-4-mini',
                quantization: '4-bit',
                max_length: 1024,
                temperature: 0.7
            };
        } catch (error) {
            console.error('모델 정보 조회 실패:', error);
            return null;
        }
    }
} 