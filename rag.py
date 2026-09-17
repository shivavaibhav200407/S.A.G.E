import os
import io
import uuid
from typing import List, Dict, Any, Optional, Union
import chromadb
from chromadb.utils import embedding_functions
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Initialize local persistent vector DB
CHROMA_DATA_PATH = os.path.join(os.path.dirname(__file__), "chroma_db")
client = chromadb.PersistentClient(path=CHROMA_DATA_PATH)

# Use a lightweight local sentence transformer for embeddings
embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)

# Core persistent knowledge base collection
collection = client.get_or_create_collection(
    name="sage_knowledge_base",
    embedding_function=embedding_fn
)

class RAGEngine:
    """ChromaDB-backed Semantic Vector Engine with PDF & text ingestion."""
    def __init__(self, chromadb_collection):
        self.collection = chromadb_collection

    def ingest_pdf(self, pdf_input: Union[str, io.BytesIO, bytes], filename: str = "document.pdf") -> int:
        """
        Extracts text from PDF (file path, bytes, or file-like object)
        and ingests semantic vector chunks into ChromaDB.
        """
        try:
            from pypdf import PdfReader
            
            if isinstance(pdf_input, str):
                if not os.path.exists(pdf_input):
                    return 0
                reader = PdfReader(pdf_input)
                file_name = os.path.basename(pdf_input)
            elif isinstance(pdf_input, bytes):
                reader = PdfReader(io.BytesIO(pdf_input))
                file_name = filename
            else:
                reader = PdfReader(pdf_input)
                file_name = filename

            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=500,
                chunk_overlap=60
            )
            documents = []
            metadatas = []
            ids = []

            for page_idx, page in enumerate(reader.pages):
                text = page.extract_text()
                if not text or not text.strip():
                    continue

                page_chunks = text_splitter.split_text(text)
                for c_idx, chunk in enumerate(page_chunks):
                    chunk_id = f"{file_name}_p{page_idx+1}_c{c_idx}_{uuid.uuid4().hex[:6]}"
                    documents.append(chunk)
                    metadatas.append({
                        "source": f"{file_name} (Page {page_idx+1})",
                        "doc_name": file_name,
                        "page": page_idx + 1,
                        "type": "pdf"
                    })
                    ids.append(chunk_id)

            if not documents:
                return 0

            # Batch add all chunks in a single ChromaDB operation for maximum performance (<1s)
            self.collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )
            return len(documents)
        except Exception as e:
            print(f"[RAG PDF Ingestion Error]: {e}")
            return 0

    def ingest_text(self, text: str, source_name: str = "Notes") -> int:
        """Splits arbitrary text and ingests into ChromaDB."""
        if not text or not text.strip():
            return 0
        try:
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=500,
                chunk_overlap=50
            )
            chunks = text_splitter.split_text(text)
            
            documents = []
            metadatas = []
            ids = []

            for idx, chunk in enumerate(chunks):
                chunk_id = f"{source_name}_chunk_{idx}_{uuid.uuid4().hex[:6]}"
                documents.append(chunk)
                metadatas.append({
                    "source": source_name,
                    "doc_name": source_name,
                    "type": "text"
                })
                ids.append(chunk_id)

            self.collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )
            return len(chunks)
        except Exception as e:
            print(f"[RAG Text Ingestion Error]: {e}")
            return 0

    def list_documents(self) -> List[Dict[str, Any]]:
        """Returns a list of all distinct ingested documents and their chunk counts."""
        try:
            results = self.collection.get()
            metadatas = results.get("metadatas", [])
            doc_map = {}
            for meta in metadatas:
                if not meta:
                    continue
                name = meta.get("doc_name") or meta.get("source", "Unknown")
                dtype = meta.get("type", "text")
                if name not in doc_map:
                    doc_map[name] = {"name": name, "type": dtype, "chunks": 0}
                doc_map[name]["chunks"] += 1
            return list(doc_map.values())
        except Exception as e:
            print(f"[RAG List Documents Error]: {e}")
            return []

    def delete_document(self, doc_name: str) -> int:
        """Deletes all chunks belonging to a specific document name."""
        try:
            results = self.collection.get()
            ids_to_delete = []
            for doc_id, meta in zip(results.get("ids", []), results.get("metadatas", [])):
                if meta and (meta.get("doc_name") == doc_name or meta.get("source") == doc_name):
                    ids_to_delete.append(doc_id)
            if ids_to_delete:
                self.collection.delete(ids=ids_to_delete)
            return len(ids_to_delete)
        except Exception as e:
            print(f"[RAG Delete Document Error]: {e}")
            return 0

    def retrieve(self, query: str, top_k: int = 2) -> str:
        """Retrieves semantic chunks with citation metadata."""
        return retrieve_context(query, n_results=top_k)

    def search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Performs semantic vector search and returns structured hit objects."""
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=top_k
            )
            docs = results.get("documents", [[]])[0]
            metas = results.get("metadatas", [[]])[0]
            distances = results.get("distances", [[]])[0] if "distances" in results else [0.0] * len(docs)
            hits = []
            for doc, meta, dist in zip(docs, metas, distances):
                hits.append({
                    "text": doc,
                    "source": meta.get("source", "Knowledge Base") if meta else "Knowledge Base",
                    "doc_name": meta.get("doc_name", meta.get("source", "Knowledge Base")) if meta else "Knowledge Base",
                    "type": meta.get("type", "text") if meta else "text",
                    "distance": float(dist) if dist is not None else 0.0
                })
            return hits
        except Exception as e:
            return [{"text": f"Search notice: {e}", "source": "System", "distance": 1.0}]

# Global unified instance
rag_db = RAGEngine(collection)

def ingest_document(file_path: str) -> str:
    """Reads a text/markdown file, chunks it, and stores it in ChromaDB."""
    if not os.path.exists(file_path):
        return f"Error: File {file_path} not found."
    
    if file_path.lower().endswith(".pdf"):
        count = rag_db.ingest_pdf(file_path)
        return f"Successfully ingested {count} chunks from '{os.path.basename(file_path)}' into ChromaDB!"
    
    with open(file_path, "r", encoding="utf-8") as f:
        text = f.read()
    count = rag_db.ingest_text(text, source_name=os.path.basename(file_path))
    return f"Successfully ingested {count} chunks from '{os.path.basename(file_path)}' into ChromaDB!"

def retrieve_context(
    query: str,
    course_track: str = "general",
    n_results: int = 2,
    top_k: Optional[int] = None,
    **kwargs
) -> str:
    """Searches vector DB for the most relevant study material chunks with citations."""
    try:
        limit = top_k if top_k is not None else n_results
        results = collection.query(
            query_texts=[query],
            n_results=limit
        )
        retrieved_docs = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        if not retrieved_docs:
            return f"Standard core curriculum knowledge for {course_track} applied."

        formatted_chunks = []
        for doc, meta in zip(retrieved_docs, metadatas):
            src = meta.get("source", "Knowledge Base") if meta else "Knowledge Base"
            formatted_chunks.append(f"[{src}]\n{doc}")

        return "\n---\n".join(formatted_chunks)
    except Exception as e:
        return f"[Vector DB Notice]: {e}"

def search_knowledge_base(query: str, top_k: int = 3) -> List[Dict[str, Any]]:
    """Functional wrapper to search the ChromaDB knowledge base."""
    return rag_db.search(query, top_k=top_k)