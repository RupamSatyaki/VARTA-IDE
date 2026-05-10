import { MCPToolHandler } from '../../../shared/types/mcp.types'
import { allTools } from '../tools'
import { logger } from '../../utils/logger'

export class ToolRegistry {
  private tools = new Map<string, MCPToolHandler>()

  constructor() {
    this.registerAll(allTools)
    logger.info('ToolRegistry', 'Initialized with core tools')
  }

  register(handler: MCPToolHandler) {
    this.tools.set(handler.definition.name, handler)
  }

  registerAll(handlers: MCPToolHandler[]) {
    for (const handler of handlers) {
      this.register(handler)
    }
  }

  getToolDefinitions() {
    return Array.from(this.tools.values()).map(t => t.definition)
  }

  async executeTool(name: string, args: any) {
    const tool = this.tools.get(name)
    if (!tool) {
      throw new Error(`Tool not found: ${name}`)
    }
    return await tool.execute(args)
  }
}

export const toolRegistry = new ToolRegistry()
