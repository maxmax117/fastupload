import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';
import worker from 'worker-plugin'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), worker()],
    // resolve:
    //     {
    //         alias: {
    //             // 设置别名以正确解析Worker脚本的路径
    //             '@worker':
    //                 path.resolve(__dirname, 'src/components/uploader/UploadWorker.js'),
    //         }
    //         ,
    //
    //     },
})

