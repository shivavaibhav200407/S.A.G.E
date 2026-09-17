import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, FileText, Trash2, MessageSquare, Search, Loader2, Database, Zap, Network, BookOpen, Layers, X } from 'lucide-react';
import type { RAGDocument, SearchResult } from '../types';
import * as docService from '../services/documents';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';

interface DocumentsPageProps {
  onNavigateToChat: (prompt?: string) => void;
  onNavigateToQuiz?: (topic?: string, quizType?: 'diagnostic' | 'mastery', docName?: string) => void;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({ onNavigateToChat, onNavigateToQuiz }) => {
  const { showToast } = useToast();

  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Knowledge Graph alignment preview state
  const [selectedAlignment, setSelectedAlignment] = useState<any>(null);
  const [aligningDocName, setAligningDocName] = useState<string | null>(null);

  // Semantic search test states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searching, setSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = React.useCallback(async () => {
    setLoadingDocs(true);
    try {
      const docs = await docService.fetchDocuments();
      setDocuments(docs);
    } catch (err: any) {
      showToast(err.message || 'Failed to load documents from knowledge base.', 'error');
    } finally {
      setLoadingDocs(false);
    }
  }, [showToast]);

  const docsLoadedRef = useRef(false);

  useEffect(() => {
    if (!docsLoadedRef.current) {
      docsLoadedRef.current = true;
      loadDocuments();
    }
  }, [loadDocuments]);

  const handleFileUpload = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'txt', 'md'].includes(ext || '')) {
      showToast('Only PDF, TXT, and MD files are supported.', 'error');
      return;
    }

    setUploading(true);
    setUploadProgressText(`Uploading and indexing "${file.name}" into ChromaDB...`);

    try {
      const res = await docService.uploadDocumentFile(file);
      showToast(res.message || `Successfully indexed ${res.chunks_ingested} chunks!`, 'success');
      await loadDocuments();
      if (res.chunks_ingested > 0 && (res as any).alignment) {
        setSelectedAlignment((res as any).alignment);
      }
    } catch (err: any) {
      showToast(err.message || 'PDF upload or processing failed.', 'error');
    } finally {
      setUploading(false);
      setUploadProgressText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleOpenDiagnosticAlignment = async (docName: string) => {
    setAligningDocName(docName);
    try {
      const alignment = await docService.alignDocumentWithKnowledgeGraph(docName);
      setSelectedAlignment(alignment);
    } catch (err: any) {
      if (onNavigateToQuiz) {
        onNavigateToQuiz(undefined, 'diagnostic', docName);
      }
    } finally {
      setAligningDocName(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async (docName: string) => {
    if (!confirm(`Are you sure you want to delete "${docName}" from the knowledge base?`)) return;

    try {
      const res = await docService.deleteDocument(docName);
      showToast(`Removed "${docName}" (${res.deleted_chunks} chunks deleted).`, 'info');
      await loadDocuments();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete document.', 'error');
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const results = await docService.searchKnowledgeBase(searchQuery.trim());
      setSearchResults(results);
      if (results.length === 0) {
        showToast('No matching vector chunks found.', 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Vector search failed.', 'error');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-6xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-medium mb-2">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>ChromaDB Semantic Vector RAG</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
            Knowledge Vault & Documents
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Upload course notes, textbook chapters, or reference PDFs. SAGE indexes them for citation-grounded tutoring.
          </p>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all cursor-pointer ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-950/20 shadow-glow-accent'
            : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-600/20">
            {uploading ? (
              <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
            ) : (
              <UploadCloud className="w-7 h-7" />
            )}
          </div>

          <div>
            <h3 className="text-base font-semibold text-white">
              {uploading ? 'Processing Document...' : 'Upload Learning Material'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {uploading
                ? uploadProgressText
                : 'Drag and drop your PDF, TXT, or MD files here, or click to browse.'}
            </p>
          </div>

          {!uploading && (
            <div className="flex items-center gap-2 pt-2">
              <Badge variant="cyan" size="sm">PDF</Badge>
              <Badge variant="default" size="sm">TXT</Badge>
              <Badge variant="default" size="sm">MD</Badge>
              <span className="text-[11px] text-slate-500">Auto-chunked (500 chars)</span>
            </div>
          )}
        </div>
      </div>

      {/* Document Library Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span>Document Library</span>
            <Badge variant="accent" size="sm">{documents.length} Files</Badge>
          </h2>

          <Button size="sm" variant="ghost" onClick={loadDocuments} loading={loadingDocs}>
            Refresh
          </Button>
        </div>

        {loadingDocs ? (
          <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            <span className="text-xs">Fetching indexed documents...</span>
          </div>
        ) : documents.length === 0 ? (
          /* Empty State */
          <Card className="p-8 text-center border-slate-800/80">
            <div className="w-12 h-12 rounded-xl bg-slate-800/60 border border-slate-700/60 mx-auto flex items-center justify-center text-slate-400 mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white">No documents uploaded yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Upload your engineering textbooks or syllabus notes above to enable custom retrieval-augmented tutoring.
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              icon={<UploadCloud className="w-4 h-4" />}
            >
              Select File to Upload
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc, idx) => (
              <Card key={idx} hoverEffect className="p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shrink-0 text-cyan-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium text-white truncate" title={doc.name}>
                        {doc.name}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDelete(doc.name)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 transition-colors shrink-0"
                      title="Delete from knowledge base"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant="cyan" size="sm">
                      {doc.chunks} Semantic Chunks
                    </Badge>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <Button
                    size="sm"
                    variant="primary"
                    className="w-full text-xs justify-center"
                    loading={aligningDocName === doc.name}
                    onClick={() => handleOpenDiagnosticAlignment(doc.name)}
                    icon={<Zap className="w-3.5 h-3.5 text-amber-300" />}
                  >
                    Diagnose & Align to KG
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full text-xs justify-start text-slate-300 hover:text-white"
                    onClick={() => onNavigateToChat(`According to my uploaded document "${doc.name}", explain the core concepts and summarize the key takeaways.`)}
                    icon={<MessageSquare className="w-3.5 h-3.5 text-indigo-400" />}
                  >
                    Ask SAGE about this file
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Semantic Vector Search Testing Section */}
      <Card className="p-6 space-y-4 border-slate-800/80">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">Semantic Search Inspector</h3>
            <p className="text-[11px] text-slate-400">
              Test vector similarity matching directly against your indexed ChromaDB chunks.
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search knowledge base (e.g. 'time complexity of quicksort')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="secondary" size="md" loading={searching}>
            Search
          </Button>
        </form>

        {searchResults.length > 0 && (
          <div className="space-y-3 pt-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Top Retrieved Chunks:
            </span>
            <div className="space-y-2">
              {searchResults.map((res, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-indigo-400">
                    <span>Match #{i + 1} {res.metadata?.source ? `(${res.metadata.source})` : ''}</span>
                    {res.score !== undefined && <span className="font-mono">Score: {res.score.toFixed(3)}</span>}
                  </div>
                  <p className="text-slate-300 leading-relaxed font-mono text-[11px] bg-slate-950 p-2 rounded-lg border border-slate-800/60">
                    {res.text || res.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Knowledge Graph Semantic Alignment Preview Modal */}
      {selectedAlignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <Card className="max-w-lg w-full p-6 space-y-5 border-indigo-500/40 bg-slate-950/95 shadow-2xl relative">
            <button
              onClick={() => setSelectedAlignment(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-mono">
                <Network className="w-3.5 h-3.5 text-indigo-400" />
                <span>Knowledge Graph Semantic Alignment</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400 shrink-0" />
                <span className="truncate">{selectedAlignment.doc_name}</span>
              </h2>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Target Knowledge Domain</span>
                <Badge variant="accent" size="sm" className="font-mono">
                  {selectedAlignment.domain_title || selectedAlignment.domain?.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Indexed ChromaDB Chunks</span>
                <span className="font-mono text-cyan-400 font-semibold">{selectedAlignment.total_chunks} chunks</span>
              </div>
            </div>

            {selectedAlignment.aligned_topics && selectedAlignment.aligned_topics.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  Aligned Curriculum Modules
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAlignment.aligned_topics.map((t: string, i: number) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-medium"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedAlignment.prerequisites && selectedAlignment.prerequisites.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-400" />
                  Prerequisite Competencies Analyzed
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAlignment.prerequisites.map((p: string, i: number) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-mono"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row gap-2">
              <Button
                variant="primary"
                className="flex-1 justify-center text-xs"
                onClick={() => {
                  const targetTopic = selectedAlignment.aligned_topics?.[0] || undefined;
                  const dName = selectedAlignment.doc_name;
                  setSelectedAlignment(null);
                  if (onNavigateToQuiz) {
                    onNavigateToQuiz(targetTopic, 'diagnostic', dName);
                  }
                }}
                icon={<Zap className="w-3.5 h-3.5 text-amber-300" />}
              >
                Launch Grounded Diagnostic Quiz
              </Button>
              <Button
                variant="ghost"
                className="text-xs text-slate-300 hover:text-white"
                onClick={() => {
                  const dName = selectedAlignment.doc_name;
                  setSelectedAlignment(null);
                  onNavigateToChat(`Based on my uploaded document "${dName}", explain the primary concept of ${selectedAlignment.aligned_topics?.[0] || 'the text'} and show an illustrative example.`);
                }}
                icon={<MessageSquare className="w-3.5 h-3.5 text-indigo-400" />}
              >
                Discuss in Chat
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
