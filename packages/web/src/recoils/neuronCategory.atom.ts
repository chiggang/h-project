import { atom } from 'recoil';
import { INeuronCategory } from '../interfaces/app.interface';

/**
 * 뉴런 분류
 */
export const neuronCategoryAtom = atom({
  key: 'neuronCategoryState',
  default: [] as INeuronCategory[],
});
