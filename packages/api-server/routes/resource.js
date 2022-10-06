const express = require('express');
const router = express.Router();
const path = require('path');
const _ = require('lodash');
const fs = require('fs');

// 환경설정을 정의함
const appConfig = require('../configs/app.config.json');

// 사용자의 이미지를 제공함
router.get('/user_image/*', async (req, res, next) => {
  // 주소: http://localhost:9001/resource/user_image/파일명
  res.sendFile(
    path.resolve(
      __dirname,
      '..',
      '..',
      'files',
      'user_image',
      res.req.params['0'] ? res.req.params['0'] : '',
    ),
  );
});

// 마이 페이지의 배경 이미지를 제공함
router.get('/background_image/*', async (req, res, next) => {
  // 주소: http://localhost:9001/resource/background_image/파일명
  res.sendFile(
    path.resolve(
      __dirname,
      '..',
      '..',
      'files',
      'background_image',
      res.req.params['0'] ? res.req.params['0'] : '',
    ),
  );
});

module.exports = router;
