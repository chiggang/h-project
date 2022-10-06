import { atom } from 'recoil';
import { INeuronGroup } from '../interfaces/app.interface';

/**
 * 뉴런 그룹
 */
export const neuronGroupAtom = atom({
  key: 'neuronGroupState',
  default: [] as INeuronGroup[],
});
