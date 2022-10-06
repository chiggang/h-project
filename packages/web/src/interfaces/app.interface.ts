import * as THREE from 'three';
import { ENeuron } from '../enums/app.enum';
import { GLTF } from 'three-stdlib';

/**
 * Size
 * @Param width: Width size(px)
 * @Param height: Height size(px)
 */
export interface ISize {
  width: number;
  height: number;
}

/**
 * Position
 * @Param x: Horizontal position(px)
 * @Param y: Vertical position(px)
 */
export interface IPosition {
  x: number;
  y: number;
}

/**
 * 환경 설정
 * @Param
 */
export interface IConfig {
  loaded: boolean;
  api: {
    commonUrl: {
      host: string;
      port: number;
    };
  };
  upload: {
    maximumNumberOfImage: number;
    maximumNumberOfPdf: number;
    imageUrl: {
      host: string;
      port: number;
      path: string;
    };
    pdfUrl: {
      host: string;
      port: number;
      path: string;
    };
  };
  resource: {
    imageUrl: {
      host: string;
      port: number;
      path: string;
    };
    pdfUrl: {
      host: string;
      port: number;
      path: string;
    };
  };
}

/**
 * 윈도우 메시지
 * @Param
 * @Param
 */
export interface IWindowMessage {
  type: string;
  command: string;
  data: any;
}

/**
 * 필터링 체크박스
 * @Param
 * @Param
 */
export interface IFilterCheckBox {
  inspiration: boolean;
  research: boolean;
  reflection: boolean;
}

/**
 * 뉴런
 * @Param
 */
export interface INeuron {
  id: number;
  group: string;
  category: string;
  subCategory: string;
  title: string;
  content: string;
  date: string;
  image: INeuronFile[] | null;
  pdf: INeuronFile[] | null;
  uploadingImage?: INeuronFile[] | null;
  uploadingPdf?: INeuronFile[] | null;
  linkUrl: string;
  sortNoInGroup: number;
}

/**
 * 정렬용 뉴런
 * @Param
 */
export interface ISortNeuron {
  id: string;
  name: string;
}

/**
 * 게시물에 포함된 첨부파일
 */
export interface INeuronFile {
  fieldname: string;
  filename: string;
  mimetype: string;
  originalname: string;
  size: number;
  isDelete?: boolean;
}

/**
 * 뉴런 그룹
 */
export interface INeuronGroup {
  id: string;
  name: string;
}

/**
 * 뉴런 분류
 * @Param
 */
export interface INeuronCategory {
  index: number;
  name: string;
  category: string;
  subCategory: {
    name: string;
    value: string;
  }[];
}

/**
 * 뉴런 GLTF
 */
export type GLTFResult = GLTF & {
  nodes: {
    Object_4: THREE.Mesh;
    Object_5: THREE.Mesh;
    Object_6: THREE.Mesh;
  };
  materials: {
    Nucleus: THREE.MeshStandardMaterial;
    Neuron: THREE.MeshPhysicalMaterial;
    Light: THREE.MeshStandardMaterial;
  };
};

/**
 * 메시지 모달
 * @Param
 */
export interface IMessageModal {
  visible: boolean;
  title: string;
  content: string;
}
