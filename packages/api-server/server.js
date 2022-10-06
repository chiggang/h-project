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

// 환경설정을 정의함
const appConfig = require('./configs/app.config.json');

// 뉴런 관련 라우터를 정의함
const neuronRouter = require('./routes/neuron');

// 사용자 관련 라우터를 정의함
// const userRouter = require('./routes/user');

// const hashtagRouter = require('./routes/hashtag');
// const db = require('./models');
// const passportConfig = require('./passport');

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
      origin: 'http://a.com',
      credentials: true,
      exposedHeaders: ['Authorization'],
    }),
  );
} else {
  app.use(morgan('dev'));
  app.use(
    cors({
      origin: true,
      credentials: true,
      exposedHeaders: ['Authorization'],
    }),
  );
}
// app.use('/', express.static(path.join(__dirname, 'uploads')));
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
//     domain: process.env.NODE_ENV === 'production' && '.a.com'
//   },
// }));
// app.use(passport.initialize());
// app.use(passport.session());

// 서버 실행 여부에 대한 테스트용 주소를 정의함
app.get('/', (req, res) => {
  res.send('API Server started!');
});

// 라우터에 주소를 적용함
app.use('/neuron', neuronRouter);
// app.use('/user', userRouter);

if (appConfig.server.port !== undefined) {
  app.listen(appConfig.server.port, () => {
    console.log('> API Server started: port', appConfig.server.port);
  });
} else {
  console.log('> API Server error: 환경설정을 불러올 수 없습니다.');
}
