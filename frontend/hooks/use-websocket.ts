"use client"

import { useEffect, useRef, useState, useCallback } from "react"

export function useWebSocket(url: string) {
  const [lastMessage, setLastMessage] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  const connect = useCallback(() => {
    // In a real implementation, this would connect to a WebSocket server
    // For now, we'll simulate WebSocket behavior with a mock connection
    console.log("[v0] WebSocket connecting to:", url)

    // Simulate connection
    setIsConnected(true)

    // Mock WebSocket for development
    const mockWs = {
      send: (data: string) => {
        console.log("[v0] WebSocket send:", data)
        // In production, this would send to actual WebSocket server
      },
      close: () => {
        console.log("[v0] WebSocket closed")
        setIsConnected(false)
      },
    }

    wsRef.current = mockWs as any

    return mockWs
  }, [url])

  useEffect(() => {
    const ws = connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      ws.close()
    }
  }, [connect])

  const sendMessage = useCallback(
    (message: string) => {
      if (wsRef.current && isConnected) {
        wsRef.current.send(message)
      }
    },
    [isConnected],
  )

  return {
    sendMessage,
    lastMessage,
    isConnected,
  }
}
