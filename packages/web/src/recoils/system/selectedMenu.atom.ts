import { atom } from 'recoil';
import { IMenu } from '../../interfaces/system.interface';

/**
 * 선택한 메뉴
 */
export const selectedMenuAtom = atom({
  key: 'selectedMenuState',
  default: {
    id: '',
    path: '',
  } as IMenu,
});
