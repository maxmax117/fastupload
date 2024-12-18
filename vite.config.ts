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
 * Copyright (c) 2024 Max Wang
 * Licensed under the MIT License
 * https://github.com/maxmax117/fastupload
 */
`;

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), worker(), dts({
        insertTypesEntry: true,
        include: ['src/components/uploader/FastUpload.tsx', 
            'src/index.ts',
            'src/locales/**/*'
        ]
    })],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/components/uploader/FastUpload.tsx'),
            name: 'fastupload',
            fileName: (format) => `fastupload.${format}.js`,
            formats: ['es', 'umd']
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
                    if (assetInfo.name === 'UploadWorker.js') {
                        return 'assets/[name][extname]';
                    }
                    return 'assets/[name]-[hash][extname]';
                }
            }
        },
        assetsDir: 'assets',
        emptyOutDir: true,
        sourcemap: true,
        worker: {
            format: 'es',
            plugins: [],
            rollupOptions: {
                output: {
                    format: 'es',
                    entryFileNames: 'assets/[name].js',
                    chunkFileNames: 'assets/[name].js'
                }
            }
        }
    }
})

