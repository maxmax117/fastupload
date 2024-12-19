import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import {resolve} from 'path';
import path from 'path';
import worker from 'worker-plugin'
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

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), dts({
        insertTypesEntry: true,
        include: ['src/components/uploader/FastUpload.tsx', 
            'src/index.ts'
        ]
    })],
    build: {
        lib: {
            entry: {
                'FastUpload': resolve(__dirname, 'src/components/uploader/FastUpload.tsx'),
                'UploadWorker': resolve(__dirname, 'src/components/uploader/UploadWorker.js')
            },
            formats: ['es'],
            fileName: (format, entryName) => `${entryName}.${format}.js`
        },
        rollupOptions: {
            external: ['react', 'react-dom', '@mui/joy', '@emotion/react'],
            output: {
                banner,
                exports: 'named',
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',
                    '@mui/joy': 'MuiJoy',
                    '@emotion/react': 'EmotionReact'
                },
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name?.includes('locales/')) {
                        return assetInfo.name.replace(/\.ts$/, '');
                    }
                    return 'assets/[name]-[hash][extname]';
                },
                entryFileNames: (chunkInfo) => {
                    if (chunkInfo.name === 'UploadWorker') {
                        return 'UploadWorker.js';
                    }
                    if (chunkInfo.name?.includes('locales/')) {
                        return '[name]';
                    }
                    return chunkInfo.isEntry ? 'FastUpload.[format].js' : '[name].js';
                },
                preserveModules: false,
                inlineDynamicImports: false,
                compact: true,
                generatedCode: {
                    preset: 'es2015',
                    symbols: false
                }
            }
        },
        minify: true,
        copyPublicDir: true,
        assetsDir: '.',
        emptyOutDir: true,
        sourcemap: true
    }
})

