import { useState, useCallback, useEffect } from 'react'
import type { MCPToolDefinition, MCPToolResult } from '../../shared/types/mcp.types'

/**
 * Hook to interact with Varta's MCP (Model Context Protocol) system.
 */
export function useMCP() {
  const [tools, setTools] = useState<MCPToolDefinition[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshTools = useCallback(async () => {
    try {
      setLoading(true)
      const toolDefs = await window.varta.mcp.listTools()
      setTools(toolDefs)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const callTool = useCallback(async (name: string, args: any): Promise<MCPToolResult> => {
    try {
      setLoading(true)
      const result = await window.varta.mcp.callTool(name, args)
      return result
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Error calling tool ${name}: ${err.message}` }]
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    refreshTools()
  }, [refreshTools])

  return {
    tools,
    loading,
    error,
    refreshTools,
    callTool
  }
}
