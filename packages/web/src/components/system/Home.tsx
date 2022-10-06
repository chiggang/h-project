import { useRecoilState } from 'recoil';
import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IMenu } from '../../interfaces/system.interface';
import { selectedMenuAtom } from '../../recoils/system/selectedMenu.atom';
import {
  Button,
  Drawer,
  FileInput,
  Modal,
  Select,
  Table,
  Textarea,
  TextInput,
} from '@mantine/core';
import { neuronCategoryAtom } from '../../recoils/neuronCategory.atom';
import {
  IConfig,
  IMessageModal,
  INeuron,
  INeuronCategory,
} from '../../interfaces/app.interface';
import axios, { AxiosResponse } from 'axios';
import { nanoid } from 'nanoid';
import { ENeuron } from '../../enums/app.enum';
import _ from 'lodash';
import { DatePicker } from '@mantine/dates';
import { useResizeObserver } from '@mantine/hooks';
import { openConfirmModal, openContextModal, openModal } from '@mantine/modals';
import * as yup from 'yup';
import dateFormat from 'dateformat';
import { configAtom } from '../../recoils/config.atom';

/**
 * HOME
 * @param props
 * @constructor
 */
const Home: React.FC<any> = (props: any) => {
  // 환경 설정을 정의함
  const [config, setConfig] = useRecoilState<IConfig>(configAtom);

  useEffect(() => {}, []);

  // 환경 설정이 변경될 때 실행함
  useEffect(() => {
    if (config.api.commonUrl.host === '') {
      return;
    }
  }, [config.api.commonUrl.host]);

  return (
    <>
      {/* 페이지 */}
      <div className="">
        <div className="h-96 flex justify-start items-start">
          관리자 페이지 입니다.
        </div>
      </div>
    </>
  );
};

export default Home;
