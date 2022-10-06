'use strict';

const express = require('express');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');
const app = express();
const server = require('http').createServer();

let whiteList = ['http://sysnova.cafe24.com', 'http://sysnova.cafe24.com'];

let corsOptions = {
  origin: (origin, callback) => {
    let isWhiteList = whiteList.indexOf(origin) !== -1;
    callback(null, isWhiteList);
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.use(
  morgan(
    ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms',
  ),
);
app.use(
  express.static(path.resolve(__dirname, '..', '..', '..', 'h-project-files')),
);

// app.get('*', (req, res) => {
//   res.sendFile(path.resolve(__dirname, '..', 'web', 'index.html'));
// });

const PORT = process.env.PORT || 17200;

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});
