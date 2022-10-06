import { atom } from 'recoil';
import { INeuron } from '../interfaces/app.interface';

export const selectedNeuronAtom = atom({
  key: 'selectedNeuronState',
  default: null as INeuron | null,
});
