import React, { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import { useRecoilState } from 'recoil';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fas } from '@fortawesome/free-solid-svg-icons';

import Main from './pages/Main';
import System from './pages/System';
import NotFound from './pages/NotFound';
import './styles/App.css';
import { IConfig } from './interfaces/app.interface';
import { configAtom } from './recoils/config.atom';

// FontAwesome 아이콘을 불러옴
library.add(fab, far, fas);

function App() {
  // 환경 설정을 정의함
  const [config, setConfig] = useRecoilState<IConfig>(configAtom);

  // 환경 설정을 불러옴
  const loadConfig = () => {
    // 시스템 환경설정을 불러옴
    axios
      .get('/json/app.config.json')
      .then((response: any) => {
        if (response.data === undefined) {
          return;
        }

        let v: any = response.data;

        // 환경 설정을 기억함
        setConfig({
          loaded: true,
          api: {
            commonUrl: {
              host: v.api.commonUrl.host || '',
              port: v.api.commonUrl.port || 0,
            },
          },
          upload: {
            maximumNumberOfImage: v.upload.maximumNumberOfImage || 1,
            maximumNumberOfPdf: v.upload.maximumNumberOfPdf || 1,
            imageUrl: {
              host: v.upload.imageUrl.host || '',
              port: v.upload.imageUrl.port || 0,
              path: v.upload.imageUrl.path || '',
            },
            pdfUrl: {
              host: v.upload.pdfUrl.host || '',
              port: v.upload.pdfUrl.port || 0,
              path: v.upload.pdfUrl.path || '',
            },
          },
          resource: {
            imageUrl: {
              host: v.upload.imageUrl.host || '',
              port: v.upload.imageUrl.port || 0,
              path: v.upload.imageUrl.path || '',
            },
            pdfUrl: {
              host: v.upload.pdfUrl.host || '',
              port: v.upload.pdfUrl.port || 0,
              path: v.upload.pdfUrl.path || '',
            },
          },
        });
      })
      .catch((error) => {
        console.log('> Error: 환경 설정을 불러올 수 없습니다.');
        console.log('> Error:', error);
      });
  };

  useEffect(() => {
    // 환경 설정을 불러옴
    loadConfig();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* 메인 페이지 */}
        <Route path="" element={<Main />} />

        {/* 관리자 페이지 */}
        <Route path="system" element={<System />} />

        {/* 페이지를 찾을 수 없음 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
