import axios from "axios";
// import workerPath from "@worker";

class YouFile {
    chunkSize = 512 * 1024;
    chunkIndex = 0;
    offset = 0;
    file = null;
    fileSize = 0;
    fileReader = new FileReader();

    constructor(file) {
        this.file = file;
        if (file) {
            this.fileSize = file.size;
            // console.log('reading file:', file);

            this.fileReader.onload = (e) => {
                this.onReadChunk(e)
            }

            this.fileReader.onerror = (e) => {
                this.onError(e);
            };

            this.fileReader.onloadend = (e) => {
                this.onReadChunkEnd(e);
            }
        }
    }

    readFile() {
        this.readChunk();
    }

    onReadChunk(e) {
        // Do something with the chunk data
        console.log('Chunk read:', e.target.result);
        console.log('Chunk size:', e.target.result.byteLength);
        this.chunkIndex++;

        // Prepare for reading the next chunk
        this.offset += this.chunkSize;
        if (this.offset < this.fileSize) {
            this.readChunk();
        } else {
            console.log('File reading completed.');
        }
    }

    onReadChunkEnd(e) {
        // const chunkSize = e.target.result.byteLength;
        console.log('Chunk size:', e.target.result);
    }

    onError(e) {
        console.error(e);
    }


    readChunk() {
        const chunk = this.file.slice(this.offset, Math.min(this.fileSize, this.offset + this.chunkSize));
        // console.log("chunk: ",chunk);
        this.fileReader.readAsArrayBuffer(chunk);
    }

    async uploadFileInChunks(file, chunkSize) {
        const fileSize = file.size;
        let uploaded = 0;

        // 切割文件并逐个上传。这个循环会串行执行。
        let i = 0;
        while (uploaded < fileSize) {
            const chunk = file.slice(uploaded, Math.min(fileSize, uploaded + chunkSize));
            console.log(`sliced the  ${i} chunk:`, chunk);
            await this.uploadChunk(chunk, i++, file);
            console.log('uploaded a chunk');
            uploaded += chunk.size;

            // 更新进度条、发送状态给用户等
            // updateProgress(uploaded, fileSize);
        }

        if (uploaded === fileSize) {
            const formData = new FormData();
            formData.append('fileId', file.name);
            formData.append('chunkNumber', i);
            axios.post('http://localhost:8080/merge', formData)
                .then(response => {
                    console.log(response);

                })
                .catch(error => {
                    console.error(error);
                })
                .finally(() => {

                })
        }
    }

    async uploadChunk(chunk, startByte, file) {
        const formData = new FormData();
        formData.append('chunk', chunk); // 添加分片数据
        formData.append('start', startByte); // 添加当前分片的起始字节
        formData.append('chunkIndex', startByte); // 添加当前分片的起始字节
        formData.append('fileId', file.name); // 一般会有一个文件ID或其他标识符

        try {

            // const myworker = new MyWorker();
            const worker = new Worker('UploadWorker.js')
            worker.postMessage('doWork', chunk);



            // // 假设我们有一个API的URL去处理上传
            // const response = await fetch('http://localhost:8080/upload', {
            //     method: 'POST',
            //     body: formData
            // });
            //
            // if (!response.ok) {
            //     throw new Error('Upload failed');
            // }
            //
            // return response.json(); // 或者根据服务器的响应格式来处理数据
        } catch (error) {
            console.error('An error occurred while uploading the chunk:', error);
            throw error; // 可以在这里添加错误处理逻辑，例如重试逻辑
        }
    }


    // uploadChunk(chunk, checksum, chunkIndex) {
    //
    // }
}

export default YouFile;
