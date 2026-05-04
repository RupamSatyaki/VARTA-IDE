import { Menu, MenuItem, BrowserWindow, MenuItemConstructorOptions } from 'electron'

export interface ContextMenuOptions {
  items: ContextMenuItem[]
  x?:    number
  y?:    number
}

export interface ContextMenuItem {
  label?:    string
  type?:     'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio'
  enabled?:  boolean
  checked?:  boolean
  submenu?:  ContextMenuItem[]
  action?:   string   // sent back to renderer via webContents.send
}

export function showContextMenu(
  win:     BrowserWindow,
  options: ContextMenuOptions,
): void {
  const buildItems = (items: ContextMenuItem[]): MenuItemConstructorOptions[] =>
    items.map((item): MenuItemConstructorOptions => {
      if (item.type === 'separator') {
        return { type: 'separator' }
      }
      return {
        label:   item.label,
        type:    item.type ?? 'normal',
        enabled: item.enabled ?? true,
        checked: item.checked,
        submenu: item.submenu ? buildItems(item.submenu) : undefined,
        click:   item.action
          ? () => win.webContents.send('CONTEXT_MENU:ACTION', item.action)
          : undefined,
      }
    })

  const menu = Menu.buildFromTemplate(buildItems(options.items))
  menu.popup({ window: win, x: options.x, y: options.y })
}
