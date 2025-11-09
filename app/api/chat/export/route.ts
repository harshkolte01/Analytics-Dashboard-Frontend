import { NextResponse } from 'next/server'

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000'
const REQUEST_TIMEOUT = 45000 // 45 seconds

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { question, format = 'csv', session_id, user_id } = body
    
    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      )
    }

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

    // Make request to backend API with CSV format
    const response = await fetch(`${API_BASE_URL}/api/chat/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        format,
        session_id,
        user_id,
        include_explanation: false,
        execute_query: true
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Export API error ${response.status}:`, errorText)
      
      if (response.status === 503) {
        return NextResponse.json({
          error: 'AI service is currently unavailable',
          message: 'Cannot export data while the AI service is down. Please try again later.'
        }, { status: 503 })
      }
      
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()

    if (format === 'csv' && data.results && typeof data.results === 'string') {
      // Return CSV data with proper headers
      return new NextResponse(data.results, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="query-results-${Date.now()}.csv"`
        }
      })
    }

    // For other formats or if CSV is not a string, return JSON
    return NextResponse.json(data)
    
  } catch (error: any) {
    console.error('Error exporting query results:', error)
    
    if (error.name === 'AbortError') {
      return NextResponse.json({
        error: 'Export timeout',
        message: 'The export request is taking too long. Please try a simpler query.'
      }, { status: 408 })
    }
    
    if (error.message?.includes('fetch')) {
      return NextResponse.json({
        error: 'Service unavailable',
        message: 'Unable to connect to the analytics service for export.'
      }, { status: 503 })
    }
    
    return NextResponse.json({
      error: 'Failed to export query results',
      message: error instanceof Error ? error.message : 'Unknown error occurred during export'
    }, { status: 500 })
  }
}