import { request, ApiError } from './api';
import type { RAGDocument, SearchResult } from '../types';

export interface DocumentListResponse {
  documents: RAGDocument[];
  count: number;
}

export interface UploadDocumentResponse {
  status: string;
  filename: string;
  chunks_ingested: number;
  message: string;
}

export interface SearchResponse {
  results: SearchResult[];
}

export async function fetchDocuments(): Promise<RAGDocument[]> {
  const data = await request<DocumentListResponse>('/api/rag/');
  return data.documents || [];
}

export async function uploadDocumentFile(file: File): Promise<UploadDocumentResponse> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!['pdf', 'txt', 'md'].includes(ext || '')) {
    throw new ApiError('Only PDF, TXT, and MD files are supported by SAGE Knowledge Vault.', 400);
  }

  const formData = new FormData();
  formData.append('file', file);

  return await request<UploadDocumentResponse>('/api/rag/', {
    method: 'POST',
    body: formData,
  });
}

export async function deleteDocument(docName: string): Promise<{ deleted_chunks: number }> {
  return await request('/api/rag/', {
    method: 'POST',
    body: JSON.stringify({ action: 'delete_document', doc_name: docName }),
  });
}

export async function searchKnowledgeBase(query: string, topK: number = 3): Promise<SearchResult[]> {
  const data = await request<SearchResponse>('/api/rag/', {
    method: 'POST',
    body: JSON.stringify({ action: 'search', query, top_k: topK }),
  });
  return data.results || [];
}

export interface DocumentAlignmentResponse {
  alignment: {
    doc_name: string;
    domain: string;
    domain_title: string;
    aligned_topics: string[];
    prerequisites: string[];
    total_chunks: number;
    sample_context?: string;
  };
}

export async function alignDocumentWithKnowledgeGraph(docName: string): Promise<DocumentAlignmentResponse['alignment']> {
  const data = await request<DocumentAlignmentResponse>('/api/rag/', {
    method: 'POST',
    body: JSON.stringify({ action: 'align_diagnostic', doc_name: docName }),
  });
  return data.alignment;
}

