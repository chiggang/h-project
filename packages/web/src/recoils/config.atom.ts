import { atom } from 'recoil';
import { IConfig } from '../interfaces/app.interface';

/**
 * 환경 설정
 */
export const configAtom = atom({
  key: 'configState',
  default: {
    loaded: false,
    api: {
      commonUrl: {
        host: '',
        port: 0,
      },
    },
    upload: {
      maximumNumberOfImage: 1,
      maximumNumberOfPdf: 1,
      imageUrl: {
        host: '',
        port: 0,
        path: '',
      },
      pdfUrl: {
        host: '',
        port: 0,
        path: '',
      },
    },
  } as IConfig,
});
