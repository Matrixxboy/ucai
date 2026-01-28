import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import uuid
import os
from typing import List, Dict, Any
from Utils.paths import MEMORY_DIR

class MemoryService:
    _instance = None
    _client = None
    _collection = None
    _embedding_model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MemoryService, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        print(f"Initializing Memory Service at {MEMORY_DIR}...")
        try:
            # Initialize ChromaDB persistent client
            self._client = chromadb.PersistentClient(path=MEMORY_DIR)
            
            # Initialize Sentence Transformer for embeddings
            # We use a small, fast model
            print("Loading embedding model (all-MiniLM-L6-v2)...")
            self._embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            
            # Create or get collection
            self._collection = self._client.get_or_create_collection(name="conversation_history")
            print("Memory Service initialized.")
        except Exception as e:
            print(f"Failed to initialize Memory Service: {e}")

    def add_interaction(self, user_input: str, ai_response: str):
        """Stores the interaction in the vector DB."""
        if not self._collection or not self._embedding_model:
            return

        try:
            # Create a combined text for context
            text = f"User: {user_input}\nAssistant: {ai_response}"
            
            # Generate ID
            doc_id = str(uuid.uuid4())
            
            # Generate embedding
            embedding = self._embedding_model.encode(text).tolist()
            
            # Add to collection
            self._collection.add(
                documents=[text],
                embeddings=[embedding],
                metadatas=[{"role": "interaction"}],
                ids=[doc_id]
            )
            print("Interaction stored in memory.")
        except Exception as e:
            print(f"Failed to store interaction: {e}")

    def search_context(self, query: str, n_results: int = 3) -> List[str]:
        """Retrieves relevant context for the query."""
        if not self._collection or not self._embedding_model:
            return []

        try:
            # Generate query embedding
            query_embedding = self._embedding_model.encode(query).tolist()
            
            # Query collection
            results = self._collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results
            )
            
            if results and results['documents']:
                return results['documents'][0]
            return []
        except Exception as e:
            print(f"Failed to search context: {e}")
            return []

memory_service = MemoryService()
