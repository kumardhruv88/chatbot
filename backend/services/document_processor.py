import os
from typing import List, Dict
import PyPDF2
import docx
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import pickle

from ..config import get_settings

settings = get_settings()


class DocumentProcessor:
    """Process and store documents for RAG using FAISS."""
    
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.embedding_dim = 384  # Dimension for all-MiniLM-L6-v2
    
    def extract_text(self, file_path: str, file_type: str) -> str:
        """Extract text from different file types."""
        if file_type == ".pdf":
            return self._extract_from_pdf(file_path)
        elif file_type == ".docx":
            return self._extract_from_docx(file_path)
        elif file_type in [".txt", ".md"]:
            return self._extract_from_text(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
    
    def _extract_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF."""
        text = ""
        with open(file_path, "rb") as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        return text
    
    def _extract_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX."""
        doc = docx.Document(file_path)
        return "\n".join([paragraph.text for paragraph in doc.paragraphs])
    
    def _extract_from_text(self, file_path: str) -> str:
        """Extract text from TXT/MD files."""
        with open(file_path, "r", encoding="utf-8") as file:
            return file.read()
    
    def _get_index_path(self, thread_id: int) -> str:
        """Get the path for the FAISS index file."""
        os.makedirs(settings.chroma_persist_dir, exist_ok=True)
        return os.path.join(settings.chroma_persist_dir, f"thread_{thread_id}.index")
    
    def _get_metadata_path(self, thread_id: int) -> str:
        """Get the path for the metadata file."""
        os.makedirs(settings.chroma_persist_dir, exist_ok=True)
        return os.path.join(settings.chroma_persist_dir, f"thread_{thread_id}_metadata.pkl")
    
    async def process_and_store(
        self, 
        file_path: str, 
        thread_id: int, 
        filename: str
    ) -> None:
        """Process document and store embeddings in FAISS."""
        
        # Extract text
        file_type = os.path.splitext(file_path)[1].lower()
        text = self.extract_text(file_path, file_type)
        
        if not text.strip():
            raise ValueError("Document contains no extractable text")
        
        # Split into chunks
        chunks = self.text_splitter.split_text(text)
        
        # Generate embeddings
        embeddings = self.embedding_model.encode(chunks)
        embeddings_np = np.array(embeddings).astype('float32')
        
        # Load or create FAISS index
        index_path = self._get_index_path(thread_id)
        metadata_path = self._get_metadata_path(thread_id)
        
        if os.path.exists(index_path):
            # Load existing index
            index = faiss.read_index(index_path)
            with open(metadata_path, 'rb') as f:
                metadata_list = pickle.load(f)
        else:
            # Create new index
            index = faiss.IndexFlatL2(self.embedding_dim)
            metadata_list = []
        
        # Add new embeddings to index
        index.add(embeddings_np)
        
        # Add metadata
        for i, chunk in enumerate(chunks):
            metadata_list.append({
                "source": filename,
                "chunk_index": len(metadata_list),
                "text": chunk,
                "thread_id": thread_id
            })
        
        # Save index and metadata
        faiss.write_index(index, index_path)
        with open(metadata_path, 'wb') as f:
            pickle.dump(metadata_list, f)
