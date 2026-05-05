# AI Integration

Varta integrates with Anthropic's Claude models to provide AI-powered coding assistance. Features include a chat panel, inline ghost text suggestions, right-click context actions, and AI-generated commit messages.

## Getting an API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign in or create an account
3. Navigate to **API Keys** → **Create Key**
4. Copy the key (starts with `sk-ant-api03-...`)

Keep your key secure — it grants access to your Anthropic account and incurs usage charges.

## Setting Your API Key in Varta

1. Open Settings: `Ctrl+,`
2. Scroll to the **AI** section
3. Paste your key into the **API Key** field
4. Press Enter or click outside the field

The key is stored securely in the main process via `electron-store`. It is never returned to the renderer — the renderer only receives a boolean indicating whether a key is set. See [Security Model](../architecture/security-model.md#ai-api-key-security) for details.

## AI Chat Panel

### Opening the Chat

- **Keyboard:** `Ctrl+Shift+A`
- **Sidebar:** Click the robot icon
- **Command Palette:** `Ctrl+Shift+P` → `AI: Open Chat`

### Editor Context

Every message you send automatically includes context about your current editor state:

| Context Field | Description |
|---|---|
| `activeFilePath` | Path of the currently open file |
| `activeFileContent` | Full content of the active file |
| `selectedText` | Currently selected text (if any) |
| `cursorLine` | Current cursor line number |
| `language` | Detected language of the active file |
| `diagnostics` | Monaco editor errors and warnings |
| `projectRoot` | Root path of the open folder |
| `openTabs` | List of currently open file paths |

This context is injected into the system prompt automatically. You don't need to paste code into the chat — the AI already knows what you're working on.

### Sending Messages

Type your message in the input field at the bottom of the chat panel and press `Enter` (or `Shift+Enter` for a new line). The AI response streams in real time.

Example prompts:
- `Explain what this function does`
- `Add error handling to the selected code`
- `Write a unit test for this module`
- `Refactor this to use async/await`
- `What's causing the TypeScript error on line 42?`

### Streaming Architecture

```
Renderer                    Main Process (AIService)
   │                                │
   │  ai.sendMessage(messages)      │
   ├──────────────────────────────►│
   │                                │ POST /v1/messages (streaming)
   │                                │ Anthropic API
   │◄── STREAM_CHUNK (delta 1) ─────┤
   │◄── STREAM_CHUNK (delta 2) ─────┤
   │◄── STREAM_CHUNK (delta 3) ─────┤
   │         ...                    │
   │◄── STREAM_END ─────────────────┤
```

Each `STREAM_CHUNK` event contains a text delta. The renderer appends each chunk to the current message in `useAIStore.streamingContent`. On `STREAM_END`, the streaming content is finalized into a permanent message.

### Response Action Buttons

The AI can include special tags in its responses that render as interactive buttons:

#### `<varta:replace>` — Apply Code

```
Here's the updated function with error handling:

<varta:replace>
export async function fetchUser(id: string) {
  try {
    const response = await fetch(`/api/users/${id}`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } catch (err) {
    console.error('fetchUser failed:', err)
    throw err
  }
}
</varta:replace>
```

Clicking **Apply** replaces the selected text in the editor with the code block content. If no text is selected, it inserts at the cursor position.

#### `<varta:terminal>` — Run Command

```
Install the missing dependency:

<varta:terminal>npm install zod</varta:terminal>
```

Clicking **Run** sends the command to the active terminal session.

#### `<varta:newfile>` — Create File

```
Create a new test file:

<varta:newfile path="src/utils/__tests__/helpers.test.ts">
import { formatDate } from '../helpers'

describe('formatDate', () => {
  it('formats a date correctly', () => {
    expect(formatDate(new Date('2024-01-15'))).toBe('Jan 15, 2024')
  })
})
</varta:newfile>
```

Clicking **Create File** writes the file to disk at the specified path (relative to project root).

### Chat Toolbar

The chat toolbar provides:

| Button | Action |
|---|---|
| Model selector | Switch between claude-sonnet-4-5 and claude-haiku-3-5 |
| Clear chat | Clear all messages |
| Copy last response | Copy the last AI message to clipboard |
| Cancel | Cancel the current streaming response |

## Inline Ghost Text Hints

Inline hints provide AI-powered code completions that appear as ghost text in the editor, similar to GitHub Copilot.

### How It Works

1. You stop typing for 600ms (configurable via `ai.inlineHintDelay`)
2. Varta sends the text before and after the cursor to `AIService.generateInlineHint()`
3. The AI returns a completion suggestion
4. The suggestion appears as gray ghost text after the cursor

```typescript
// You type:
function calculateTax(amount: number) {
  // cursor is here

// Ghost text appears:
function calculateTax(amount: number) {
  return amount * 0.1  // ← ghost text (gray, not yet accepted)
}
```

### Accepting and Dismissing

| Key | Action |
|---|---|
| `Tab` | Accept the full suggestion |
| `→` (right arrow) | Accept one word at a time |
| `Escape` | Dismiss the suggestion |
| Any other key | Dismiss and continue typing |

### Model

Inline hints use `claude-haiku-3-5` (fast, low-latency) rather than the chat model. This keeps hint latency low (typically 200–500ms).

### Enabling/Disabling

Toggle inline hints in Settings → AI → "Enable inline hints", or via `ai.inlineHintsEnabled`.

## Right-Click AI Actions in Monaco

Right-clicking in the editor shows AI actions in the context menu:

| Action | Description |
|---|---|
| **Explain Selection** | Explain what the selected code does |
| **Refactor Selection** | Suggest refactoring improvements |
| **Fix Errors** | Fix Monaco-reported errors in selection |
| **Generate Tests** | Write unit tests for the selection |
| **Add Documentation** | Add JSDoc/docstring to the selection |
| **Ask AI About Selection** | Open chat with selection pre-quoted |

These actions open the AI chat panel with the selected code and a pre-filled prompt.

## AI Commit Message Generation

In the Git panel, click **✨ Generate** above the commit message field to generate a commit message from your staged diff.

The AI analyzes the diff and generates a message following the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
feat(auth): add JWT refresh token rotation

- Implement sliding window refresh token expiry
- Add token blacklist for revoked tokens
- Update auth middleware to handle refresh flow
```

You can edit the generated message before committing.

## Models

| Model | Used For | Speed | Quality |
|---|---|---|---|
| `claude-sonnet-4-5` | AI Chat | Medium | High |
| `claude-haiku-3-5` | Inline hints, commit messages | Fast | Good |

Switch the chat model in the chat toolbar or via `ai.chatModel` in settings.

## Related

- [Security Model](../architecture/security-model.md) — API key storage
- [Git Integration](./git-integration.md) — AI commit message generation
- [Settings](./settings.md) — AI configuration options
- [IPC Contract](../architecture/ipc-contract.md) — AIChannel (10 channels)
