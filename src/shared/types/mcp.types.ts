/** Core MCP types for Varta IDE */

export interface MCPToolDefinition {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, any>
    required?: string[]
  }
}

export interface MCPToolResult {
  content: Array<{
    type: 'text'
    text: string
  }>
  isError?: boolean
}

export interface MCPToolHandler {
  definition: MCPToolDefinition
  execute: (args: any) => Promise<MCPToolResult>
}
