import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Document, Page } from 'react-pdf/dist/esm/entry.webpack';
import { useRecoilState } from 'recoil';
import { IConfig } from '../interfaces/app.interface';
import { configAtom } from '../recoils/config.atom';
import urlJoin from 'url-join';
import prependHttp from 'prepend-http';

const PdfViewer: React.FC<any> = (props: any) => {
  // 환경 설정을 정의함
  const [config, setConfig] = useRecoilState<IConfig>(configAtom);

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

  useEffect(() => {
    console.log('> file:', props.file);

    const aaa = urlJoin(
      `${config.resource.pdfUrl.host}:${config.resource.pdfUrl.port}`,
      'resource',
      'pdf',
      props.file.filename,
    );

    console.log(aaa);

    return () => {};
  }, []);

  return (
    <div className="space-y-2">
      <Document
        file={urlJoin(
          `${config.resource.pdfUrl.host}:${config.resource.pdfUrl.port}`,
          'resource',
          'pdf',
          props.file.filename,
        )}
        onLoadSuccess={handlePdf_onLoadSuccess}
        className="rounded-md overflow-hidden"
      >
        <Page pageNumber={pdfPageNumber} width={props.width} />
      </Document>

      <div className="flex justify-between items-center">
        {/* 새창으로 열기 버튼 */}
        <div
          onClick={() =>
            window.open(
              urlJoin(
                `${config.resource.pdfUrl.host}:${config.resource.pdfUrl.port}`,
                'resource',
                'pdf',
                props.file.filename,
              ),
            )
          }
          className="button-event flex justify-center items-center space-x-1.5"
        >
          {/* 아이콘 */}
          <div className="px-2 py-1 flex justify-center items-center bg-gray-800 rounded-full">
            <FontAwesomeIcon
              icon={['fas', 'up-right-from-square']}
              className="w-3.5 h-3.5 text-white"
            />
          </div>

          {/* 새창으로 열기 */}
          <div className="flex justify-start items-center space-x-2">
            <span className="text-sm font-bold text-gray-600 py-1">
              새창으로 열기
            </span>
          </div>
        </div>

        {/* PDF 페이징 */}
        <div className="flex justify-center items-center space-x-1">
          {/* 이전 페이지 이동 버튼 */}
          <div
            onClick={handlePdfMoveToPreButton_onClick}
            className="button-event px-2 py-1 flex justify-center items-center"
          >
            <FontAwesomeIcon
              icon={['fas', 'chevron-left']}
              className="w-5 h-5 text-white"
            />
          </div>

          {/* 페이징 */}
          <div className="px-4 py-1 flex justify-center items-center bg-white rounded-full">
            <span className="text-xs font-bold text-gray-500">
              {pdfPageNumber} / {pdfNumPages}
            </span>
          </div>

          {/* 다음 페이지 이동 버튼 */}
          <div
            onClick={handlePdfMoveToNextButton_onClick}
            className="button-event px-2 py-1 flex justify-center items-center"
          >
            <FontAwesomeIcon
              icon={['fas', 'chevron-right']}
              className="w-5 h-5 text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;
