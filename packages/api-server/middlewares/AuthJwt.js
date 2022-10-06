const jwt = require('jsonwebtoken');
const createJwt = require('./CreateJwt');

// 환경설정을 정의함
const appConfig = require('../configs/app.config.json');

// JWT 인증을 확인함
const AuthJwt = (req, res, next) => {
  // JWT 비밀코드를 불러옴
  const tmpJwtSecret = appConfig.jwt.jwtSecret;

  try {
    if (req.headers.authorization) {
      // JWT 인증을 확인함
      const tmpDecodeJwt = jwt.verify(req.headers.authorization, tmpJwtSecret);

      // 사용자 정보를 적용함
      req.user = tmpDecodeJwt;

      // 새 JWT를 생성함
      const tmpNewJwt = createJwt(
        tmpDecodeJwt.userType,
        tmpDecodeJwt.userId,
        tmpDecodeJwt.userName,
        tmpDecodeJwt.userDeptCode,
        tmpDecodeJwt.userDeptName,
      );

      // 새 JWT를 적용함
      req.authorization = tmpNewJwt;

      next();
    } else {
      res.status(401).header({ Authorization: '' }).json({
        success: false,
        message: '인증이 필요합니다.',
      });
    }
  } catch (error) {
    console.log('> error:', error);
    res.status(401).header({ Authorization: '' }).json({
      success: false,
      message: '유효하지 않은 인증입니다.',
    });
  }
};

module.exports = AuthJwt;
