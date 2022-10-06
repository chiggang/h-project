const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { nanoid } = require('nanoid');
const _ = require('lodash');
const fs = require('fs');
const Iconv = require('iconv').Iconv;

// 환경설정을 정의함
const appConfig = require('../configs/app.config.json');

// 디스크 스토리지를 정의함
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 파일을 업로드할 경로를 적용함
    cb(null, appConfig.upload.tempPath);
  },
  filename: (req, file, cb) => {
    // 깨진 한글을 복원함
    let iconv = new Iconv('UTF-8', 'ISO-8859-1');
    let buffer = iconv.convert(file.originalname);
    file.originalname = buffer.toString() || file.originalname;

    // 업로드한 파일을 저장할 새 이름을 적용함
    cb(null, `${nanoid(30)}_${file.originalname}`);
  },
});

// 파일 업로드를 정의함
const upload = multer({ storage });

/**
 * 업로드한 파일을 지정한 폴더로 이동함
 * @param files 업로드한 파일 배열
 * @param allowFileType 업로드가 가능한 파일 종류
 * @param destinationPath 업로드한 파일이 저장된 폴더
 * @returns {{code: string, data: null}}
 */
const moveFileToDestinationPath = (files, allowFileType, destinationPath) => {
  // 처리 결과를 반환함
  // code: 반환할 결과 코드
  // data: 반환할 결과 데이터
  let result = {
    code: '',
    data: null,
  };

  try {
    // 업로드 결과
    // {
    //   fieldname: 'user-image',
    //   originalname: 'sample.zip',
    //   encoding: '7bit',
    //   mimetype: 'application/zip',
    //   destination: '/Users/chiggang/Project/temp/j/packages/files/temp',
    //   filename: 'ozrUbwLknj8NMNdiS_mK5_OsoKXg4sdCErR-X9Csk5MnujF_5A_WebGL_Build.zip',
    //   path: '/Users/chiggang/Project/temp/j/packages/files/temp/ozrUbwLknj8NMNdiS_mK5_OsoKXg4sdCErR-X9Csk5MnujF_5A_WebGL_Build.zip',
    //   size: 16092559
    // }

    // 파일이 정상적으로 업로드됨
    if (files.length > 0) {
      /**
       * 지정한 파일 종류가 아니면 파일을 삭제 폴더로 이동시킴
       * @param fileType 파일 종류 배열(image/jpeg, image/png, application/pdf, ...)
       * @returns {boolean} true(지정한 파일 종류가 맞음), false(지정한 파일 종류가 아님)
       */
      const compareFileType = (fileType) => {
        // 지정한 파일 종류인지 비교한 결과를 정의함
        let correctFileType = true;

        // 지정한 파일 종류인지 비교함
        files.map((file) => {
          // 지정한 파일 종류가 아니면 false를 반환함
          if (!_.includes(fileType, file.mimetype)) {
            correctFileType = false;
          }
        });

        // 지정한 파일 종류가 아님
        if (!correctFileType) {
          // 파일을 삭제 폴더로 이동함
          files.map((file) => {
            moveFileToTrashPath(file.destination, file.filename);
          });
        }

        return correctFileType;
      };

      // 지정한 파일 종류가 아니면 파일을 삭제 폴더로 이동시킴
      let compareFileTypeResult = compareFileType(allowFileType);

      // 지정한 파일 종류가 맞음
      if (compareFileTypeResult) {
        try {
          files.map((file) => {
            // 파일을 지정한 폴더로 이동함
            fs.renameSync(
              path.join(file.destination, file.filename),
              path.join(destinationPath, file.filename),
            );
          });

          console.log('> 파일 이동 완료:', destinationPath);

          // 업로드를 완료함
          result = {
            code: 'success',
            data: files,
          };
        } catch (error) {
          console.log('> 파일 이동 오류:', destinationPath);

          // 파일을 삭제 폴더로 이동함
          files.map((file) => {
            moveFileToTrashPath(file.destination, file.filename);
          });

          // 파일 이동에 실패함
          result.code = 'error-2';
        }
      } else {
        // 지정한 파일 종류가 아님
        result.code = 'error-1';
      }
    } else {
      // 파일 확인에 실패함
      result.code = 'error-3';
    }
  } catch (error) {
    console.log('> 업로드 실패');

    // 파일 업로드에 실패함
    result.code = 'error-4';
  }

  return result;
};

// 파일을 삭제 폴더로 이동함
const moveFileToTrashPath = (filePath, fileName) => {
  if (
    fs.existsSync(path.join(filePath, fileName)) &&
    fs.existsSync(appConfig.upload.trashPath)
  ) {
    // 파일을 삭제 폴더로 이동함
    fs.renameSync(
      path.join(filePath, fileName),
      path.join(appConfig.upload.trashPath, fileName),
    );
  }
};

/**
 * 업로드한 결과를 반환함
 * @param res 처리 결과
 * @param code 처리 결과 코드
 * @param data 처리 결과 데이터
 */
const sendResultStatus = (res, code, data) => {
  switch (code) {
    // 업로드를 완료함
    case 'success':
      // 완료 응답을 보냄
      res.status(200).json({ result: 'successful', saveFile: data });
      break;

    // 지정한 파일 종류가 아님
    case 'error-1':
      // 지정한 파일 종류가 아니라는 응답을 보냄
      res.status(500).json('not an allowed file type');
      break;

    // 파일 이동에 실패함
    case 'error-2':
      // 파일 이동 실패 응답을 보냄
      res.status(500).json('file move failed');
      break;

    // 파일 확인에 실패함
    case 'error-3':
      // 파일 확인 실패 응답을 보냄
      res.status(500).json('file verification failed');
      break;

    // 파일 업로드에 실패함
    case 'error-4':
      // 파일 업로드 실패 응답을 보냄
      res.status(500).json('file upload failed');
      // next(error);
      break;

    default:
      break;
  }
};

// 이미지 파일을 업로드함
router.post(
  '/image',
  upload.array('image', appConfig.upload.maximumNumberOfImage),
  async (req, res, next) => {
    // 업로드한 파일을 지정한 폴더로 이동함
    let result = moveFileToDestinationPath(
      req.files,
      ['image/jpeg', 'image/png'],
      appConfig.upload.imagePath,
    );

    // 업로드한 결과를 반환함
    sendResultStatus(res, result.code, result.data);

    // switch (result.code) {
    //   // 업로드를 완료함
    //   case 'success':
    //     // 완료 응답을 보냄
    //     res.status(200).json({ result: 'successful', saveFile: result.data });
    //     break;
    //
    //   // 지정한 파일 종류가 아님
    //   case 'error-1':
    //     // 지정한 파일 종류가 아니라는 응답을 보냄
    //     res.status(500).json('not an allowed file type');
    //     break;
    //
    //   // 파일 이동에 실패함
    //   case 'error-2':
    //     // 파일 이동 실패 응답을 보냄
    //     res.status(500).json('file move failed');
    //     break;
    //
    //   // 파일 확인에 실패함
    //   case 'error-3':
    //     // 파일 확인 실패 응답을 보냄
    //     res.status(500).json('file verification failed');
    //     break;
    //
    //   // 파일 업로드에 실패함
    //   case 'error-4':
    //     // 파일 업로드 실패 응답을 보냄
    //     res.status(500).json('file upload failed');
    //     // next(error);
    //     break;
    //
    //   default:
    //     break;
    // }

    // try {
    //   // 업로드 결과
    //   // {
    //   //   fieldname: 'user-image',
    //   //   originalname: 'WebGL_Build.zip',
    //   //   encoding: '7bit',
    //   //   mimetype: 'application/zip',
    //   //   destination: '/Users/chiggang/Project/temp/j/packages/files/temp',
    //   //   filename: 'ozrUbwLknj8NMNdiS_mK5_OsoKXg4sdCErR-X9Csk5MnujF_5A_WebGL_Build.zip',
    //   //   path: '/Users/chiggang/Project/temp/j/packages/files/temp/ozrUbwLknj8NMNdiS_mK5_OsoKXg4sdCErR-X9Csk5MnujF_5A_WebGL_Build.zip',
    //   //   size: 16092559
    //   // }
    //
    //   //   // 업로드한 파일이 최종적으로 보관될 폴더를 정의함
    //   // const destinationPath = appConfig.upload.imagePath;
    //
    //   // // 업로드한 파일 정보를 불러옴
    //   // const files = req.files;
    //
    //   // 파일이 정상적으로 업로드됨
    //   if (req.files.length > 0) {
    //     /**
    //      * 지정한 파일 종류가 아니면 파일을 삭제 폴더로 이동시킴
    //      * @param fileType 파일 종류 배열(image/jpeg, image/png, application/pdf, ...)
    //      * @returns {boolean} true(지정한 파일 종류가 맞음), false(지정한 파일 종류가 아님)
    //      */
    //     const compareFileType = (fileType) => {
    //       // 지정한 파일 종류인지 비교한 결과를 정의함
    //       let correctFileType = true;
    //
    //       // 지정한 파일 종류인지 비교함
    //       files.map((file) => {
    //         // 지정한 파일 종류가 아니면 false를 반환함
    //         if (!_.includes(fileType, file.mimetype)) {
    //           correctFileType = false;
    //         }
    //       });
    //
    //       // 지정한 파일 종류가 아님
    //       if (!correctFileType) {
    //         // 파일을 삭제 폴더로 이동함
    //         files.map((file) => {
    //           moveFileToTrashPath(file.destination, file.filename);
    //         });
    //
    //         // 지정한 파일 종류가 아니라는 응답을 보냄
    //         res.status(500).json('not an allowed file type');
    //       }
    //
    //       return correctFileType;
    //     };
    //
    //     // 지정한 파일 종류가 아니면 파일을 삭제 폴더로 이동시킴
    //     let compareFileTypeResult = compareFileType([
    //       'image/jpeg',
    //       'image/png',
    //     ]);
    //
    //     // 지정한 파일 종류가 맞음
    //     if (compareFileTypeResult) {
    //       try {
    //         files.map((file) => {
    //           // 파일을 지정한 폴더로 이동함
    //           fs.renameSync(
    //             path.join(file.destination, file.filename),
    //             path.join(destinationPath, file.filename),
    //           );
    //         });
    //
    //         console.log('> 파일 이동 완료:', destinationPath);
    //
    //         // 완료 응답을 보냄
    //         res.status(200).json({ result: 'successful', saveFile: files });
    //       } catch (error) {
    //         console.log('> 파일 이동 오류:', destinationPath);
    //
    //         // 파일을 삭제 폴더로 이동함
    //         files.map((file) => {
    //           moveFileToTrashPath(file.destination, file.filename);
    //         });
    //
    //         // 파일 이동 실패 응답을 보냄
    //         res.status(500).json('file move failed');
    //       }
    //     }
    //
    //     // // 업로드한 파일이 이미지가 아님
    //     // if (!_.includes(tmpFile.mimetype, 'image/')) {
    //     //   console.log('> 이미지가 아님');
    //     //
    //     //
    //     //   // 이미지 파일이 아니라는 응답을 보냄
    //     //   res.status(500).json('not an image file');
    //     // } else {
    //     //   try {
    //     //     // 파일을 사용자 이미지 폴더로 이동함
    //     //     fs.renameSync(
    //     //       path.join(tmpFile.destination, tmpFile.filename),
    //     //       path.join(appConfig.upload.userImagePath, tmpFile.filename),
    //     //     );
    //     //
    //     //     console.log(
    //     //       '> 파일 이동 완료:',
    //     //       path.join(appConfig.upload.userImagePath, tmpFile.filename),
    //     //     );
    //     //
    //     //     // 완료 응답을 보냄
    //     //     res.status(200).json({ result: 'successful', saveFile: tmpFile });
    //     //   } catch (error) {
    //     //     console.log(
    //     //       '> 파일 이동 오류:',
    //     //       path.join(appConfig.upload.userImagePath, tmpFile.filename),
    //     //     );
    //     //
    //     //     // 파일을 삭제 폴더로 이동함
    //     //     moveFileToTrashPath(tmpFile.destination, tmpFile.filename);
    //     //
    //     //     // 파일 이동 실패 응답을 보냄
    //     //     res.status(500).json('file move failed');
    //     //   }
    //     // }
    //   } else {
    //     // 파일 확인 실패 응답을 보냄
    //     res.status(500).json('file verification failed');
    //   }
    // } catch (error) {
    //   console.error('POST /profile:', error);
    //
    //   // 파일 업로드 실패 응답을 보냄
    //   res.status(500).json('file upload failed');
    //
    //   next(error);
    // }
  },
);

// PDF 파일을 업로드함
router.post(
  '/pdf',
  upload.array('pdf', appConfig.upload.maximumNumberOfImage),
  async (req, res, next) => {
    // 업로드한 파일을 지정한 폴더로 이동함
    let result = moveFileToDestinationPath(
      req.files,
      ['application/pdf'],
      appConfig.upload.pdfPath,
    );

    // 업로드한 결과를 반환함
    sendResultStatus(res, result.code, result.data);
  },
);

module.exports = router;
