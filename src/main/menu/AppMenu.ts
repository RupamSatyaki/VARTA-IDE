import { app, Menu, MenuItemConstructorOptions, BrowserWindow, shell } from 'electron'
import { WindowChannel } from '../../shared/ipc'

export function buildAppMenu(mainWindow: BrowserWindow): void {
  const isMac = process.platform === 'darwin'

  const send = (channel: string) => () => {
    mainWindow.webContents.send(channel)
  }

  const template: MenuItemConstructorOptions[] = [
    // ── macOS app menu ───────────────────────────────────────────────────────
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' as const },
        { type: 'separator' as const },
        { role: 'services' as const },
        { type: 'separator' as const },
        { role: 'hide' as const },
        { role: 'hideOthers' as const },
        { role: 'unhide' as const },
        { type: 'separator' as const },
        { role: 'quit' as const },
      ],
    }] : []),

    // ── File ─────────────────────────────────────────────────────────────────
    {
      label: 'File',
      submenu: [
        { label: 'New File',    accelerator: 'CmdOrCtrl+N',       click: send('varta.file.newFile') },
        { label: 'Open File…',  accelerator: 'CmdOrCtrl+O',       click: send('varta.file.openFile') },
        { label: 'Open Folder…',accelerator: 'CmdOrCtrl+K CmdOrCtrl+O', click: send('varta.file.openFolder') },
        { type: 'separator' },
        { label: 'Save',        accelerator: 'CmdOrCtrl+S',       click: send('varta.file.save') },
        { label: 'Save All',    accelerator: 'CmdOrCtrl+K S',     click: send('varta.file.saveAll') },
        { label: 'Save As…',    accelerator: 'CmdOrCtrl+Shift+S', click: send('varta.file.saveAs') },
        { type: 'separator' },
        { label: 'Close Editor',accelerator: 'CmdOrCtrl+W',       click: send('varta.file.close') },
        { type: 'separator' },
        isMac ? { role: 'close' as const } : { role: 'quit' as const },
      ],
    },

    // ── Edit ─────────────────────────────────────────────────────────────────
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' as const },
        { role: 'redo' as const },
        { type: 'separator' },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const },
        { type: 'separator' },
        { label: 'Find',        accelerator: 'CmdOrCtrl+F',       click: send('varta.edit.find') },
        { label: 'Replace',     accelerator: 'CmdOrCtrl+H',       click: send('varta.edit.replace') },
        { label: 'Find in Files', accelerator: 'CmdOrCtrl+Shift+F', click: send('varta.view.search') },
        { type: 'separator' },
        { label: 'Format Document', accelerator: 'Shift+Alt+F',   click: send('varta.edit.formatDocument') },
      ],
    },

    // ── View ─────────────────────────────────────────────────────────────────
    {
      label: 'View',
      submenu: [
        { label: 'Command Palette', accelerator: 'CmdOrCtrl+Shift+P', click: send('varta.view.commandPalette') },
        { label: 'Quick Open',      accelerator: 'CmdOrCtrl+P',       click: send('varta.view.quickOpen') },
        { type: 'separator' },
        { label: 'Explorer',        accelerator: 'CmdOrCtrl+Shift+E', click: send('varta.view.explorer') },
        { label: 'Search',          accelerator: 'CmdOrCtrl+Shift+F', click: send('varta.view.search') },
        { label: 'Source Control',  accelerator: 'CmdOrCtrl+Shift+G', click: send('varta.view.git') },
        { label: 'Extensions',      accelerator: 'CmdOrCtrl+Shift+X', click: send('varta.view.extensions') },
        { label: 'AI Assistant',    accelerator: 'CmdOrCtrl+Shift+A', click: send('varta.view.ai') },
        { type: 'separator' },
        { label: 'Toggle Sidebar',  accelerator: 'CmdOrCtrl+B',       click: send('varta.view.toggleSidebar') },
        { label: 'Toggle Terminal', accelerator: 'CmdOrCtrl+`',       click: send('varta.view.toggleTerminal') },
        { label: 'Toggle Panel',    accelerator: 'CmdOrCtrl+J',       click: send('varta.view.togglePanel') },
        { type: 'separator' },
        { label: 'Toggle Full Screen', accelerator: 'F11',
          click: () => mainWindow.setFullScreen(!mainWindow.isFullScreen()) },
        { role: 'resetZoom' as const },
        { role: 'zoomIn' as const },
        { role: 'zoomOut' as const },
        { type: 'separator' },
        ...(process.env.NODE_ENV === 'development'
          ? [{ role: 'toggleDevTools' as const }]
          : []),
      ],
    },

    // ── Go ───────────────────────────────────────────────────────────────────
    {
      label: 'Go',
      submenu: [
        { label: 'Go to File…',     accelerator: 'CmdOrCtrl+P',       click: send('varta.view.quickOpen') },
        { label: 'Go to Symbol…',   accelerator: 'CmdOrCtrl+Shift+O', click: send('varta.go.symbol') },
        { label: 'Go to Line…',     accelerator: 'CmdOrCtrl+G',       click: send('varta.go.line') },
        { label: 'Go to Definition',accelerator: 'F12',                click: send('varta.go.definition') },
        { type: 'separator' },
        { label: 'Back',            accelerator: 'Alt+Left',           click: send('varta.go.back') },
        { label: 'Forward',         accelerator: 'Alt+Right',          click: send('varta.go.forward') },
      ],
    },

    // ── Terminal ─────────────────────────────────────────────────────────────
    {
      label: 'Terminal',
      submenu: [
        { label: 'New Terminal',    accelerator: 'CmdOrCtrl+Shift+`',  click: send('varta.terminal.new') },
        { label: 'Split Terminal',                                      click: send('varta.terminal.split') },
        { label: 'Kill Terminal',                                       click: send('varta.terminal.kill') },
      ],
    },

    // ── Help ─────────────────────────────────────────────────────────────────
    {
      label: 'Help',
      submenu: [
        { label: 'About Varta', click: () => {
          // Renderer handles this via command palette
          mainWindow.webContents.send('varta.help.about')
        }},
        { label: 'Report Issue', click: () => {
          shell.openExternal('https://github.com/varta-editor/varta/issues').catch(() => {})
        }},
        { type: 'separator' },
        { label: 'Toggle Developer Tools', accelerator: 'F12',
          click: () => mainWindow.webContents.toggleDevTools() },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
