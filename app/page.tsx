"use client";
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import pdfToText from 'react-pdftotext'

interface QueryResult {
  success: boolean
  query: string
  response: string
  relevantSections: Array<{
    text: string
    similarity: number
    article_section: string
    chunk_type: string
  }>
}

export default function ConstitutionAssistant() {
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState<string>('')
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [isUploaded, setIsUploaded] = useState<boolean>(false)
  const [query, setQuery] = useState<string>('')
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null)
  const [isQuerying, setIsQuerying] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [processingProgress, setProcessingProgress] = useState<number>(0)
  const [processingStage, setProcessingStage] = useState<string>('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setPdfFile(file)
      setError('')
      extractTextFromPDF(file)
    } else {
      setError('Please select a valid PDF file')
    }
  }

  const extractTextFromPDF = async (file: File) => {
    setIsProcessing(true)
    setUploadProgress(0)

    try {
      setUploadProgress(25)
      
      // Extract text using react-pdftotext
      const text = await pdfToText(file)
      
      setUploadProgress(75)
      setExtractedText(text)
      setUploadProgress(100)
      setIsUploaded(true)

      // Auto-process the text
      await processConstitution(text)

    } catch (err) {
      console.error('Error extracting PDF:', err)
      setError('Failed to extract text from PDF. Please try with a different PDF file.')
    } finally {
      setIsProcessing(false)
    }
  }

  const processConstitution = async (text: string) => {
    try {
      setProcessingProgress(0)
      setProcessingStage('Initializing chunking...')

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          constitutionText: text,
          strategy: 'ai'
        }),
      })

      // Check if response supports streaming (for real-time progress)
      if (response.body && response.headers.get('content-type')?.includes('text/stream')) {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let finalResult = null

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter(line => line.trim())

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.type === 'progress') {
                  setProcessingProgress(data.progress)
                  setProcessingStage(data.stage)
                } else if (data.type === 'complete') {
                  finalResult = data.result
                }
              } catch (e) {
                console.error('Error parsing progress data:', e)
              }
            }
          }
        }

        if (finalResult?.success) {
          console.log('Constitution processed successfully:', finalResult)
          setProcessingProgress(100)
          setProcessingStage('Complete!')
        } else {
          throw new Error('Failed to process constitution')
        }
      } else {
        // Fallback for non-streaming response
        const result = await response.json()
        if (result.success) {
          console.log('Constitution processed successfully:', result)
          setProcessingProgress(100)
          setProcessingStage('Complete!')
        } else {
          throw new Error('Failed to process constitution')
        }
      }
    } catch (err) {
      console.error('Error processing constitution:', err)
      setError('Failed to process constitution text')
      setProcessingProgress(0)
      setProcessingStage('')
    }
  }

  const handleQuery = async () => {
    if (!query.trim()) return

    setIsQuerying(true)
    setError('')

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })

      const result: QueryResult = await response.json()
      setQueryResult(result)
    } catch (err) {
      console.error('Error querying:', err)
      setError('Failed to process query')
    } finally {
      setIsQuerying(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleQuery()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]" />
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent mb-4">
            Constitution AI
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Advanced AI-powered constitutional law analysis with intelligent document processing
          </p>
        </motion.div>

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
              <h2 className="text-2xl font-semibold mb-6 text-center text-blue-400">
                📄 Upload Constitution Document
              </h2>

              {!isUploaded ? (
                <motion.div
                  className="border-2 border-dashed border-blue-500/50 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400/70 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <div className="text-6xl mb-4">📁</div>
                  <p className="text-xl mb-2">Click to upload PDF</p>
                  <p className="text-gray-400">Supports PDF files up to 50MB</p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <div className="text-6xl mb-4">✅</div>
                  <p className="text-xl text-green-400 mb-2">Constitution uploaded successfully!</p>
                  <p className="text-gray-400">{pdfFile?.name}</p>
                  <div className="mt-4 p-4 bg-gray-900/50 rounded-lg">
                    <p className="text-sm text-gray-300 mb-2">Extracted Text Preview:</p>
                    <p className="text-xs text-gray-400 max-h-32 overflow-y-auto">
                      {extractedText.substring(0, 500)}...
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Progress Bar */}
              <AnimatePresence>
                {(isProcessing || processingProgress > 0) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6"
                  >
                    <div className="space-y-4">
                      {/* PDF Extraction Progress */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-300">Processing PDF...</span>
                          <span className="text-sm text-blue-400">{Math.round(uploadProgress)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <motion.div
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </div>

                      {/* Constitution Processing Progress */}
                      {processingProgress > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-300">{processingStage}</span>
                            <span className="text-sm text-green-400">{Math.round(processingProgress)}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <motion.div
                              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${processingProgress}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Query Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-semibold mb-6 text-center text-blue-400">
              🔍 Ask Legal Questions
            </h2>

            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask anything about constitutional law..."
                  className="w-full p-4 bg-gray-900/70 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300"
                  rows={3}
                  disabled={!isUploaded}
                />
              </div>
              <motion.button
                onClick={handleQuery}
                disabled={!query.trim() || !isUploaded || isQuerying}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl font-semibold transition-all duration-300 shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isQuerying ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    AI Thinking...
                  </div>
                ) : (
                  '🚀 Ask AI'
                )}
              </motion.button>
            </div>

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-4 bg-red-900/50 border border-red-500/50 rounded-xl text-red-200"
                >
                  ⚠️ {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Query Results */}
            <AnimatePresence>
              {queryResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* AI Response */}
                  <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-3 text-cyan-400 flex items-center gap-2">
                      🤖 AI Legal Analysis
                    </h3>
                    <div className="text-gray-100 leading-relaxed whitespace-pre-wrap">
                      {queryResult.response}
                    </div>
                  </div>

                  {/* Relevant Sections */}
                  {queryResult.relevantSections.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-blue-400 flex items-center gap-2">
                        📚 Relevant Constitutional Sections
                      </h3>
                      <div className="space-y-4">
                        {queryResult.relevantSections.map((section, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-gray-800/40 border border-gray-600/40 rounded-xl p-5 hover:border-blue-500/50 transition-all duration-300"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-blue-300">{section.article_section}</h4>
                              <div className="flex items-center gap-3">
                                <span className="text-xs px-2 py-1 bg-blue-900/50 rounded-full text-blue-300">
                                  {section.chunk_type}
                                </span>
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                  <span className="text-xs text-gray-400">
                                    {Math.round(section.similarity * 100)}% match
                                  </span>
                                </div>
                              </div>
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed">
                              {section.text.length > 300
                                ? `${section.text.substring(0, 300)}...`
                                : section.text
                              }
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="max-w-6xl mx-auto mt-16 grid md:grid-cols-3 gap-6"
        >
          {[
            {
              icon: '🧠',
              title: 'AI-Powered Analysis',
              description: 'Advanced vector embeddings and semantic search for precise legal information retrieval'
            },
            {
              icon: '⚡',
              title: 'Real-time Processing',
              description: 'Lightning-fast document processing with intelligent chunking strategies'
            },
            {
              icon: '🎯',
              title: 'Contextual Accuracy',
              description: 'Highly relevant results with similarity scoring and source attribution'
            }
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
  )
}