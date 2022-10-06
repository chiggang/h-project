const express = require('express');
const router = express.Router();
const { Pool, Client } = require('pg');
const _ = require('lodash');
const createJwt = require('../middlewares/CreateJwt');
const authJwt = require('../middlewares/AuthJwt');
const appConfig = require('../configs/app.config.json');

// 뉴런 그룹을 불러옴
router.get('/neuron_group', async (req, res, next) => {
  const param = req.query;

  // // ?를 불러옴
  // let userId = param.userId || req.user.userId;

  let query = `
    SELECT  N_GROUP,
            CREATED_AT,
            UPDATED_AT
    FROM    T_NEURON_GROUP
  `;

  let result = await executeQuery(query, (resultType, data) => {
    if (resultType) {
      res.status(200).header({ Authorization: req.authorization }).json(data);
    } else {
      // 쿼리에 오류가 발생함
      res.status(400).json(null);
    }
  });
});

// 뉴런 그룹을 수정함
router.patch('/neuron_group', async (req, res, next) => {
  let param = req.body;

  let query = `
    UPDATE  T_NEURON_GROUP
    SET     N_GROUP = '${JSON.stringify(param)}',
            UPDATED_AT = CURRENT_TIMESTAMP
  `;

  let result = await executeQuery(query, (resultType, data) => {
    if (resultType) {
      res.status(200).header({ Authorization: req.authorization }).json(data);
    } else {
      // 쿼리에 오류가 발생함
      res.status(400).json(null);
    }
  });
});

// 전체 뉴런을 불러옴
router.get('/neurons', async (req, res, next) => {
  const param = req.query;

  // // ?를 불러옴
  // let userId = param.userId || req.user.userId;

  let query = `
    SELECT  ID,
            N_GROUP AS GROUP,
            CATEGORY,
            SUB_CATEGORY,
            TITLE,
            CONTENT,
            DATE,
            IMAGE,
            PDF,
            LINK_URL,
            SORT_NO_IN_GROUP,
            CREATED_AT,
            UPDATED_AT
    FROM    T_NEURON
    ORDER   BY N_GROUP,
            SORT_NO_IN_GROUP
  `;

  let result = await executeQuery(query, (resultType, data) => {
    if (resultType) {
      res.status(200).header({ Authorization: req.authorization }).json(data);
    } else {
      // 쿼리에 오류가 발생함
      res.status(400).json(null);
    }
  });
});

// 뉴런을 추가함
router.post('/neuron', async (req, res, next) => {
  let param = req.body;

  param = {
    ...param,
    image:
      param.uploadingImage.length > 0
        ? param.uploadingImage
        : param.image || [],
    pdf: param.uploadingPdf.length > 0 ? param.uploadingPdf : param.pdf || [],
  };

  let query = `
    INSERT  INTO T_NEURON
            (
              N_GROUP,
              CATEGORY,
              SUB_CATEGORY,
              TITLE,
              CONTENT,
              DATE,
              IMAGE,
              PDF,
              LINK_URL,
              SORT_NO_IN_GROUP
            )
    VALUES  (
              '${param.group}',
              '${param.category}',
              '${param.subCategory}',
              '${param.title.replace(/\'/gi, "''")}',
              '${param.content.replace(/\'/gi, "''")}',
              '${param.date}',
              '${JSON.stringify(param.image)}',
              '${JSON.stringify(param.pdf)}',
              '${param.linkUrl}',
              (
                SELECT    MAX(SORT_NO_IN_GROUP) + 1
                FROM      T_NEURON
                WHERE     N_GROUP = '${param.group}'
              )
            )
  `;

  let result = await executeQuery(query, (resultType, data) => {
    if (resultType) {
      res.status(200).header({ Authorization: req.authorization }).json(data);
    } else {
      // 쿼리에 오류가 발생함
      res.status(400).json(null);
    }
  });
});

// 지정한 뉴런을 수정함
router.patch('/neuron', async (req, res, next) => {
  let param = req.body;

  param = {
    ...param,
    image:
      param.uploadingImage.length > 0
        ? _.concat(param.image || [], param.uploadingImage)
        : param.image || [],
    pdf:
      param.uploadingPdf.length > 0
        ? _.concat(param.pdf || [], param.uploadingPdf)
        : param.pdf || [],
  };

  // 삭제할 파일을 목록에서 제거함
  param = {
    ...param,
    image: param.image.filter(
      (file) => file.isDelete === undefined || file.isDelete === false,
    ),
    pdf: param.pdf.filter(
      (file) => file.isDelete === undefined || file.isDelete === false,
    ),
  };

  let query = `
    UPDATE  T_NEURON
    SET     N_GROUP = '${param.group}',
            CATEGORY = '${param.category}',
            SUB_CATEGORY = '${param.subCategory}',
            TITLE = '${param.title.replace(/\'/gi, "''")}',
            CONTENT = '${param.content.replace(/\'/gi, "''")}',
            DATE = '${param.date}',
            IMAGE = '${JSON.stringify(param.image)}',
            PDF = '${JSON.stringify(param.pdf)}',
            LINK_URL = '${param.linkUrl.replace(/\'/gi, "''")}',
            SORT_NO_IN_GROUP = '${param.sortNoInGroup}',
            UPDATED_AT = CURRENT_TIMESTAMP
    WHERE   ID = ${param.id}
  `;

  let result = await executeQuery(query, (resultType, data) => {
    if (resultType) {
      res.status(200).header({ Authorization: req.authorization }).json(data);
    } else {
      // 쿼리에 오류가 발생함
      res.status(400).json(null);
    }
  });
});

// 뉴런의 순서를 수정함
router.patch('/neuron_sort', async (req, res, next) => {
  let param = req.body;

  let addQuery = '';

  param.map((paramData) => {
    if (addQuery) {
      addQuery += ', ';
    }

    addQuery += `(${paramData.id}, ${paramData.sortNoInGroup})`;
  });

  let query = `
    UPDATE  T_NEURON AS U
    SET     ID = U2.ID,
            SORT_NO_IN_GROUP = U2.SORT_NO_IN_GROUP
    FROM    (
                VALUES ${addQuery}
            ) AS U2(ID, SORT_NO_IN_GROUP)
    WHERE   U2.ID = U.ID
  `;

  let result = await executeQuery(query, (resultType, data) => {
    if (resultType) {
      res.status(200).header({ Authorization: req.authorization }).json(data);
    } else {
      // 쿼리에 오류가 발생함
      res.status(400).json(null);
    }
  });
});

// 지정한 뉴런을 삭제함
router.delete('/neuron', async (req, res, next) => {
  const param = req.body;

  let query = `
    DELETE
    FROM    T_NEURON
    WHERE   ID = ${param.id}
  `;

  let result = await executeQuery(query, (resultType, data) => {
    if (resultType) {
      res.status(200).header({ Authorization: req.authorization }).json(data);
    } else {
      // 쿼리에 오류가 발생함
      res.status(400).json(null);
    }
  });
});

// 쿼리를 실행함
const executeQuery = async (query, callback) => {
  const pool = new Pool(appConfig.database);

  // 쿼리를 실행함
  await pool
    .query(query)
    .then((response) => {
      pool.end();

      // 불러온 데이터를 반환함
      callback(true, {
        rowLength: response.rowCount,
        rowData: response.rows,
      });
    })
    .catch((error) => {
      // 처리 실패를 반환함
      callback(false, error);

      pool.end();
    });
};

module.exports = router;
