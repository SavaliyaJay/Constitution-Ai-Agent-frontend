"use client";
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import pdfToText from 'react-pdftotext';

// Type definition for the query API response
interface QueryResult {
  success: boolean;
  query: string;
  response: string;
  relevantSections: Array<{
    text: string;
    similarity: number;
    article_section: string;
    chunk_type: string;
  }>;
}

// A clear state machine for the app's status
type AppStatus = 'loading' | 'ready' | 'needs_upload' | 'error';

export default function ConstitutionAssistant() {
  // Main application state
  const [appStatus, setAppStatus] = useState<AppStatus>('loading');

  // PDF processing state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [processingStage, setProcessingStage] = useState<string>('');

  // Querying state
  const [query, setQuery] = useState<string>('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isQuerying, setIsQuerying] = useState<boolean>(false);

  // General UI state
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // useEffect runs once on component mount to check the database status
  useEffect(() => {
    const checkDbStatus = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stats`);
        const data = await response.json();
        if (data.success && data.totalChunks > 0) {
          console.log("Database contains data. System is ready.");
          setAppStatus('ready');
        } else {
          console.log("Database is empty. PDF upload required.");
          setAppStatus('needs_upload');
        }
      } catch (err) {
        console.error("Failed to fetch DB stats:", err);
        setError("Could not connect to the backend. Please refresh the page.");
        setAppStatus('error');
      }
    };
    checkDbStatus();
  }, []); // Empty dependency array ensures this runs only once

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setError('');
      setQueryResult(null); // Clear previous results on new upload
      extractTextFromPDF(file);
    } else {
      setError('Please select a valid PDF file.');
    }
  };

  const extractTextFromPDF = async (file: File) => {
    setIsProcessing(true);
    setProcessingProgress(5);
    setProcessingStage('Extracting text from PDF...');
    try {
      const text = await pdfToText(file);
      await processConstitution(text);
    } catch (err) {
      console.error('Error extracting PDF:', err);
      setError('Failed to extract text from PDF. Please try another file.');
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const processConstitution = async (text: string) => {
    setProcessingStage('Initializing processing...');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ constitutionText: text, strategy: 'ai' }),
      });

      if (!response.body) throw new Error("Server returned an empty response.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let finalResult = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'progress') {
              setProcessingProgress(data.progress);
              setProcessingStage(data.stage);
            } else if (data.type === 'complete') {
              finalResult = data.result;
            } else if (data.type === 'error') {
              throw new Error(data.error); // Propagate backend error
            }
          }
        }
      }

      if (finalResult?.success) {
        setProcessingProgress(100);
        setProcessingStage('Database is ready! You can now ask questions.');
        setAppStatus('ready'); // CRITICAL: Set app to ready on success
      } else {
        throw new Error('Processing failed without a specific error message.');
      }
    } catch (err: unknown) {
      let errorMessage = 'An unknown error occurred during processing.';
      if (err instanceof Error) {
        errorMessage = err.message; // Safely access the message property
      }
      setError(errorMessage);
      setProcessingProgress(0);
      setProcessingStage('Processing Failed');
      setAppStatus('needs_upload');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuery = async () => {
    if (!query.trim()) return;
    setIsQuerying(true);
    setError('');
    setQueryResult(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const result: QueryResult = await response.json();
      setQueryResult(result);
      if (!result.success) {
        setError(result.response || "Failed to get a valid response.");
      }
    } catch (_err) { 
  setError('Failed to process query. The server might be down.');
} finally {
      setIsQuerying(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuery();
    }
  };

  // Helper to get dynamic subtitle based on app status
  const getSubtitle = () => {
    switch (appStatus) {
      case 'loading': return 'Connecting to the legal database...';
      case 'ready': return 'The database is ready. Ask a legal question about the Constitution of India.';
      case 'needs_upload': return 'To begin, please upload the Constitution of India PDF.';
      case 'error': return 'A connection error occurred. Please refresh the page.';
      default: return 'An AI assistant for analyzing the Constitution of India.';
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black text-white">
      <div className="fixed inset-0 overflow-hidden z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]" />
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          animate={{ x: [0, 100, 0], y: [0, -100, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
          animate={{ x: [0, -100, 0], y: [0, 100, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent mb-4">
            Constitution AI
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">{getSubtitle()}</p>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {appStatus === 'loading' && (
              <motion.div key="loader" className="text-center p-8">
                <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
              </motion.div>
            )}

            {appStatus !== 'loading' && (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-12"
              >
                {/* Section 1: Upload */}
                <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
                  <h2 className="text-2xl font-semibold mb-6 text-center text-blue-400 flex items-center justify-center gap-3">
                    {appStatus === 'ready' ?
                      <span className="text-green-400">✅</span> :
                      <span className="text-yellow-400">1.</span>
                    }
                    {appStatus === 'ready' ? 'Database is Loaded' : 'Upload Constitution of India PDF'}
                  </h2>

                  <motion.div
                    className="border-2 border-dashed border-blue-500/50 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400/70 transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    onClick={() => !isProcessing && fileInputRef.current?.click()}
                  >
                    <input type="file" accept="application/pdf" onChange={handleFileSelect} ref={fileInputRef} className="hidden" disabled={isProcessing} />
                    <div className="text-6xl mb-4">📁</div>
                    <p className="text-xl mb-2">{pdfFile ? pdfFile.name : 'Click to upload PDF'}</p>
                    <p className="text-gray-400">{appStatus === 'ready' ? 'Upload a new file to replace existing data.' : 'Only the Constitution of India is accepted (Max 50MB).'}</p>
                  </motion.div>

                  <AnimatePresence>
                    {(isProcessing || (processingProgress > 0 && processingProgress < 100)) && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-300">{processingStage}</span>
                          <span className="text-sm text-green-400">{Math.round(processingProgress)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <motion.div
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                            animate={{ width: `${processingProgress}%` }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Section 2: Query */}
                <div className={`bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl transition-opacity duration-500 ${appStatus !== 'ready' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <h2 className="text-2xl font-semibold mb-6 text-center text-blue-400">
                    {appStatus === 'ready' ? '2. Ask a Legal Question' : '2. Ask Legal Questions (Requires Upload)'}
                  </h2>
                  <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={appStatus === 'ready' ? "Ask anything about constitutional law..." : "Please complete step 1 first"}
                      className="w-full p-4 bg-gray-900/70 border border-gray-600/50 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      rows={3}
                      disabled={appStatus !== 'ready' || isQuerying}
                    />
                    <motion.button
                      onClick={handleQuery}
                      disabled={appStatus !== 'ready' || !query.trim() || isQuerying}
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-700 rounded-xl font-semibold shadow-lg"
                      whileHover={{ scale: 1.05 }}
                    >
                      {isQuerying ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Thinking...
                        </div>
                      ) : ('🚀 Ask AI')}
                    </motion.button>
                  </div>
                  <div className="text-center text-xs text-yellow-400/80 bg-yellow-900/30 p-3 rounded-lg border border-yellow-700/50">
                    <strong>Disclaimer:</strong> This AI assistant is for informational purposes only and is not a substitute for professional legal advice. Always verify critical information.
                  </div>

                  {/* Error and Query Results */}
                  <div className="mt-6">
                    <AnimatePresence>
                      {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4 p-4 bg-red-900/50 border border-red-500/50 rounded-xl text-red-200">
                          ⚠️ {error}
                        </motion.div>
                      )}
                      {queryResult && queryResult.success && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                          {/* AI Response */}
                          <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-xl p-6">
                            <h3 className="text-lg font-semibold mb-3 text-cyan-400 flex items-center gap-2">🤖 AI Legal Analysis</h3>
                            <div className="text-gray-100 leading-relaxed whitespace-pre-wrap">{queryResult.response}</div>
                          </div>
                          {/* Relevant Sections */}
                          {queryResult.relevantSections.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold mb-4 text-blue-400 flex items-center gap-2">📚 Relevant Constitutional Sections</h3>
                              <div className="space-y-4">
                                {queryResult.relevantSections.map((section, index) => (
                                  <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="bg-gray-800/40 border border-gray-600/40 rounded-xl p-5 hover:border-blue-500/50 transition-colors">
                                    <div className="flex flex-wrap items-center justify-between mb-3 gap-2">
                                      <h4 className="font-medium text-blue-300">{section.article_section}</h4>
                                      <div className="flex items-center gap-3">
                                        <span className="text-xs px-2 py-1 bg-blue-900/50 rounded-full">{section.chunk_type}</span>
                                        <span className="text-xs text-green-300">{Math.round(section.similarity * 100)}% match</span>
                                      </div>
                                    </div>
                                    <p className="text-gray-300 text-sm leading-relaxed">{section.text}</p>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="max-w-6xl mx-auto mt-16 grid md:grid-cols-3 gap-6"
        >
          {[
            { icon: '🧠', title: 'AI-Powered Analysis', description: 'Advanced vector embeddings and semantic search for precise legal information retrieval' },
            { icon: '⚡', title: 'Real-time Processing', description: 'Lightning-fast document processing with intelligent chunking strategies' },
            { icon: '🎯', title: 'Contextual Accuracy', description: 'Highly relevant results with similarity scoring and source attribution' }
          ].map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6 text-center"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-3 text-blue-400">{feature.title}</h3>
              <p className="text-gray-300 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-16 pb-8"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300">
              Powered by AI • Vector Embeddings • Constitutional Law
            </span>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}