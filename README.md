
# FastUpload

一个基于web worker多线程技术的可实现异步上传的React组件

![FastUpload](./public/images/fastupload16.37.16.png)

# 特性
- 多线程上传，上传文件时不会阻塞UI页面，用户随时可以停止
- 上传实时进度显示
- 支持断点续传
- 支持秒传功能
- 支持连续上传
- 多语言支持，目前支持英文、中文、日文

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## 如何安装使用
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
## 后端服务对接
文件上传需要有后端服务对接，FastUpload组件是一个前端组件，本身不提供后端服务，需要你自己实现。
为了简化大家的工作，我以不同后端开发语言实现了几套后端服务(bunjs、java、go)，如果你需要的话，请联系并说明你需要哪种后端。

如果你需要自己对接后端服务，可以参考以下步骤：

### 后端接口

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list


## Installation


