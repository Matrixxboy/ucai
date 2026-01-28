from pydantic import BaseModel
from typing import List, Optional

class ChatMessage(BaseModel):
    system_prompt: Optional[str] = None
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    max_tokens: Optional[int] = 512
    temperature: Optional[float] = 0.7
    web_search: Optional[bool] = False
    session_id: Optional[str] = "default_session"