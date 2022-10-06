import { atom } from 'recoil';
import { INeuron } from '../interfaces/app.interface';

/**
 * 뉴런
 */
export const neuronsAtom = atom({
  key: 'neuronsState',
  default: [] as INeuron[],
});
