const express = require('express');
const router = express.Router();
const sql = require('mssql');
const authJwt = require('../middlewares/AuthJwt');
const appConfig = require('../configs/app.config.json');

// 배너를 추가함
router.post('/banner', authJwt, async (req, res, next) => {
  const param = req.body;

  let query = `
    INSERT  INTO SIS500T
            (
              SUBJECT,
              CONTENT,
              PERIOD,
              LINK_URL,
              BACKGROUND_IMAGE_ID,
              BLANK_WINDOW,
              VISIBLE,
              SORT_NO,
              CREATED_USER_ID,
              CREATED_USER_NAME,
              CREATED_USER_EMAIL
            )
    VALUES  (
              '${param.subject}',
              '${param.content}',
              '${param.period}',
              '${param.linkUrl}',
              ${param.backgroundImageId},
              ${param.blankWindow},
              ${param.visible},
              (
                SELECT  COUNT(*) + 1
                FROM    SIS500T
              ),
              '${param.createdUserId}',
              '${param.createdUserName}',
              '${param.createdUserEmail}'
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

// 지정한 배너를 수정함
router.patch('/banner', authJwt, async (req, res, next) => {
  const param = req.body;

  let query = `
    UPDATE  SIS500T
    SET     SUBJECT = '${param.subject}',
            CONTENT = '${param.content}',
            PERIOD = '${param.period}',
            LINK_URL = '${param.linkUrl}',
            BACKGROUND_IMAGE_ID = ${param.backgroundImageId},
            BLANK_WINDOW = ${param.blankWindow},
            VISIBLE = ${param.visible},
            UPDATED_AT = CURRENT_TIMESTAMP
    WHERE   id = ${param.id}
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

// 지정한 배너를 삭제함
router.delete('/banner', authJwt, async (req, res, next) => {
  const param = req.body;

  let query = `
    DELETE  SIS500T
    WHERE   id = ${param.id}
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

// 배너 순서를 저장함
router.post('/banner/sort', authJwt, async (req, res, next) => {
  const param = req.body;

  let query = '';

  param.map((data) => {
    query += `
      UPDATE  SIS500T
      SET     SORT_NO = ${data.sortNo}
      WHERE   ID = ${data.id};
    `;
  });

  let result = await executeQuery(query, (resultType, data) => {
    if (resultType) {
      res.status(200).header({ Authorization: req.authorization }).json(data);
    } else {
      // 쿼리에 오류가 발생함
      res.status(400).json(null);
    }
  });
});

// 전체 배너 목록을 불러옴
router.get('/banners', async (req, res, next) => {
  const param = req.query;

  let query = `
    SELECT  A.ID,
            A.SUBJECT,
            A.CONTENT,
            A.PERIOD,
            A.LINK_URL,
            A.BACKGROUND_IMAGE_ID,
            A.BLANK_WINDOW,
            A.VISIBLE,
            A.SORT_NO,
            A.CREATED_AT,
            A.CREATED_USER_ID,
            A.CREATED_USER_NAME,
            A.CREATED_USER_EMAIL,
            A.UPDATED_AT
    FROM    SIS500T A
    ORDER   BY A.SORT_NO
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

// 지정한 배너를 불러옴
// @param id: 배너 고유번호
router.get('/banner', async (req, res, next) => {
  const param = req.query;

  let query = `
    SELECT  A.ID,
            A.SUBJECT,
            A.CONTENT,
            A.PERIOD,
            A.LINK_URL,
            A.BACKGROUND_IMAGE_ID,
            A.BLANK_WINDOW,
            A.VISIBLE,
            A.SORT_NO,
            A.CREATED_AT,
            A.CREATED_USER_ID,
            A.CREATED_USER_NAME,
            A.CREATED_USER_EMAIL,
            A.UPDATED_AT
    FROM    SIS500T A
    WHERE   A.ID = ${param.id}
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

// 셔틀버스 시간표를 불러옴
router.get('/shuttlebus_timetable', async (req, res, next) => {
  const param = req.query;

  let query = `
    SELECT  TOP 1 BUS,
            TIMETABLE
    FROM    SIS503T
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

// 셔틀버스 시간표를 저장함
// @param userId: 사용자 학번
// @param bus: 셔틀버스
// @param timetable: 셔틀버스 시간표
router.patch('/shuttlebus_timetable', authJwt, async (req, res, next) => {
  const param = req.body;

  // 사용자 학번 또는 교번을 불러옴
  let userId = param.userId || req.user.userId;

  let query = `
    UPDATE  SIS503T
    SET     BUS = '${param.bus}',
            TIMETABLE = '${param.timetable}'
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

// 메뉴 수동 관리를 불러옴
router.get('/switch_menu', authJwt, async (req, res, next) => {
  const param = req.query;

  let query = `
    SELECT  LECTURE_EVALUATION,
            PAID_TUITION,
            GENERAL_REINSTATEMENT_APPLICATION
    FROM    SIS504T
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

// 메뉴 수동 관리를 저장함
// @param userId: 사용자 학번
// @param lectureEvaluation: 강의 평가
// @param paidTuition: 등록금 고지
// @param generalReinstatementApplication: 일반 복학 신청
router.patch('/switch_menu', authJwt, async (req, res, next) => {
  const param = req.body;

  // 사용자 학번 또는 교번을 불러옴
  let userId = param.userId || req.user.userId;

  let query = `
    UPDATE  SIS504T
    SET     LECTURE_EVALUATION = '${param.lectureEvaluation}',
            PAID_TUITION = '${param.paidTuition}',
            GENERAL_REINSTATEMENT_APPLICATION = '${param.generalReinstatementApplication}'
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

// 쿼리를 실행함
// const sendData = (res, resultType, data) => {
//   try {
//     switch (runType) {
//         // SELECT
//       case 'get':
//         if (resultType) {
//           // 실행을 완료함
//           if (Object.keys(data).length > 0) {
//             return res.end(JSON.stringify({
//               status: 200,
//               result: 'success',
//               message: '조회하였습니다.',
//               data: data
//             }));
//           } else {
//             return res.end(JSON.stringify({
//               status: 204,
//               result: 'nothing',
//               message: '조회된 내용이 없습니다.',
//               data: data
//             }));
//           }
//         } else {
//           // 실행이 실패함
//           return res.end(JSON.stringify({
//             status: 500,
//             result: 'error',
//             message: '조회에 실패하였습니다.',
//             data: data
//           }));
//         }
//         break;
//
//         // INSERT, UPDATE, DELETE
//       case 'set':
//         if (resultType) {
//           // 실행을 완료함
//           return res.end(JSON.stringify({
//             status: 200,
//             result: 'success',
//             message: '실행하였습니다.',
//             data: data
//           }));
//         } else {
//           // 실행이 실패함
//           return res.end(JSON.stringify({
//             status: 500,
//             result: 'error',
//             message: '실행에 실패하였습니다.',
//             data: data
//           }));
//         }
//         break;
//     }
//   } catch (error) {
//     console.log(error);
//   }
// };

module.exports = router;
