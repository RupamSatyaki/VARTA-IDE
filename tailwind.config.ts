import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/renderer/**/*.{ts,tsx,html}',
    './src/renderer/index.html'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // All colors reference CSS variables so themes can swap them at runtime
        'varta-bg':          'var(--varta-bg)',
        'varta-bg-secondary':'var(--varta-bg-secondary)',
        'varta-bg-tertiary': 'var(--varta-bg-tertiary)',
        'varta-border':      'var(--varta-border)',
        'varta-text':        'var(--varta-text)',
        'varta-text-muted':  'var(--varta-text-muted)',
        'varta-text-faint':  'var(--varta-text-faint)',
        'varta-accent':      'var(--varta-accent)',
        'varta-accent-hover':'var(--varta-accent-hover)',
        'varta-success':     'var(--varta-success)',
        'varta-warning':     'var(--varta-warning)',
        'varta-error':       'var(--varta-error)',
        'varta-info':        'var(--varta-info)',
        'varta-selection':   'var(--varta-selection)',
        'varta-hover':       'var(--varta-hover)',
        'varta-active':      'var(--varta-active)',
        'varta-tab-active':  'var(--varta-tab-active)',
        'varta-tab-inactive':'var(--varta-tab-inactive)',
        'varta-sidebar':     'var(--varta-sidebar)',
        'varta-activitybar': 'var(--varta-activitybar)',
        'varta-statusbar':   'var(--varta-statusbar)',
        'varta-panel':       'var(--varta-panel)',
        'varta-titlebar':    'var(--varta-titlebar)'
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      fontSize: {
        'editor': 'var(--varta-editor-font-size)',
        'ui':     'var(--varta-ui-font-size)'
      },
      spacing: {
        'sidebar-width':  'var(--varta-sidebar-width)',
        'activitybar-width': 'var(--varta-activitybar-width)',
        'statusbar-height':  'var(--varta-statusbar-height)',
        'titlebar-height':   'var(--varta-titlebar-height)',
        'tab-height':        'var(--varta-tab-height)',
        'panel-height':      'var(--varta-panel-height)'
      },
      animation: {
        'fade-in':    'fadeIn 0.15s ease-in-out',
        'slide-down': 'slideDown 0.15s ease-in-out',
        'slide-up':   'slideUp 0.15s ease-in-out',
        'spin-slow':  'spin 2s linear infinite'
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideDown: {
          '0%':   { transform: 'translateY(-4px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' }
        },
        slideUp: {
          '0%':   { transform: 'translateY(4px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',   opacity: '1' }
        }
      },
      borderRadius: {
        'varta': 'var(--varta-border-radius)'
      },
      boxShadow: {
        'varta-sm':  'var(--varta-shadow-sm)',
        'varta-md':  'var(--varta-shadow-md)',
        'varta-lg':  'var(--varta-shadow-lg)',
        'varta-popup': 'var(--varta-shadow-popup)'
      }
    }
  },
  plugins: []
}

export default config
