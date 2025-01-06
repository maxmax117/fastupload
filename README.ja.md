# FastUpload

[English](README.md) | [中文](README.zh.md) | [日本語](README.ja.md)

Web Workerのマルチスレッド技術を基にした、任意のサイズのファイルを非同期アップロードできるReactコンポーネント

<img src="./public/images/3.gif" width="500" alt="FastUpload">
<img src="./public/images/2.gif" width="530" alt="FastUpload">
<img src="./public/images/1.gif" width="500" alt="FastUpload">

# 特徴
- マルチスレッドアップロード、ファイルアップロード中にUIページがブロックされず、ユーザーはいつでも一時停止またはキャンセル可能
- 大容量ファイルのアップロードに対応
- リアルタイムのアップロード進捗表示
- レジューム機能対応
- クイックアップロード機能対応
- 連続アップロード対応
- 多言語対応（現在、英語、中国語、日本語に対応）

# インストールと使用方法
## フロントエンドコンポーネントのインストール
npmを使用
```bash
npm install @maxmax117/fastupload
```
yarnを使用
```bash
yarn add @maxmax117/fastupload
```
その後、Reactプロジェクトの適切な場所に追加

```html
<FastUpload lang='ja'/>
```

## バックエンドアップロードサーバーの統合
ファイルアップロードにはバックエンドサービスのサポートが必要です。FastUploadコンポーネントはフロントエンドコンポーネントであり、バックエンドサービスは提供していません。お好みの言語とフレームワーク（Java、Go、Node.js、Bun.js、Python、PHPなど）で実装する必要があります。
作業を簡素化するために、必要な場合は<a href="mailto:intellibiz.sh@gmail.com">intellibiz.sh@gmail.com</a>までご連絡ください。異なるバックエンド開発言語（bunjs、java、go）でいくつかのバックエンドサービスを実装しており、スタンドアロンのマイクロサービスとしてすぐに使用できます。

独自のバックエンドサービスを統合する必要がある場合は、以下の手順を参照してください：

### バックエンドAPIの実装

- アップロードサーバーは以下の2つのインターフェースを実装する必要があります：

```js
1. ハンドシェイクインターフェースの実装
'/upload/shakehands'

    入力パラメータ：
    const json = {
        fileHash: string,
        fileSize: number,
        fileName: string,
        fileId: string
    };
    戻りパラメータ：
    {
      success: boolean,
      message: string,
      type: 'new',
      fileId: string,
      chunkSize: number,
      status: "PENDING",
        uploadProgress: {
                          totalChunks: number,
                          uploadedChunks: number,
                          percentage: number
                      }
      };
    
2. チャンクアップロードインターフェースの実装
'/upload/chunk'
    入力パラメータ
    {
      chunk: Blob,
      chunkIndex: number,
      fileId: string,
      clientFileId: string,
      checksum: string
    }
    
    戻りパラメータ：
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

### アップロードサーバーの指定

```js
  <FastUpload uploadServer='[your server url]' lang='ja'/>
```

### 言語の切り替え

```js
  <FastUpload lang='en'/> // 英語（デフォルト）
  <FastUpload lang='zh'/> // 中国語
  <FastUpload lang='ja'/> // 日本語
``` 