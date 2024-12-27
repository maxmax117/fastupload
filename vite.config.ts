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
        },
        {
            name: 'cleanup-worker',
            generateBundle(options, bundle) {
                // 在生成 bundle 时删除重复的 worker 文件
                for (const fileName in bundle) {
                    if (fileName.includes('UploadWorker') && fileName.includes('assets')) {
                        delete bundle[fileName];
                    }
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
            output: {
                dir: 'dist',
                format: 'es',
                manualChunks: (id) => {
                    if (id.includes('UploadWorker.js') || 
                        id.includes('UploadController') ||
                        id.includes('api/axios') ||
                        id.includes('node_modules/axios') ||
                        id.includes('node_modules/nanoid') ||
                        id.includes('node_modules/spark-md5')) {
                        return 'worker';
                    }
                    return null;
                },
                entryFileNames: '[name].[format].js',
                chunkFileNames: (chunkInfo) => {
                    if (chunkInfo.name === 'worker') {
                        return 'UploadWorker.js';
                    }
                    return 'assets/[name]-[hash].js';
                }
            }
        },
        minify: true,
        sourcemap: true,
        worker: {
            format: 'iife',
            plugins: []
        }
    }
})

