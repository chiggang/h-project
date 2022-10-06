import { useRecoilState } from 'recoil';
import React, { useEffect, useRef, useState } from 'react';
import {
  IConfig,
  INeuron,
  INeuronCategory,
  INeuronFile,
  INeuronGroup,
  IPosition,
} from '../interfaces/app.interface';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Image, ScrollArea } from '@mantine/core';
import { Document, Page } from 'react-pdf/dist/esm/entry.webpack';
import { selectedNeuronAtom } from '../recoils/selectedNeuron.atom';
import { useResizeDetector } from 'react-resize-detector';
import urlJoin from 'url-join';
import { configAtom } from '../recoils/config.atom';
import { motion } from 'framer-motion';
import _ from 'lodash';
import { neuronGroupAtom } from '../recoils/neuronGroup.atom';
import { neuronCategoryAtom } from '../recoils/neuronCategory.atom';
import { neuronsAtom } from '../recoils/neurons.atom';
import PdfViewer from './PdfViewer';
import prependHttp from 'prepend-http';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

interface IFontAwesomeMultiIcon {
  tailwindMaxWidth: number;
  tailwindMaxHeight: number;
  icons: {
    icon: IconProp;
    className: string;
  }[];
}

/**
 * FontAwesome을 이용한 레이어 형태의 다중 아이콘
 * @param props
 * @constructor
 */
const FontAwesomeMultiIcon: React.FC<IFontAwesomeMultiIcon> = ({
  tailwindMaxWidth = 0,
  tailwindMaxHeight = 0,
  icons = [],
}) => {
  useEffect(() => {}, []);

  return (
    <div className={`relative w-${tailwindMaxWidth} h-${tailwindMaxHeight}`}>
      <div className="relative w-full h-full flex justify-center items-center">
        {icons.map(
          (
            item: {
              icon: IconProp;
              className: string;
            },
            index: number,
          ) => (
            <div
              key={index}
              className="absolute flex justify-center items-center"
            >
              <FontAwesomeIcon icon={item.icon} className={item.className} />
            </div>
          ),
        )}
      </div>
    </div>
  );
};

export default FontAwesomeMultiIcon;
