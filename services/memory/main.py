import os
import asyncio
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import numpy as np
from sentence_transformers import SentenceTransformer
import httpx
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AI Partner Memory Service", version="1.0.0")

# 모델 초기화
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

# Qdrant 클라이언트
qdrant_client = QdrantClient(
    host=os.getenv("QDRANT_HOST", "localhost"),
    port=int(os.getenv("QDRANT_PORT", 6333))
)

# 컬렉션 이름
MEMORY_COLLECTION = "ai_partner_memory"
CONVERSATION_COLLECTION = "conversations"

# Pydantic 모델들
class MemoryItem(BaseModel):
    id: str
    content: str
    metadata: Dict[str, Any]
    timestamp: float
    user_id: str

class ConversationItem(BaseModel):
    id: str
    user_message: str
    ai_response: str
    emotion: str
    timestamp: float
    user_id: str

class SearchRequest(BaseModel):
    query: str
    limit: int = 10
    user_id: str

class MemoryResponse(BaseModel):
    memories: List[Dict[str, Any]]
    total: int

@app.on_event("startup")
async def startup_event():
    """서비스 시작 시 초기화"""
    try:
        # 메모리 컬렉션 생성
        qdrant_client.recreate_collection(
            collection_name=MEMORY_COLLECTION,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE)
        )
        
        # 대화 컬렉션 생성
        qdrant_client.recreate_collection(
            collection_name=CONVERSATION_COLLECTION,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE)
        )
        
        print("메모리 서비스가 시작되었습니다.")
    except Exception as e:
        print(f"초기화 오류: {e}")

@app.post("/memory/store", response_model=Dict[str, str])
async def store_memory(memory: MemoryItem):
    """메모리 저장"""
    try:
        # 텍스트를 벡터로 변환
        embedding = embedding_model.encode(memory.content)
        
        # Qdrant에 저장
        point = PointStruct(
            id=memory.id,
            vector=embedding.tolist(),
            payload={
                "content": memory.content,
                "metadata": memory.metadata,
                "timestamp": memory.timestamp,
                "user_id": memory.user_id
            }
        )
        
        qdrant_client.upsert(
            collection_name=MEMORY_COLLECTION,
            points=[point]
        )
        
        return {"status": "success", "message": "메모리가 저장되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"메모리 저장 실패: {str(e)}")

@app.post("/memory/search", response_model=MemoryResponse)
async def search_memory(request: SearchRequest):
    """메모리 검색"""
    try:
        # 쿼리를 벡터로 변환
        query_embedding = embedding_model.encode(request.query)
        
        # 유사도 검색
        search_result = qdrant_client.search(
            collection_name=MEMORY_COLLECTION,
            query_vector=query_embedding.tolist(),
            limit=request.limit,
            query_filter={"must": [{"key": "user_id", "match": {"value": request.user_id}}]}
        )
        
        memories = []
        for result in search_result:
            memories.append({
                "id": result.id,
                "content": result.payload["content"],
                "metadata": result.payload["metadata"],
                "timestamp": result.payload["timestamp"],
                "score": result.score
            })
        
        return MemoryResponse(memories=memories, total=len(memories))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"메모리 검색 실패: {str(e)}")

@app.post("/conversation/store")
async def store_conversation(conversation: ConversationItem):
    """대화 저장"""
    try:
        # 사용자 메시지와 AI 응답을 결합하여 벡터 생성
        combined_text = f"User: {conversation.user_message} AI: {conversation.ai_response}"
        embedding = embedding_model.encode(combined_text)
        
        point = PointStruct(
            id=conversation.id,
            vector=embedding.tolist(),
            payload={
                "user_message": conversation.user_message,
                "ai_response": conversation.ai_response,
                "emotion": conversation.emotion,
                "timestamp": conversation.timestamp,
                "user_id": conversation.user_id
            }
        )
        
        qdrant_client.upsert(
            collection_name=CONVERSATION_COLLECTION,
            points=[point]
        )
        
        return {"status": "success", "message": "대화가 저장되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"대화 저장 실패: {str(e)}")

@app.get("/memory/stats/{user_id}")
async def get_memory_stats(user_id: str):
    """사용자별 메모리 통계"""
    try:
        # 메모리 개수
        memory_count = qdrant_client.count(
            collection_name=MEMORY_COLLECTION,
            query_filter={"must": [{"key": "user_id", "match": {"value": user_id}}]}
        )
        
        # 대화 개수
        conversation_count = qdrant_client.count(
            collection_name=CONVERSATION_COLLECTION,
            query_filter={"must": [{"key": "user_id", "match": {"value": user_id}}]}
        )
        
        return {
            "memory_count": memory_count.count,
            "conversation_count": conversation_count.count,
            "total_items": memory_count.count + conversation_count.count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"통계 조회 실패: {str(e)}")

@app.delete("/memory/{memory_id}")
async def delete_memory(memory_id: str):
    """메모리 삭제"""
    try:
        qdrant_client.delete(
            collection_name=MEMORY_COLLECTION,
            points_selector=[memory_id]
        )
        return {"status": "success", "message": "메모리가 삭제되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"메모리 삭제 실패: {str(e)}")

@app.get("/health")
async def health_check():
    """헬스 체크"""
    return {"status": "healthy", "service": "memory"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 