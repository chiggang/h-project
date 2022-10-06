import { atom } from 'recoil';

export const neuronCategoryCheckBoxAtom = atom({
  key: 'neuronCategoryCheckBoxState',
  default: [] as string[],
});
