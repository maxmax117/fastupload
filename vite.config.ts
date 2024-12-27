import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import {resolve} from 'path'
import dts from 'vite-plugin-dts'
import pkg from './package.json'

const banner = `/**
 * @license
 * ${pkg.name} v${pkg.version}
 * Copyright (c) 2024 Max Wang(max_wang7788@163.com)
 * Licensed under the MIT License
 * https://github.com/maxmax117/fastupload
 */
`;

export default defineConfig({
    plugins: [
        react(),
        dts({
            insertTypesEntry: true,
            include: ['src/components/uploader/FastUpload.tsx']
        }),
        {
            name: 'worker-bundle',
            generateBundle(options, bundle) {
                if (bundle['worker.js']) {
                    bundle['UploadWorker.js'] = bundle['worker.js'];
                    delete bundle['worker.js'];
                }
            }
        }
    ],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/components/uploader/FastUpload.tsx'),
            formats: ['es'],
            fileName: (format) => `fastupload.${format}.js`
        },
        rollupOptions: {
            external: ['react', 'react-dom', '@mui/joy', '@emotion/react', 'i18next', 'react-i18next'],
            input: {
                'fastupload': resolve(__dirname, 'src/components/uploader/FastUpload.tsx'),
                'locales/en': resolve(__dirname, 'src/locales/en.ts'),
                'locales/zh': resolve(__dirname, 'src/locales/zh.ts'),
                'locales/ja': resolve(__dirname, 'src/locales/ja.ts')
            },
            output: {
                banner,
                exports: 'named',
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',
                    '@mui/joy': 'MuiJoy',
                    '@emotion/react': 'EmotionReact',
                    'i18next': 'i18next',
                    'react-i18next': 'ReactI18next'
                },
                entryFileNames: (chunkInfo) => {
                    if (chunkInfo.name === 'fastupload') {
                        return 'fastupload.es.js'
                    }
                    if (chunkInfo.name.startsWith('locales/')) {
                        return `${chunkInfo.name}.js`
                    }
                    return '[name].js'
                },
                chunkFileNames: (chunkInfo) => {
                    if (chunkInfo.name === 'worker') {
                        return 'UploadWorker.js'
                    }
                    return '[name]-[hash].js'
                },
                preserveModules: false,
                manualChunks: (id) => {
                    if (id.includes('UploadWorker.js') || 
                        id.includes('UploadController') ||
                        id.includes('api/axios') ||
                        id.includes('node_modules/axios') ||
                        id.includes('node_modules/nanoid') ||
                        id.includes('node_modules/spark-md5')) {
                        return 'worker'
                    }
                    return null;
                }
            }
        },
        minify: true,
        sourcemap: true,
        worker: {
            format: 'es',
            plugins: []
        }
    }
})

