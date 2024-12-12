async function uploadFile(file) {
    // 切分文件为多个分片
    const chunks = createFileChunks(file);

    // 并行上传所有分片，但不阻塞UI
    const uploadPromises = chunks.map(chunk => {
        const formData = new FormData();
        formData.append('chunk', chunk);
        return axios.post('/upload_chunk', formData);
    });

    try {
        // 等待所有分片上传完成
        await Promise.all(uploadPromises);
        console.log('All chunks uploaded successfully');
    } catch (error) {
        console.error('Error uploading chunks', error);
    }
}

async function createFileChunks(file){

}

async function uploadChunk(chunk) {
    let myworker = new Worker();
}


/////////////////
async function readChunksSequentially(file) {
    let start = 0;
    let end = 1024;
    let chunkSize = 1024;
    let chunks = [];

    while (start < file.size) {
        let chunk = file.slice(start, end);
        let chunkData = await readChunkAsync(chunk); // 使用异步读取切片的函数
        chunks.push(chunkData);

        start = end;
        end = start + chunkSize;
    }

    return chunks;
}

function readChunkAsync(chunk) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();

        reader.onload = function (e) {
            resolve(e.target.result);
        };

        reader.onerror = function (e) {
            reject(e);
        };

        reader.readAsArrayBuffer(chunk);
    });
}

const file = ... // 你要读取的文件
readChunksSequentially(file)
    .then(chunks => {
        // 处理按顺序读取的chunks
        console.log(chunks);
    })
    .catch(error => {
        // 处理错误
        console.error(error);
    });
