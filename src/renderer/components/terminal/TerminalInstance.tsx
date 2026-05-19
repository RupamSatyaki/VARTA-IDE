import React, { useRef, useEffect, useCallback } from 'react'
import { Terminal }      from '@xterm/xterm'
import { FitAddon }      from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'   // RC4: import CSS directly here as well
import { useSettingsStore } from '../../store/settingsStore'
import { TerminalContextMenu } from './TerminalContextMenu'

export interface TerminalInstanceProps {
  terminalId: string
  isActive:   boolean
}

export function TerminalInstance({ terminalId, isActive }: TerminalInstanceProps) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const xtermRef      = useRef<Terminal | null>(null)
  const fitAddonRef   = useRef<FitAddon | null>(null)
  const { settings }  = useSettingsStore()

  // ── Mount xterm ONCE per terminalId ──────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container) { return }

    const ts = settings.terminal

    const xterm = new Terminal({
      theme: {
        background:          '#1e1b24',
        foreground:          '#e0def4',
        cursor:              '#a074c4',
        cursorAccent:        '#1e1b24',
        selectionBackground: 'rgba(160, 116, 196, 0.25)',
        black:               '#1e1b24',
        red:                 '#f44747',
        green:               '#4ec9b0',
        yellow:              '#ff8c00',
        blue:                '#569cd6',
        magenta:             '#a074c4',
        cyan:                '#4fc1ff',
        white:               '#e0def4',
        brightBlack:         '#6e6a86',
        brightRed:           '#f44747',
        brightGreen:         '#4ec9b0',
        brightYellow:        '#ff8c00',
        brightBlue:          '#569cd6',
        brightMagenta:       '#b58cd6',
        brightCyan:          '#4fc1ff',
        brightWhite:         '#ffffff',
      },
      fontFamily:       ts.fontFamily,
      fontSize:         ts.fontSize,
      lineHeight:       ts.lineHeight,
      cursorBlink:      ts.cursorBlinking === 'blink',
      cursorStyle:      ts.cursorStyle as 'block' | 'underline' | 'bar',
      scrollback:       ts.scrollback,
      allowProposedApi: true,
      convertEol:       true,
    })

    const fitAddon      = new FitAddon()
    const webLinksAddon = new WebLinksAddon()

    xterm.loadAddon(fitAddon)
    xterm.loadAddon(webLinksAddon)

    // RC1 FIX: open() FIRST, then fit() inside requestAnimationFrame
    // so the container has real pixel dimensions
    xterm.open(container)

    requestAnimationFrame(() => {
      try {
        fitAddon.fit()
        window.varta.terminal.resize({
          id:   terminalId,
          cols: xterm.cols,
          rows: xterm.rows,
        }).catch(() => {})
      } catch { /* ignore */ }
    })

    xtermRef.current    = xterm
    fitAddonRef.current = fitAddon

    // ── xterm → PTY ───────────────────────────────────────────────────────
    xterm.onData((data) => {
      window.varta.terminal.write({ id: terminalId, data }).catch(() => {})
    })

    // ── PTY → xterm (RC5: log for debugging) ─────────────────────────────
    const offData = window.varta.terminal.onData((event) => {
      if (event.id !== terminalId) { return }
      xterm.write(event.data)
    })

    // ── PTY exit ──────────────────────────────────────────────────────────
    const offExit = window.varta.terminal.onExit((event) => {
      if (event.id !== terminalId) { return }
      xterm.write('\r\n\x1b[31mProcess exited (code: ' + (event.exitCode ?? 0) + ')\x1b[0m\r\n')
    })

    // ── ResizeObserver ────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        if (!fitAddonRef.current || !xtermRef.current) { return }
        try {
          fitAddonRef.current.fit()
          window.varta.terminal.resize({
            id:   terminalId,
            cols: xtermRef.current.cols,
            rows: xtermRef.current.rows,
          }).catch(() => {})
        } catch { /* ignore during unmount */ }
      })
    })
    ro.observe(container)

    // ── Clear event ───────────────────────────────────────────────────────
    const handleClearEvent = (e: Event) => {
      if ((e as CustomEvent).detail?.id === terminalId) {
        xterm.clear()
      }
    }
    window.addEventListener('varta:terminal:clear', handleClearEvent)

    return () => {
      offData()
      offExit()
      ro.disconnect()
      window.removeEventListener('varta:terminal:clear', handleClearEvent)
      xterm.dispose()
      xtermRef.current    = null
      fitAddonRef.current = null
    }
  }, [terminalId]) // one instance per terminalId

  // ── Refit when becoming active ────────────────────────────────────────────
  useEffect(() => {
    if (!isActive) { return }
    requestAnimationFrame(() => {
      if (!fitAddonRef.current || !xtermRef.current) { return }
      try {
        fitAddonRef.current.fit()
        window.varta.terminal.resize({
          id:   terminalId,
          cols: xtermRef.current.cols,
          rows: xtermRef.current.rows,
        }).catch(() => {})
        xtermRef.current.focus()
      } catch { /* ignore */ }
    })
  }, [isActive, terminalId])

  // ── Context menu ──────────────────────────────────────────────────────────
  const handleCopy = useCallback(() => {
    const sel = xtermRef.current?.getSelection()
    if (sel) { navigator.clipboard.writeText(sel).catch(() => {}) }
  }, [])

  const handlePaste = useCallback(() => {
    navigator.clipboard.readText()
      .then((text) => window.varta.terminal.write({ id: terminalId, data: text }))
      .catch(() => {})
  }, [terminalId])

  const handleClear      = useCallback(() => { xtermRef.current?.clear() }, [])
  const handleSelectAll  = useCallback(() => { xtermRef.current?.selectAll() }, [])

  return (
    <TerminalContextMenu
      onCopy={handleCopy}
      onPaste={handlePaste}
      onClear={handleClear}
      onSelectAll={handleSelectAll}
    >
      {/*
       * RC1 FIX: Container MUST have explicit width/height.
       * minHeight ensures xterm gets real dimensions even before flex settles.
       * No display:none here — visibility is controlled by the parent wrapper.
       */}
      <div
        ref={containerRef}
        style={{
          width:           '100%',
          height:          '100%',
          minHeight:       '100px',
          overflow:        'hidden',
          padding:         '4px 8px',
          boxSizing:       'border-box',
          backgroundColor: 'var(--varta-bg)',
        }}
      />
    </TerminalContextMenu>
  )
}
