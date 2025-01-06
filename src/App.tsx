import { useState } from 'react'
import './App.css'
import FastUpload from "./components/uploader/FastUpload.tsx";
import FastUploadPro from './components/uploader/FastUploadPro.tsx';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './locales/en';
import zhTranslation from './locales/zh';
import jaTranslation from './locales/ja';

// i18n
//   .use(initReactI18next)
//   .init({
//     resources: {
//       en: { translation: enTranslation },
//       zh: { translation: zhTranslation },
//       ja: { translation: jaTranslation }
//     },
//     lng: 'zh', // 默认语言
//     fallbackLng: 'en',
//     interpolation: {
//       escapeValue: false
//     }
//   });

function App() {
  const [count, setCount] = useState(0)


  return (
    <>
      {/*<div>*/}
      {/*  <a href="https://vitejs.dev" target="_blank">*/}
      {/*    <img src={viteLogo} className="logo" alt="Vite logo" />*/}
      {/*  </a>*/}
      {/*  <a href="https://react.dev" target="_blank">*/}
      {/*    <img src={reactLogo} className="logo react" alt="React logo" />*/}
      {/*  </a>*/}
      {/*</div>*/}
      {/*<h1>Vite + React</h1>*/}
        <FastUpload lang='ja'/>
        {/* <FastUploadPro/> */}
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
