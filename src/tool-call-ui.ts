/**
 * 도구 호출 UI 컴포넌트
 * 에이전트 시스템의 도구 호출을 위한 사용자 친화적 인터페이스를 제공합니다.
 */

export interface ToolDefinition {
  name: string;
  description: string;
  category: string;
  parameters: ToolParameter[];
  icon: string;
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  description: string;
  required: boolean;
  default?: any;
  options?: string[]; // select 타입용
}

export interface ToolCallResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime?: number;
}

export class ToolCallUI {
  private container: HTMLElement;
  private uiElement: HTMLElement | null = null;
  private isVisible: boolean = false;
  private availableTools: ToolDefinition[] = [];
  private currentToolCall: any = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.initializeTools();
    this.createUI();
  }

  /**
   * 사용 가능한 도구들 초기화
   */
  private initializeTools(): void {
    this.availableTools = [
      {
        name: 'web_search',
        description: '웹 검색을 통해 최신 정보를 찾습니다',
        category: '정보 검색',
        icon: 'fas fa-search',
        parameters: [
          {
            name: 'query',
            type: 'string',
            description: '검색할 키워드',
            required: true
          },
          {
            name: 'max_results',
            type: 'number',
            description: '최대 결과 수',
            required: false,
            default: 5
          }
        ]
      },
      {
        name: 'calculator',
        description: '수학 계산을 수행합니다',
        category: '계산',
        icon: 'fas fa-calculator',
        parameters: [
          {
            name: 'expression',
            type: 'string',
            description: '계산할 수식',
            required: true
          }
        ]
      },
      {
        name: 'translator',
        description: '텍스트를 다른 언어로 번역합니다',
        category: '번역',
        icon: 'fas fa-language',
        parameters: [
          {
            name: 'text',
            type: 'string',
            description: '번역할 텍스트',
            required: true
          },
          {
            name: 'target_language',
            type: 'select',
            description: '목표 언어',
            required: true,
            options: ['ko', 'en', 'ja', 'zh', 'es', 'fr', 'de']
          }
        ]
      },
      {
        name: 'weather',
        description: '지정된 지역의 날씨 정보를 가져옵니다',
        category: '날씨',
        icon: 'fas fa-cloud-sun',
        parameters: [
          {
            name: 'location',
            type: 'string',
            description: '지역명',
            required: true
          }
        ]
      },
      {
        name: 'file_operations',
        description: '파일 시스템 작업을 수행합니다',
        category: '파일',
        icon: 'fas fa-file',
        parameters: [
          {
            name: 'operation',
            type: 'select',
            description: '수행할 작업',
            required: true,
            options: ['read', 'write', 'delete', 'list']
          },
          {
            name: 'path',
            type: 'string',
            description: '파일 경로',
            required: true
          },
          {
            name: 'content',
            type: 'string',
            description: '파일 내용 (write 작업시)',
            required: false
          }
        ]
      }
    ];
  }

  /**
   * UI 생성
   */
  private createUI(): void {
    this.uiElement = document.createElement('div');
    this.uiElement.className = 'tool-call-ui';
    this.uiElement.innerHTML = `
      <div class="tool-call-header">
        <i class="fas fa-tools" aria-hidden="true"></i>
        <span>도구 호출</span>
        <button class="tool-call-close-btn" aria-label="도구 호출 닫기">
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>
      </div>
      
      <div class="tool-call-content">
        <!-- 도구 선택 -->
        <div class="tool-selection-section">
          <h4>도구 선택</h4>
          <div class="tool-categories">
            <button class="category-btn active" data-category="all">
              <i class="fas fa-th" aria-hidden="true"></i>
              <span>전체</span>
            </button>
            <button class="category-btn" data-category="정보 검색">
              <i class="fas fa-search" aria-hidden="true"></i>
              <span>정보 검색</span>
            </button>
            <button class="category-btn" data-category="계산">
              <i class="fas fa-calculator" aria-hidden="true"></i>
              <span>계산</span>
            </button>
            <button class="category-btn" data-category="번역">
              <i class="fas fa-language" aria-hidden="true"></i>
              <span>번역</span>
            </button>
            <button class="category-btn" data-category="날씨">
              <i class="fas fa-cloud-sun" aria-hidden="true"></i>
              <span>날씨</span>
            </button>
            <button class="category-btn" data-category="파일">
              <i class="fas fa-file" aria-hidden="true"></i>
              <span>파일</span>
            </button>
          </div>
          
          <div class="tool-list">
            ${this.renderToolList()}
          </div>
        </div>

        <!-- 도구 매개변수 -->
        <div class="tool-parameters-section" style="display: none;">
          <h4>매개변수 설정</h4>
          <div class="tool-info">
            <div class="tool-name"></div>
            <div class="tool-description"></div>
          </div>
          <form class="tool-parameters-form">
            <!-- 매개변수 입력 필드들이 동적으로 추가됩니다 -->
          </form>
          <div class="tool-actions">
            <button class="tool-execute-btn" type="button">
              <i class="fas fa-play" aria-hidden="true"></i>
              <span>실행</span>
            </button>
            <button class="tool-cancel-btn" type="button">
              <i class="fas fa-times" aria-hidden="true"></i>
              <span>취소</span>
            </button>
          </div>
        </div>

        <!-- 실행 결과 -->
        <div class="tool-results-section" style="display: none;">
          <h4>실행 결과</h4>
          <div class="tool-execution-status">
            <div class="status-indicator">
              <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>
              <span>실행 중...</span>
            </div>
          </div>
          <div class="tool-results-content">
            <!-- 결과가 여기에 표시됩니다 -->
          </div>
          <div class="tool-results-actions">
            <button class="tool-copy-btn" type="button">
              <i class="fas fa-copy" aria-hidden="true"></i>
              <span>복사</span>
            </button>
            <button class="tool-new-call-btn" type="button">
              <i class="fas fa-plus" aria-hidden="true"></i>
              <span>새 호출</span>
            </button>
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(this.uiElement);
    this.bindEvents();
  }

  /**
   * 도구 목록 렌더링
   */
  private renderToolList(): string {
    return this.availableTools.map(tool => `
      <div class="tool-item" data-tool="${tool.name}">
        <div class="tool-icon">
          <i class="${tool.icon}" aria-hidden="true"></i>
        </div>
        <div class="tool-info">
          <div class="tool-name">${tool.name}</div>
          <div class="tool-description">${tool.description}</div>
          <div class="tool-category">${tool.category}</div>
        </div>
        <div class="tool-action">
          <button class="tool-select-btn" aria-label="${tool.name} 선택">
            <i class="fas fa-arrow-right" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  /**
   * 이벤트 바인딩
   */
  private bindEvents(): void {
    if (!this.uiElement) return;

    // 닫기 버튼
    const closeBtn = this.uiElement.querySelector('.tool-call-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hide();
      });
    }

    // 카테고리 필터
    const categoryButtons = this.uiElement.querySelectorAll('.category-btn');
    categoryButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        const target = event.currentTarget as HTMLElement;
        const category = target.dataset.category;
        this.filterToolsByCategory(category || 'all');
        this.updateCategoryButtons(target);
      });
    });

    // 도구 선택
    const toolSelectButtons = this.uiElement.querySelectorAll('.tool-select-btn');
    toolSelectButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        const target = event.currentTarget as HTMLElement;
        const toolItem = target.closest('.tool-item') as HTMLElement;
        const toolName = toolItem?.dataset.tool;
        if (toolName) {
          this.selectTool(toolName);
        }
      });
    });

    // 도구 실행
    const executeBtn = this.uiElement.querySelector('.tool-execute-btn');
    if (executeBtn) {
      executeBtn.addEventListener('click', () => {
        this.executeTool();
      });
    }

    // 도구 취소
    const cancelBtn = this.uiElement.querySelector('.tool-cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.cancelToolExecution();
      });
    }

    // 결과 복사
    const copyBtn = this.uiElement.querySelector('.tool-copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        this.copyResults();
      });
    }

    // 새 호출
    const newCallBtn = this.uiElement.querySelector('.tool-new-call-btn');
    if (newCallBtn) {
      newCallBtn.addEventListener('click', () => {
        this.resetToolCall();
      });
    }
  }

  /**
   * 카테고리별 도구 필터링
   */
  private filterToolsByCategory(category: string): void {
    if (!this.uiElement) return;

    const toolItems = this.uiElement.querySelectorAll('.tool-item');
    toolItems.forEach(item => {
      const toolName = item.getAttribute('data-tool');
      const tool = this.availableTools.find(t => t.name === toolName);
      
      if (category === 'all' || tool?.category === category) {
        (item as HTMLElement).style.display = 'block';
      } else {
        (item as HTMLElement).style.display = 'none';
      }
    });
  }

  /**
   * 카테고리 버튼 상태 업데이트
   */
  private updateCategoryButtons(activeButton: HTMLElement): void {
    if (!this.uiElement) return;

    const categoryButtons = this.uiElement.querySelectorAll('.category-btn');
    categoryButtons.forEach(button => {
      button.classList.remove('active');
    });
    activeButton.classList.add('active');
  }

  /**
   * 도구 선택
   */
  private selectTool(toolName: string): void {
    const tool = this.availableTools.find(t => t.name === toolName);
    if (!tool) return;

    this.currentToolCall = {
      tool: tool,
      parameters: {}
    };

    this.showParametersSection(tool);
  }

  /**
   * 매개변수 섹션 표시
   */
  private showParametersSection(tool: ToolDefinition): void {
    if (!this.uiElement) return;

    const parametersSection = this.uiElement.querySelector('.tool-parameters-section') as HTMLElement;
    const toolInfo = this.uiElement.querySelector('.tool-info');
    const parametersForm = this.uiElement.querySelector('.tool-parameters-form') as HTMLElement;

    if (toolInfo) {
      const toolName = toolInfo.querySelector('.tool-name');
      const toolDescription = toolInfo.querySelector('.tool-description');
      
      if (toolName) toolName.textContent = tool.name;
      if (toolDescription) toolDescription.textContent = tool.description;
    }

    if (parametersForm) {
      parametersForm.innerHTML = this.renderParametersForm(tool.parameters);
      this.bindParameterEvents(parametersForm);
    }

    parametersSection.style.display = 'block';
    
    // 도구 선택 섹션 숨기기
    const selectionSection = this.uiElement.querySelector('.tool-selection-section') as HTMLElement;
    if (selectionSection) {
      selectionSection.style.display = 'none';
    }
  }

  /**
   * 매개변수 폼 렌더링
   */
  private renderParametersForm(parameters: ToolParameter[]): string {
    return parameters.map(param => {
      let inputHtml = '';
      
      switch (param.type) {
        case 'string':
          inputHtml = `<input type="text" name="${param.name}" placeholder="${param.description}" ${param.required ? 'required' : ''} ${param.default ? `value="${param.default}"` : ''}>`;
          break;
        case 'number':
          inputHtml = `<input type="number" name="${param.name}" placeholder="${param.description}" ${param.required ? 'required' : ''} ${param.default ? `value="${param.default}"` : ''}>`;
          break;
        case 'boolean':
          inputHtml = `<input type="checkbox" name="${param.name}" ${param.default ? 'checked' : ''}>`;
          break;
        case 'select':
          const options = param.options?.map(option => `<option value="${option}">${option}</option>`).join('') || '';
          inputHtml = `<select name="${param.name}" ${param.required ? 'required' : ''}>${options}</select>`;
          break;
      }

      return `
        <div class="parameter-group">
          <label class="parameter-label">
            ${param.name} ${param.required ? '<span class="required">*</span>' : ''}
          </label>
          <div class="parameter-input">
            ${inputHtml}
          </div>
          <div class="parameter-description">${param.description}</div>
        </div>
      `;
    }).join('');
  }

  /**
   * 매개변수 이벤트 바인딩
   */
  private bindParameterEvents(form: HTMLElement): void {
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
      input.addEventListener('change', (event) => {
        const target = event.target as HTMLInputElement;
        const name = target.name;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        
        if (this.currentToolCall) {
          this.currentToolCall.parameters[name] = value;
        }
      });
    });
  }

  /**
   * 도구 실행
   */
  private async executeTool(): Promise<void> {
    if (!this.currentToolCall) return;

    this.showResultsSection();
    this.updateExecutionStatus('실행 중...', 'loading');

    try {
      const startTime = performance.now();
      
      // 실제 도구 호출 (AgentManager를 통해)
      const result = await this.callTool(this.currentToolCall.tool.name, this.currentToolCall.parameters);
      
      const executionTime = performance.now() - startTime;
      
      this.updateExecutionStatus('완료', 'success');
      this.displayResults(result, executionTime);
      
    } catch (error) {
      console.error('도구 실행 오류:', error);
      this.updateExecutionStatus('실패', 'error');
      this.displayError(error as string);
    }
  }

  /**
   * 실제 도구 호출
   */
  private async callTool(toolName: string, parameters: any): Promise<any> {
    // AgentManager를 통한 도구 호출
    if (window.agentManager) {
      return await window.agentManager.executeTool(toolName, parameters);
    } else {
      // 임시 구현 (실제로는 AgentManager 사용)
      return await this.mockToolCall(toolName, parameters);
    }
  }

  /**
   * 임시 도구 호출 구현
   */
  private async mockToolCall(toolName: string, parameters: any): Promise<any> {
    // 실제 구현에서는 AgentManager를 통해 호출
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 지연
    
    switch (toolName) {
      case 'web_search':
        return {
          success: true,
          data: {
            results: [
              { title: '검색 결과 1', url: 'https://example.com/1', snippet: '검색 결과에 대한 설명...' },
              { title: '검색 결과 2', url: 'https://example.com/2', snippet: '다른 검색 결과...' }
            ]
          }
        };
      case 'calculator':
        try {
          const result = eval(parameters.expression);
          return {
            success: true,
            data: { result: result }
          };
        } catch (error) {
          return {
            success: false,
            error: '계산 오류: ' + error
          };
        }
      case 'translator':
        return {
          success: true,
          data: {
            original: parameters.text,
            translated: `[${parameters.target_language}] ${parameters.text}`,
            target_language: parameters.target_language
          }
        };
      default:
        return {
          success: true,
          data: { message: `${toolName} 도구가 실행되었습니다.`, parameters }
        };
    }
  }

  /**
   * 결과 섹션 표시
   */
  private showResultsSection(): void {
    if (!this.uiElement) return;

    const resultsSection = this.uiElement.querySelector('.tool-results-section') as HTMLElement;
    resultsSection.style.display = 'block';
    
    // 매개변수 섹션 숨기기
    const parametersSection = this.uiElement.querySelector('.tool-parameters-section') as HTMLElement;
    if (parametersSection) {
      parametersSection.style.display = 'none';
    }
  }

  /**
   * 실행 상태 업데이트
   */
  private updateExecutionStatus(message: string, status: 'loading' | 'success' | 'error'): void {
    if (!this.uiElement) return;

    const statusIndicator = this.uiElement.querySelector('.status-indicator');
    if (statusIndicator) {
      const icon = statusIndicator.querySelector('i');
      const text = statusIndicator.querySelector('span');
      
      if (icon) {
        icon.className = status === 'loading' ? 'fas fa-spinner fa-spin' : 
                        status === 'success' ? 'fas fa-check' : 'fas fa-times';
      }
      
      if (text) {
        text.textContent = message;
      }
      
      statusIndicator.className = `status-indicator ${status}`;
    }
  }

  /**
   * 결과 표시
   */
  private displayResults(result: any, executionTime: number): void {
    if (!this.uiElement) return;

    const resultsContent = this.uiElement.querySelector('.tool-results-content');
    if (!resultsContent) return;

    let resultHtml = '';
    
    if (result.success) {
      resultHtml = this.formatResults(result.data);
    } else {
      resultHtml = `<div class="error-message">${result.error}</div>`;
    }

    resultHtml += `<div class="execution-time">실행 시간: ${executionTime.toFixed(2)}ms</div>`;
    
    resultsContent.innerHTML = resultHtml;
  }

  /**
   * 오류 표시
   */
  private displayError(error: string): void {
    if (!this.uiElement) return;

    const resultsContent = this.uiElement.querySelector('.tool-results-content');
    if (resultsContent) {
      resultsContent.innerHTML = `<div class="error-message">오류: ${error}</div>`;
    }
  }

  /**
   * 결과 포맷팅
   */
  private formatResults(data: any): string {
    if (typeof data === 'string') {
      return `<div class="result-text">${data}</div>`;
    }
    
    if (Array.isArray(data)) {
      return `<div class="result-list">${data.map(item => `<div class="result-item">${JSON.stringify(item)}</div>`).join('')}</div>`;
    }
    
    if (typeof data === 'object') {
      return `<div class="result-object"><pre>${JSON.stringify(data, null, 2)}</pre></div>`;
    }
    
    return `<div class="result-text">${String(data)}</div>`;
  }

  /**
   * 도구 실행 취소
   */
  private cancelToolExecution(): void {
    this.resetToolCall();
  }

  /**
   * 결과 복사
   */
  private copyResults(): void {
    if (!this.uiElement) return;

    const resultsContent = this.uiElement.querySelector('.tool-results-content');
    if (!resultsContent) return;

    const text = resultsContent.textContent || '';
    navigator.clipboard.writeText(text).then(() => {
      // 복사 완료 알림
      if (window.showNotification) {
        window.showNotification('결과가 클립보드에 복사되었습니다.', 'success');
      }
    }).catch(err => {
      console.error('복사 실패:', err);
    });
  }

  /**
   * 도구 호출 리셋
   */
  private resetToolCall(): void {
    this.currentToolCall = null;
    this.showToolSelection();
  }

  /**
   * 도구 선택 섹션 표시
   */
  private showToolSelection(): void {
    if (!this.uiElement) return;

    const selectionSection = this.uiElement.querySelector('.tool-selection-section') as HTMLElement;
    const parametersSection = this.uiElement.querySelector('.tool-parameters-section') as HTMLElement;
    const resultsSection = this.uiElement.querySelector('.tool-results-section') as HTMLElement;

    if (selectionSection) selectionSection.style.display = 'block';
    if (parametersSection) parametersSection.style.display = 'none';
    if (resultsSection) resultsSection.style.display = 'none';
  }

  /**
   * UI 표시
   */
  show(): void {
    if (this.uiElement) {
      this.uiElement.style.display = 'block';
      this.isVisible = true;
    }
  }

  /**
   * UI 숨기기
   */
  hide(): void {
    if (this.uiElement) {
      this.uiElement.style.display = 'none';
      this.isVisible = false;
    }
  }

  /**
   * UI 토글
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * UI 정리
   */
  dispose(): void {
    if (this.uiElement) {
      this.uiElement.remove();
      this.uiElement = null;
    }
  }
} 