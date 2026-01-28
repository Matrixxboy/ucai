import uuid
from datetime import datetime
from fastapi.responses import JSONResponse
from typing import Any, Optional
from .http_status import HTTPStatusCode, APICode


def make_response(
    *,
    status: HTTPStatusCode,
    code: APICode,
    message: str,
    data: Optional[Any] = None,
    error: Optional[Any] = None,
):
    body = {
        "success": status < 400,  # 2xx/3xx = success, 4xx/5xx = error
        "message": message,
        "data": data if status < 400 else None,
        "error": None if status < 400 else {
            "type": code.value,
            "details": error
        },
        "meta": {
            "http_code": status,
            "timestamp": datetime.utcnow().isoformat(),
            "request_id": f"req_{uuid.uuid4().hex[:12]}"
        }
    }

    return JSONResponse(status_code=status, content=body)