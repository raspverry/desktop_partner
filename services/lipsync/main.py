import os
import asyncio
import json
import subprocess
import tempfile
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
import numpy as np
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AI Partner Lipsync Service", version="1.0.0")

# Viseme 매핑 (VRM BlendShape 기준)
VISEME_MAPPING = {
    'A': 'Ah',      # 아
    'B': 'Ch',      # 치
    'C': 'Dd',      # 드
    'D': 'E',       # 에
    'E': 'Eh',      # 에
    'F': 'Ff',      # 프
    'G': 'I',       # 이
    'H': 'O',       # 오
    'X': 'Oh',      # 오
    'I': 'I',       # 이
    'J': 'Ch',      # 치
    'K': 'Kk',      # 크
    'L': 'L',       # 루
    'M': 'M',       # 음
    'N': 'N',       # 느
    'O': 'O',       # 오
    'P': 'Pp',      # 프
    'Q': 'Kk',      # 크
    'R': 'Rr',      # 루
    'S': 'S',       # 스
    'T': 'T',       # 트
    'U': 'U',       # 우
    'V': 'Vv',      # 브
    'W': 'W',       # 우
    'Y': 'I',       # 이
    'Z': 'S'        # 스
}

# 한국어 음소-영어 Viseme 매핑
KOREAN_PHONEME_MAPPING = {
    'ㅏ': 'A', 'ㅑ': 'A', 'ㅓ': 'O', 'ㅕ': 'O',
    'ㅗ': 'O', 'ㅛ': 'O', 'ㅜ': 'U', 'ㅠ': 'U',
    'ㅡ': 'U', 'ㅣ': 'I', 'ㅐ': 'A', 'ㅒ': 'A',
    'ㅔ': 'E', 'ㅖ': 'E', 'ㅚ': 'O', 'ㅟ': 'U',
    'ㅢ': 'U', 'ㅘ': 'A', 'ㅙ': 'A', 'ㅝ': 'U',
    'ㅞ': 'U', 'ㅟ': 'U', 'ㅢ': 'U',
    'ㄱ': 'K', 'ㄴ': 'N', 'ㄷ': 'T', 'ㄹ': 'L',
    'ㅁ': 'M', 'ㅂ': 'B', 'ㅅ': 'S', 'ㅇ': 'N',
    'ㅈ': 'J', 'ㅊ': 'C', 'ㅋ': 'K', 'ㅌ': 'T',
    'ㅍ': 'P', 'ㅎ': 'H', 'ㄲ': 'K', 'ㄸ': 'T',
    'ㅃ': 'B', 'ㅆ': 'S', 'ㅉ': 'J'
}

class LipsyncRequest(BaseModel):
    text: str
    language: str = "ko"
    duration: float = 3.0
    user_id: str = "default"

class LipsyncResponse(BaseModel):
    success: bool
    visemes: List[Dict[str, Any]]
    duration: float
    message: str

class AudioAnalysisRequest(BaseModel):
    audio_data: bytes
    sample_rate: int = 16000
    user_id: str = "default"

@app.on_event("startup")
async def startup_event():
    """서비스 시작 시 초기화"""
    print("립싱크 서비스가 시작되었습니다.")

@app.post("/lipsync/generate", response_model=LipsyncResponse)
async def generate_lipsync(request: LipsyncRequest):
    """텍스트 기반 립싱크 생성"""
    try:
        # 텍스트를 음소로 분해
        phonemes = text_to_phonemes(request.text, request.language)
        
        # 음소를 Viseme으로 변환
        visemes = phonemes_to_visemes(phonemes, request.duration)
        
        return LipsyncResponse(
            success=True,
            visemes=visemes,
            duration=request.duration,
            message="립싱크 생성 완료"
        )
    except Exception as e:
        return LipsyncResponse(
            success=False,
            visemes=[],
            duration=0.0,
            message=f"립싱크 생성 실패: {str(e)}"
        )

@app.post("/lipsync/analyze-audio", response_model=LipsyncResponse)
async def analyze_audio_lipsync(request: AudioAnalysisRequest):
    """오디오 기반 립싱크 분석"""
    try:
        # 오디오 데이터를 임시 파일로 저장
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            temp_file.write(request.audio_data)
            temp_file_path = temp_file.name
        
        # Rhubarb Lipsync 실행
        visemes = await run_rhubarb_lipsync(temp_file_path)
        
        # 임시 파일 삭제
        os.unlink(temp_file_path)
        
        return LipsyncResponse(
            success=True,
            visemes=visemes,
            duration=len(visemes) * 0.1,  # 100ms per viseme
            message="오디오 립싱크 분석 완료"
        )
    except Exception as e:
        return LipsyncResponse(
            success=False,
            visemes=[],
            duration=0.0,
            message=f"오디오 립싱크 분석 실패: {str(e)}"
        )

def text_to_phonemes(text: str, language: str) -> List[str]:
    """텍스트를 음소로 분해"""
    if language == "ko":
        return korean_text_to_phonemes(text)
    else:
        return english_text_to_phonemes(text)

def korean_text_to_phonemes(text: str) -> List[str]:
    """한국어 텍스트를 음소로 분해"""
    phonemes = []
    
    for char in text:
        if '\uAC00' <= char <= '\uD7AF':  # 한글 유니코드 범위
            # 한글 자모 분해
            code = ord(char) - 0xAC00
            jong = code % 28
            jung = (code // 28) % 21
            cho = code // 28 // 21
            
            # 초성 매핑
            if cho > 0:
                cho_list = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
                phonemes.append(cho_list[cho])
            
            # 중성 매핑
            if jung > 0:
                jung_list = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ']
                phonemes.append(jung_list[jung])
            
            # 종성 매핑
            if jong > 0:
                jong_list = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
                if jong < len(jong_list):
                    phonemes.append(jong_list[jong])
        else:
            # 영문자나 기타 문자
            phonemes.append(char.lower())
    
    return phonemes

def english_text_to_phonemes(text: str) -> List[str]:
    """영어 텍스트를 음소로 분해 (간단한 버전)"""
    # 간단한 영어 음소 분해
    phonemes = []
    text = text.lower()
    
    for char in text:
        if char.isalpha():
            phonemes.append(char)
        elif char.isspace():
            phonemes.append(' ')
    
    return phonemes

def phonemes_to_visemes(phonemes: List[str], duration: float) -> List[Dict[str, Any]]:
    """음소를 Viseme으로 변환"""
    visemes = []
    time_per_phoneme = duration / len(phonemes) if phonemes else 0.1
    
    for i, phoneme in enumerate(phonemes):
        if phoneme in KOREAN_PHONEME_MAPPING:
            viseme_code = KOREAN_PHONEME_MAPPING[phoneme]
            if viseme_code in VISEME_MAPPING:
                viseme_name = VISEME_MAPPING[viseme_code]
                
                visemes.append({
                    "time": i * time_per_phoneme,
                    "duration": time_per_phoneme,
                    "viseme": viseme_name,
                    "phoneme": phoneme,
                    "intensity": 1.0
                })
        else:
            # 기본 Viseme
            visemes.append({
                "time": i * time_per_phoneme,
                "duration": time_per_phoneme,
                "viseme": "Neutral",
                "phoneme": phoneme,
                "intensity": 0.5
            })
    
    return visemes

async def run_rhubarb_lipsync(audio_file_path: str) -> List[Dict[str, Any]]:
    """Rhubarb Lipsync 실행"""
    try:
        # Rhubarb Lipsync 명령어 실행
        result = subprocess.run([
            "rhubarb", "-f", "json", audio_file_path
        ], capture_output=True, text=True)
        
        if result.returncode != 0:
            raise Exception(f"Rhubarb 실행 실패: {result.stderr}")
        
        # JSON 결과 파싱
        lipsync_data = json.loads(result.stdout)
        visemes = []
        
        for mouth_cue in lipsync_data.get("mouthCues", []):
            visemes.append({
                "time": mouth_cue["start"],
                "duration": mouth_cue["end"] - mouth_cue["start"],
                "viseme": mouth_cue["value"],
                "phoneme": mouth_cue["value"],
                "intensity": 1.0
            })
        
        return visemes
    except Exception as e:
        print(f"Rhubarb Lipsync 오류: {e}")
        # 폴백: 기본 Viseme 시퀀스
        return generate_fallback_visemes()

def generate_fallback_visemes() -> List[Dict[str, Any]]:
    """기본 Viseme 시퀀스 생성"""
    return [
        {"time": 0.0, "duration": 0.1, "viseme": "Neutral", "phoneme": "silence", "intensity": 0.5},
        {"time": 0.1, "duration": 0.1, "viseme": "Ah", "phoneme": "a", "intensity": 1.0},
        {"time": 0.2, "duration": 0.1, "viseme": "Neutral", "phoneme": "silence", "intensity": 0.5}
    ]

@app.get("/health")
async def health_check():
    """헬스 체크"""
    return {"status": "healthy", "service": "lipsync"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003) 