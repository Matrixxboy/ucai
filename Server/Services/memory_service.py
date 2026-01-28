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

    def add_interaction(self, user_input: str, ai_response: str, session_id: str = "default_session"):
        """Stores the interaction in the vector DB with session metadata."""
        if not self._collection or not self._embedding_model:
            return

        try:
            # Create a combined text for context
            text = f"User: {user_input}\nAssistant: {ai_response}"
            
            # Generate ID
            doc_id = str(uuid.uuid4())
            
            # Generate embedding
            embedding = self._embedding_model.encode(text).tolist()
            
            # Add to collection with Session Metadata
            self._collection.add(
                documents=[text],
                embeddings=[embedding],
                metadatas=[{"role": "interaction", "session_id": session_id}],
                ids=[doc_id]
            )
            print(f"Interaction stored in memory (Session: {session_id}).")
        except Exception as e:
            print(f"Failed to store interaction: {e}")

    def search_context(self, query: str, session_id: str = None, n_results: int = 3) -> List[str]:
        """
        Retrieves relevant context.
        If session_id is provided, prioritizes or filters by that session (STM).
        """
        if not self._collection or not self._embedding_model:
            return []

        try:
            # Generate query embedding
            query_embedding = self._embedding_model.encode(query).tolist()
            
            # Define filter: If session_id is strict, we can filter.
            # Strategy: We search globally (LTM) but we *could* filter.
            # User said "make the vector for STM too". 
            # Let's enforce session filter if provided for "Session STM".
            
            where_filter = None
            if session_id:
                where_filter = {"session_id": session_id}
            
            # Query collection
            results = self._collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                where=where_filter # Filter by session if provided
            )
            
            if results and results['documents']:
                return results['documents'][0]
            return []
        except Exception as e:
            print(f"Failed to search context: {e}")
            return []

    def clear_memory(self, session_id: str = None):
        """
        Clears memory.
        If session_id is provided, deletes only that session's data.
        If None, deletes EVERYTHING (Global Reset).
        """
        if not self._collection:
            return False

        try:
            if session_id:
                # Delete by session_id metadata
                self._collection.delete(where={"session_id": session_id})
                print(f"Memory Cleared for Session: {session_id}")
            else:
                # Delete all
                # ChromaDB requires a filter or list of IDs usually, but passing empty where might not work on all versions.
                # However, collection.delete() without args might fail. 
                # Safe way: delete existing collection and recreate.
                self._client.delete_collection(name="conversation_history")
                self._collection = self._client.create_collection(name="conversation_history")
                print("Global Memory Cleared (All Data Wiped).")
            return True
        except Exception as e:
            print(f"Failed to clear memory: {e}")
            return False

memory_service = MemoryService()
