import os

# Define global data directory: ~/.ucai
USER_HOME = os.path.expanduser("~")
UCAI_BASE_DIR = os.path.join(USER_HOME, ".ucai")
MODELS_DIR = os.path.join(UCAI_BASE_DIR, "models")
MEMORY_DIR = os.path.join(UCAI_BASE_DIR, "memory")
SETTINGS_FILE = os.path.join(UCAI_BASE_DIR, "settings.json")

# Ensure directories exist
def ensure_directories():
    os.makedirs(UCAI_BASE_DIR, exist_ok=True)
    os.makedirs(MODELS_DIR, exist_ok=True)
    os.makedirs(MEMORY_DIR, exist_ok=True)

ensure_directories()
