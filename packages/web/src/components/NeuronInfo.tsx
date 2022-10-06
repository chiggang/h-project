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

/**
 * 뉴런 상세 정보 레이어
 * @param props
 * @constructor
 */
const NeuronInfo: React.FC<any> = (props: any) => {
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

  // 뉴런 데이터를 정의함
  const [neurons, setNeurons] = useRecoilState<INeuron[]>(neuronsAtom);

  // 선택한 뉴런을 정의함
  const [selectedNeuron, setSelectedNeuron] =
    useRecoilState(selectedNeuronAtom);

  const [neuronInfoLayer, setNeuronInfoLayer] = useState<any>({
    width: 1000,
    height: 800,
    minWidth: 200,
    minHeight: 200,
    x: 100,
    y: 100,
  });

  // 뉴런 그룹에 포함된 뉴런 목록 영역을 정의함
  const {
    width: neuronInGroupWidth,
    height: neuronInGroupHeight,
    ref: neuronInGroupRef,
  } = useResizeDetector();

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
  const getCenterPosition = (width: number, height: number): IPosition => {
    let tmpX = width === 0 ? 0 : window.innerWidth / 2 - width / 2;
    let tmpY = height === 0 ? 0 : window.innerHeight / 2 - height / 2;

    // 위치 px 출력 방식(소수점 좌표)에 따라 레이어 모양이 일그러지는 경우가 발생하여 정수로 처리함
    tmpX = Math.round(tmpX);
    tmpY = Math.round(tmpY);

    return { x: tmpX, y: tmpY };
  };

  // 뉴런 상세 정보 레이어를 닫음
  const handleRndCloseButton_onClick = () => {
    // 선택한 뉴런을 초기화함
    setSelectedNeuron(null);
  };

  useEffect(() => {}, []);

  // 레이어가 출력됐을 때 실행함
  useEffect(() => {
    if (selectedNeuron === null) {
      return;
    }

    let position: IPosition = getCenterPosition(
      neuronInfoLayer.width,
      neuronInfoLayer.height,
    );

    // 레이어의 화면 중간 정렬 위치를 계산함
    setNeuronInfoLayer({
      ...neuronInfoLayer,
      x: position.x,
      y: position.y,
    });
  }, [selectedNeuron]);

  return (
    <>
      {/*{selectedNeuron !== null && (*/}
      <motion.div
        initial={false}
        animate={selectedNeuron !== null ? 'open' : 'close'}
        variants={{
          open: { opacity: 1, x: 0, display: 'block' },
          close: { opacity: 0, x: 50, transitionEnd: { display: 'none' } },
        }}
        transition={{
          type: 'spring',
          stiffness: 700,
          damping: 30,
        }}
        className="absolute right-0 top-0 h-screen p-1 bg-gray-100/70 backdrop-blur-md z-50"
      >
        <div style={{ width: '45rem' }}>
          {/* 배경 이미지 */}
          {/*<div*/}
          {/*  style={{*/}
          {/*    width: '60rem',*/}
          {/*    backgroundImage: `url(/images/layer_bg_3.png)`,*/}
          {/*    backgroundSize: 'contain',*/}
          {/*    backgroundRepeat: 'no-repeat',*/}
          {/*    backgroundPosition: 'center center',*/}
          {/*  }}*/}
          {/*  className="absolute left-0 top-0 h-full z-10"*/}
          {/*/>*/}

          {/* 뉴런 그룹에 포함된 뉴런 목록 */}
          <div className="absolute left-0 bottom-16 -translate-x-84 w-72 z-30">
            <ScrollArea
              style={{
                maxHeight: 'calc(100vh - 200px)',
                height: neuronInGroupHeight,
              }}
            >
              <div ref={neuronInGroupRef} className="space-y-2 z-30">
                {/* 뉴런 목록 */}
                {neurons
                  .filter(
                    (filterData: INeuron) =>
                      filterData.group === selectedNeuron?.group,
                  )
                  .map((neuron: INeuron) => (
                    <div
                      key={neuron.id}
                      onClick={() => setSelectedNeuron(neuron)}
                      className={`px-3 py-1 flex justify-center items-center space-x-3 rounded-full drop-shadow ${
                        neuron.id !== selectedNeuron?.id &&
                        'button-event bg-gray-800/90 hover:bg-black/80'
                      } ${neuron.id === selectedNeuron?.id && 'bg-amber-500'}`}
                    >
                      {/* 뉴런 정보 */}
                      <div className="grow pt-2 pr-2 pb-1 pl-2 rounded space-y-1">
                        {/* 분류 - 하위분류 */}
                        <div className="flex justify-end items-center">
                          <div className="pb-1 flex justify-center items-center border-b border-white/50 rounded-sm">
                            <span
                              className={`text-xs font-bold text-shadow-xs ${
                                neuron.id !== selectedNeuron?.id &&
                                'text-gray-400'
                              } ${
                                neuron.id === selectedNeuron?.id && 'text-white'
                              }`}
                            >
                              {getNeuronCategoryName(neuron.category)} -{' '}
                              {getNeuronSubCategoryName(
                                neuron.category,
                                neuron.subCategory,
                              )}
                            </span>
                          </div>
                        </div>

                        {/* 제목 */}
                        <div className="flex justify-end items-center">
                          <div className="w-48 flex justify-end items-center">
                            <span className="text-base font-bold text-white text-shadow-xs truncate whitespace-nowrap">
                              {neuron.title}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 포인트 지점 아이콘 */}
                      <div className="flex-none flex justify-center items-center">
                        <FontAwesomeIcon
                          icon={['fas', 'circle-dot']}
                          className={`w-6 h-6 text-amber-400 ${
                            neuron.id === selectedNeuron?.id && 'text-amber-700'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </div>

          {/* 레이어 내용 */}
          <div className="absolute left-0 top-0 px-10 py-10 w-full h-full text-black space-y-7 rounded-md z-20">
            {/* 레이어 헤더 */}
            <div className="h-9 flex justify-between items-center space-x-2 select-none">
              {/* 제목 */}
              <div className="drag-handle h-full flex-grow pl-4 flex justify-start items-center overflow-hidden space-x-2">
                <div className="flex justify-center items-center">
                  <FontAwesomeIcon
                    icon={['fas', 'asterisk']}
                    className="w-4 h-4 text-amber-800"
                  />
                </div>

                <span className="text-2xl font-bold text-black truncate">
                  {selectedNeuron?.title}
                </span>
              </div>

              {/* 버튼 */}
              <div className="flex justify-center items-center">
                <div className="flex justify-center items-center space-x-2">
                  {/* 닫기 버튼 */}
                  <div
                    onClick={handleRndCloseButton_onClick}
                    className="button-event px-1 py-1 flex justify-center items-center"
                  >
                    <FontAwesomeIcon
                      icon={['fas', 'xmark']}
                      className="w-10 h-10 text-sky-700"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 내용 */}
            <ScrollArea
              style={{
                height: 'calc(100vh - 180px)',
              }}
              className="relative w-full px-5"
            >
              <div className="space-y-10">
                {/* 텍스트 */}
                <div className="break-all">
                  <span className="text-sm font-bold text-gray-800 py-1">
                    {selectedNeuron?.content}
                  </span>
                </div>

                {/* 외부 링크 */}
                {selectedNeuron?.linkUrl && (
                  <div className="flex justify-start items-center space-x-2">
                    {/* 아이콘 */}
                    <div className="px-2 py-1 flex justify-center items-center bg-gray-800 rounded-full">
                      <FontAwesomeIcon
                        icon={['fas', 'link']}
                        className="w-3.5 h-3.5 text-white"
                      />
                    </div>

                    {/* 링크 주소 */}
                    {selectedNeuron?.linkUrl && (
                      <div
                        onClick={() =>
                          window.open(prependHttp(selectedNeuron?.linkUrl))
                        }
                        className="flex justify-center items-center cursor-pointer"
                      >
                        <span className="text-sm font-bold text-gray-600 py-1">
                          {prependHttp(selectedNeuron?.linkUrl)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* 이미지 */}
                <div className="space-y-2">
                  {selectedNeuron?.image &&
                    selectedNeuron.image.map(
                      (file: INeuronFile, index: number) => (
                        <div
                          key={index}
                          className="w-full rounded-md overflow-hidden"
                        >
                          <img
                            src={urlJoin(
                              `${config.resource.imageUrl.host}:${config.resource.imageUrl.port}`,
                              'resource',
                              'image',
                              file.filename,
                            )}
                            alt={file.originalname}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ),
                    )}
                </div>

                {/* PDF */}
                <div ref={pdfRef} className="space-y-7">
                  {selectedNeuron?.pdf &&
                    selectedNeuron?.pdf.map(
                      (file: INeuronFile, index: number) => (
                        <div key={index}>
                          <PdfViewer file={file} width={pdfWidth} />
                        </div>
                      ),
                    )}
                </div>
              </div>
            </ScrollArea>

            {/* 하단바 */}
            <div className="px-2 flex justify-end items-center space-x-5">
              {/* 일자 */}
              <span className="text-xs font-bold text-rose-800">
                {selectedNeuron?.date}
              </span>

              {/* 분류, 하위분류 */}
              <span className="text-md font-bold text-gray-700">
                {selectedNeuron &&
                  getNeuronCategoryName(selectedNeuron?.category)}{' '}
                -{' '}
                {selectedNeuron &&
                  getNeuronSubCategoryName(
                    selectedNeuron.category,
                    selectedNeuron.subCategory,
                  )}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
      {/*)}*/}
    </>
  );
};

export default NeuronInfo;
