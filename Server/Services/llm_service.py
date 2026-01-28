import os
import json
from llama_cpp import Llama
from typing import Optional, Dict, Any, Generator
from Utils.paths import SETTINGS_FILE, MODELS_DIR

class LLMService:
    _instance = None
    _model: Optional[Llama] = None
    _model_path: Optional[str] = None
    _config: Dict[str, Any] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(LLMService, cls).__new__(cls)
            cls._instance._load_settings()
        return cls._instance

    def _load_settings(self):
        """Loads settings from disk."""
        from Static.prompt import system_prompt as default_system_prompt
        self._config = {
            "n_ctx": 2048,
            "n_gpu_layers": 0, # Default to CPU
            "verbose": True,
            "system_prompt": default_system_prompt,
            "rag_enabled": True
        }
        if os.path.exists(SETTINGS_FILE):
            try:
                with open(SETTINGS_FILE, "r") as f:
                    data = json.load(f)
                    self._model_path = data.get("model_path")
                    if "config" in data:
                        self._config.update(data["config"])
                print(f"Loaded settings from {SETTINGS_FILE}: {self._model_path}")
                
                # OPTIONAL: Auto-load the model if it was previously loaded
                if self._model_path:
                    try:
                        self.load_model(self._model_path, self._config)
                    except Exception as e:
                        print(f"Auto-load failed: {e}")

            except Exception as e:
                print(f"Failed to load settings file: {e}")

    def _save_settings(self):
        """Saves current settings to disk."""
        data = {
            "model_path": self._model_path,
            "config": self._config
        }
        try:
            with open(SETTINGS_FILE, "w") as f:
                json.dump(data, f, indent=4)
            print(f"Settings saved to {SETTINGS_FILE}")
        except Exception as e:
            print(f"Failed to save settings: {e}")

    def load_model(self, model_path: str, config: Optional[Dict[str, Any]] = None):
        """Loads the LLM from the specified path."""
        # Check if path is absolute, otherwise check Global Models directory
        if not os.path.exists(model_path):
            # Try looking in Global Models directory
            relative_path = os.path.join(MODELS_DIR, model_path)
            if os.path.exists(relative_path):
                model_path = relative_path
            else:
                # Fallback to local Server/Models for backward compatibility
                local_path = os.path.join(os.getcwd(), "Models", model_path)
                if os.path.exists(local_path):
                    model_path = local_path
                else:
                    raise FileNotFoundError(f"Model file not found at: {model_path} or {relative_path}")
        
        self._model_path = model_path
        if config:
            self._config.update(config)

        # Unload existing model if any
        if self._model:
            del self._model
            self._model = None

        print(f"Loading model from {model_path} with config {self._config}...")
        try:
            self._model = Llama(
                model_path=model_path,
                n_ctx=self._config.get("n_ctx", 2048),
                n_gpu_layers=self._config.get("n_gpu_layers", 0),
                verbose=self._config.get("verbose", True)
            )
            print("Model loaded successfully.")
            self._save_settings() # Save success state
            return True
        except Exception as e:
            print(f"Failed to load model: {e}")
            raise e

    def get_model_status(self):
        return {
            "loaded": self._model is not None,
            "model_path": self._model_path,
            "config": self._config
        }

    def chat_stream(self, messages: list, max_tokens: int = 512, temperature: float = 0.7) -> Generator[str, None, None]:
        """Streams chat completion from the model."""
        if not self._model:
            raise ValueError("Model is not loaded. Please configure the model path in settings.")

        stream = self._model.create_chat_completion(
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
            stream=True
        )

        for chunk in stream:
            if "content" in chunk["choices"][0]["delta"]:
                yield chunk["choices"][0]["delta"]["content"]

llm_service = LLMService()
