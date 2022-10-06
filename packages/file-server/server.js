const express = require('express');
const cors = require('cors');
// const session = require('express-session');
// const cookieParser = require('cookie-parser');
// const passport = require('passport');
// const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const hpp = require('hpp');
const helmet = require('helmet');
const fs = require('fs');

// 환경설정을 정의함
const appConfig = require('./configs/app.config.json');

// 파일 업로드 라우터를 정의함
const uploadRouter = require('./routes/upload');

// 리소스 라우터를 정의함
const resourceRouter = require('./routes/resource');

// const db = require('./models');
// const passportConfig = require('./passport');

// 업로드 폴더를 생성함
const createUploadPath = () => {
  // 생성할 폴더를 정의함
  const tmpPath = [
    appConfig.upload.rootPath,
    appConfig.upload.tempPath,
    appConfig.upload.trashPath,
    appConfig.upload.imagePath,
    appConfig.upload.pdfPath,
  ];

  // 폴더를 생성함
  tmpPath.map((data) => {
    if (!fs.existsSync(data)) {
      fs.mkdirSync(data, { recursive: true });
    }
  });
};

// dotenv.config();
const app = express();
// db.sequelize
//   .sync()
//   .then(() => {
//     console.log('db 연결 성공');
//   })
//   .catch(console.error);
// passportConfig();

if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
  app.use(hpp());
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(
    cors({
      origin: 'http://sysnova.cafe24.com',
      credentials: true,
    }),
  );
} else {
  app.use(morgan('dev'));
  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );
}
app.use('/', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser(process.env.COOKIE_SECRET));
// app.use(session({
//   saveUninitialized: false,
//   resave: false,
//   secret: process.env.COOKIE_SECRET,
//   cookie: {
//     httpOnly: true,
//     secure: false,
//     domain: process.env.NODE_ENV === 'production' && '.sweetwater.co.kr'
//   },
// }));
// app.use(passport.initialize());
// app.use(passport.session());

// 서버 실행 여부에 대한 테스트용 주소를 정의함
app.get('/', (req, res) => {
  res.send('File Server started!');
});

// 라우터에 주소를 적용함
app.use('/upload', uploadRouter);
app.use('/resource', resourceRouter);
// app.use('/user', userRouter);
// app.use('/hashtag', hashtagRouter);

if (appConfig.server.port !== undefined) {
  app.listen(appConfig.server.port, () => {
    console.log('> File Server started: port', appConfig.server.port);

    // 업로드 폴더를 생성함
    createUploadPath();
  });
} else {
  console.log('> File Server error: 환경설정을 불러올 수 없습니다.');
}
