from pydantic import BaseModel
from typing import Optional

class SettingsUpdate(BaseModel):
    model_path: str
    n_ctx: Optional[int] = 2048
    n_gpu_layers: Optional[int] = 0
    verbose: Optional[bool] = True
    system_prompt: Optional[str] = None
    rag_enabled: Optional[bool] = True