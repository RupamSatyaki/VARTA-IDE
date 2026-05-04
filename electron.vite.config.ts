import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
        '@main':   resolve('src/main'),
      }
    },
    build: {
      rollupOptions: {
        external: ['node-pty', 'electron-devtools-installer']
      }
    }
  },

  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared':  resolve('src/shared'),
        '@preload': resolve('src/preload'),
      }
    }
  },

  renderer: {
    root: 'src/renderer',
    resolve: {
      alias: {
        '@renderer':   resolve('src/renderer'),
        '@shared':     resolve('src/shared'),
        '@components': resolve('src/renderer/components'),
        '@store':      resolve('src/renderer/store'),
        '@hooks':      resolve('src/renderer/hooks'),
        '@utils':      resolve('src/renderer/utils'),
        '@assets':     resolve('src/renderer/assets'),
      }
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        input: {
          index: resolve('src/renderer/index.html')
        }
      }
    },
    worker: {
      format: 'es',
    },
    optimizeDeps: {
      include: [
        'monaco-editor/esm/vs/editor/editor.worker',
        'monaco-editor/esm/vs/language/json/json.worker',
        'monaco-editor/esm/vs/language/css/css.worker',
        'monaco-editor/esm/vs/language/html/html.worker',
        'monaco-editor/esm/vs/language/typescript/ts.worker',
      ],
    },
  }
})
