/**
 * Command Registry — central hub for all executable commands in Varta.
 * Commands are registered at app startup and executed by the command palette
 * and keybinding system.
 */

export interface Command {
  id:          string
  label:       string
  category:    string
  keybinding?: string
  icon?:       string
  execute:     () => void | Promise<void>
}

class CommandRegistry {
  private commands     = new Map<string, Command>()
  private recentlyUsed: string[] = []
  private readonly MAX_RECENT = 10

  register(command: Command): void {
    this.commands.set(command.id, command)
  }

  unregister(id: string): void {
    this.commands.delete(id)
  }

  async execute(id: string): Promise<void> {
    const cmd = this.commands.get(id)
    if (!cmd) { return }

    // Track recently used
    this.recentlyUsed = [id, ...this.recentlyUsed.filter((x) => x !== id)]
      .slice(0, this.MAX_RECENT)

    await cmd.execute()
  }

  search(query: string): Command[] {
    const q = query.toLowerCase().trim()
    if (!q) { return this.getAll() }

    return Array.from(this.commands.values()).filter((cmd) =>
      cmd.label.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      cmd.id.toLowerCase().includes(q)
    )
  }

  getAll(): Command[] {
    return Array.from(this.commands.values())
  }

  getRecentlyUsed(): Command[] {
    return this.recentlyUsed
      .map((id) => this.commands.get(id))
      .filter((c): c is Command => c !== undefined)
  }

  getByCategory(): Map<string, Command[]> {
    const map = new Map<string, Command[]>()
    for (const cmd of this.commands.values()) {
      const list = map.get(cmd.category) ?? []
      list.push(cmd)
      map.set(cmd.category, list)
    }
    return map
  }

  has(id: string): boolean {
    return this.commands.has(id)
  }
}

export const registry = new CommandRegistry()
