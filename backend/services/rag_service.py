from typing import Dict, List
import os
import pickle
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

from ..config import get_settings

settings = get_settings()


class RAGService:
    """Retrieve relevant context from documents using FAISS."""
    
    def __init__(self):
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
    
    def _get_index_path(self, thread_id: int) -> str:
        """Get the path for the FAISS index file."""
        return os.path.join(settings.chroma_persist_dir, f"thread_{thread_id}.index")
    
    def _get_metadata_path(self, thread_id: int) -> str:
        """Get the path for the metadata file."""
        return os.path.join(settings.chroma_persist_dir, f"thread_{thread_id}_metadata.pkl")
    
    async def retrieve_context(
        self, 
        query: str, 
        thread_id: int,
        top_k: int = 3
    ) -> Dict[str, any]:
        """Retrieve relevant document chunks for a query."""
        
        index_path = self._get_index_path(thread_id)
        metadata_path = self._get_metadata_path(thread_id)
        
        # Check if index exists
        if not os.path.exists(index_path):
            return {"context": "", "sources": []}
        
        # Load index and metadata
        index = faiss.read_index(index_path)
        with open(metadata_path, 'rb') as f:
            metadata_list = pickle.load(f)
        
        # Generate query embedding
        query_embedding = self.embedding_model.encode([query])
        query_embedding_np = np.array(query_embedding).astype('float32')
        
        # Search for similar chunks
        distances, indices = index.search(query_embedding_np, min(top_k, len(metadata_list)))
        
        # Format context from retrieved chunks
        context_parts = []
        sources = set()
        
        for idx in indices[0]:
            if idx < len(metadata_list):
                metadata = metadata_list[idx]
                source_name = metadata.get("source", "Unknown")
                text = metadata.get("text", "")
                
                sources.add(source_name)
                context_parts.append(f"[From {source_name}]\n{text}")
        
        context = "\n\n".join(context_parts)
        
        return {
            "context": context,
            "sources": list(sources)
        }
