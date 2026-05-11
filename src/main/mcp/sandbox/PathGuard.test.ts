import { describe, it, expect, vi } from 'vitest'
import { PathGuard } from './PathGuard'
import path from 'path'

vi.mock('electron', () => ({
  app: {
    varta_workspaceRoot: path.normalize('/mock/workspace')
  }
}))

describe('PathGuard', () => {
  it('should validate paths within the workspace', () => {
    const safePath = 'src/index.ts'
    const result = PathGuard.validate(safePath)
    expect(result).toContain(path.normalize(safePath))
  })

  it('should throw error for paths outside workspace', () => {
    const dangerousPath = '../../etc/passwd'
    expect(() => PathGuard.validate(dangerousPath)).toThrow(/Security Violation/)
  })

  it('should handle absolute paths correctly', () => {
    const absoluteSafePath = path.normalize('/mock/workspace/src/app.ts')
    const result = PathGuard.validate(absoluteSafePath)
    expect(result).toBe(absoluteSafePath)
  })
})
