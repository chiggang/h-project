const express = require('express');
const router = express.Router();
const sql = require('mssql');
const authJwt = require('../middlewares/AuthJwt');
const appConfig = require('../configs/app.config.json');
const { response } = require('express');
const axios = require('axios');

// 입력한 검색어에 해당하는 우편번호 목록을 불러옴
router.get('/zipcode', async (req, res, next) => {
  const param = req.query;

  // 우편번호를 불러옴
  axios({
    method: 'GET',
    url: 'https://www.juso.go.kr/addrlink/addrLinkApiJsonp.do',
    params: {
      confmKey: appConfig.zipcode.key,
      currentPage: 1,
      countPerPage: 1000,
      keyword: param.address,
      resultType: 'json',
    },
  })
    .then((response) => {
      let tmpRowData = JSON.parse(
        response.data.substring(1, response.data.length - 1),
      );
      tmpRowData = tmpRowData.results.juso;

      res.status(200).header({ Authorization: req.authorization }).json({
        rowLength: tmpRowData.length,
        rowData: tmpRowData,
      });
    })
    .catch((error) => {
      console.log('> axios error:', error);

      // 쿼리에 오류가 발생함
      res.status(400).json(null);
    });
});

// 쿼리를 실행함
const executeQuery = async (query, callback) => {
  // 쿼리를 실행함
  sql
    .connect(appConfig.database)
    .then(() => {
      return sql.query(query);
    })
    .then((result) => {
      // 불러온 데이터를 반환함
      callback(true, {
        rowLength: result.rowsAffected,
        rowData: result.recordset,
      });
    })
    .catch((error) => {
      // throw new error;
      // // 쿼리 실패에 대한 오류를 처리함
      // func.setLog(`Query.Error: 쿼리 실행에 실패하였습니다. - DB Type: ${dbType}`, 'Y', 'N');
      // func.setLog(`Query.Error: ${error}`, 'Y', 'N');
      // func.setLog(`Query.Error: Query - ${query}`, 'Y', 'Y');

      // 처리 실패를 반환함
      callback(false, error);
    });
};

module.exports = router;
