import React from 'react';
import ReactDOM from 'react-dom/client';
import { createEmotionCache, MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { RecoilRoot } from 'recoil';
import App from './App';
import './styles/index.css';
import { EmotionCache } from '@emotion/react';

// Tailwind CSS의 버튼 투명화 기본값 때문에 Mantine의 버튼이 투명으로 적용되어 버튼이 보이지 않는 문제가 발생함
// Mantine의 emotionCache를 사용하여 Tailwind CSS의 스타일을 먼저 불러온 후, Mantine의 스타일을 덮어서 불러오도록 함
// 참고: https://v5.mantine.dev/theming/emotion-cache/
const myCache: EmotionCache = createEmotionCache({
  key: 'mantine',
  prepend: false,
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(
  // <React.StrictMode>
  <RecoilRoot>
    <MantineProvider
      withCSSVariables
      withGlobalStyles
      withNormalizeCSS
      emotionCache={myCache}
    >
      <ModalsProvider>
        <App />
      </ModalsProvider>
    </MantineProvider>
  </RecoilRoot>,
  // </React.StrictMode>
);
