from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import List, Optional, Dict, Any

from Services.llm_service import llm_service
from Services.memory_service import memory_service
from Utils.Res.response_helper import make_response
from Utils.Res.http_status import HTTPStatusCode, APICode
from Static.prompt import system_prompt

from Models.Settings import SettingsUpdate
from Models.Chat import ChatRequest
from Models.model import DownloadRequest
router = APIRouter()


@router.get("/settings")
def get_settings():
    return make_response(
        status=HTTPStatusCode.OK,
        code=APICode.OK,
        message="Settings retrieved",
        data=llm_service.get_model_status()
    )

@router.post("/settings/update")
def update_settings(settings: SettingsUpdate):
    try:
        success = llm_service.load_model(
            model_path=settings.model_path,
            config={
                "n_ctx": settings.n_ctx,
                "n_gpu_layers": settings.n_gpu_layers,
                "verbose": settings.verbose
            }
        )
        return make_response(
            status=HTTPStatusCode.OK,
            code=APICode.OK,
            message="Model loaded successfully",
            data=llm_service.get_model_status()
        )
    except Exception as e:
        return make_response(
            status=HTTPStatusCode.BAD_REQUEST,
            code=APICode.ERROR,
            message=f"Failed to load model: {str(e)}"
        )

@router.post("/chat")
async def chat(request: ChatRequest):
    try:
        # 1. Retrieve Context (RAG)
        user_message = request.messages[-1].content
        context = memory_service.search_context(user_message)
        
        system_prompt = "You are a helpful AI assistant."
        if context:
            context_str = "\n".join(context)
            system_prompt += f"\n\nRelevant past information:\n{context_str}\n\nUse this information to answer the user if relevant."
            print(f"RAG Context Injected: {len(context)} items")

        # Convert Pydantic models to dicts for Llama
        messages = [
            {
                {
                    "role": "assistant", 
                    "content": m.system_prompt or system_prompt
                },
                {"role": m.role, 
                "content": m.content}
            } for m in request.messages]
        
        # Inject System Prompt if not present
        if messages[0]["role"] != "system":
            messages.insert(0, {"role": "system", "content": system_prompt})
        else:
            messages[0]["content"] += f"\n{system_prompt}" # Append to existing system prompt

        # 2. Generator Wrapper to Capture Response for Memory
        async def response_generator():
            full_response = ""
            stream = llm_service.chat_stream(
                messages=messages,
                max_tokens=request.max_tokens,
                temperature=request.temperature
            )
            for chunk in stream:
                full_response += chunk
                yield chunk
            
            # 3. Store Interaction
            memory_service.add_interaction(user_message, full_response)

        return StreamingResponse(
            response_generator(),
            media_type="text/event-stream"
        )
    except ValueError as e:
        return make_response(
            status=HTTPStatusCode.BAD_REQUEST,
            code=APICode.VALIDATION,
            message=str(e)
        )
    except Exception as e:
        return make_response(
            status=HTTPStatusCode.INTERNAL_SERVER_ERROR,
            code=APICode.INTERNAL_SERVER_ERROR,
            message=f"Chat error: {str(e)}"
        )

# --- Model Management API ---

import os
from Services.download_service import download_service



@router.get("/models")
def list_models():
    """Scans the ~/.ucai/models directory for .gguf files."""
    try:
        from Utils.paths import MODELS_DIR
        if not os.path.exists(MODELS_DIR):
             return make_response(
                status=HTTPStatusCode.OK,
                code=APICode.OK,
                message="No global models directory found",
                data=[]
            )
        
        files = [f for f in os.listdir(MODELS_DIR) if f.endswith(".gguf")]
        return make_response(
            status=HTTPStatusCode.OK,
            code=APICode.OK,
            message="Models listed from global storage",
            data=files
        )
    except Exception as e:
         return make_response(
            status=HTTPStatusCode.INTERNAL_SERVER_ERROR,
            code=APICode.INTERNAL_SERVER_ERROR,
            message=f"Failed to list models: {str(e)}"
        )

@router.post("/models/download")
def download_model(req: DownloadRequest):
    try:
        task_id = download_service.start_download(req.repo_id, req.filename)
        return make_response(
            status=HTTPStatusCode.OK,
            code=APICode.OK,
            message="Download started",
            data={"task_id": task_id}
        )
    except Exception as e:
        return make_response(
            status=HTTPStatusCode.INTERNAL_SERVER_ERROR,
            code=APICode.INTERNAL_SERVER_ERROR,
            message=f"Failed to start download: {str(e)}"
        )

@router.get("/models/download/{task_id}")
def check_download_status(task_id: str):
    status = download_service.get_status(task_id)
    if not status:
         return make_response(
            status=HTTPStatusCode.NOT_FOUND,
            code=APICode.NOT_FOUND,
            message="Task not found"
        )
    return make_response(
        status=HTTPStatusCode.OK,
        code=APICode.OK,
        message="Download status",
        data=status
    )
