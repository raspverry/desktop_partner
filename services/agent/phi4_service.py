"""
Phi-4-mini 4bit 양자화 서비스
Microsoft의 Phi-4-mini 모델을 4bit 양자화하여 실행
"""

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import logging
from typing import Optional, Dict, Any
import asyncio
from concurrent.futures import ThreadPoolExecutor

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Phi4MiniService:
    """Phi-4-mini 4bit 양자화 서비스"""
    
    def __init__(self):
        self.model_name = "microsoft/Phi-4-mini"
        self.tokenizer: Optional[AutoTokenizer] = None
        self.model: Optional[AutoModelForCausalLM] = None
        self.executor = ThreadPoolExecutor(max_workers=1)
        self.is_initialized = False
        
    async def initialize(self):
        """모델 초기화"""
        if self.is_initialized:
            return
            
        try:
            logger.info("Phi-4-mini 모델 로딩 시작...")
            
            # 토크나이저 로드
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.model_name,
                trust_remote_code=True
            )
            
            # 패딩 토큰 설정
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            
            # 4bit 양자화 모델 로드
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.float16,
                bnb_4bit_use_double_quant=True,
                bnb_4bit_quant_type="nf4",
                device_map="auto",
                torch_dtype=torch.float16,
                trust_remote_code=True
            )
            
            self.is_initialized = True
            logger.info("Phi-4-mini 4bit 모델 로딩 완료")
            
        except Exception as e:
            logger.error(f"모델 로딩 실패: {e}")
            raise
    
    async def generate_response(self, prompt: str, max_length: int = 512, temperature: float = 0.7) -> str:
        """응답 생성"""
        if not self.is_initialized:
            await self.initialize()
        
        try:
            # 비동기 실행을 위한 루프에서 실행
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                self.executor,
                self._generate_sync,
                prompt,
                max_length,
                temperature
            )
            return result
            
        except Exception as e:
            logger.error(f"응답 생성 실패: {e}")
            return f"죄송합니다. 오류가 발생했습니다: {str(e)}"
    
    def _generate_sync(self, prompt: str, max_length: int, temperature: float) -> str:
        """동기 응답 생성"""
        try:
            # 입력 토큰화
            inputs = self.tokenizer(
                prompt,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=max_length
            )
            
            # GPU로 이동 (가능한 경우)
            if torch.cuda.is_available():
                inputs = {k: v.cuda() for k, v in inputs.items()}
            
            # 생성
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_length=max_length,
                    temperature=temperature,
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id,
                    eos_token_id=self.tokenizer.eos_token_id,
                    repetition_penalty=1.1
                )
            
            # 디코딩
            generated_text = self.tokenizer.decode(
                outputs[0],
                skip_special_tokens=True
            )
            
            # 원본 프롬프트 제거
            if generated_text.startswith(prompt):
                generated_text = generated_text[len(prompt):].strip()
            
            return generated_text
            
        except Exception as e:
            logger.error(f"동기 생성 실패: {e}")
            raise
    
    async def classify_prompt(self, user_input: str) -> str:
        """프롬프트 분류 (간단/복잡/도구)"""
        classification_prompt = f"""
다음 입력을 분류해주세요. 'simple', 'complex', 'tool' 중 하나로 답하세요.

입력: {user_input}

분류:"""
        
        result = await self.generate_response(classification_prompt, max_length=100, temperature=0.3)
        
        # 결과 파싱
        result = result.strip().lower()
        if 'simple' in result:
            return 'simple'
        elif 'complex' in result:
            return 'complex'
        elif 'tool' in result:
            return 'tool'
        else:
            return 'simple'  # 기본값
    
    async def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """감정 분석"""
        sentiment_prompt = f"""
다음 텍스트의 감정을 분석해주세요. 'positive', 'negative', 'neutral' 중 하나로 답하고, 신뢰도 점수(0-1)도 함께 제공해주세요.

텍스트: {text}

분석:"""
        
        result = await self.generate_response(sentiment_prompt, max_length=150, temperature=0.3)
        
        # 결과 파싱
        result = result.strip().lower()
        if 'positive' in result:
            emotion = 'positive'
        elif 'negative' in result:
            emotion = 'negative'
        else:
            emotion = 'neutral'
        
        # 신뢰도 점수 추출 (간단한 추정)
        confidence = 0.8  # 기본값
        
        return {
            'emotion': emotion,
            'confidence': confidence,
            'text': text
        }
    
    def get_model_info(self) -> Dict[str, Any]:
        """모델 정보 반환"""
        return {
            'model_name': self.model_name,
            'is_initialized': self.is_initialized,
            'quantization': '4bit',
            'device': 'cuda' if torch.cuda.is_available() else 'cpu',
            'memory_usage': self._get_memory_usage()
        }
    
    def _get_memory_usage(self) -> float:
        """메모리 사용량 반환 (GB)"""
        if torch.cuda.is_available():
            return torch.cuda.memory_allocated() / 1024**3
        return 0.0
    
    async def cleanup(self):
        """리소스 정리"""
        if self.model:
            del self.model
        if self.tokenizer:
            del self.tokenizer
        torch.cuda.empty_cache() if torch.cuda.is_available() else None
        self.executor.shutdown(wait=True)

# 전역 인스턴스
phi4_service = Phi4MiniService() 