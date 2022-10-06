import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import _ from 'lodash';
import {
  Button,
  Checkbox,
  CloseButton,
  Drawer,
  FileInput,
  Image,
  Popover,
  ScrollArea,
  Select,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import 'dayjs/locale/ko';
import * as THREE from 'three';
import {
  Canvas,
  extend,
  PerspectiveCameraProps,
  useFrame,
  useThree,
} from '@react-three/fiber';
import {
  BakeShadows,
  Bounds,
  Effects,
  MeshReflectorMaterial,
  OrbitControls,
  OrbitControlsProps,
  PerspectiveCamera,
  useBounds,
  useGLTF,
  useTexture,
} from '@react-three/drei';

// import '../styles/App.css';

import {
  Bloom,
  DepthOfField,
  EffectComposer,
  Noise,
  Vignette,
} from '@react-three/postprocessing';
import {
  GLTFResult,
  IConfig,
  INeuron,
  INeuronCategory,
  INeuronGroup,
  IPosition,
  IWindowMessage,
} from '../interfaces/app.interface';
import { nanoid } from 'nanoid';
import { DraggableData, Position, ResizableDelta, Rnd } from 'react-rnd';
import { DraggableEvent } from 'react-draggable';
import { ResizeDirection } from 're-resizable';
import { useResizeDetector } from 'react-resize-detector';
import { ENeuron } from '../enums/app.enum';
import axios, { AxiosResponse } from 'axios';
import { motion } from 'framer-motion';
import { useTimeout } from '@mantine/hooks';
import { useRecoilState } from 'recoil';
import { neuronCategoryCheckBoxAtom } from '../recoils/neuronCategoryCheckBox.atom';
import NeuronMesh from '../components/NeuronMesh';
import { selectedNeuronAtom } from '../recoils/selectedNeuron.atom';
import NeuronDetailInfo from '../components/NeuronDetailInfo';
import NeuronDetailInfo2 from '../components/NeuronDetailInfo2';
import { neuronCategoryAtom } from '../recoils/neuronCategory.atom';
import { configAtom } from '../recoils/config.atom';
import { neuronGroupAtom } from '../recoils/neuronGroup.atom';
import SelectedMenuPath from '../components/system/SelectedMenuPath';
import Home from '../components/system/Home';
import ManageNeuron from '../components/system/ManageNeuron';
import NeuronInfo from '../components/NeuronInfo';
import { neuronsAtom } from '../recoils/neurons.atom';
import { Vector3 } from 'three';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib/controls/OrbitControls';
import { PerspectiveCamera as PerspectiveCameraImpl } from 'three/src/cameras/PerspectiveCamera';
import FontAwesomeMultiIcon from '../components/FontAwesomeMultiIcon';

// // FontAwesome 아이콘을 불러옴
// library.add(fab, far, fas);

// 뉴런의 시작과 끝에 여백의 뉴런을 추가함
const paddingCount: number = 15;

// 랜덤값을 생성함
const randomData1: number[] = Array.from({ length: 300 }, (_, i) =>
  Math.random(),
);
const randomData2: number[] = Array.from({ length: 300 }, (_, i) =>
  Math.random(),
);

const Main = () => {
  const orbitControlRef = useRef<OrbitControlsImpl>(null);
  const cameraRef = useRef<PerspectiveCameraImpl>(null);

  // 환경 설정을 정의함
  const [config, setConfig] = useRecoilState<IConfig>(configAtom);

  // 뉴런 그룹을 정의함
  const [neuronGroup, setNeuronGroup] =
    useRecoilState<INeuronGroup[]>(neuronGroupAtom);
  const neuronGroupRef = useRef<INeuronGroup[]>([]);

  // 뉴런 분류를 정의함
  const [neuronCategory, setNeuronCategory] =
    useRecoilState<INeuronCategory[]>(neuronCategoryAtom);
  const neuronCategoryRef = useRef<INeuronCategory[]>([]);

  // //
  // const [neuronCategoryCheckBox, setNeuronCategoryCheckBox] = useRecoilState(
  //   neuronCategoryCheckBoxAtom,
  // );

  // 뉴런 검색 레이어의 출력 여부를 정의함
  const [openLeuronSearchLayer, setOpenLeuronSearchLayer] =
    useState<boolean>(false);

  // 뉴런 검색 레이어의 입력폼을 정의함
  const [leuronSearchLayerInput, setLeuronSearchLayerInput] =
    useState<string>('');

  // 뉴런 검색 레이어에서 검색한 결과를 정의함
  const [leuronSearchLayerResult, setLeuronSearchLayerResult] = useState<
    INeuron[]
  >([]);

  // 뉴런 그룹 목록의 출력 여부를 정의함
  const [openLeuronGroupLayer, setOpenLeuronGroupLayer] =
    useState<boolean>(false);

  // 뉴런 그룹 목록에서 선택한 그룹을 정의함
  const [selectedLeuronGroup, setSelectedLeuronGroup] =
    useState<INeuronGroup | null>(null);

  // 체크한 뉴런 분류 체크박스를 정의함
  const [checkedNeuronCategoryCheckBox, setCheckedNeuronCategoryCheckBox] =
    useState<string[]>([]);

  // 선택한 뉴런을 정의함
  const [selectedNeuron, setSelectedNeuron] =
    useRecoilState(selectedNeuronAtom);

  const [neuronInfoLayer, setNeuronInfoLayer] = useState<any>({
    width: 700,
    height: 600,
    minWidth: 200,
    minHeight: 200,
    x: 100,
    y: 100,
  });

  // 뉴런 검색 레이어에서 엔터키를 입력함
  const handleLeuronSearchLayerInput_onKeyDown = (event: any) => {
    if (event.code === 'Enter') {
      // 뉴런 검색 레이어에서 입력한 검색어로 검색함
      getSearchNeuron();
    }
  };

  // 뉴런 검색 레이어에서 입력한 검색어로 검색함
  const getSearchNeuron = () => {
    let result: INeuron[] = neurons.filter((filterData: INeuron) =>
      _.includes(
        _.lowerCase(
          _.join(
            [
              filterData.category,
              filterData.subCategory,
              filterData.title,
              filterData.content,
              filterData.date,
            ],
            ' ',
          ),
        ),
        _.lowerCase(leuronSearchLayerInput),
      ),
    );

    // 뉴런 검색 레이어에서 검색한 결과를 기억함
    setLeuronSearchLayerResult(result);
  };

  // 뉴런 검색 레이어를 초기화함
  const resetLeuronSearchLayer = () => {
    console.log('!!!');

    // 뉴런 검색 레이어의 입력폼을 초기화함
    setLeuronSearchLayerInput('');

    // 뉴런 검색 레이어에서 검색한 결과를 초기화함
    setLeuronSearchLayerResult([]);
  };

  /**
   * 3D 모델 처리
   */

  // 뉴런 모델을 불러옴
  const { nodes, materials } = useGLTF(
    '/gltf/multipolar_neuron/scene-transformed.glb',
  ) as GLTFResult;

  /**
   * ...
   */

  // 뉴런 데이터를 정의함
  // const [neurons, setNeurons] = useState<INeuron[]>([]);
  const [neurons, setNeurons] = useRecoilState<INeuron[]>(neuronsAtom);

  // 체크한 뉴런 분류 체크박스를 윈도우 메시지로 보냄
  const sendMessageCheckedNeuronCategoryCheckBox = () => {
    // 윈도우 메시지를 보냄
    window.postMessage(
      {
        type: '',
        command: 'checked-neuron-category-checkBox',
        data: {
          checkedNeuronCategoryCheckBox,
        },
      } as IWindowMessage,
      '*',
    );
  };

  // 기초값을 요청한 뉴런에게 기초값을 윈도우 메시지로 보냄
  const sendMessageInitialData = (id: number) => {
    // 윈도우 메시지를 보냄
    window.postMessage(
      {
        type: '',
        command: 'initial-data',
        data: {
          id,
          neuronGroup: neuronGroupRef.current,
          neuronCategory: neuronCategoryRef.current,
        },
      } as IWindowMessage,
      '*',
    );
  };

  // 뉴런 그룹 목록에서 선택한 뉴런 그룹을 윈도우 메시지로 보냄
  const sendMessageSelectedNeuronGroup = () => {
    // 윈도우 메시지를 보냄
    window.postMessage(
      {
        type: '',
        command: 'selected-neuron-group',
        data: {
          selectedLeuronGroup,
        },
      } as IWindowMessage,
      '*',
    );
  };

  /**
   * 뉴런 레이블의 마우스 처리
   */

  // 뉴런 레이블에 마우스 들어옴 및 나감을 정의함
  const [mouseOverNeuron, setMouseOverNeuron] = useState<boolean>(false);

  // 뉴런 레이블에 마우스가 들어오면 뉴런 데이터의 기억을 정의함
  const [mouseOverNeuronData, setMouseOverNeuronData] =
    useState<INeuron | null>(null);

  // 뉴런 레이블에서 마우스가 나가면 뉴런 데이터를 초기화함
  const {
    start: startRemoveMouseOverNeuronData,
    clear: clearRemoveMouseOverNeuronData,
  } = useTimeout(() => {
    if (!mouseOverNeuron) {
      setMouseOverNeuronData(null);
    }
  }, 1000);

  // 뉴런 그룹 목록을 출력함
  const { start: startOpenLeuronGroupLayer, clear: clearOpenLeuronGroupLayer } =
    useTimeout(() => {
      // 뉴런 그룹 목록을 출력함
      setOpenLeuronGroupLayer(true);
    }, 3000);

  /**
   * 윈도우 메시지 처리
   */

  // 윈도우 메시지를 받음
  const handleWindow_onMessage = useCallback((event: MessageEvent) => {
    if (event.data.command === undefined) {
      return;
    }

    const message: IWindowMessage = event.data;

    switch (message.command) {
      // 뉴런 레이블: 마우스 들어옴
      case 'mouse-over-neuron-label':
        // 뉴런 레이블에 마우스가 들어옴
        setMouseOverNeuron(true);

        // 뉴런 레이블에 해당하는 뉴런 데이터를 기억함
        setMouseOverNeuronData(message.data.neuron);
        break;

      // 뉴런 레이블: 마우스 나감
      case 'mouse-leave-neuron-label':
        // 뉴런 레이블에서 마우스가 나감
        setMouseOverNeuron(false);

        // 뉴런 레이블에 해당하는 뉴런 데이터를 초기화함
        // startRemoveMouseOverNeuronData();
        setMouseOverNeuronData(null);
        break;

      // 뉴런 레이블: 마우스를 클릭함
      case 'mouse-click-neuron-label':
        // 선택한 뉴런을 기억함
        setSelectedNeuron(message.data.neuron);
        break;

      // 뉴런의 로딩이 끝나고 나면 메인에게 기초값을 요청함
      case 'get-initial-data':
        // 기초값을 요청한 뉴런에게 기초값을 윈도우 메시지로 보냄
        sendMessageInitialData(message.data.id);
        break;

      default:
        break;
    }
  }, []);

  // // 윈도우 메시지를 받음
  // window.onmessage = (event: MessageEvent) => {
  //   if (event.data.command === undefined) {
  //     return;
  //   }
  //
  //   const message: IWindowMessage = event.data;
  //
  //   switch (message.command) {
  //     // 뉴런 레이블: 마우스 들어옴
  //     case 'mouse-over-neuron-label':
  //       // 뉴런 레이블에 마우스가 들어옴
  //       setMouseOverNeuron(true);
  //
  //       // 뉴런 레이블에 해당하는 뉴런 데이터를 기억함
  //       setMouseOverNeuronData(message.data.neuron);
  //       break;
  //
  //     // 뉴런 레이블: 마우스 나감
  //     case 'mouse-leave-neuron-label':
  //       // 뉴런 레이블에서 마우스가 나감
  //       setMouseOverNeuron(false);
  //
  //       // 뉴런 레이블에 해당하는 뉴런 데이터를 초기화함
  //       startRemoveMouseOverNeuronData();
  //       break;
  //
  //     default:
  //       break;
  //   }
  // };

  /**
   * 뉴런 상세 정보 레이어 창의 PDF 파일 처리
   */

  // PDF 영역을 정의함
  const {
    width: pdfWidth,
    height: pdfHeight,
    ref: pdfRef,
  } = useResizeDetector();

  //
  const [pdfNumPages, setPdfNumPages] = useState<number>(0);
  const [pdfPageNumber, setPdfPageNumber] = useState<number>(1);

  // PDF 파일을 불러옴
  const handlePdf_onLoadSuccess = ({ numPages }: { numPages: number }) => {
    setPdfNumPages(numPages);
    console.log('> numPages:', numPages);
  };

  // PDF 이전 페이지로 이동 버튼을 클릭함
  const handlePdfMoveToPreButton_onClick = () => {
    if (pdfPageNumber <= 1) {
      return;
    }

    setPdfPageNumber(pdfPageNumber - 1);
  };

  // PDF 다음 페이지로 이동 버튼을 클릭함
  const handlePdfMoveToNextButton_onClick = () => {
    if (pdfPageNumber >= pdfNumPages) {
      return;
    }

    setPdfPageNumber(pdfPageNumber + 1);
  };

  /**
   * 뉴런 렌더링
   */

  // 뉴런을 캔버스에 출력함
  const renderNeuron = useMemo(() => {
    console.log('> mesh create');

    // const renderNeuron = useCallback(() => {
    // const renderNeuron = () => {
    return neurons.map((data: INeuron, index: number) => (
      <NeuronMesh
        key={index}
        name={`neuron-${data.id}`}
        // rotation={[
        //   Math.PI / 2,
        //   (-Math.PI / 2) * Math.random(),
        //   index,
        // ]}
        rotation={[Math.PI / 2, (-Math.PI / 2) * randomData1[index], index]}
        // position={[
        //   2 - Math.sin(i / 5) - 5,
        //   i * Math.random() * 0.5 - 1,
        //   2 - Math.cos(i / 5) - 1,
        // ]}
        // position={[
        //   Math.sin(index / 5) * 1.5,
        //   (index * Math.random()) / 2 - neurons.length * 0.1,
        //   Math.cos(index / 5),
        // ]}
        position={[
          Math.sin(index / 5) * 1.5,
          (index * randomData2[index]) / 2 - neurons.length * 0.1,
          Math.cos(index / 5),
        ]}
        checkedNeuronCategoryCheckBox={checkedNeuronCategoryCheckBox}
        gltf={{ nodes: nodes, materials: materials }}
        tag={data}
      />
    ));
  }, [neurons]);
  // };

  /**
   * 뉴런 분류 체크박스 렌더링
   */

  // 뉴런 분류 체크박스를 출력함
  const renderNeuronCategoryCheckBox = () => {
    return neuronCategory.map((data: INeuronCategory) => (
      <div key={data.index}>
        <Checkbox
          label={
            <span className="text-sm font-bold text-indigo-200 text-shadow-xs">
              {data.name}
            </span>
          }
          radius="xl"
          size="sm"
          color="indigo"
          onChange={() => {}}
          onClick={() => {
            // 클릭한 체크박스를 불러함
            let clickedCategory: string = data.category;

            // 체크한 뉴런 분류 체크박스를 불러옴
            let checkedCategory: string[] = _.cloneDeep(
              checkedNeuronCategoryCheckBox,
            );

            if (_.includes(checkedCategory, clickedCategory)) {
              if (_.includes(checkedCategory, clickedCategory)) {
                _.pull(checkedCategory, clickedCategory);
              }
            } else {
              if (!_.includes(checkedCategory, clickedCategory)) {
                checkedCategory.push(clickedCategory);
              }
            }

            // 체크한 뉴런 분류 체크박스를 기억함
            setCheckedNeuronCategoryCheckBox(_.cloneDeep(checkedCategory));
          }}
          checked={_.includes(checkedNeuronCategoryCheckBox, data.category)}
        />
      </div>
    ));
  };

  /**
   * JSON 데이터 읽음
   */

  // 뉴런 분류를 불러옴
  const getNeuronCategory = () => {
    axios
      .get('/json/neuron-category.json')
      .then((response) => {
        let tmpResponse: INeuronCategory[] = response.data;

        if (tmpResponse.length > 0) {
          // 배열을 정렬함
          tmpResponse = _.sortBy(tmpResponse, ['index']);

          // 뉴런 분류를 기억함
          setNeuronCategory(tmpResponse);

          // // 뉴런 분류를 기억함
          // (async () => {
          //   await setNeuronCategoryMutate(tmpResponse);
          // })();
        }
      })
      .catch((error) => {
        console.log('> JSON error: 뉴런 분류를 불러올 수 없습니다.');
        console.log('> JSON error:', error);
      });
  };

  /**
   * DB 데이터 읽음
   */

  // 뉴런 그룹을 불러옴
  const getNeuronGroup = () => {
    axios({
      method: 'GET',
      url: `${config.api.commonUrl.host}:${config.api.commonUrl.port}/neuron/neuron_group`,
      headers: {
        // Authorization: userMutate?.authorization,
      },
      params: {
        // userId: userMutate?.userId,
      },
    })
      .then((response: AxiosResponse<any>) => {
        if (response.headers.authorization !== undefined) {
          // 불러온 데이터를 정의함
          let tmpData: any = response.data.rowData;

          // 뉴런 그룹을 기억함
          setNeuronGroup(JSON.parse(tmpData[0].n_group || '[]'));
        } else {
          // // 경고창을 출력함
          // Dialog.alert({
          //   content: '정보를 불러올 수 없습니다.',
          //   confirmText: '확인',
          //   onConfirm: () => {},
          // });
        }
      })
      .catch((error) => {
        console.log('> axios get neuron group error:', error.response);
      });
  };

  // 뉴런 데이터를 불러옴
  const getNeuronData = () => {
    // 전체 뉴런을 불러옴
    axios({
      method: 'GET',
      url: `${config.api.commonUrl.host}:${config.api.commonUrl.port}/neuron/neurons`,
      headers: {
        // Authorization: userMutate?.authorization,
      },
      params: {
        // userId: userMutate?.userId,
      },
    })
      .then((response: AxiosResponse<any>) => {
        if (response.headers.authorization !== undefined) {
          // 불러온 데이터를 정의함
          let tmpData: any = response.data.rowData;

          // 임시로 기억할 뉴런 데이터를 정의함
          let tmpNeurons: INeuron[] = [];

          // 임시 데이터를 추가함
          Array.from({ length: paddingCount }).map(() => {
            tmpNeurons.push({
              id: 0,
              group: '',
              category: ENeuron.NONE,
              subCategory: '',
              title: '',
              content: '',
              date: '',
              image: [],
              pdf: [],
              linkUrl: '',
              sortNoInGroup: 0,
            });
          });

          // 불러온 데이터를 추가함
          tmpData.map((data: any) => {
            // 뉴런 데이터를 보정함
            tmpNeurons.push({
              id: data.id,
              group: data.group,
              category: data.category,
              subCategory: data.sub_category,
              title: data.title,
              content: data.content,
              date: data.date,
              image: JSON.parse(data.image || '[]'),
              pdf: JSON.parse(data.pdf || '[]'),
              linkUrl: data.link_url,
              sortNoInGroup: data.sort_no_in_group,
            });
          });

          // 임시 데이터를 추가함
          Array.from({ length: paddingCount }).map(() => {
            tmpNeurons.push({
              id: 0,
              group: '',
              category: ENeuron.NONE,
              subCategory: '',
              title: '',
              content: '',
              date: '',
              image: [],
              pdf: [],
              linkUrl: '',
              sortNoInGroup: 0,
            });
          });

          // 뉴런 데이터를 기억함
          setNeurons(tmpNeurons);
        } else {
          // // 경고창을 출력함
          // Dialog.alert({
          //   content: '정보를 불러올 수 없습니다.',
          //   confirmText: '확인',
          //   onConfirm: () => {},
          // });
        }
      })
      .catch((error) => {
        console.log('> axios error:', error.response);
      });

    // axios
    //   .get('/json/temp-neuron-data.json')
    //   .then((response) => {
    //     let tmpResponse: INeuron[] = response.data;
    //
    //     // 임시로 기억할 뉴런 데이터를 정의함
    //     let tmpNeurons: INeuron[] = [];
    //
    //     Array.from({ length: paddingCount }).map(() => {
    //       tmpNeurons.push({
    //         id: 0,
    //         group: '',
    //         category: ENeuron.NONE,
    //         subCategory: '',
    //         title: '',
    //         content: '',
    //         date: '',
    //         image: [],
    //         pdf: [],
    //         linkUrl: '',
    //       });
    //     });
    //
    //     if (tmpResponse.length > 0) {
    //       tmpNeurons = _.concat(tmpNeurons, response.data);
    //     }
    //
    //     Array.from({ length: paddingCount }).map(() => {
    //       tmpNeurons.push({
    //         id: 0,
    //         group: '',
    //         category: ENeuron.NONE,
    //         subCategory: '',
    //         title: '',
    //         content: '',
    //         date: '',
    //         image: [],
    //         pdf: [],
    //         linkUrl: '',
    //       });
    //     });
    //
    //     // 뉴런 데이터를 기억함
    //     setNeurons(tmpNeurons);
    //   })
    //   .catch((error) => {
    //     console.log('> JSON error: 뉴런 데이터를 불러올 수 없습니다.');
    //     console.log('> JSON error:', error);
    //   });
  };

  // 뉴런 그룹의 이름을 불러옴
  const getNeuronGroupName = (group: string): string => {
    return (
      _.find(neuronGroup, {
        id: group,
      })?.name || ''
    );
  };

  // 뉴런 분류의 이름을 불러옴
  const getNeuronCategoryName = (category: string): string => {
    return (
      _.find(neuronCategory, {
        category: category,
      })?.name || ''
    );
  };

  // 뉴런 하위 분류의 이름을 불러옴
  const getNeuronSubCategoryName = (
    category: string,
    subCategory: string,
  ): string => {
    let tmpCategory = _.find(neuronCategory, {
      category: category,
    });

    if (tmpCategory === undefined) {
      return '';
    }

    let tmpSubCategory =
      _.find(tmpCategory.subCategory, {
        value: subCategory,
      })?.name || '';

    return tmpSubCategory;
  };

  /**
   * 뉴런 상세 정보 레이어 창 처리
   */

  // 화면 크기에 맞는 레이어의 새 위치를 계산함
  const getLayerNewPosition = (
    paramPosition: IPosition = { x: 0, y: 0 },
  ): IPosition => {
    let tmpLayerPosition: IPosition = { x: 0, y: 0 };

    if (paramPosition.x === 0 && paramPosition.y === 0) {
      tmpLayerPosition = {
        x: neuronInfoLayer.x,
        y: neuronInfoLayer.y,
      };
    } else {
      tmpLayerPosition = {
        x: paramPosition.x,
        y: paramPosition.y,
      };
    }

    // 레이어의 현재 위치를 불러옴
    let tmpX = window.innerWidth - tmpLayerPosition.x!;
    let tmpY = window.innerHeight - tmpLayerPosition.y!;

    // 레이어가 Right + Bottom 밖으로 이동했는지를 계산하여 위치를 보정함
    tmpX = tmpX < 50 ? window.innerWidth - 50 : tmpLayerPosition.x!;
    tmpY = tmpY < 90 ? window.innerHeight - 90 : tmpLayerPosition.y!;

    // 레이어가 Left + Top 밖으로 이동했는지를 계산하여 위치를 보정함
    tmpX =
      tmpX < -(neuronInfoLayer.width - 50)
        ? -(neuronInfoLayer.width - 50)
        : tmpX;

    return {
      x: tmpX,
      y: tmpY,
    };
  };

  // 레이어의 화면 중간 정렬 위치를 계산함
  const getCenterPosition = (
    width: number,
    height: number,
  ): { x: number; y: number } => {
    let tmpX = width === 0 ? 0 : window.innerWidth / 2 - width / 2;
    let tmpY = height === 0 ? 0 : window.innerHeight / 2 - height / 2;

    // 위치 px 출력 방식(소수점 좌표)에 따라 레이어 모양이 일그러지는 경우가 발생하여 정수로 처리함
    tmpX = Math.round(tmpX);
    tmpY = Math.round(tmpY);

    return { x: tmpX, y: tmpY };
  };

  // 레이어를 드래그한 후 멈춤
  const handleRnd_onDragStop = (event: DraggableEvent, data: DraggableData) => {
    // 화면 크기에 맞는 레이어의 새 위치를 계산함
    // 위치 px 출력 방식(소수점 좌표)에 따라 레이어 모양이 일그러지는 경우가 발생하여 정수로 처리함
    const newLayerPosition = getLayerNewPosition({
      x: Math.round(data.x),
      y: Math.round(data.y),
    });

    setNeuronInfoLayer({
      ...neuronInfoLayer,
      x: newLayerPosition.x,
      y: newLayerPosition.y,
    });
  };

  // 레이어의 크기가 변경된 후 멈춤
  const handleRnd_onResizeStop = (
    event: MouseEvent | TouchEvent,
    dir: ResizeDirection,
    elementRef: HTMLElement,
    delta: ResizableDelta,
    position: Position,
  ) => {
    // 레이어의 크기를 불러옴
    const tmpWidth = +elementRef.style.width.replace('px', '');
    const tmpHeight = +elementRef.style.height.replace('px', '');

    setNeuronInfoLayer({
      ...neuronInfoLayer,
      width: tmpWidth,
      height: tmpHeight,
      x: position.x,
      y: position.y,
    });
  };

  // 뉴런 상세 정보 레이어를 닫음
  const handleRndCloseButton_onClick = () => {
    // 선택한 뉴런을 초기화함
    setSelectedNeuron(null);
  };

  // 상단 단축 버튼을 클릭함
  const handleShortcutButton_onClick = (data: string) => {
    switch (data) {
      // 초기 위치로 화면 이동
      case 'reset-camera':
        // setCameraPosition(new THREE.Vector3(0, 0, 5));
        // setCameraPosition([0.2, 0.2, 5] as THREE.Vector3);
        // setCameraPosition({ x: 100, y: 100, z: 15 });

        // orbitControlsRef.current.target.set(0.95, 0, 0);
        // // orbitControlsRef.current.update();
        //
        // console.log(orbitControlsRef.current);

        // orbitControlRef.current.target = { x: 10, y: 10, z: 10 } as THREE.Vector3;
        // orbitControlRef.current.position.set({
        //   x: 10,
        //   y: 10,
        //   z: 20,
        // } as THREE.Vector3);
        // orbitControlRef.current.update();

        // 윈도우 메시지를 보냄
        window.postMessage(
          {
            type: '',
            command: 'reset-camera',
            data: { x: 3, y: 0, z: 5 },
          } as IWindowMessage,
          '*',
        );
        break;

      // 뉴런 그룹 출력
      case 'neuron-group':
        setOpenLeuronGroupLayer(!openLeuronGroupLayer);
        break;

      // 뉴런 검색
      case 'search-neuron':
        break;

      default:
        break;
    }
  };

  /**
   * useEffect 처리
   */

  useEffect(() => {
    // 체크한 뉴런 분류 체크박스를 초기화함
    setCheckedNeuronCategoryCheckBox([
      'inspiration',
      'research',
      'possibility',
    ]);

    // 윈도우 메시지 이벤트를 시작함
    window.addEventListener('message', (event: MessageEvent) =>
      handleWindow_onMessage(event),
    );

    return () => {
      // 윈도우 메시지 이벤트를 제거함
      window.removeEventListener('message', (event: MessageEvent) =>
        handleWindow_onMessage(event),
      );
    };
  }, []);

  // 뉴런 분류 체크박스가 변경될 때 실행함
  useEffect(() => {
    // 체크한 뉴런 분류 체크박스를 윈도우 메시지로 보냄
    sendMessageCheckedNeuronCategoryCheckBox();
  }, [checkedNeuronCategoryCheckBox]);

  // 환경 설정이 변경될 때 실행함
  useEffect(() => {
    if (!config.loaded) {
      return;
    }

    // 뉴런 그룹을 불러옴
    getNeuronGroup();

    // 뉴런 분류를 불러옴
    getNeuronCategory();

    // 뉴런 데이터를 불러옴
    getNeuronData();

    // 임시!!
    // 뉴런 그룹 목록을 출력함
    startOpenLeuronGroupLayer();
  }, [config]);

  // 뉴런 그룹이 변경될 때 실행함
  useEffect(() => {
    neuronGroupRef.current = neuronGroup;
  }, [neuronGroup]);

  // 뉴런 분류가 변경될 때 실행함
  useEffect(() => {
    neuronCategoryRef.current = neuronCategory;
  }, [neuronCategory]);

  // 뉴런 그룹 목록에서 뉴런 그룹을 선택할 때 실행함
  useEffect(() => {
    // 뉴런 그룹 목록에서 선택한 뉴런 그룹을 윈도우 메시지로 보냄
    sendMessageSelectedNeuronGroup();
  }, [selectedLeuronGroup]);

  // 뉴런 그룹 목록에서 뉴런을 선택할 때 실행함
  useEffect(() => {
    console.log('> selectedNeuron:', selectedNeuron);
  }, [selectedNeuron]);

  const handle2 = () => {
    console.log('> orbitControlRef:', orbitControlRef.current);

    // orbitControlRef.current.position.set(10, 10, 5);

    orbitControlRef.current!.enableDamping = true;

    cameraRef.current?.position?.set(0, 10, 5);
    console.log('> cameraRef.current?.position:', cameraRef.current?.position);
  };

  return (
    <div className="relative w-screen h-screen webgl-background-color overflow-hidden select-none">
      {/*<div className="absolute left-96 top-6 w-14 h-14 z-40">*/}
      {/*  <FontAwesomeMultiIcon*/}
      {/*    tailwindMaxWidth={14}*/}
      {/*    tailwindMaxHeight={14}*/}
      {/*    icons={[*/}
      {/*      {*/}
      {/*        icon: ['fas', 'comment'],*/}
      {/*        className: 'w-6 h-6 text-white',*/}
      {/*      },*/}
      {/*      {*/}
      {/*        icon: ['fas', 'ban'],*/}
      {/*        className: 'w-14 h-14 text-red-600',*/}
      {/*      },*/}
      {/*    ]}*/}
      {/*  />*/}
      {/*</div>*/}

      {/* 사이트 제목 */}
      <div className="absolute left-8 top-6 space-y-0.5 z-40">
        <div onClick={handle2}>
          <span className="text-3xl font-bold text-white text-shadow-xs tracking-wider">
            LINA's Lab
          </span>
        </div>

        <div className="px-0.5 flex justify-between items-center">
          <span className="scale-75 text-xs font-bold text-white text-shadow-xs">
            P
          </span>
          <span className="scale-75 text-xs font-bold text-white text-shadow-xs">
            R
          </span>
          <span className="scale-75 text-xs font-bold text-white text-shadow-xs">
            O
          </span>
          <span className="scale-75 text-xs font-bold text-white text-shadow-xs">
            J
          </span>
          <span className="scale-75 text-xs font-bold text-white text-shadow-xs">
            E
          </span>
          <span className="scale-75 text-xs font-bold text-white text-shadow-xs">
            C
          </span>
          <span className="scale-75 text-xs font-bold text-white text-shadow-xs">
            T
          </span>
        </div>
      </div>

      {/* 검색 */}
      {/*<div className="absolute left-8 top-16 space-y-4 z-40 hidden">*/}
      {/*  /!* 텍스트박스 *!/*/}
      {/*  <div>*/}
      {/*    <TextInput placeholder="Search" label="" />*/}
      {/*  </div>*/}

      {/*  /!* 체크박스 *!/*/}
      {/*  <div className="space-y-2">{renderNeuronCategoryCheckBox()}</div>*/}
      {/*</div>*/}

      {/* 상단 단축 버튼 */}
      <div className="absolute left-1/2 top-7 -translate-x-1/2 px-2 py-1.5 flex justify-center items-center bg-black/30 rounded-full z-60">
        {/* 초기 위치로 화면 이동 */}
        <Tooltip
          position="bottom"
          offset={20}
          transition="slide-down"
          transitionDuration={200}
          label={
            <span className="text-xs font-bold text-white">
              초기 위치로 화면 이동
            </span>
          }
          withArrow
        >
          <div
            onClick={() => handleShortcutButton_onClick('reset-camera')}
            className="button-event w-7 h-7 flex justify-center items-center bg-black/50 rounded-full overflow-hidden"
          >
            <FontAwesomeIcon
              icon={['fas', 'cube']}
              className="w-3.5 h-3.5 text-white"
            />
          </div>
        </Tooltip>

        <div className="w-2" />

        {/* 뉴런 그룹 출력 */}
        <Tooltip
          position="bottom"
          offset={20}
          transition="slide-down"
          transitionDuration={200}
          label={
            <span className="text-xs font-bold text-white">뉴런 그룹 출력</span>
          }
          withArrow
        >
          <div
            onClick={() => handleShortcutButton_onClick('neuron-group')}
            className="button-event w-7 h-7 flex justify-center items-center bg-black/50 rounded-full overflow-hidden"
          >
            <FontAwesomeIcon
              icon={['fas', 'circle-nodes']}
              className="w-3.5 h-3.5 text-white"
            />
          </div>
        </Tooltip>

        <div className="w-2" />

        {/* 뉴런 검색 */}
        <Popover
          width={350}
          trapFocus
          position="bottom"
          withArrow
          // closeOnClickOutside={false}
          shadow="md"
          // onOpen={resetLeuronSearchLayer}
          onClose={() => {
            setOpenLeuronSearchLayer(false);
            resetLeuronSearchLayer();
          }}
          opened={openLeuronSearchLayer}
        >
          {/* 트리거 버튼 */}
          <Popover.Target>
            <Tooltip
              position="bottom"
              offset={20}
              transition="slide-down"
              transitionDuration={200}
              label={
                <span className="text-xs font-bold text-white">뉴런 검색</span>
              }
              withArrow
            >
              <div
                onClick={() => setOpenLeuronSearchLayer(true)}
                className="button-event w-7 h-7 flex justify-center items-center bg-black/50 rounded-full overflow-hidden"
              >
                <FontAwesomeIcon
                  icon={['fas', 'magnifying-glass']}
                  className="w-3.5 h-3.5 text-white"
                />
              </div>
            </Tooltip>
          </Popover.Target>

          <Popover.Dropdown>
            <div className="relative w-full mb-1 px-1 space-y-4">
              {/* 검색 */}
              <div className="flex justify-center items-end space-x-1">
                <TextInput
                  placeholder="검색어를 입력하세요."
                  label="검색"
                  size="xs"
                  withAsterisk={true}
                  onChange={(event) => {
                    setLeuronSearchLayerInput(event.currentTarget.value);
                  }}
                  onKeyDown={handleLeuronSearchLayerInput_onKeyDown}
                  defaultValue={leuronSearchLayerInput}
                  className="w-full"
                />

                {/* 검색하기 버튼 */}
                <Button
                  onClick={getSearchNeuron}
                  // leftIcon={
                  //   <FontAwesomeIcon
                  //     icon={['fas', 'check']}
                  //     className="w-3.5 h-3.5"
                  //   />
                  // }
                  size="xs"
                >
                  검색하기
                </Button>
              </div>

              {/* 검색된 목록 */}
              <div className="relative w-full h-72 bg-gray-100 rounded">
                {/* 검색된 결과가 없음 */}
                {leuronSearchLayerResult.length === 0 && (
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="flex justify-center items-center">
                      <span className="text-sm font-bold text-gray-600">
                        검색된 결과가 없습니다.
                      </span>
                    </div>
                  </div>
                )}

                {/* 검색된 결과가 있음 */}
                {leuronSearchLayerResult.length !== 0 && (
                  <div>
                    <ScrollArea
                      style={{
                        height: '18rem',
                      }}
                      className="relative w-full"
                    >
                      <div className="relative p-2 bg-gray-100 rounded">
                        {leuronSearchLayerResult.map(
                          (neuron: INeuron, index: number) => (
                            <div
                              key={neuron.id}
                              onClick={() => setSelectedNeuron(neuron)}
                              className={`button-event px-2 py-2 hover:bg-white space-y-1 ${
                                index > 0 && 'border-t border-gray-300'
                              }`}
                            >
                              {/* 간략 정보 */}
                              <div className="pt-1 flex justify-start items-center space-x-3">
                                {/* 분류 - 하위분류 */}
                                <div
                                  className={`px-1 flex justify-center items-center rounded ${
                                    neuron.id !== selectedNeuron?.id &&
                                    'bg-gray-600'
                                  } ${
                                    neuron.id === selectedNeuron?.id &&
                                    'bg-amber-600'
                                  }`}
                                >
                                  <span className="scale-90 text-xs font-bold text-white">
                                    {getNeuronCategoryName(neuron.category)} -{' '}
                                    {getNeuronSubCategoryName(
                                      neuron.category,
                                      neuron.subCategory,
                                    )}
                                  </span>
                                </div>
                              </div>

                              {/* 제목 */}
                              <div className="flex justify-start items-center">
                                <span className="text-xs font-semibold text-gray-700">
                                  {neuron.title}
                                </span>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>

              {/* 버튼 */}
              <div className="flex justify-between items-center">
                <div className="flex justify-center items-center space-x-2"></div>

                <div className="flex justify-center items-center space-x-2">
                  {/* 닫기 버튼 */}
                  <Button
                    onClick={() => setOpenLeuronSearchLayer(false)}
                    size="xs"
                    color="dark"
                  >
                    닫기
                  </Button>
                </div>
              </div>
            </div>
          </Popover.Dropdown>
        </Popover>
      </div>

      {/* 마우스 오버용 뉴런 이름 */}
      <motion.div
        // animate={neuronControlMutate?.mouseOverData !== null ? 'open' : 'close'}
        // animate={mouseOverNeuronData !== null ? 'open' : 'close'}
        transition={{
          staggerChildren: 0.1,
        }}
        className="absolute right-8 top-7 space-y-1 z-40"
      >
        {/* 뉴런 분류 */}
        <motion.div
          initial={false}
          animate={mouseOverNeuron ? 'open' : 'close'}
          variants={{
            open: { opacity: 1, x: 0 },
            close: { opacity: 0, x: -50 },
          }}
          transition={{
            type: 'spring',
            stiffness: 700,
            damping: 30,
          }}
          className="flex justify-end items-center"
        >
          {/* 그룹 */}
          <div className="px-3 py-1 flex justify-center items-center rounded">
            <span className="text-sm font-bold text-white text-shadow-xs">
              {mouseOverNeuronData?.group &&
                getNeuronGroupName(mouseOverNeuronData.group)}
            </span>
          </div>

          {/* 분류 */}
          <div className="px-3 py-1 flex justify-center items-center bg-teal-900 rounded">
            <span className="text-xs font-bold text-white">
              {mouseOverNeuronData?.category &&
                getNeuronCategoryName(mouseOverNeuronData.category)}{' '}
              -{' '}
              {mouseOverNeuronData?.subCategory &&
                getNeuronSubCategoryName(
                  mouseOverNeuronData.category,
                  mouseOverNeuronData.subCategory,
                )}
            </span>
          </div>
        </motion.div>

        {/* 제목 */}
        <motion.div
          animate={mouseOverNeuron ? 'open' : 'close'}
          variants={{
            open: { opacity: 1, x: 0 },
            close: { opacity: 0, x: -15 },
          }}
          transition={{
            type: 'spring',
            stiffness: 700,
            damping: 30,
          }}
          className="flex justify-end items-center"
        >
          <div className="px-3 flex justify-center items-center bg-black/10">
            <span className="text-xl font-semibold text-white text-shadow-xs">
              {mouseOverNeuronData?.title}
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* 뉴런 그룹 레이어 */}
      <motion.div
        initial={false}
        animate={openLeuronGroupLayer ? 'open' : 'close'}
        variants={{
          open: { opacity: 1, x: 0, display: 'block' },
          close: { opacity: 0, x: -200, transitionEnd: { display: 'none' } },
        }}
        transition={{
          type: 'spring',
          stiffness: 700,
          damping: 30,
        }}
        className="absolute left-8 bottom-14 w-84 z-50"
      >
        <div>
          {/* 뉴런 그룹 목록 */}
          <ScrollArea
            style={{
              height: 'calc(100vh - 180px)',
            }}
          >
            <div className="w-full space-y-10">
              {neuronGroup.map((group: INeuronGroup) => (
                <div key={group.id} className="space-y-3 rounded-sm">
                  {/* 그룹 제목 체크박스 */}
                  <Checkbox
                    label={
                      <span className="text-sm font-bold text-white text-shadow-xs">
                        {group.name}
                      </span>
                    }
                    radius="xl"
                    size="sm"
                    color="red"
                    onChange={() => {}}
                    onClick={() => {
                      if (
                        selectedLeuronGroup !== null &&
                        group.id === selectedLeuronGroup.id
                      ) {
                        // 선택한 뉴런 그룹을 초기화함
                        setSelectedLeuronGroup(null);
                      } else {
                        // 뉴런 그룹을 선택함
                        setSelectedLeuronGroup(group);
                      }
                    }}
                    checked={
                      selectedLeuronGroup !== null &&
                      group.id === selectedLeuronGroup.id
                    }
                    className="px-2"
                  />

                  {/* 그룹에 속한 뉴런 */}
                  <div className="space-y-1">
                    {neurons
                      .filter(
                        (filterData: INeuron) => filterData.group === group.id,
                      )
                      .map((neuron: INeuron) => (
                        <div
                          key={neuron.id}
                          onClick={() => setSelectedNeuron(neuron)}
                          className={`relative px-5 py-2 rounded-md overflow-hidden ${
                            neuron.id !== selectedNeuron?.id &&
                            'button-event bg-gray-800/90 hover:bg-black/80'
                          } ${
                            neuron.id === selectedNeuron?.id && 'bg-amber-500'
                          }`}
                        >
                          {/* 선택한 그룹임을 표시 */}
                          <motion.div
                            animate={
                              selectedLeuronGroup !== null &&
                              group.id === selectedLeuronGroup.id
                                ? 'open'
                                : 'close'
                            }
                            variants={{
                              open: { opacity: 1 },
                              close: { opacity: 0 },
                            }}
                            transition={{
                              type: 'spring',
                              stiffness: 700,
                              damping: 30,
                            }}
                          >
                            <div className="absolute right-1 top-1 px-2 py-0.5 flex justify-center items-center bg-amber-600 rounded space-x-1 scale-75 origin-top-right z-20">
                              <div className="flex justify-center items-center">
                                <FontAwesomeIcon
                                  icon={['fas', 'circle-notch']}
                                  className="w-3 h-3 text-white animate-spin"
                                />
                              </div>

                              <div className="flex justify-center items-center">
                                <span className="text-xs font-bold text-white">
                                  GROUP
                                </span>
                              </div>
                            </div>
                          </motion.div>

                          {/* 그룹 */}
                          <div className="space-y-2">
                            {/* 간략 정보 */}
                            <div className="pt-1 flex justify-start items-center space-x-3">
                              {/* 분류 - 하위분류 */}
                              <div
                                className={`px-1 flex justify-center items-center rounded ${
                                  neuron.id !== selectedNeuron?.id &&
                                  'bg-teal-900'
                                } ${
                                  neuron.id === selectedNeuron?.id &&
                                  'bg-blue-900'
                                }`}
                              >
                                <span className="scale-90 text-xs font-bold text-white">
                                  {getNeuronCategoryName(neuron.category)} -{' '}
                                  {getNeuronSubCategoryName(
                                    neuron.category,
                                    neuron.subCategory,
                                  )}
                                </span>
                              </div>

                              {/* 이미지 파일 포함 여부 */}
                              {neuron.image !== null &&
                                neuron.image.length > 0 && (
                                  <div className="flex justify-center items-center">
                                    <FontAwesomeIcon
                                      icon={['fas', 'image']}
                                      className={`w-3.5 h-3.5 ${
                                        neuron.id !== selectedNeuron?.id &&
                                        'text-lime-600'
                                      } ${
                                        neuron.id === selectedNeuron?.id &&
                                        'text-blue-600'
                                      }`}
                                    />
                                  </div>
                                )}

                              {/* PDF 파일 포함 여부 */}
                              {neuron.pdf !== null && neuron.pdf.length > 0 && (
                                <div className="flex justify-center items-center">
                                  <FontAwesomeIcon
                                    icon={['fas', 'note-sticky']}
                                    className={`w-3.5 h-3.5 ${
                                      neuron.id !== selectedNeuron?.id &&
                                      'text-lime-600'
                                    } ${
                                      neuron.id === selectedNeuron?.id &&
                                      'text-blue-600'
                                    }`}
                                  />
                                </div>
                              )}
                            </div>

                            {/* 제목 */}
                            <div className="flex justify-start items-center">
                              <span className="text-sm font-semibold text-white text-shadow-xs">
                                {neuron.title}
                              </span>
                            </div>

                            {/* 일시 */}
                            <div className="flex justify-end items-center">
                              <span className="scale-75 origin-right text-xs font-semibold text-white underline underline-offset-4 decoration-gray-400 decoration-dotted text-shadow-xs">
                                {neuron.date}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* 레이어 닫기 버튼 */}
          <div className="absolute left-1/2 -bottom-11 -translate-x-1/2 flex justify-center items-center">
            <CloseButton
              title="Close popover"
              size="lg"
              iconSize={40}
              onClick={() => setOpenLeuronGroupLayer(false)}
            />
          </div>
        </div>
      </motion.div>

      {/* 상세 정보 레이어 */}
      {/*<NeuronDetailInfo />*/}
      {/*<NeuronDetailInfo2 />*/}
      <NeuronInfo />

      {/* 3D */}
      <div className="absolute left-0 top-0 w-full h-full z-20">
        {/* CycleRaycast's status data can now be turned into informative HTML */}
        {/*<Canvas shadows dpr={1.5} camera={{ position: [-10, 10, 5], fov: 50 }}>*/}
        {/*<Canvas*/}
        {/*  shadows*/}
        {/*  dpr={[1, 2]}*/}
        {/*  camera={{ position: [-10, 5, 5], fov: 20 }}*/}
        {/*>*/}
        <Canvas
          // flat
          // shadows
          dpr={[1, 2]}
          camera={{ position: [0, 0, 5], fov: 40 }}
          // className="webgl-background-color"
          // gl={{
          //   powerPreference: 'high-performance',
          //   alpha: true,
          //   antialias: true,
          //   stencil: true,
          //   depth: true,
          // }}
        >
          {/*<Rig>*/}
          {/*<color attach="background" args={['gray']} />*/}
          {/*<OrbitControls*/}
          {/*  makeDefault*/}
          {/*  ref={orbitControlsRef}*/}
          {/*  enableDamping={true}*/}
          {/*  dampingFactor={0.05}*/}
          {/*  // minPolarAngle={0}*/}
          {/*  // maxPolarAngle={Math.PI / 1.75}*/}
          {/*/>*/}

          {/*<CustomOrbitControls ref={orbitControlRef} />*/}
          <OrbitControls ref={orbitControlRef} makeDefault />
          <PerspectiveCamera ref={cameraRef} makeDefault />

          {/*<CameraShake*/}
          {/*  yawFrequency={1}*/}
          {/*  maxYaw={0.05}*/}
          {/*  pitchFrequency={1}*/}
          {/*  maxPitch={0.05}*/}
          {/*  rollFrequency={0.5}*/}
          {/*  maxRoll={0.5}*/}
          {/*  intensity={0.2}*/}
          {/*/>*/}
          {/*<Background />*/}
          <Stage />
          {/*<Suspense fallback={null}>*/}
          <Bounds clip observe>
            <SelectToZoom>{renderNeuron}</SelectToZoom>
          </Bounds>

          {/*</Suspense>*/}
          {/* This component cycles through the raycast intersections, combine it with event.stopPropagation! */}
          {/*<CycleRaycast onChanged={(objects, cycle) => set({ objects, cycle })} />*/}
          {/*<CycleRaycast />*/}
          {/*</Rig>*/}
          <EffectComposer multisampling={0} disableNormalPass={true}>
            {/*<DepthOfField*/}
            {/*  focusDistance={0}*/}
            {/*  focalLength={0.02}*/}
            {/*  bokehScale={2}*/}
            {/*  height={400}*/}
            {/*/>*/}
            {/*<Bloom*/}
            {/*  luminanceThreshold={0.5}*/}
            {/*  luminanceSmoothing={1}*/}
            {/*  height={480}*/}
            {/*  opacity={2}*/}
            {/*/>*/}
            {/*<Noise opacity={0.02} />*/}
            <Vignette eskil={false} offset={0.5} darkness={0.7} />
          </EffectComposer>
        </Canvas>
      </div>
    </div>
  );
};

// 카메라
const CustomOrbitControls = () => {
  const [targetPosition, setTargetPosition] = useState<{
    x: number;
    y: number;
    z: number;
  } | null>(null);

  const [started, setStarted] = useState<boolean>(false);
  const vec = new THREE.Vector3();

  let prePosition: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };

  useFrame((state) => {
    if (targetPosition !== null) {
      // state.camera.lookAt(1, 0, 0);
      state.camera.position.lerp(
        vec.set(targetPosition.x, targetPosition.y, targetPosition.z),
        0.05,
      );
      state.camera.updateProjectionMatrix();

      if (
        prePosition.x.toFixed(3) === state.camera.position.x.toFixed(3) &&
        prePosition.y.toFixed(3) === state.camera.position.y.toFixed(3) &&
        prePosition.z.toFixed(3) === state.camera.position.z.toFixed(3)
      ) {
        setTargetPosition(null);
        console.log('끝');
      }

      prePosition.x = state.camera.position.x;
      prePosition.y = state.camera.position.y;
      prePosition.z = state.camera.position.z;
    } else {
      return null;
    }
  });

  // 3D 카메라를 정의함
  const orbitControlsRef = useRef<any>(null);

  // 윈도우 메시지를 받음
  const handleWindow_onMessage = useCallback((event: MessageEvent) => {
    if (event.data.command === undefined) {
      return;
    }

    const message: IWindowMessage = event.data;

    switch (message.command) {
      //
      case 'reset-camera':
        // orbitControlsRef.current.target.set(0.95, 0, 0);
        // orbitControlsRef.current.update();

        // console.log(orbitControlsRef.current.target.x);
        // setStarted(true);
        setTargetPosition(message.data);
        break;

      default:
        break;
    }
  }, []);

  useEffect(() => {
    // 윈도우 메시지 이벤트를 시작함
    window.addEventListener('message', (event: MessageEvent) =>
      handleWindow_onMessage(event),
    );

    return () => {
      // 윈도우 메시지 이벤트를 제거함
      window.removeEventListener('message', (event: MessageEvent) =>
        handleWindow_onMessage(event),
      );
    };
  }, []);

  return (
    <OrbitControls
      makeDefault
      // args={[camera, gl.domElement]}
      ref={orbitControlsRef}
      enableDamping={true}
      dampingFactor={0.05}
      onPointerMove={() => setTargetPosition(null)}
      // minPolarAngle={0}
      // maxPolarAngle={Math.PI / 1.75}
    />
  );
};

// 배경
const Stage = () => {
  return (
    <>
      {/* Fill */}
      <ambientLight intensity={0.5} />
      {/* Main */}
      <directionalLight
        position={[1, 10, -2]}
        intensity={1}
        shadow-camera-far={70}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-mapSize={[512, 512]}
        castShadow
      />
      {/* Strip */}
      <directionalLight position={[-10, -10, 2]} intensity={3} />
      {/* Ground */}
      <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, -0.75, 0]}>
        <planeGeometry args={[20, 20]} />
        <shadowMaterial opacity={0.2} />
      </mesh>
      {/* This freezes the shadow map, which is fast, but the model has to be static  */}
      <BakeShadows />
    </>
  );
};

// Percentage closer soft shadows, normally *very* expensive
// softShadows();

const Rig = ({ children }: { children: any }) => {
  const outer = useRef<THREE.Group>(null!);
  const inner = useRef<THREE.Group>(null!);
  useFrame(({ camera, clock }) => {
    outer.current.position.y = THREE.MathUtils.lerp(
      outer.current.position.y,
      0,
      0.05,
    );
    inner.current.rotation.y = Math.sin(clock.getElapsedTime() / 8) * Math.PI;
    inner.current.position.z = 5 + -Math.sin(clock.getElapsedTime() / 2) * 10;
    inner.current.position.y = -5 + Math.sin(clock.getElapsedTime() / 2) * 2;
  });
  return (
    <group position={[0, -100, 0]} ref={outer}>
      <group ref={inner}>{children}</group>
    </group>
  );
};

//
function SelectToZoom({ children }: { children: any }) {
  const api = useBounds();

  return (
    <group
    // onClick={(e) => (
    //   e.stopPropagation(), e.delta <= 2 && api.refresh(e.object).fit()
    // )}
    // onPointerMissed={(e) => e.button === 0 && api.refresh().fit()}
    >
      {children}
    </group>
  );
}

const Background = (props: any) => {
  const { gl } = useThree();

  const texture = useTexture('/images/skybox_1.jpg');
  const formatted = new THREE.WebGLCubeRenderTarget(
    texture.image.height,
  ).fromEquirectangularTexture(gl, texture);
  return <primitive attach="background" object={formatted.texture} />;
};

export default Main;
