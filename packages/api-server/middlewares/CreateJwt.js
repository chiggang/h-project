const jwt = require('jsonwebtoken');

// 환경설정을 정의함
const appConfig = require('../configs/app.config.json');

// JWT를 생성함
const CreateJwt = (userType, userId, userName, userDeptCode, userDeptName) => {
  // JWT 비밀코드를 불러옴
  const tmpJwtSecret = appConfig.jwt.jwtSecret;

  try {
    // JWT를 생성함
    const token = jwt.sign(
      {
        userType,
        userId,
        userName,
        userDeptCode,
        userDeptName,
      },
      tmpJwtSecret,
      {
        expiresIn: appConfig.jwt.expiresIn || '15d',
      },
    );

    return token;
  } catch (error) {
    return '';
  }
};

module.exports = CreateJwt;
