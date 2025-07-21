// 에이전트 관리 시스템
export interface ToolRequest {
    toolName: string;
    parameters: Record<string, any>;
    userId: string;
    sessionId: string;
}

export interface ToolResponse {
    success: boolean;
    result: any;
    error?: string;
    executionTime: number;
}

export interface AgentWorkflow {
    id: string;
    name: string;
    steps: WorkflowStep[];
    description: string;
}

export interface WorkflowStep {
    id: string;
    toolName: string;
    parameters: Record<string, any>;
    condition?: string;
    dependsOn?: string[];
}

export interface AgentStats {
    totalRequests: number;
    successfulRequests: number;
    averageResponseTime: number;
    toolsUsed: Record<string, number>;
}

export class AgentManager {
    private availableTools: Map<string, ToolFunction> = new Map();
    private workflows: Map<string, AgentWorkflow> = new Map();
    private stats: AgentStats;
    private serviceUrl: string;

    constructor(serviceUrl: string = 'http://localhost:8002') {
        this.serviceUrl = serviceUrl;
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            averageResponseTime: 0,
            toolsUsed: {}
        };
        
        this.initializeDefaultTools();
    }

    // 기본 도구들 초기화
    private initializeDefaultTools(): void {
        // 웹 검색 도구
        this.registerTool('web_search', async (params: any) => {
            const query = params.query || '';
            const response = await fetch(`${this.serviceUrl}/tools/web_search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });
            return await response.json();
        });

        // 계산 도구
        this.registerTool('calculator', async (params: any) => {
            const expression = params.expression || '0';
            try {
                // 안전한 계산 (eval 대신 Function 사용)
                const result = new Function(`return ${expression}`)();
                return { result, expression };
            } catch (error) {
                return { error: '계산 오류', expression };
            }
        });

        // 번역 도구
        this.registerTool('translation', async (params: any) => {
            const { text, target_language } = params;
            const response = await fetch(`${this.serviceUrl}/tools/translation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, target_language })
            });
            return await response.json();
        });

        // 날씨 도구
        this.registerTool('weather', async (params: any) => {
            const location = params.location || '서울';
            const response = await fetch(`${this.serviceUrl}/tools/weather`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ location })
            });
            return await response.json();
        });

        // 이미지 생성 도구
        this.registerTool('image_generation', async (params: any) => {
            const prompt = params.prompt || '';
            const response = await fetch(`${this.serviceUrl}/tools/image_generation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });
            return await response.json();
        });
    }

    // 도구 등록
    public registerTool(name: string, toolFunction: ToolFunction): void {
        this.availableTools.set(name, toolFunction);
        console.log(`도구 등록됨: ${name}`);
    }

    // 도구 실행
    public async executeTool(request: ToolRequest): Promise<ToolResponse> {
        const startTime = Date.now();
        this.stats.totalRequests++;

        try {
            const tool = this.availableTools.get(request.toolName);
            if (!tool) {
                throw new Error(`도구를 찾을 수 없습니다: ${request.toolName}`);
            }

            const result = await tool(request.parameters);
            const executionTime = Date.now() - startTime;

            // 통계 업데이트
            this.stats.successfulRequests++;
            this.stats.toolsUsed[request.toolName] = (this.stats.toolsUsed[request.toolName] || 0) + 1;
            this.updateAverageResponseTime(executionTime);

            return {
                success: true,
                result,
                executionTime
            };

        } catch (error) {
            const executionTime = Date.now() - startTime;
            console.error(`도구 실행 실패: ${request.toolName}`, error);

            return {
                success: false,
                result: null,
                error: error instanceof Error ? error.message : '알 수 없는 오류',
                executionTime
            };
        }
    }

    // 워크플로우 등록
    public registerWorkflow(workflow: AgentWorkflow): void {
        this.workflows.set(workflow.id, workflow);
        console.log(`워크플로우 등록됨: ${workflow.name}`);
    }

    // 워크플로우 실행
    public async executeWorkflow(workflowId: string, inputData: Record<string, any>): Promise<ToolResponse[]> {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`워크플로우를 찾을 수 없습니다: ${workflowId}`);
        }

        const results: ToolResponse[] = [];
        const context: Record<string, any> = { ...inputData };

        for (const step of workflow.steps) {
            // 조건 체크
            if (step.condition && !this.evaluateCondition(step.condition, context)) {
                console.log(`워크플로우 스텝 건너뜀: ${step.id} (조건 불만족)`);
                continue;
            }

            // 의존성 체크
            if (step.dependsOn && !this.checkDependencies(step.dependsOn, results)) {
                console.log(`워크플로우 스텝 건너뜀: ${step.id} (의존성 불만족)`);
                continue;
            }

            // 파라미터 치환
            const parameters = this.substituteParameters(step.parameters, context);

            // 도구 실행
            const request: ToolRequest = {
                toolName: step.toolName,
                parameters,
                userId: inputData.userId || 'anonymous',
                sessionId: inputData.sessionId || 'default'
            };

            const result = await this.executeTool(request);
            results.push(result);

            // 컨텍스트 업데이트
            if (result.success) {
                context[`${step.id}_result`] = result.result;
            }
        }

        return results;
    }

    // 조건 평가
    private evaluateCondition(condition: string, context: Record<string, any>): boolean {
        try {
            // 간단한 조건 평가 (실제로는 더 안전한 파서 사용 권장)
            const expression = condition.replace(/\$\{(\w+)\}/g, (match, key) => {
                return JSON.stringify(context[key] || '');
            });
            return new Function(`return ${expression}`)();
        } catch (error) {
            console.error('조건 평가 실패:', error);
            return false;
        }
    }

    // 의존성 체크
    private checkDependencies(dependencies: string[], results: ToolResponse[]): boolean {
        return dependencies.every(dep => 
            results.some(result => result.success && result.result)
        );
    }

    // 파라미터 치환
    private substituteParameters(parameters: Record<string, any>, context: Record<string, any>): Record<string, any> {
        const substituted: Record<string, any> = {};
        
        for (const [key, value] of Object.entries(parameters)) {
            if (typeof value === 'string') {
                substituted[key] = value.replace(/\$\{(\w+)\}/g, (match, contextKey) => {
                    return context[contextKey] || match;
                });
            } else {
                substituted[key] = value;
            }
        }
        
        return substituted;
    }

    // 통계 업데이트
    private updateAverageResponseTime(newTime: number): void {
        const totalTime = this.stats.averageResponseTime * (this.stats.successfulRequests - 1) + newTime;
        this.stats.averageResponseTime = totalTime / this.stats.successfulRequests;
    }

    // 통계 조회
    public getStats(): AgentStats {
        return { ...this.stats };
    }

    // 사용 가능한 도구 목록
    public getAvailableTools(): string[] {
        return Array.from(this.availableTools.keys());
    }

    // 등록된 워크플로우 목록
    public getWorkflows(): AgentWorkflow[] {
        return Array.from(this.workflows.values());
    }

    // 서비스 상태 체크
    public async checkServiceHealth(): Promise<boolean> {
        try {
            const response = await fetch(`${this.serviceUrl}/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            return response.ok;
        } catch (error) {
            console.error('서비스 상태 체크 실패:', error);
            return false;
        }
    }

    // 서비스 URL 업데이트
    public setServiceUrl(url: string): void {
        this.serviceUrl = url;
    }

    // 통계 초기화
    public resetStats(): void {
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            averageResponseTime: 0,
            toolsUsed: {}
        };
    }
}

// 도구 함수 타입
type ToolFunction = (parameters: Record<string, any>) => Promise<any>;

// 전역 에이전트 매니저 인스턴스
export const agentManager = new AgentManager();

// 기본 워크플로우 등록
const defaultWorkflows: AgentWorkflow[] = [
    {
        id: 'research_task',
        name: '연구 작업',
        description: '웹 검색과 분석을 결합한 연구 작업',
        steps: [
            {
                id: 'search',
                toolName: 'web_search',
                parameters: { query: '${search_query}' }
            },
            {
                id: 'analyze',
                toolName: 'calculator',
                parameters: { expression: '${analysis_expression}' },
                dependsOn: ['search']
            }
        ]
    },
    {
        id: 'translation_workflow',
        name: '번역 워크플로우',
        description: '텍스트 번역 및 검증',
        steps: [
            {
                id: 'translate',
                toolName: 'translation',
                parameters: { text: '${input_text}', target_language: '${target_lang}' }
            }
        ]
    }
];

// 기본 워크플로우 등록
defaultWorkflows.forEach(workflow => {
    agentManager.registerWorkflow(workflow);
}); 