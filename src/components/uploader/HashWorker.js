self.onmessage = function (event) {
    // const action = event.data;
    const {action, data, chunkSize} = event.data;
    console.log(event);

    if (action === 'hash') {
        // const result = uploadFile(data, chunkSize);
        // postMessage(result);
    }
};



export default self;
