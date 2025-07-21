import os
import asyncio
import json
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
from dotenv import load_dotenv
import logging
from phi4_service import phi4_service

load_dotenv()

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Partner Agent Service", version="1.0.0")

# API 클라이언트들
openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
anthropic_client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# 메모리 서비스 URL
MEMORY_SERVICE_URL = os.getenv("MEMORY_SERVICE_URL", "http://localhost:8001")

# Pydantic 모델들
class AgentRequest(BaseModel):
    user_message: str
    user_id: str
    context: Optional[Dict[str, Any]] = None
    emotion: Optional[str] = None

class AgentResponse(BaseModel):
    response: str
    emotion: str
    confidence: float
    memory_used: List[Dict[str, Any]]

class AgentConfig(BaseModel):
    model: str = "gpt-4"
    temperature: float = 0.7
    max_tokens: int = 500
    memory_limit: int = 5

class ConversationMessage(BaseModel):
    role: str
    content: str

class GenerateRequest(BaseModel):
    messages: List[ConversationMessage]
    max_length: Optional[int] = 512
    temperature: Optional[float] = 0.7

class GenerateResponse(BaseModel):
    response: str
    model_info: Dict[str, Any]

class SentimentRequest(BaseModel):
    text: str

class SentimentResponse(BaseModel):
    emotion: str
    confidence: float
    text: str

class ClassificationRequest(BaseModel):
    text: str

class ClassificationResponse(BaseModel):
    classification: str
    confidence: float

# 에이전트 설정
DEFAULT_AGENT_CONFIG = AgentConfig()

@app.on_event("startup")
async def startup_event():
    """서비스 시작 시 Phi-4-mini 모델 초기화"""
    try:
        logger.info("Phi-4-mini 4bit 모델 초기화 시작...")
        await phi4_service.initialize()
        logger.info("Phi-4-mini 4bit 모델 초기화 완료")
    except Exception as e:
        logger.error(f"모델 초기화 실패: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """서비스 종료 시 리소스 정리"""
    await phi4_service.cleanup()

async def get_relevant_memories(user_id: str, query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """관련 메모리 검색"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{MEMORY_SERVICE_URL}/memory/search",
                json={
                    "query": query,
                    "limit": limit,
                    "user_id": user_id
                }
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("memories", [])
            return []
    except Exception as e:
        print(f"메모리 검색 실패: {e}")
        return []

async def store_conversation(user_id: str, user_message: str, ai_response: str, emotion: str):
    """대화 저장"""
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{MEMORY_SERVICE_URL}/conversation/store",
                json={
                    "id": f"conv_{int(asyncio.get_event_loop().time())}",
                    "user_message": user_message,
                    "ai_response": ai_response,
                    "emotion": emotion,
                    "timestamp": asyncio.get_event_loop().time(),
                    "user_id": user_id
                }
            )
    except Exception as e:
        print(f"대화 저장 실패: {e}")

async def generate_response_with_memory(
    user_message: str, 
    memories: List[Dict[str, Any]], 
    config: AgentConfig
) -> Dict[str, Any]:
    """메모리를 활용한 응답 생성"""
    
    # 메모리 컨텍스트 구성
    memory_context = ""
    if memories:
        memory_context = "\n\n관련 기억:\n"
        for memory in memories:
            memory_context += f"- {memory['content']}\n"
    
    # 시스템 프롬프트 구성
    system_prompt = f"""당신은 사용자의 AI 파트너입니다. 사용자와의 대화를 통해 관계를 발전시키고, 
사용자의 기억과 선호도를 학습하여 개인화된 응답을 제공합니다.

{memory_context}

사용자의 메시지에 대해 친근하고 공감적인 응답을 제공하세요. 
감정적 지지와 격려를 포함하여 사용자가 편안함을 느낄 수 있도록 하세요.
한국어로 응답하세요."""

    try:
        if config.model.startswith("gpt"):
            response = await openai_client.chat.completions.create(
                model=config.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=config.temperature,
                max_tokens=config.max_tokens
            )
            ai_response = response.choices[0].message.content
        elif config.model.startswith("claude"):
            response = await anthropic_client.messages.create(
                model=config.model,
                max_tokens=config.max_tokens,
                temperature=config.temperature,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}]
            )
            ai_response = response.content[0].text
        else:
            raise ValueError(f"지원하지 않는 모델: {config.model}")
        
        # 감정 분석 (간단한 키워드 기반)
        emotion_keywords = {
            "happy": ["기쁘", "좋", "행복", "즐거", "웃"],
            "sad": ["슬프", "우울", "힘들", "아프", "눈물"],
            "angry": ["화나", "분노", "짜증", "열받", "싫"],
            "excited": ["신나", "설렘", "기대", "재미", "멋"]
        }
        
        detected_emotion = "neutral"
        for emotion, keywords in emotion_keywords.items():
            if any(keyword in ai_response for keyword in keywords):
                detected_emotion = emotion
                break
        
        return {
            "response": ai_response,
            "emotion": detected_emotion,
            "confidence": 0.8
        }
        
    except Exception as e:
        print(f"응답 생성 실패: {e}")
        return {
            "response": "죄송합니다. 응답을 생성하는 중에 문제가 발생했습니다.",
            "emotion": "neutral",
            "confidence": 0.5
        }

@app.post("/agent/chat", response_model=AgentResponse)
async def chat_with_agent(request: AgentRequest):
    """에이전트와 대화"""
    try:
        # 관련 메모리 검색
        memories = await get_relevant_memories(
            request.user_id, 
            request.user_message, 
            DEFAULT_AGENT_CONFIG.memory_limit
        )
        
        # 응답 생성
        result = await generate_response_with_memory(
            request.user_message,
            memories,
            DEFAULT_AGENT_CONFIG
        )
        
        # 대화 저장
        await store_conversation(
            request.user_id,
            request.user_message,
            result["response"],
            result["emotion"]
        )
        
        return AgentResponse(
            response=result["response"],
            emotion=result["emotion"],
            confidence=result["confidence"],
            memory_used=memories
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"에이전트 대화 실패: {str(e)}")

@app.post("/agent/emotion-analysis")
async def analyze_emotion(text: str):
    """감정 분석"""
    try:
        # 간단한 키워드 기반 감정 분석
        emotion_keywords = {
            "happy": ["기쁘", "좋", "행복", "즐거", "웃", "신나"],
            "sad": ["슬프", "우울", "힘들", "아프", "눈물", "외로"],
            "angry": ["화나", "분노", "짜증", "열받", "싫", "열"],
            "excited": ["신나", "설렘", "기대", "재미", "멋", "최고"],
            "neutral": ["보통", "그냥", "일반", "평범"]
        }
        
        detected_emotion = "neutral"
        confidence = 0.5
        
        for emotion, keywords in emotion_keywords.items():
            if any(keyword in text for keyword in keywords):
                detected_emotion = emotion
                confidence = 0.8
                break
        
        return {
            "emotion": detected_emotion,
            "confidence": confidence,
            "intensity": 0.7
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"감정 분석 실패: {str(e)}")

@app.get("/agent/config")
async def get_agent_config():
    """에이전트 설정 조회"""
    return DEFAULT_AGENT_CONFIG

@app.put("/agent/config")
async def update_agent_config(config: AgentConfig):
    """에이전트 설정 업데이트"""
    global DEFAULT_AGENT_CONFIG
    DEFAULT_AGENT_CONFIG = config
    return {"status": "success", "message": "설정이 업데이트되었습니다."}

@app.get("/health")
async def health_check():
    """헬스 체크"""
    return {"status": "healthy", "service": "agent"}

@app.post("/phi4-mini/generate", response_model=GenerateResponse)
async def generate_response(request: GenerateRequest):
    """Phi-4-mini를 사용한 응답 생성"""
    try:
        # 메시지를 프롬프트로 변환
        prompt = format_messages_to_prompt(request.messages)
        
        # 응답 생성
        response = await phi4_service.generate_response(
            prompt=prompt,
            max_length=request.max_length,
            temperature=request.temperature
        )
        
        return GenerateResponse(
            response=response,
            model_info=phi4_service.get_model_info()
        )
        
    except Exception as e:
        logger.error(f"응답 생성 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/phi4-mini/sentiment", response_model=SentimentResponse)
async def analyze_sentiment(request: SentimentRequest):
    """감정 분석"""
    try:
        result = await phi4_service.analyze_sentiment(request.text)
        return SentimentResponse(**result)
        
    except Exception as e:
        logger.error(f"감정 분석 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/phi4-mini/classify", response_model=ClassificationResponse)
async def classify_prompt(request: ClassificationRequest):
    """프롬프트 분류"""
    try:
        classification = await phi4_service.classify_prompt(request.text)
        return ClassificationResponse(
            classification=classification,
            confidence=0.8  # 기본 신뢰도
        )
        
    except Exception as e:
        logger.error(f"프롬프트 분류 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/phi4-mini/info")
async def get_model_info():
    """모델 정보 조회"""
    return phi4_service.get_model_info()

def format_messages_to_prompt(messages: List[ConversationMessage]) -> str:
    """대화 메시지를 프롬프트로 변환"""
    prompt = ""
    for message in messages:
        if message.role == "system":
            prompt += f"시스템: {message.content}\n"
        elif message.role == "user":
            prompt += f"사용자: {message.content}\n"
        elif message.role == "assistant":
            prompt += f"어시스턴트: {message.content}\n"
    
    prompt += "어시스턴트: "
    return prompt

# 기존 엔드포인트들 (하위 호환성 유지)
@app.post("/tool")
async def run_tool(request: Dict[str, Any]):
    """도구 실행 (기존 API)"""
    try:
        # Phi-4-mini를 사용한 도구 실행
        tool_prompt = f"다음 도구를 실행해주세요: {request.get('command', '')}"
        response = await phi4_service.generate_response(tool_prompt, max_length=256)
        
        return {
            "success": True,
            "result": response,
            "model": "phi4-mini-4bit"
        }
        
    except Exception as e:
        logger.error(f"도구 실행 실패: {e}")
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002) 