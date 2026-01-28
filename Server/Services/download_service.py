import os
import uuid
import threading
from huggingface_hub import hf_hub_download
from Utils.paths import MODELS_DIR

class DownloadService:
    _instance = None
    _downloads = {}  # Store download status by task_id

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DownloadService, cls).__new__(cls)
        return cls._instance

    def start_download(self, repo_id: str, filename: str) -> str:
        """Starts a background download and returns a task_id."""
        task_id = str(uuid.uuid4())
        self._downloads[task_id] = {
            "status": "pending",
            "repo_id": repo_id,
            "filename": filename,
            "progress": 0,
            "error": None
        }

        # Run in a separate thread to avoid blocking the API
        thread = threading.Thread(target=self._download_task, args=(task_id, repo_id, filename))
        thread.start()
        return task_id

    def _download_task(self, task_id: str, repo_id: str, filename: str):
        self._downloads[task_id]["status"] = "downloading"
        try:
            print(f"Starting download: {repo_id}/{filename} to {MODELS_DIR}")
            
            file_path = hf_hub_download(
                repo_id=repo_id,
                filename=filename,
                local_dir=MODELS_DIR,
                local_dir_use_symlinks=False # Download actual file
            )
            
            self._downloads[task_id]["status"] = "completed"
            self._downloads[task_id]["file_path"] = file_path
            print(f"Download completed: {file_path}")

        except Exception as e:
            print(f"Download failed: {e}")
            self._downloads[task_id]["status"] = "failed"
            self._downloads[task_id]["error"] = str(e)

    def get_status(self, task_id: str):
        return self._downloads.get(task_id, None)

download_service = DownloadService()
