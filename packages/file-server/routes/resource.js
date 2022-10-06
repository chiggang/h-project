const express = require('express');
const router = express.Router();
const path = require('path');

// 환경설정을 정의함
const appConfig = require('../configs/app.config.json');

// 이미지 파일을 제공함
router.get('/image/*', async (req, res, next) => {
  console.log('> appConfig:', appConfig);
  // 임시!!
  // 파일 경로를 환경설정에서 불러와야 함!!

  // 주소: http://localhost:포트/resource/image/파일명
  res.sendFile(
    path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      'files',
      'image',
      res.req.params['0'] ? res.req.params['0'] : '',
    ),
  );
});

// PDF 파일을 제공함
router.get('/pdf/*', async (req, res, next) => {
  // 주소: http://localhost:포트/resource/pdf/파일명
  res.sendFile(
    path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      'files',
      'pdf',
      res.req.params['0'] ? res.req.params['0'] : '',
    ),
  );
});

module.exports = router;
