import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import { functionsScanner, copyFile } from "wpsjs/vite_plugins"

// https://vitejs.dev/config/
export default defineConfig({
    base: './',
    plugins: [
        copyFile({ src: 'manifest.xml', dest: 'manifest.xml', }),
        copyFile({ src: 'js', dest: 'js', }),
        copyFile({ src: 'images', dest: 'images', }),
        copyFile({ src: 'ui', dest: 'ui', }),
        copyFile({ src: 'main.js', dest: 'main.js', }),
        copyFile({ src: 'ribbon.xml', dest: 'ribbon.xml', }),
        functionsScanner({
            inputJsPath: 'js/functions.js',
            outputJsonPath: 'functions.json',
            namespace: 'WpsForge',
        }),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        host: '0.0.0.0'
    }
})
