// importScripts("https://unpkg.com/axios/dist/axios.min.js");

import { createApi } from '../../api/axios';
import SparkMD5 from 'spark-md5'
import {nanoid} from "nanoid";
import {UploadController} from './UploadController';

const FILE_STATUS = {
    PENDING: 'pending',
    UPLOADING: 'uploading',
    COMPLETED: 'completed',
    ERROR: 'error'
}
// 修改 axios 实例配置
    // axios.defaults.baseURL = 'http://localhost:3000';
    // axios.defaults.withCredentials = true;
// axios.defaults.headers.common = {
//     'Content-Type': 'application/json',
//     'Accept': 'application/json'
// };

// console.log('worker:', self);
console.log('Worker script loaded');
let api = null;
let uploadController = new UploadController();

self.onmessage = function (event) {
    console.log('Worker received message:', event.data);
    const {action, data, chunkSize, userId} = event.data;
    
    // 添加错误处理
    try {
        // 初始化 api 实例（包含拦截器）
        if (!api && userId) {
            console.log('Initializing api with userId:', userId);
            api = createApi(userId);
        }

        switch (action) {
            case 'upload':
                uploadController = new UploadController();
                uploadFile(data, chunkSize);
                break;
            case 'pause':
                uploadController.pause();
                break;
            case 'resume':
                uploadController.resume();
                break;
            case 'stop':
                uploadController.stop();
                break;
        }
    } catch (error) {
        console.error('Error in worker:', error);
        self.postMessage({
            action: 'error',
            data: error.message
        });
    }
};

// 确保 worker 脚本加载完成
self.postMessage({ action: 'ready' });

async function uploadChunk(chunk, index, fileId, clientFileId) {
    // 检查是否已停止
    if (uploadController.isStopped()) {
        throw new Error('Upload stopped');
    }

    while (uploadController.isPaused()) {
        // 在暂停时也检查是否停止
        if (uploadController.isStopped()) {
            throw new Error('Upload stopped');
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if(!fileId || !clientFileId){
        console.error('fileId or clientFileId is null');
        return;
    }
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunkIndex', index);
    formData.append('fileId', fileId);
    formData.append('clientFileId', clientFileId);
    const md5 = await getChunkMD5(chunk);

    formData.append('checksum', md5 + '');

    return new Promise((resolve, reject) => {
        const abortController = new AbortController();
        try {
            let loaded = 0;
            const request = api.post(`/upload/chunk`, formData, {
                onUploadProgress: function (e) {
                    // 检查是否停止
                    if (uploadController.isStopped()) {
                        abortController.abort();
                        reject(new Error('Upload stopped'));
                        return;
                    }
                    postMessage({action: 'progress', fileId: fileId, clientFileId: clientFileId, index: index, loaded: e.loaded});
                },
                signal: abortController.signal,
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // 保存 abort controller 到 uploadController
            uploadController.addAbortController(abortController);

            request.then(response => {
                resolve(response);
            }).catch(error => {
                reject(error);
            });
        } catch (e) {
            reject(e);
        }
    });
}

function getChunkMD5(chunk) {
    return new Promise((resolve, reject) => {
        const sparkMd5 = new SparkMD5.ArrayBuffer();
        const fileReader = new FileReader();

        fileReader.onload = function (e) {
            sparkMd5.append(e.target.result); // Append array buffer
            resolve(sparkMd5.end());
        };

        fileReader.onerror = function () {
            reject('Error occurred while reading the file');
        };

        function readChunk(chunk) {
            fileReader.readAsArrayBuffer(chunk);
        }

        // Start reading file
        readChunk(chunk);
    });
}

const CHUNK_SIZE = 1 * 1024 * 1024; // 1M bytes

function getFileMD5(uploadFile, chunkSize) {
    const {file, id} = uploadFile;
    return new Promise((resolve, reject) => {
        const fileSize = file.size;
        if (!chunkSize) {
            chunkSize = 10 * 1024 * 1024;
        }
        let loaded = 0;
        let isPaused = false;

        const sparkMd5 = new SparkMD5.ArrayBuffer();
        const fileReader = new FileReader();

        // 检查是否需要暂停或停止
        async function checkStatus() {
            console.log('checkStatus:', uploadController.isStopped(),uploadController.isPaused());
            // 检查是否已停止
            if (uploadController.isStopped()) {
                fileReader.abort(); // 中止当前读取
                throw new Error('Upload stopped');
            }

            // 检查是否暂停
            while (uploadController.isPaused()) {
                // 在暂停时也检查是否停止
                if (uploadController.isStopped()) {
                    fileReader.abort();
                    throw new Error('Upload stopped');
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        fileReader.onload = function (e) {
                     // 检查是否已停止
            checkStatus();

            sparkMd5.append(e.target.result); // Append array buffer
            loaded += e.target.result.byteLength;

            //TODO: 这里需要根据文件大小计算进度
            postMessage({action: 'checksum_progress', fileId: id, clientFileId: id, loaded: loaded});

            if (loaded < fileSize) {
                readNextChunk(); // Continue reading
            } else {
                const fileMd5 = sparkMd5.end();
                resolve(fileMd5);
            }

        };

        fileReader.onerror = function () {
            reject('Error occurred while reading the file');
        };

        function readNextChunk() {
           
            const chunk = file.slice(loaded, Math.min(loaded + chunkSize, fileSize));
            fileReader.readAsArrayBuffer(chunk);
        }

        // Start reading file
        readNextChunk();
    });
}

function onPause() {


}

function onResume() {
    /** * 分片获取md5值 * @param {*} file 文件对象 * @param {*} chunkSize 分片大小 * @param {*} progressCallback 进度修改回调 * @returns */function md5WithChunk(file, chunkSize, progressCallback = console.log) {
        return new Promise((resolve, reject) => {
            const blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice
            let chunks = Math.ceil(file.size / chunkSize)
            let currentChunk = 0
            let spark = new SparkMD5.ArrayBuffer()
            let fileReader = new FileReader()
            fileReader.onerror = reject
            fileReader.onload = (e) => {
                processCallback(currentChunk / chunks)
                spark.append(e.target.result)
                currentChunk++
                if (currentChunk < chunks) {
                    loadNext()
                } else {
                    resolve(spark.end())
                }
            }

            function loadNext() {
                let start = currentChunk * chunkSize
                let end = start + chunkSize >= file.size ? file.size : start + chunkSize
                fileReader.readAsArrayBuffer(blobSlice.call(file, start, end))
            }

            loadNext()
        })
    }

}

function onStop() {

}

function calHash() {

}


async function shakeHands(fileId, file,  checksum) {

    const json = {
        "fileHash": checksum,
        "fileSize": file.size,
        "fileName": file.name,
        "fileId": fileId
        // "chunkNumber": Math.ceil(file.size / chunkSize),
    };

    return api.post('/upload/shakehands', json, {
        onUploadProgress: function (e) {
            // console.log('onUploadProgress:', e);
        },
        })
        .then(response => {
            console.log('hands shake: ', response.data);
            if(response.data && response.data.success && response.data.status === FILE_STATUS.COMPLETED){
                postMessage({action: 'progress', fileId: fileId, clientFileId: fileId, loaded: file.size});
            }
            return response.data;
        })
        .catch(error => {
            console.error(error);
            postMessage({action: 'error', fileId: file.name, data: error.message})
        })
}

async function complete(fileId) {
    return api.get(`${baseUrl}/upload/complete`, {params: {'fileId': fileId, 'OkFile': 1}}, {
        onUploadProgress: function (e) {
            // console.log('loaded:', e);
            // console.log('Shake hands:', e);
        },
    })
        .then(response => {
            console.log('upload completed');
        })
        .catch(error => {
            console.error(error);
            postMessage({action: 'error', fileId: fileId, data: error.message})
        })
}

// 创建一个简单的锁机制
class AsyncLock {
    constructor() {
        this.locked = false;
        this.waitingQueue = [];
    }

    async acquire() {
        if (!this.locked) {
            this.locked = true;
            return;
        }
        
        await new Promise(resolve => {
            this.waitingQueue.push(resolve);
        });
    }

    release() {
        if (this.waitingQueue.length > 0) {
            const resolve = this.waitingQueue.shift();
            resolve();
        } else {
            this.locked = false;
        }
    }
}

function createQueue(file, chunkSize, totalChunks, exclude) {
    const queue = [];
    let total = 0;
    // 初始化切片队列
    for (let i = 0; i < totalChunks; i++) {
        if(exclude && exclude.include(i))
            continue;
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        // console.log(`chunk ${i} start: ${start}, end: ${end}`);
        total += end - start;
        queue.push({
            index: i,
            start,
            end
        });
    }

    return {queue, total};
}

async function uploadChunks(file,  fileId, clientFileId, queue, maxConcurrency=5) { 
    console.log('upload chunkqueue:', queue);

    const queueLock = new AsyncLock();
    
    async function processChunk(chunk) {
        const slicedChunk = file.slice(chunk.start, chunk.end);
        console.log(`uploading chunk ${chunk.index} ${slicedChunk.size}`);
        let uploaded = 0;
        try {
            await uploadChunk(slicedChunk, chunk.index, fileId, clientFileId);
            uploaded += chunk.end - chunk.start;
            try {
                  // 获取锁后再访问队列
                await queueLock.acquire();
                if (queue.length > 0) {
                    const nextChunk = queue.shift();
                    queueLock.release();
                    return processChunk(nextChunk);
                }
            } finally {
                queueLock.release();
            }
        } catch (error) {
            await queueLock.acquire();
            queue.unshift(chunk); // 失败重试
            queueLock.release();
            throw error;
        }
    }

    // 启动并发上传
    const uploadTasks = [];
    for (let i = 0; i < Math.min(maxConcurrency, queue.length); i++) {
        await queueLock.acquire();
        const chunk = queue.shift();
        queueLock.release();
        // 立即执行任务并将 Promise 加入数组
        uploadTasks.push(processChunk(chunk).catch(error => {
            console.error('Chunk upload failed:', error);
            throw error;
        }));
    }

    await Promise.all(uploadTasks);
}

async function uploadFile(uploadFile) {
    try {
        //一个文件默认最多10个切片，发起10个并发上传
        const maxConcurrency = 5;
        const {file, id} = uploadFile;
        if(!id || !file){
            console.error('file or id is null');
            return;
        }
        // 执行你的任务
        console.log('doing worker job', file);
        
        const startTime = new Date();
        let timeDiff = 0;

        const fileSize = file.size;
        // const fileId = nanoid(11);
       
        let uploaded = 0;

        const fileChecksum = await getFileMD5( uploadFile);
    // 与服务器握手
        const res = await shakeHands(id, file, fileChecksum);

        console.log('shake hands result:', res);

        if (!res) {
            postMessage({action: 'error', fileId: file.name, data: 'shake hands error'});
            return;
        }

        const clientFileId = id;
        const fileId = res.fileId;
        const chunkSize = res.chunkSize;
        const totalChunks = Math.ceil(fileSize / chunkSize);
        // const maxConcurrency = res.maxConcurrency;
        const chunkPromises = [];

        if (res.status === FILE_STATUS.COMPLETED) { //秒传
            console.time('flash upload');
            timeDiff = new Date() - startTime;
            // postMessage({action: 'completed', fileId: file.name, data: res, time: timeDiff});
        }
        else if (res.status === FILE_STATUS.PENDING ) {//新文件上传
            // File is not existing, then 切割文件并异步上传
            let i = 0;
            console.log('uploading a new file');

            const {queue, total} = createQueue(file, chunkSize, totalChunks);

            postMessage({action: 'start', fileId: file.name, total: total});

            try {
                await uploadChunks(file, fileId, clientFileId, queue);
                if (!uploadController.isStopped()) {
                    // 只有在未停止的情况下才发送完成消息
                    postMessage({
                        action: 'completed',
                        fileId: file.name,
                        time: new Date() - startTime
                    });
                }
            } catch (error) {
                if (uploadController.isStopped()) {
                    postMessage({
                        action: 'stopped',
                        fileId: file.name
                    });
                } else {
                    throw error;
                }
            }
        }
        else if (res.status === FILE_STATUS.UPLOADING) {//续传
            console.log('resume uploading');
            try{
                const existingChunks = res.uploadedChunks;
        
                const {queue, total} = createQueue(file, chunkSize, totalChunks, existingChunks);
                
                // postMessage({action: 'start', fileId: file.name, total: total});
    
                await uploadChunks(file, fileId, clientFileId, queue);
            } catch (error) {
                console.error('upload error:', error);
                if (uploadController.isStopped()) {
                    postMessage({
                        action: 'stopped',
                        fileId: file.name
                    });
                } else {
                    throw error;
                }
            }
        }
    } catch (error) {
        postMessage({
            action: 'error',
            fileId: file.name,
            data: error.message
        });
    }
}

export default self;
