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
                "verbose": settings.verbose,
                "system_prompt": settings.system_prompt,
                "rag_enabled": settings.rag_enabled
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
        
        formatted_messages = []

        # 1. Inject System Prompt (Global)
        current_system_prompt = llm_service._config.get("system_prompt", "You are a helpful AI assistant.")
        rag_enabled = llm_service._config.get("rag_enabled", True)

        # 0. Inject Context Tools (Time/Date)
        from datetime import datetime
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        current_system_prompt += f"\n\nCurrent Date & Time: {current_time}"

        # 0.1 Web Search Injection
        if request.web_search:
            from Utils.tools import search_web
            # Simple keyword extraction: use the last user message
            search_query = user_message
            print(f"Searching web for: {search_query}...")
            search_results = search_web(search_query)
            current_system_prompt += f"\n\nWeb Search Results:\n{search_results}\n\nUse these results to answer the user's question with up-to-date information."

        # RAG Injection
        if rag_enabled and context:
             context_str = "\n".join(context)
             current_system_prompt += f"\n\nRelevant past information:\n{context_str}\n\nUse this information to answer the user if relevant."
             print(f"RAG Context Injected: {len(context)} items")

        formatted_messages.append({"role": "system", "content": current_system_prompt})
        
        # 2. Append User/Assistant Messages
        for m in request.messages:
             formatted_messages.append({"role": m.role, "content": m.content})

        # 2. Generator Wrapper to Capture Response for Memory
        async def response_generator():
            full_response = ""
            stream = llm_service.chat_stream(
                messages=formatted_messages,
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
