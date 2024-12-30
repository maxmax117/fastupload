
# FastUpload

一个基于web worker多线程技术的可实现任意大小文件异步上传的React组件

![FastUpload](./public/images/fastupload16.37.16.png)

# 特性
- 多线程上传，上传文件时不会阻塞UI页面，用户随时可以停止
- 支持超大文件上传
- 上传实时进度显示
- 支持断点续传
- 支持秒传功能
- 支持连续上传
- 多语言支持，目前支持英文、中文、日文


# 如何安装使用
## 前端组件安装
使用npm安装
```bash
npm install @maxmax117/fastupload
```
使用yarn安装
```bash
yarn add @maxmax117/fastupload
```
然后在你的react项目合适的位置加入

```html
<FastUpload lang='en'/>
```
## 后端上传服务器对接
文件上传需要有后端服务支持，FastUpload组件是一个前端组件，本身不提供后端服务，需要你自己实现。
为了简化大家的工作，我以不同后端开发语言实现了几套后端服务(bunjs、java、go)，如果你需要的话，可以联系我<a href="mailto:intellibiz.sh@gmail.com">intellibiz.sh@gmail.com</a>

如果你需要自己对接后端服务，可以参考以下步骤：

### 实现后端接口

- 上传服务器必须实现下面两个接口:

```js
1. 实现上传握手接口
'/upload/shakehands'

    接入参数：
    const json = {
        fileHash: string,
        fileSize: number,
        fileName: string,
        fileId: string
    };
    返回参数：
    {
      success: boolean,
      message: string,
      type: 'new',
      fileId: string,
      chunkSize: number,
      status: “PENDING”,
        uploadProgress: {
                          totalChunks: number,
                          uploadedChunks: number,
                          percentage: number
                      }
      };
    
2. 实现分片上传接口
'/upload/chunk'
    接入参数
    {
      chunk: Blob,
      chunkIndex: number,
      fileId: string,
      clientFileId: string,
      checksum: string
    }
    
    返回参数：
    {
        success: boolean,
        message: string,
        chunkIndex: number,
        fileId: string,
        size: number,
        isComplete: boolean,
        uploadProgress: {
                            totalChunks: number,
                            uploadedChunks: number
                        }                
    }


```

### 指定上传服务器


```js
  <FastUpload uploadServer='[your server url]' lang='en'/>
```

### 切换语言

```js
  <FastUpload lang='en'/> // 默认英文 
  <FastUpload lang='zh'/> // 中文
  <FastUpload lang='ja'/> // 日文
```



