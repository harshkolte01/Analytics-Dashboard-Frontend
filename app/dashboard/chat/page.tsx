'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Send,
  Bot,
  User,
  Loader2,
  Database,
  BarChart3,
  MessageSquare,
  History,
  Plus,
  Clock,
  Download,
  FileText,
  FileSpreadsheet
} from 'lucide-react'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  sql?: string
  results?: any[] | 'historical'
  error?: string
  queryId?: string // Add query ID for database reference
  resultRowCount?: number
  isHistorical?: boolean
}

interface ChatSession {
  id: string
  sessionName: string
  isActive: boolean
  createdAt: Date
  lastUsedAt: Date
  queryCount?: number
}

interface SuggestedQuestion {
  id: string
  question: string
  category: string
}

const suggestedQuestions: SuggestedQuestion[] = [
  {
    id: '1',
    question: "What's the total spend in the last 90 days?",
    category: 'Spend Analysis'
  },
  {
    id: '2',
    question: "List top 5 vendors by spend.",
    category: 'Vendor Analysis'
  },
  {
    id: '3',
    question: "Show overdue invoices as of today.",
    category: 'Payment Status'
  },
  {
    id: '4',
    question: "What's the average invoice value by month?",
    category: 'Trends'
  },
  {
    id: '5',
    question: "Which categories have the highest spend?",
    category: 'Category Analysis'
  },
  {
    id: '6',
    question: "How many invoices were processed this month?",
    category: 'Volume Analysis'
  }
]

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

// Simple markdown parser for chat messages
function parseMarkdown(text: string): React.ReactElement {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\n)/g)
  
  return (
    <span>
      {parts.map((part, index) => {
        // Bold text **text**
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index} className="font-semibold">{part.slice(2, -2)}</strong>
        }
        // Italic text *text*
        if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
          return <em key={index} className="italic">{part.slice(1, -1)}</em>
        }
        // Inline code `code`
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={index} className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>
        }
        // Line breaks
        if (part === '\n') {
          return <br key={index} />
        }
        // Regular text
        return <span key={index}>{part}</span>
      })}
    </span>
  )
}

// Enhanced markdown parser for longer content with lists
function parseMarkdownContent(text: string): React.ReactElement {
  const lines = text.split('\n')
  const elements: React.ReactElement[] = []
  let currentListItems: { content: string; number?: string }[] = []
  let listType: 'ordered' | 'unordered' | null = null

  const flushList = () => {
    if (currentListItems.length > 0) {
      if (listType === 'ordered') {
        // For ordered lists, preserve original numbering
        elements.push(
          <div key={elements.length} className="ml-4 mb-2">
            {currentListItems.map((item, idx) => (
              <div key={idx} className="mb-1 flex">
                <span className="font-semibold mr-2 flex-shrink-0">{item.number}</span>
                <div className="flex-1">{parseMarkdown(item.content)}</div>
              </div>
            ))}
          </div>
        )
      } else {
        // For unordered lists, use standard bullets
        elements.push(
          <ul key={elements.length} className="ml-4 mb-2 list-disc">
            {currentListItems.map((item, idx) => (
              <li key={idx} className="mb-1">{parseMarkdown(item.content)}</li>
            ))}
          </ul>
        )
      }
      currentListItems = []
      listType = null
    }
  }

  lines.forEach((line, index) => {
    const trimmedLine = line.trim()
    
    // Numbered list item - preserve original number
    const numberedMatch = trimmedLine.match(/^(\d+\.\s)(.*)/)
    if (numberedMatch) {
      if (listType !== 'ordered') {
        flushList()
        listType = 'ordered'
      }
      currentListItems.push({
        number: numberedMatch[1],
        content: numberedMatch[2]
      })
    }
    // Bullet list item
    else if (/^[-*]\s/.test(trimmedLine)) {
      if (listType !== 'unordered') {
        flushList()
        listType = 'unordered'
      }
      currentListItems.push({
        content: trimmedLine.replace(/^[-*]\s/, '')
      })
    }
    // Regular line
    else {
      flushList()
      if (trimmedLine) {
        elements.push(
          <p key={elements.length} className="mb-2 last:mb-0">
            {parseMarkdown(line)}
          </p>
        )
      } else if (index < lines.length - 1) {
        // Add spacing for empty lines (but not at the end)
        elements.push(<div key={elements.length} className="mb-2" />)
      }
    }
  })

  flushList() // Flush any remaining list items

  return <div>{elements}</div>
}

// Export utility functions
function exportToCSV(data: any[], filename: string = 'query-results') {
  if (!data || data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header]
        // Handle values that might contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value ?? ''
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

async function exportToExcel(data: any[], filename: string = 'query-results') {
  if (!data || data.length === 0) return

  try {
    // Dynamic import to avoid loading the library unless needed
    const XLSX = await import('xlsx')
    
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Results')
    
    // Auto-size columns
    const colWidths = Object.keys(data[0]).map(key => ({
      wch: Math.max(
        key.length,
        ...data.slice(0, 100).map(row => String(row[key] || '').length)
      )
    }))
    worksheet['!cols'] = colWidths
    
    XLSX.writeFile(workbook, `${filename}.xlsx`)
  } catch (error) {
    console.error('Failed to export to Excel:', error)
    // Fallback to CSV if Excel export fails
    exportToCSV(data, filename)
  }
}

// Error handling utility functions
function getErrorMessage(error: string, status?: number): string {
  switch (status) {
    case 503:
      return 'The AI service is currently unavailable. Please try again in a few moments.'
    case 408:
      return 'Your query is taking longer than expected. Please try a simpler question or try again later.'
    default:
      if (error.includes('timeout')) {
        return 'The request timed out. Please try a simpler query or check if all services are running.'
      }
      if (error.includes('unavailable')) {
        return 'The AI service is temporarily unavailable. Please try again later.'
      }
      return 'I encountered an error while processing your question. Please try again or rephrase your query.'
  }
}

function getNetworkErrorMessage(error: any): string {
  if (error?.message?.includes('fetch')) {
    return 'Unable to connect to the analytics service. Please check if all services are running and try again.'
  }
  if (error?.name === 'AbortError') {
    return 'The request was cancelled due to timeout. Please try a simpler query.'
  }
  return 'I encountered a network error. Please check your connection and try again.'
}

function ResultsTable({ results, queryId, question, sessionId, resultRowCount, isHistorical, onReExecuteQuery }: {
  results: any[] | 'historical',
  queryId?: string,
  question?: string,
  sessionId?: string,
  resultRowCount?: number,
  isHistorical?: boolean,
  onReExecuteQuery?: (question: string, queryId?: string) => void
}) {
  // Handle historical data
  if (results === 'historical') {
    return (
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">
              Historical Query Results
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {resultRowCount} rows returned
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          This query was executed previously and returned {resultRowCount} rows.
          Results are not stored for historical queries.
        </p>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReExecuteQuery?.(question || '', queryId)}
            className="text-xs"
            title="Re-execute this query to see current results"
            disabled={!question || !onReExecuteQuery}
          >
            <Database className="h-3 w-3 mr-1" />
            Re-execute Query
          </Button>
        </div>
      </div>
    )
  }

  if (!results || results.length === 0 || !results[0]) {
    return <p className="text-gray-500 text-sm">No results found.</p>
  }

  const columns = Object.keys(results[0])


  const handleExportCSV = () => {
    const filename = question
      ? `query-${queryId || Date.now()}-${question.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '-')}`
      : `query-results-${Date.now()}`
    exportToCSV(results, filename)
  }

  const handleExportExcel = () => {
    const filename = question
      ? `query-${queryId || Date.now()}-${question.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '-')}`
      : `query-results-${Date.now()}`
    exportToExcel(results, filename)
  }

  const handleDownloadCSV = async () => {
    if (!question) return
    
    try {
      const response = await fetch('/api/chat/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          format: 'csv',
          session_id: sessionId,
          user_id: 'default-user'
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `query-results-${Date.now()}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } else {
        console.error('Failed to download CSV')
      }
    } catch (error) {
      console.error('Error downloading CSV:', error)
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Export buttons */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
        <span className="text-sm font-medium text-gray-700">
          {results.length} rows
        </span>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs"
            title="Export current view as CSV"
          >
            <FileText className="h-3 w-3 mr-1" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="text-xs"
            title="Export current view as Excel"
          >
            <FileSpreadsheet className="h-3 w-3 mr-1" />
            Excel
          </Button>
          {question && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCSV}
              className="text-xs"
              title="Download complete results as CSV"
            >
              <Download className="h-3 w-3 mr-1" />
              Full CSV
            </Button>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto max-w-full">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              {columns.map((column) => (
                <TableHead key={column} className="font-medium whitespace-nowrap px-3 py-2 text-xs">
                  {column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.slice(0, 10).map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={column} className="px-3 py-2 text-xs max-w-[200px] truncate">
                    <div className="truncate" title={row[column]?.toString()}>
                      {typeof row[column] === 'number' && (column.toLowerCase().includes('amount') || column.toLowerCase().includes('spend') || column.toLowerCase().includes('total'))
                        ? formatCurrency(row[column])
                        : typeof row[column] === 'string' && row[column].match(/^\d{4}-\d{2}-\d{2}/)
                        ? formatDate(row[column])
                        : row[column]?.toString() || '-'
                      }
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {results.length > 10 && (
        <div className="p-3 bg-gray-50 text-sm text-gray-600 text-center">
          Showing first 10 of {results.length} results
        </div>
      )}
    </div>
  )
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load or create session on component mount
  useEffect(() => {
    initializeSession()
    loadUserSessions()
  }, [])

  // Load chat history when session changes
  useEffect(() => {
    if (currentSession) {
      loadSessionHistory(currentSession.id)
    }
  }, [currentSession])

  const initializeSession = async () => {
    try {
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'default-user', // You can implement proper user management
          title: `Chat Session ${new Date().toLocaleDateString()}`
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setCurrentSession(data.session)
      }
    } catch (error) {
      console.error('Failed to initialize session:', error)
    }
  }

  const loadUserSessions = async () => {
    try {
      const response = await fetch('/api/chat/sessions?user_id=default-user&limit=10')
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      }
    } catch (error) {
      console.error('Failed to load sessions:', error)
    }
  }

  const loadSessionHistory = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}/history?limit=50`)
      if (response.ok) {
        const data = await response.json()
        const historyMessages = data.history.map((query: any) => [
          {
            id: `user-${query.id}`,
            type: 'user' as const,
            content: query.question,
            timestamp: new Date(query.createdAt),
            queryId: query.id
          },
          {
            id: `assistant-${query.id}`,
            type: 'assistant' as const,
            content: query.explanation || 'Query executed successfully.',
            timestamp: new Date(query.createdAt),
            sql: query.generatedSql,
            results: query.resultRowCount > 0 ? 'historical' : null, // Mark as historical data
            error: query.executionError,
            queryId: query.id,
            resultRowCount: query.resultRowCount,
            isHistorical: true // Flag to indicate this is historical data
          }
        ]).flat().reverse() // Reverse to show oldest first
        
        setMessages(historyMessages)
      }
    } catch (error) {
      console.error('Failed to load session history:', error)
    }
  }

  const createNewSession = async () => {
    try {
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'default-user',
          title: `New Chat ${new Date().toLocaleTimeString()}`
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setCurrentSession(data.session)
        setMessages([])
        loadUserSessions() // Refresh sessions list
      }
    } catch (error) {
      console.error('Failed to create new session:', error)
    }
  }

  const switchToSession = async (session: ChatSession) => {
    setCurrentSession(session)
    setShowHistory(false)
  }

  const handleSendMessage = async (question: string = input) => {
    if (!question.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: question,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question,
          session_id: currentSession?.id,
          user_id: 'default-user'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      // Handle different response formats
      let assistantMessage: ChatMessage

      if (!data.success && data.error) {
        // Handle API errors with proper user messages
        assistantMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: data.explanation || getErrorMessage(data.error, response.status),
          timestamp: new Date(),
          error: data.error,
          queryId: data.metadata?.query_id
        }
      } else {
        // Handle successful responses
        assistantMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: data.explanation || data.response || 'I found some results for your query.',
          timestamp: new Date(),
          sql: data.sql_query,
          results: data.results?.success ? (data.results?.data || data.results) : null,
          error: data.error || (data.results?.success === false ? data.results?.error : null),
          queryId: data.metadata?.query_id
        }
      }

      setMessages(prev => [...prev, assistantMessage])
      
      // Refresh sessions list to update query count
      loadUserSessions()
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: getNetworkErrorMessage(error),
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    handleSendMessage(question)
  }

  // Function to re-execute a historical query
  const handleReExecuteQuery = async (question: string, queryId?: string) => {
    if (!question.trim()) return
    
    // Add a new user message for the re-executed query
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: `🔄 Re-executing: ${question}`,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question,
          session_id: currentSession?.id,
          user_id: 'default-user'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      // Handle the response similar to handleSendMessage
      let assistantMessage: ChatMessage

      if (!data.success && data.error) {
        assistantMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: data.explanation || getErrorMessage(data.error, response.status),
          timestamp: new Date(),
          error: data.error,
          queryId: data.metadata?.query_id
        }
      } else {
        assistantMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: data.explanation || data.response || 'I found some results for your re-executed query.',
          timestamp: new Date(),
          sql: data.sql_query,
          results: data.results?.success ? (data.results?.data || data.results) : null,
          error: data.error || (data.results?.success === false ? data.results?.error : null),
          queryId: data.metadata?.query_id
        }
      }

      setMessages(prev => [...prev, assistantMessage])
      loadUserSessions()
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: getNetworkErrorMessage(error),
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Chat with Data</h1>
              <p className="text-gray-600 text-sm mt-1">
                {currentSession ? `Session: ${currentSession.sessionName}` : 'Ask questions about your analytics data'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="hidden md:flex"
            >
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={createNewSession}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8 md:py-12">
                <MessageSquare className="h-10 w-10 md:h-12 md:w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
                <p className="text-gray-600 text-sm mb-6 px-4">Ask questions about your invoice data, spending patterns, or vendor analytics.</p>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] md:max-w-[85%] min-w-0 ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                  <div className={`flex items-start space-x-2 md:space-x-3 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center ${
                      message.type === 'user' ? 'bg-blue-600' : 'bg-gray-600'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="h-3 w-3 md:h-4 md:w-4 text-white" />
                      ) : (
                        <Bot className="h-3 w-3 md:h-4 md:w-4 text-white" />
                      )}
                    </div>
                    <div className={`flex-1 min-w-0 ${message.type === 'user' ? 'text-right' : ''}`}>
                      <div className={`inline-block p-2 md:p-3 rounded-lg max-w-full ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <div className="text-xs md:text-sm break-words">
                          {message.type === 'user' ? (
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          ) : (
                            parseMarkdownContent(message.content)
                          )}
                        </div>
                      </div>
                      
                      {/* SQL Query Display */}
                      {message.sql && (
                        <div className="mt-2 md:mt-3 max-w-full">
                          <Card className="overflow-hidden">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-xs md:text-sm flex items-center">
                                <Database className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                                Generated SQL
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                              <div className="overflow-x-auto">
                                <pre className="text-[10px] md:text-xs bg-gray-900 text-green-400 p-2 md:p-3 whitespace-pre-wrap break-all">
                                  {message.sql}
                                </pre>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}

                      {/* Results Display */}
                      {message.results && (
                        <div className="mt-2 md:mt-3 max-w-full">
                          <Card className="overflow-hidden">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-xs md:text-sm flex items-center">
                                <BarChart3 className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                                {message.results === 'historical'
                                  ? `Results (${message.resultRowCount || 0} rows - Historical)`
                                  : `Results (${Array.isArray(message.results) ? message.results.length : 0} rows)`
                                }
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-2 md:p-3">
                              <ResultsTable
                                results={message.results}
                                queryId={message.queryId}
                                question={messages.find(m => m.type === 'user' && m.timestamp <= message.timestamp)?.content}
                                sessionId={currentSession?.id}
                                resultRowCount={message.resultRowCount}
                                isHistorical={message.isHistorical}
                                onReExecuteQuery={handleReExecuteQuery}
                              />
                            </CardContent>
                          </Card>
                        </div>
                      )}

                      {/* Error Display */}
                      {message.error && (
                        <div className="mt-2 md:mt-3 max-w-full">
                          <Card className="border-red-200 overflow-hidden">
                            <CardContent className="pt-2 md:pt-3">
                              <p className="text-xs md:text-sm text-red-600 break-words">{message.error}</p>
                            </CardContent>
                          </Card>
                        </div>
                      )}

                      <p className="text-[10px] md:text-xs text-gray-500 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2 md:space-x-3">
                  <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-600 flex items-center justify-center">
                    <Bot className="h-3 w-3 md:h-4 md:w-4 text-white" />
                  </div>
                  <div className="bg-gray-100 p-2 md:p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                      <span className="text-xs md:text-sm text-gray-600">Analyzing your question...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 p-3 md:p-4 border-t bg-white">
            <div className="flex space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about your data..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isLoading}
                className="flex-1 text-sm"
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* History Sidebar - Desktop */}
        {showHistory && (
          <div className="hidden md:block w-80 flex-shrink-0 border-l bg-gray-50 overflow-y-auto">
            <div className="p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <History className="h-5 w-5 mr-2" />
                    Chat History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sessions.map((session) => (
                    <div key={session.id} className="border rounded-lg p-3 hover:bg-gray-100 cursor-pointer"
                         onClick={() => switchToSession(session)}>
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm truncate">{session.sessionName}</h4>
                        {currentSession?.id === session.id && (
                          <Badge variant="default" className="text-xs">Current</Badge>
                        )}
                      </div>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(session.lastUsedAt).toLocaleDateString()}
                      </div>
                      {session.queryCount && (
                        <p className="text-xs text-gray-500 mt-1">{session.queryCount} queries</p>
                      )}
                    </div>
                  ))}
                  {sessions.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No chat history yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Suggested Questions Sidebar - Desktop */}
        {!showHistory && (
          <div className="hidden md:block w-80 flex-shrink-0 border-l bg-gray-50 overflow-y-auto">
            <div className="p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Suggested Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {suggestedQuestions.map((suggestion) => (
                    <div key={suggestion.id}>
                      <Badge variant="outline" className="text-xs mb-2">
                        {suggestion.category}
                      </Badge>
                      <Button
                        variant="ghost"
                        className="w-full text-left justify-start h-auto p-3 text-sm whitespace-normal"
                        onClick={() => handleSuggestedQuestion(suggestion.question)}
                        disabled={isLoading}
                      >
                        {suggestion.question}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="md:hidden absolute inset-0 z-50 flex">
            <div className="flex-1 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
            <div className="w-80 bg-gray-50 overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex space-x-2">
                    <Button
                      variant={showHistory ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setShowHistory(true)}
                    >
                      <History className="h-4 w-4 mr-1" />
                      History
                    </Button>
                    <Button
                      variant={!showHistory ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setShowHistory(false)}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Suggestions
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
                    ×
                  </Button>
                </div>

                {showHistory ? (
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        createNewSession()
                        setSidebarOpen(false)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Chat
                    </Button>
                    {sessions.map((session) => (
                      <div key={session.id} className="border rounded-lg p-3 hover:bg-gray-100 cursor-pointer"
                           onClick={() => {
                             switchToSession(session)
                             setSidebarOpen(false)
                           }}>
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm truncate">{session.sessionName}</h4>
                          {currentSession?.id === session.id && (
                            <Badge variant="default" className="text-xs">Current</Badge>
                          )}
                        </div>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(session.lastUsedAt).toLocaleDateString()}
                        </div>
                        {session.queryCount && (
                          <p className="text-xs text-gray-500 mt-1">{session.queryCount} queries</p>
                        )}
                      </div>
                    ))}
                    {sessions.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No chat history yet</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {suggestedQuestions.map((suggestion) => (
                      <div key={suggestion.id}>
                        <Badge variant="outline" className="text-xs mb-2">
                          {suggestion.category}
                        </Badge>
                        <Button
                          variant="ghost"
                          className="w-full text-left justify-start h-auto p-3 text-sm whitespace-normal"
                          onClick={() => {
                            handleSuggestedQuestion(suggestion.question)
                            setSidebarOpen(false)
                          }}
                          disabled={isLoading}
                        >
                          {suggestion.question}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}