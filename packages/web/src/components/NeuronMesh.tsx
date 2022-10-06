import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useRecoilState, useRecoilValue } from 'recoil';
import { neuronCategoryCheckBoxAtom } from '../recoils/neuronCategoryCheckBox.atom';
import {
  INeuronCategory,
  INeuronGroup,
  IWindowMessage,
} from '../interfaces/app.interface';
import { useFrame } from '@react-three/fiber';
import { Html, Sparkles } from '@react-three/drei';
import _ from 'lodash';
import MultiPolarNeuron from './MultiPolarNeuron';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// const NeuronMesh: React.FC<any> = memo((props) => {
const NeuronMesh: React.FC<any> = (props: any) => {
  console.log('ok!');

  // 뉴런 그룹을 정의함
  const [neuronGroup, setNeuronGroup] = useState<INeuronGroup[]>([]);

  // 뉴런 분류를 정의함
  const [neuronCategory, setNeuronCategory] = useState<INeuronCategory[]>([]);

  // 선택한 뉴런 그룹 여부를 정의함
  const [selectedNeuronGroup, setSelectedNeuronGroup] =
    useState<boolean>(false);

  // 체크한 뉴런 분류 체크박스를 정의함
  const [checkedNeuronCategoryCheckBox, setCheckedNeuronCategoryCheckBox] =
    useState<string[]>([]);

  const ref = useRef<THREE.Mesh>(null!);

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
   * 뉴런 레이블의 마우스 이벤트 처리
   */

  // 뉴런 레이블에 마우스가 들어옴
  const handleLabel_onMouseOver = () => {
    // 윈도우 메시지를 보냄
    window.postMessage(
      {
        type: '',
        command: 'mouse-over-neuron-label',
        data: {
          neuron: props.tag,
        },
      } as IWindowMessage,
      '*',
    );
  };

  // 뉴런 레이블에서 마우스가 나감
  const handleLabel_onMouseLeave = () => {
    // 윈도우 메시지를 보냄
    window.postMessage(
      {
        type: '',
        command: 'mouse-leave-neuron-label',
        data: {
          neuron: props.tag,
        },
      } as IWindowMessage,
      '*',
    );
  };

  // 뉴런 레이블을 클릭함
  const handleLabel_onClick = () => {
    // 윈도우 메시지를 보냄
    window.postMessage(
      {
        type: '',
        command: 'mouse-click-neuron-label',
        data: {
          neuron: props.tag,
        },
      } as IWindowMessage,
      '*',
    );

    // // 윈도우 메시지를 보냄
    // window.postMessage(
    //   {
    //     type: '',
    //     command: 'open-neuron-info-layer',
    //     data: {
    //       neuron: props.tag,
    //     },
    //   } as IWindowMessage,
    //   '*',
    // );
  };

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
      // 체크한 뉴런 분류 체크박스가 변경됨
      case 'checked-neuron-category-checkBox':
        // 체크한 뉴런 분류 체크박스를 기억함
        setCheckedNeuronCategoryCheckBox(
          message.data.checkedNeuronCategoryCheckBox,
        );
        break;

      // 기초값을 받음
      case 'initial-data':
        if (message.data.id === props.tag.id) {
          // 뉴런 그룹을 기억함
          setNeuronGroup(message.data.neuronGroup);

          // 뉴런 분류를 기억함
          setNeuronCategory(message.data.neuronCategory);
        }
        break;

      // 선택한 뉴런 그룹을 받음
      case 'selected-neuron-group':
        if (message.data.selectedLeuronGroup === null) {
          // 선택한 뉴런 그룹 여부를 해제함
          setSelectedNeuronGroup(false);
        } else {
          if (message.data.selectedLeuronGroup.id === props.tag.group) {
            // 선택한 뉴런 그룹 여부를 기억함
            setSelectedNeuronGroup(true);
          } else {
            // 선택한 뉴런 그룹 여부를 해제함
            setSelectedNeuronGroup(false);
          }
        }
        break;

      default:
        break;
    }
  }, []);

  // 뉴런의 로딩이 끝나고 나면 메인에게 기초값을 요청함
  const getInitialData = () => {
    // 윈도우 메시지를 보냄
    window.postMessage(
      {
        type: '',
        command: 'get-initial-data',
        data: {
          id: props.tag.id,
        },
      } as IWindowMessage,
      '*',
    );
  };

  useFrame((state) => {
    let currentSec: number = Math.ceil(state.clock.elapsedTime);

    // 뉴런을 천천히 회전시킴
    ref.current.rotation.x += Math.random() * 0.0003;
    ref.current.rotation.y += Math.random() * 0.0005;
    ref.current.rotation.z += Math.random() * 0.0003;

    // 뉴런의 크기를 줄이고 늘림
    ref.current.scale.setScalar(
      1 + Math.sin(state.clock.elapsedTime / 0.6) / 100,
    );

    // ref.current.geometry.attributes.color
    //
    // ref.current.instanceMatrix.needsUpdate = true;
  });

  // Sets document.body.style.cursor: useCursor(flag, onPointerOver = 'pointer', onPointerOut = 'auto')
  // useCursor(hovered);

  useEffect(() => {
    // console.log(props);

    // 체크한 뉴런 분류 체크박스를 기억함
    setCheckedNeuronCategoryCheckBox(props.checkedNeuronCategoryCheckBox);

    // 윈도우 메시지 이벤트를 시작함
    window.addEventListener('message', (event: MessageEvent) =>
      handleWindow_onMessage(event),
    );

    if (props.tag.id !== 0) {
      // 뉴런의 로딩이 끝나고 나면 메인에게 기초값을 요청함
      getInitialData();
    }

    return () => {
      // 윈도우 메시지 이벤트를 제거함
      window.removeEventListener('message', (event: MessageEvent) =>
        handleWindow_onMessage(event),
      );
    };
  }, []);

  return (
    <mesh
      {...props}
      ref={ref}
      receiveShadow
      castShadow
      // onClick={(e) => (e.stopPropagation(), setClicked(!clicked))}
      // onPointerOver={(e) => (e.stopPropagation(), setHovered(true))}
      // onPointerOut={(e) => setHovered(false)}
      visible={
        _.includes(checkedNeuronCategoryCheckBox, props.tag.category) ||
        props.tag.category === ''
      }
    >
      {/*<boxGeometry args={[2, 6, 0.075]} />*/}
      <MultiPolarNeuron scale={4} gltf={props.gltf} tag={props.tag} />
      {/*<meshStandardMaterial*/}
      {/*  roughness={1}*/}
      {/*  transparent={true}*/}
      {/*  opacity={0.1}*/}
      {/*  color={clicked ? 'lightblue' : hovered ? 'aquamarine' : 'white'}*/}
      {/*/>*/}
      <Sparkles
        count={10}
        scale={0.1}
        size={1}
        speed={0.1}
        opacity={0.3}
        color={'rgb(209,54,142)'}
      />
      <Sparkles
        count={5}
        scale={0.7}
        size={3}
        speed={0.1}
        opacity={0.05}
        color={'rgb(30,124,178)'}
      />

      {/* 뉴런 레이블 */}
      {props.tag.title &&
        _.includes(checkedNeuronCategoryCheckBox, props.tag.category) && (
          <Html distanceFactor={3}>
            {/*<div*/}
            {/*  onClick={handleLabel_onClick}*/}
            {/*  onMouseOver={handleLabel_onMouseOver}*/}
            {/*  onMouseLeave={handleLabel_onMouseLeave}*/}
            {/*  className="neuron-button px-3 py-2 max-w-xs bg-black/40 rounded leading-none space-y-1"*/}
            {/*>*/}
            {/*  /!* 제목 *!/*/}
            {/*  <div className="w-full flex justify-center items-center leading-none">*/}
            {/*    <span className="text-xs text-gray-300 whitespace-nowrap truncate">*/}
            {/*      {getNeuronCategoryName(props.tag.category)} +{' '}*/}
            {/*      {props.tag.category}: {props.tag.title} -{' '}*/}
            {/*    </span>*/}
            {/*  </div>*/}

            {/*  /!* 날짜 *!/*/}
            {/*  <div className="w-full flex justify-start items-center leading-none">*/}
            {/*    <span className="scale-75 -translate-x-2 text-xs text-rose-600 font-extrabold whitespace-nowrap truncate">*/}
            {/*      {props.tag.date}*/}
            {/*    </span>*/}
            {/*  </div>*/}
            {/*</div>*/}

            <div
              key={props.tag.id}
              onClick={handleLabel_onClick}
              onMouseOver={handleLabel_onMouseOver}
              onMouseLeave={handleLabel_onMouseLeave}
              // className={`button-event relative w-80 px-5 py-2 rounded-md scale-50 hover:scale-75 hover:bg-gray-900 ${
              //   !selectedNeuronGroup &&
              //   'outline outline-offset-4 outline-1 outline-gray-600 bg-gray-900/10'
              // } ${
              //   selectedNeuronGroup &&
              //   'outline outline-offset-8 outline-4 outline-amber-500 bg-black/60'
              // }`}
              className="relative"
            >
              {/* 포인트 지점 */}
              <div className="absolute left-0 top-1/2 translate-x-10 -translate-y-1/2 flex justify-center items-center">
                <FontAwesomeIcon
                  icon={['fas', 'circle-dot']}
                  className="button-event w-6 h-6 text-amber-400"
                />
              </div>

              {/* 그룹 */}
              <div
                className={`button-event relative w-80 px-5 py-2 rounded-md scale-50 hover:scale-75 hover:origin-right hover:bg-gray-900 ${
                  !selectedNeuronGroup &&
                  'outline outline-offset-4 outline-1 outline-gray-600 bg-gray-900/10'
                } ${
                  selectedNeuronGroup &&
                  'outline outline-offset-8 outline-4 outline-amber-500 bg-black/60'
                }`}
              >
                <div className="space-y-2">
                  {/* 임시!! */}
                  <span className="text-3xl font-bold text-white text-shadow-xs">
                    {props.name}
                  </span>

                  {/* 그룹 이름 */}
                  <div className="flex justify-start items-center">
                    <span className="text-sm font-semibold text-white">
                      GROUP: {getNeuronGroupName(props.tag.group)}
                    </span>
                  </div>

                  {/* 간략 정보 */}
                  <div className="pt-1 flex justify-start items-center space-x-3">
                    {/* 분류 - 하위분류 */}
                    <div className="px-1 flex justify-center items-center bg-teal-900 rounded">
                      <span className="scale-90 text-xs font-bold text-white">
                        {getNeuronCategoryName(props.tag.category)} -{' '}
                        {getNeuronSubCategoryName(
                          props.tag.category,
                          props.tag.subCategory,
                        )}
                      </span>
                    </div>

                    {/* 이미지 파일 포함 여부 */}
                    {props.tag.image !== null && props.tag.image.length > 0 && (
                      <div className="flex justify-center items-center">
                        <FontAwesomeIcon
                          icon={['fas', 'image']}
                          className="w-3.5 h-3.5 text-lime-600"
                        />
                      </div>
                    )}

                    {/* PDF 파일 포함 여부 */}
                    {props.tag.pdf !== null && props.tag.pdf.length > 0 && (
                      <div className="flex justify-center items-center">
                        <FontAwesomeIcon
                          icon={['fas', 'note-sticky']}
                          className="w-3.5 h-3.5 text-lime-600"
                        />
                      </div>
                    )}
                  </div>

                  {/* 제목 */}
                  <div className="flex justify-start items-center">
                    <span className="text-sm font-semibold text-white">
                      {props.tag.title}
                    </span>
                  </div>

                  {/* 일시 */}
                  <div className="flex justify-end items-center">
                    <span className="scale-75 origin-right text-xs font-semibold text-gray-400 underline underline-offset-4 decoration-indigo-400 decoration-dotted">
                      {props.tag.date}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Html>
        )}
    </mesh>
  );
};

export default NeuronMesh;
