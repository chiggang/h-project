import { useRecoilState } from 'recoil';
import React, { useEffect, useState } from 'react';
import {
  IConfig,
  INeuron,
  INeuronFile,
  IPosition,
} from '../interfaces/app.interface';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Image } from '@mantine/core';
import { Document, Page } from 'react-pdf/dist/esm/entry.webpack';
import { DraggableData, Rnd } from 'react-rnd';
import { DraggableEvent } from 'react-draggable';
import { selectedNeuronAtom } from '../recoils/selectedNeuron.atom';
import { useResizeDetector } from 'react-resize-detector';
import urlJoin from 'url-join';
import { configAtom } from '../recoils/config.atom';

/**
 * 뉴런 상세 정보 레이어 창
 * @param props
 * @constructor
 */
const NeuronDetailInfo: React.FC<any> = (props: any) => {
  // 환경 설정을 정의함
  const [config, setConfig] = useRecoilState<IConfig>(configAtom);

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
      {selectedNeuron !== null && (
        <Rnd
          // id=""
          size={{
            width: neuronInfoLayer.width,
            height: neuronInfoLayer.height,
          }}
          position={{
            x: neuronInfoLayer.x,
            y: neuronInfoLayer.y,
          }}
          minWidth={neuronInfoLayer.minWidth}
          minHeight={neuronInfoLayer.minHeight}
          dragHandleClassName="drag-handle"
          enableResizing={false}
          disableDragging={true}
          // onClick={handleRnd_onMouseDown}
          // onMouseDown={handleRnd_onMouseDown}
          // onDragStart={handleRnd_onDragStart}
          onDragStop={handleRnd_onDragStop}
          // onResizeStop={handleRnd_onResizeStop}
          // className="layer-object p-0.5 bg-black/30 backdrop-filter backdrop-blur-md rounded-lg shadow-md overflow-hidden z-50"
          className="relative p-1 overflow-hidden z-50"
        >
          {/* 배경 이미지 */}
          <div
            className="absolute left-0 top-0 w-full h-full z-10"
            style={{
              backgroundImage: `url(/images/layer_bg_3.png)`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center center',
            }}
          />

          {/* 레이어 내용 */}
          {/*<div className="layer-frame w-full h-full text-black rounded-md">*/}
          {/*<div className="w-full h-full text-black rounded-md">*/}
          <div className="absolute left-0 top-0 p-24 w-full h-full text-black space-y-3 rounded-md z-20">
            {/* 레이어 헤더 */}
            <div className="h-9 flex justify-between items-center space-x-2 select-none">
              {/* 제목 */}
              <div className="drag-handle h-full flex-grow pl-4 flex justify-start items-center overflow-hidden cursor-move space-x-2">
                <div className="flex justify-center items-center">
                  <FontAwesomeIcon
                    icon={['fas', 'asterisk']}
                    className="w-4 h-4 text-stone-500 animate-spin"
                  />
                </div>

                <span className="text-shadow text-xl font-bold text-white truncate text-shadow-md animate-pulse">
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
                      className="w-8 h-8 text-rose-500"
                    />
                  </div>
                </div>

                {/* 드래그용 여백 */}
                <div className="drag-handle w-2 h-5 cursor-move" />
              </div>
            </div>

            {/* 내용 */}
            <div className="layer-content w-full h-full flex flex-col px-1 pb-1 overflow-hidden">
              <div className="flex-grow relative w-full h-full px-5 my-3 space-y-10 overflow-auto">
                {/* 텍스트 */}
                <div className="whitespace-pre-line">
                  <span className="text-shadow text-xs font-bold text-gray-200 drop-shadow py-0.5">
                    {selectedNeuron?.content}
                  </span>
                </div>

                {/* 이미지 */}
                {/*<div className="space-y-2">*/}
                {/*  {selectedNeuron?.image.map((img: INeuron, index: number) => (*/}
                {/*    <div*/}
                {/*      key={index}*/}
                {/*      className="w-full rounded-md overflow-hidden"*/}
                {/*    >*/}
                {/*      <Image src={img} alt="image" />*/}
                {/*    </div>*/}
                {/*  ))}*/}
                {/*</div>*/}
                <div className="space-y-2">
                  {selectedNeuron?.image &&
                    selectedNeuron.image.map(
                      (file: INeuronFile, index: number) => (
                        <div className="w-full rounded-md overflow-hidden">
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
                <div ref={pdfRef} className="space-y-2">
                  {/*{selectedNeuron?.pdf.map((pdf: string, index: number) => (*/}
                  {/*  <div key={index} className="space-y-2">*/}
                  {/*    <Document*/}
                  {/*      file={pdf}*/}
                  {/*      onLoadSuccess={handlePdf_onLoadSuccess}*/}
                  {/*      className="rounded-md overflow-hidden"*/}
                  {/*    >*/}
                  {/*      <Page pageNumber={pdfPageNumber} width={pdfWidth} />*/}
                  {/*    </Document>*/}

                  {/*    <div className="flex justify-center items-center space-x-1">*/}
                  {/*      /!* 이전 페이지 이동 버튼 *!/*/}
                  {/*      <div*/}
                  {/*        onClick={handlePdfMoveToPreButton_onClick}*/}
                  {/*        className="button-event px-2 py-1 flex justify-center items-center"*/}
                  {/*      >*/}
                  {/*        <FontAwesomeIcon*/}
                  {/*          icon={['fas', 'chevron-left']}*/}
                  {/*          className="w-3 h-3 text-gray-300"*/}
                  {/*        />*/}
                  {/*      </div>*/}

                  {/*      /!* 페이징 *!/*/}
                  {/*      <div className="px-4 py-1 flex justify-center items-center bg-white rounded-full">*/}
                  {/*        <span className="text-xs font-bold text-gray-500">*/}
                  {/*          {pdfPageNumber} / {pdfNumPages}*/}
                  {/*        </span>*/}
                  {/*      </div>*/}

                  {/*      /!* 다음 페이지 이동 버튼 *!/*/}
                  {/*      <div*/}
                  {/*        onClick={handlePdfMoveToNextButton_onClick}*/}
                  {/*        className="button-event px-2 py-1 flex justify-center items-center"*/}
                  {/*      >*/}
                  {/*        <FontAwesomeIcon*/}
                  {/*          icon={['fas', 'chevron-right']}*/}
                  {/*          className="w-3 h-3 text-gray-300"*/}
                  {/*        />*/}
                  {/*      </div>*/}
                  {/*    </div>*/}
                  {/*  </div>*/}
                  {/*))}*/}
                </div>
              </div>

              <div className="px-2 py-1 flex justify-end items-end space-x-2">
                <span className="text-xs font-bold text-rose-600">
                  {selectedNeuron?.date}
                </span>

                <span className="text-md font-bold text-white">
                  {selectedNeuron?.category}
                </span>
              </div>
            </div>
          </div>
        </Rnd>
      )}
    </>
  );
};

export default NeuronDetailInfo;
