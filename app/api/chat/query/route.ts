import { NextResponse } from 'next/server'

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000'
const REQUEST_TIMEOUT = 45000 // 45 seconds

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
    
    const response = await fetch(`${API_BASE_URL}/api/chat/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API error ${response.status}:`, errorText)
      
      // Return a more user-friendly error based on status
      if (response.status === 503) {
        return NextResponse.json({
          success: false,
          error: 'AI service is currently unavailable',
          explanation: 'The AI service is temporarily down. Please try again in a few moments.',
          timestamp: new Date().toISOString()
        }, { status: 503 })
      }
      
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error: any) {
    console.error('Error processing chat query:', error)
    
    // Handle different types of errors
    if (error.name === 'AbortError') {
      return NextResponse.json({
        success: false,
        error: 'Request timeout',
        explanation: 'Your query is taking longer than expected. Please try a simpler question or try again later.',
        timestamp: new Date().toISOString()
      }, { status: 408 })
    }
    
    if (error.message?.includes('fetch')) {
      return NextResponse.json({
        success: false,
        error: 'Service unavailable',
        explanation: 'Unable to connect to the analytics service. Please check if all services are running.',
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process your question',
      explanation: 'I encountered an error while processing your question. Please try again or rephrase your query.',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}