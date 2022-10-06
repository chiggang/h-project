const express = require('express');
const router = express.Router();
const sql = require('mssql');
const createJwt = require('../middlewares/CreateJwt');
const authJwt = require('../middlewares/AuthJwt');
const appConfig = require('../configs/app.config.json');

// 로그인을 처리함
router.get('/jwt', authJwt, async (req, res, next) => {
  const param = req.query;

  res.status(200).header({ Authorization: req.authorization }).json({});
});

// 로그인을 처리함
router.post('/sign_in', async (req, res, next) => {
  const param = req.body;

  let query = `
    SELECT  A.LOG_USER_ID,
            A.LOG_GBN,
            A.LOG_USER_NM,
            A.LOG_DEPT_CD,
            B.K_STRUCT_NM
    FROM    COM050TL A
    LEFT    OUTER JOIN SCOM0400 B
            ON A.LOG_DEPT_CD = B.STRUCT_CD
    WHERE   A.USER_ID = '${param.id}'
            AND A.LOG_PASSWORD = dbo.DGuard_PWD('NCS_HAKSA', 'HRM100T', 'USER_PW', '${param.password}')
    GROUP   BY A.LOG_PASSWORD,
            A.LOG_USER_NM,
            A.LOG_USER_ID,
            A.LOG_GBN,
            A.LOG_DEPT_CD,
            B.K_STRUCT_NM
  `;

  let result = await executeQuery(query, (resultType, data) => {
    if (resultType) {
      if (data.rowData.length > 0) {
        const tmpRowData = data.rowData[0];

        // 사용자 상태 구분에 따라 로그인이 가능한지를 판단함
        switch (tmpRowData.LOG_GBN) {
          // 1: 학생, 2: 교직원, 6: 졸업생
          case '1':
          case '2':
          case '6':
            // JWT를 생성함
            const tmpJwt = createJwt(
              tmpRowData.LOG_GBN,
              tmpRowData.LOG_USER_ID,
              tmpRowData.LOG_USER_NM,
              tmpRowData.LOG_DEPT_CD,
              tmpRowData.K_STRUCT_NM,
            );

            res.status(200).header({ Authorization: tmpJwt }).json(data);
            break;

          // 제적(로그인 금지)
          case '9':
            res.status(401).json(null);
            break;

          // 기타
          default:
            res.status(401).json(null);
            break;
        }
      } else {
        // 일치하는 사용자가 없음
        res.status(200).json(data);
      }
    } else {
      // 쿼리에 오류가 발생함
      res.status(400).json(null);
    }
  });
});

// 지정한 사용자를 수정함
router.patch('/', authJwt, async (req, res, next) => {
  const param = req.body;

  let query = `
    UPDATE  SHJ100T
    SET     TEL_NO = '${param.mergePhone}',
            HPHONE = '${param.mergeCellPhone}',
            ZIP1 = '${param.zipcode}',
            ADD1 = '${param.address1}',
            ADD2 = '${param.address2}',
            WEBMAIL_ID = '${param.email}',
            UPD_ID = '${param.updatedUserId}',
						UPD_DT = CONVERT(VARCHAR(30), GETDATE(), 120),
						UPD_IP = '',
						UPD_PGM = 'MOBILE_WEB'
    WHERE   STUD_ID = ${param.id}
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

// 지정한 사용자의 비밀번호를 수정함
router.patch('/password', authJwt, async (req, res, next) => {
  const param = req.body;

  // 사용자 학번 또는 교번을 불러옴
  let userId = param.userId || req.user.userId;

  // 사용자가 입력한 비밀번호가 현재 비밀번호와 일치하는지 확인함
  let query = `
    SELECT  USER_ID
    FROM    COM050TL
    WHERE   USER_ID = '${userId}'
            AND LOG_PASSWORD = dbo.DGuard_PWD('NCS_HAKSA', 'HRM100T', 'USER_PW', '${param.currentPassword}')
  `;

  let result = await executeQuery(query, async (resultType, data) => {
    if (data.rowLength > 0) {
      /* 현재 비밀번호가 일치함 */

      // 비밀번호를 수정함
      query = `
        UPDATE  SHJ100T
		    SET     PASSWD = dbo.DGuard_PWD('NCS_HAKSA', 'HRM100T', 'USER_PW', '${param.newPassword}')
		    WHERE   STUD_ID = '${userId}'
      `;

      result = await executeQuery(query, (subResultType, subData) => {
        if (subResultType) {
          res
            .status(200)
            .header({ Authorization: req.authorization })
            .json(subData);
        } else {
          // 쿼리에 오류가 발생함
          res.status(400).json(null);
        }
      });
    } else {
      // 현재 비밀번호가 일치하지 않음
      res.status(200).header({ Authorization: req.authorization }).json({
        rowLength: -1,
        rowData: [],
      });
    }
  });
});

// 지정한 사용자 정보를 불러옴
// @param userId: 사용자 학번 또는 교번
router.get('/one', authJwt, async (req, res, next) => {
  const param = req.query;

  // 사용자 학번 또는 교번을 불러옴
  let userId = param.userId || req.user.userId;

  let query = `
    SELECT  A.LOG_USER_ID,
            A.LOG_GBN,
            A.LOG_USER_NM,
            A.LOG_DEPT_CD,
            B.K_STRUCT_NM
    FROM    COM050TL A
    LEFT    OUTER JOIN SCOM0400 B
            ON A.LOG_DEPT_CD = B.STRUCT_CD
    WHERE   A.LOG_USER_ID = '${userId}'
    GROUP   BY  A.LOG_PASSWORD,
            A.LOG_USER_NM,
            A.LOG_USER_ID,
            A.LOG_GBN,
            A.LOG_DEPT_CD,
            B.K_STRUCT_NM
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

// 지정한 사용자의 상세 정보를 불러옴
// @param userId: 사용자 학번 또는 교번
router.get('/one_detail', authJwt, async (req, res, next) => {
  const param = req.query;

  // 사용자 학번 또는 교번을 불러옴
  let userId = param.userId || req.user.userId;

  let query = `
    SELECT  A.STUD_ID, /* 학번 */
            A.NM_KOR, /* 성명 */
            A.NM_CHI, /* 성명 */
            A.NM_ENG, /* 성명 */
            A.SEX_CD, /* 성별 */
            A.BIRTH_DT, /* 생년월일 */
            A.PROM_GRDE_CD, /* 학년 */
            (
              SELECT  RTRIM(NM_KOR)
              FROM    SCOM0000
              WHERE   CODE_DIV = 'SCOM10'
                      AND CODE_CD = A.PROM_GRDE_CD
            ) AS PROM_GRDE_NM, /* 학년 이름 */
            A.PROM_SMR_CD, /* 학기 */
            (
              SELECT  RTRIM(NM_KOR)
              FROM    SCOM0000
              WHERE   CODE_DIV = 'SCOM11'
                      AND CODE_CD = A.PROM_SMR_CD
            ) AS PROM_SMR_NM, /* 학기 이름 */
            A.TEL_NO, /* 전화번호 */
            A.HPHONE, /* 휴대폰번호 */
            A.STUD_DIV, /* 학생구분 */
            (
              SELECT  RTRIM(NM_KOR)
              FROM    SCOM0000
              WHERE   CODE_DIV = 'HSHJ07'
                      AND CODE_CD = A.STUD_DIV
            ) AS STUD_DIV_NM, /* 학생구분 이름 */
            A.SCRG_VARB_CD, /* 학적변동 */
            (
              SELECT  RTRIM(NM_KOR)
              FROM    SCOM0000
              WHERE   CODE_DIV = 'HSHJ01'
                      AND CODE_CD = A.SCRG_VARB_CD
            ) AS SCRG_VARB_NM, /* 학적변동 이름 */
            A.SCRG_STAT_CD, /* 학적상태 */
            (
              SELECT  RTRIM(NM_KOR)
              FROM    SCOM0000
              WHERE   CODE_DIV = 'HSHJ02'
                      AND CODE_CD = A.SCRG_STAT_CD
            ) AS SCRG_STAT_NM, /* 학적상태 이름 */
            A.DEPT_CD, /* 학과 */
            (
              SELECT  K_STRUCT_NM
              FROM    SCOM0400
              WHERE   STRUCT_DIV = '20'
                      AND STRUCT_CD = A.DEPT_CD
            ) AS DEPT_NM, /* 학과 이름 */
            (
              SELECT  K_STRUCT_DTL_NM
              FROM    SCOM0400
              WHERE   STRUCT_DIV = '30'
                      AND STRUCT_CD = A.DEPT_CD
                      AND STRUCT_DTL_CD = A.DTL_DEPT_CD
            ) AS DTL_DEPT_NM, /* 전공 */
            A.SCRG_CLAS, /* 반 */
            A.CCH_EMP_ID, /* 지도교수 */
            (
              SELECT  LOG_USER_NM
              FROM    COM050TL
              WHERE   LOG_USER_ID = A.CCH_EMP_ID
            ) AS CCH_EMP_NM, /* 지도교수 이름 */
            A.GSS_CD, /* 학년제 */
            A.DNN_CD, /* 주야구분 */
            (
              SELECT  RTRIM(NM_KOR)
              FROM    SCOM0000
              WHERE   CODE_DIV = 'SCOM06'
                      AND CODE_CD = A.DNN_CD
            ) AS DNN_NM, /* 주야구분 이름 */
            A.NATION_CD, /* 국적 */
            (
              SELECT  K_NATION_NM
              FROM    SCOM0200
              WHERE   NATION_CD = A.NATION_CD
            ) AS NATION_NM, /* 국적 이름 */
            A.WEBMAIL_ID, /* 메일주소 */
            A.ZIP1, /* 우편번호 */
            A.ZIP2, /* 우편번호 */
            A.ADD1, /* 주소(기본) */
            A.ADD2, /* 주소(상세) */
            B.FXOT_YN, /* 세부전형 */
            B.RCRIT_DIV_CD, /* 모집구분 */
            B.TPEX_DT, /* 입학일자 */
            B.TPEX_YEAR, /* 입학년도 */
            B.DETL_TPEX_CD,
            B.TRAN_YN, /* 편입여부 */
            (
              SELECT  RTRIM(NM_KOR)
              FROM    SCOM0000
              WHERE   CODE_DIV = 'SCOM99'
                      AND CODE_CD = B.TRAN_YN
            ) AS TRAN_YN_NM /* 편입여부 이름 */
    FROM    SHJ100T A /* 학적관리 */
    LEFT    OUTER JOIN SHJ105T B /* 입시관리 */
            ON A.STUD_ID = B.STUD_ID
    WHERE   A.STUD_ID = '${userId}'
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

// 지정한 사용자의 학기 과목별 전체 누적 성적을 불러옴
// @param userId: 사용자 학번
router.get(
  '/one_sum_semester_course_score',
  authJwt,
  async (req, res, next) => {
    const param = req.query;

    // 사용자 학번 또는 교번을 불러옴
    let userId = param.userId || req.user.userId;

    let query = `
    SELECT  SCO,
            GPA_SCO,
            AVMK,
            PERC_SCO,
            (
              SELECT  COUNT(*)
              FROM    SSJ130T
              WHERE   STUD_ID = '${userId}'
                      AND USED_YN = 'Y'
            ) AS CNT_WARNING
    FROM    SSJ115T
    WHERE   STUD_ID	= '${userId}'
  `;

    let result = await executeQuery(query, (resultType, data) => {
      if (resultType) {
        res.status(200).header({ Authorization: req.authorization }).json(data);
      } else {
        // 쿼리에 오류가 발생함
        res.status(400).json(null);
      }
    });
  },
);

// 지정한 사용자의 학기 과목별 상세 성적을 불러옴
// @param userId: 사용자 학번
router.get('/one_semester_course_score', authJwt, async (req, res, next) => {
  const param = req.query;

  // 사용자 학번 또는 교번을 불러옴
  let userId = param.userId || req.user.userId;

  let query = `
    SELECT  A.ESTB_YEAR, /* 개설년도 */
            A.ESTB_SMR_CD, /* 개설학기 */
            (
              SELECT  RTRIM(NM_KOR)
              FROM    SCOM0000
              WHERE   CODE_DIV = 'SCOM11'
                      AND CODE_CD = A.ESTB_SMR_CD
            ) AS ESTB_SMR_NM, /* 개설학기 이름 */
            A.SUBJT_CD, /* 교과목코드 */
            (
              SELECT  SUBJT_NM_KOR
              FROM    SGG100T
              WHERE   SUBJT_CD = A.SUBJT_CD
            ) AS SUBJT_NM_KOR,
            A.STUD_ID, /* 학번 */
            A.DICL, /* 분반 */
            A.DEPT_CD, /* 개설소속코드 */
            (
              SELECT  K_STRUCT_NM
              FROM    SCOM0400
              WHERE   STRUCT_DIV = '20'
                      AND STRUCT_CD = A.DEPT_CD
            ) AS DEPT_NM, /* 개설소속 이름 */
            A.DTL_DEPT_CD, /* 개설세부소속코드_전공 */
            A.GRDE_CD, /* 개설학년 */
            A.STUD_GRDE_CD, /* 학생학년 */
            (
              SELECT  RTRIM(NM_KOR)
              FROM    SCOM0000
              WHERE   CODE_DIV = 'SCOM10'
                      AND CODE_CD = A.STUD_GRDE_CD
            ) AS STUD_GRDE_NM, /* 학생학년 이름 */
            A.FAC_CD, /* 이수구분코드 */
            (
              SELECT  RTRIM(NM_KOR)
              FROM    SCOM0000
              WHERE   CODE_DIV = 'HSGG02'
                      AND CODE_CD = A.FAC_CD
            ) AS FAC_NM, /* 이수구분 이름 */
            A.APPL_POINT, /* 학점 */
            B.POINT, /* 학점 */
            A.POINT POINT1,
            SCO_MIDD, /* 중간점수 */
            SCO_ATTD, /* 출석점수 */
            SCO_RPT, /* 과제점수 */
            SCO_EOT, /* 기말점수 */
            SCO, /* 점수[총점] */
            CRET_GRD_DIV, /* 성적등급 */
            AVMK, /* 평점평균 */
            CASE  WHEN A.APPL_POINT = 0 then AVMK
                  ELSE A.APPL_POINT * AVMK
            END AS PO_AV,
            A.APPL_POINT * SCO AS PO_SCO,
            '' AS PERC_SCO,
            A.CRET_INP_DIV
    FROM    SSJ100T	A /* 성적관리 테이블 */
    LEFT    OUTER JOIN SSG100T B
            ON A.ESTB_YEAR = B.ESTB_YEAR
            AND A.ESTB_SMR_CD = B.ESTB_SMR_CD
            AND A.SUBJT_CD	= B.SUBJT_CD
            AND A.STUD_ID = B.STUD_ID
    INNER   JOIN (
              SELECT  APLY_YEAR,
                      APLY_SMR_CD,
                      SDT_DT + STM_TM AS AVAILABLE_START_DATETIME
              FROM    SCOM0100
              WHERE   SCHD_DIV = '15170'
                      AND USE_YN = 'Y'
            ) C
            ON A.ESTB_YEAR = C.APLY_YEAR
            AND A.ESTB_SMR_CD = C.APLY_SMR_CD
    WHERE   A.STUD_ID = '${userId}' /* 학번 */
            AND CRET_CFMT_YN	= 'Y' /* 성적확정여부 */
            AND A.REATLEC_AT	= 'N'
            AND CRET_GVUP_YN	= 'N' /* 성적포기여부 */
            AND C.AVAILABLE_START_DATETIME <= FORMAT(GETDATE(), 'yyyyMMddHHmm')
    ORDER   BY A.ESTB_YEAR DESC, /* 개설년도 */
            A.ESTB_SMR_CD DESC, /* 개설학기 */
            A.DEPT_CD, /* 개설소속코드 */
            A.DTL_DEPT_CD, /* 개설세부소속코드 */
            A.GRDE_CD desc /* 개설학년 */
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

// 지정한 사용자의 수강 신청 현황(년도, 학년, 학기)을 불러옴
// @param userId: 사용자 학번
router.get(
  '/one_course_application_status_group',
  authJwt,
  async (req, res, next) => {
    const param = req.query;

    // 사용자 학번 또는 교번을 불러옴
    let userId = param.userId || req.user.userId;

    let query = `
      SELECT  A.ESTB_YEAR,
              A.STUD_GRDE_CD,
              (
                SELECT  RTRIM(NM_KOR)
                FROM    SCOM0000
                WHERE   CODE_DIV = 'SCOM10'
                        AND CODE_CD = A.STUD_GRDE_CD
              ) AS STUD_GRDE_NM, /* 학생학년 이름 */
              A.ESTB_SMR_CD,
              (
                SELECT  RTRIM(NM_KOR)
                FROM    SCOM0000
                WHERE   CODE_DIV = 'SCOM11'
                        AND CODE_CD = A.ESTB_SMR_CD
              ) AS ESTB_SMR_NM /* 개설학기 이름 */
      FROM    SSG100T A
      WHERE   A.STUD_ID = '${userId}'
      GROUP   BY A.ESTB_YEAR,
              A.STUD_GRDE_CD,
              A.ESTB_SMR_CD
      ORDER   BY A.ESTB_YEAR DESC,
              A.STUD_GRDE_CD DESC,
              A.ESTB_SMR_CD DESC
    `;

    let result = await executeQuery(query, (resultType, data) => {
      if (resultType) {
        res.status(200).header({ Authorization: req.authorization }).json(data);
      } else {
        // 쿼리에 오류가 발생함
        res.status(400).json(null);
      }
    });
  },
);

// 지정한 사용자의 수강 신청 현황을 불러옴
// @param year: 년도
// @param grade: 학년
// @param semester: 학기
// @param userId: 사용자 학번
router.get(
  '/one_course_application_status',
  authJwt,
  async (req, res, next) => {
    const param = req.query;

    // 사용자 학번 또는 교번을 불러옴
    let userId = param.userId || req.user.userId;

    let query = `
      SELECT  DISTINCT C.SUBJT_CD,
              C.SUBJT_CD AS SUBJT_CD1,
              (
                SELECT  SUBJT_NM_KOR
                FROM    SGG100T
                WHERE   SUBJT_CD = C.SUBJT_CD
              ) AS SUBJT_NM, /* 교과목 이름 */
              C.DEPT_CD,
              C.DTL_DEPT_CD,
              C.GRDE_CD,
              C.ATLEC_FAC_CD,
              (
                SELECT  RTRIM(NM_KOR)
                FROM    SCOM0000
                WHERE   CODE_DIV = 'HSGG02'
                AND CODE_CD = C.ATLEC_FAC_CD
              ) AS ATLEC_FAC_NM, /* 이수구분 이름 */
              C.POINT,
              C.DICL,
              (
                SELECT  NM_KOR
                FROM    HRM100T
                WHERE   EMP_ID = B.EMP_ID
              )	AS PROF_NM,
              D.ATLEC_POCA,
              (
                SELECT  COUNT(*)
                FROM    SSG100T
                WHERE   ESTB_YEAR = C.ESTB_YEAR
                        AND ESTB_SMR_CD = C.ESTB_SMR_CD
                        AND SUBJT_CD = C.SUBJT_CD
                        AND DICL = C.DICL
                        AND DEPT_CD = C.DEPT_CD
                        AND DTL_DEPT_CD = C.DTL_DEPT_CD
              ) AS STD_CNT,
              C.REATLEC_YEAR,
              '' AS IMAGE,
              C.REATLEC_AT,
              (
                SELECT  RTRIM(NM_KOR)
                FROM    SCOM0000
                WHERE   CODE_DIV = 'HSSJ11'
                AND CODE_CD = C.REATLEC_AT
              ) AS REATLEC_AT_NM /* 재수강 */
      FROM    SSG100T C
      LEFT    OUTER JOIN SSU120T B
              ON C.ESTB_YEAR = B.ESTB_YEAR
              AND C.ESTB_SMR_CD = B.ESTB_SMR_CD
              AND	C.DEPT_CD = B.DEPT_CD
              AND	C.DTL_DEPT_CD = B.DTL_DEPT_CD
              AND	C.GRDE_CD = B.GRDE_CD
              AND	C.DICL = B.DICL
              AND	C.SUBJT_CD = B.SUBJT_CD
              AND	B.REPR_PRFS_YN = 'Y'
      LEFT    OUTER JOIN SSU100T D
              ON C.ESTB_YEAR = D.ESTB_YEAR
              AND	C.ESTB_SMR_CD = D.ESTB_SMR_CD
              AND	C.DEPT_CD = D.DEPT_CD
              AND	C.DTL_DEPT_CD = D.DTL_DEPT_CD
              AND	C.GRDE_CD = D.GRDE_CD
              AND	C.DICL = D.DICL
              AND	C.SUBJT_CD = D.SUBJT_CD
      WHERE   C.ESTB_YEAR = '${param.year}'
              AND C.ESTB_SMR_CD = '${param.semester}'
              AND C.STUD_ID = '${userId}'
    `;

    let result = await executeQuery(query, (resultType, data) => {
      if (resultType) {
        res.status(200).header({ Authorization: req.authorization }).json(data);
      } else {
        // 쿼리에 오류가 발생함
        res.status(400).json(null);
      }
    });
  },
);

// 지정한 사용자의 이수 구분별 성적을 불러옴
// @param userId: 사용자 학번
router.get('/grades_earned', authJwt, async (req, res, next) => {
  const param = req.query;

  // 사용자 학번 또는 교번을 불러옴
  let userId = param.userId || req.user.userId;

  let query = `
    SELECT  ESTB_YEAR, /* 개설년도 */
            ESTB_SMR_CD, /* 개설학기 */
            (
              SELECT  REPLACE(RTRIM(NM_KOR), ' ', '')
              FROM    SCOM0000
              WHERE   CODE_DIV = 'SCOM11'
                      AND CODE_CD = ESTB_SMR_CD
            ) AS ESTB_SMR_NM, /* 개설학기 이름 */
            STUD_ID, /* 학번 */
            STUD_DEPT_CD, /* 학생소속코드 */
            STUD_DTL_DEPT_CD, /* 학생세부소속코드 */
            STUD_GRDE_CD, /* 학생학년 */
            LEC_CNT, /* 과목수 */
            APPL_POINT, /* 신청학점 */
            GAIN_POINT, /* 취득학점 */
            GAIN_POINT_MJOR, /* 취득학점 - 교 */
            GAIN_POINT_CLT, /* 취득학점 - 전 */
            GAIN_POINT_CLT_ESTL, /* 취득학점_교필 */
            GAIN_POINT_CLT_CHOS, /* 취득학점_교선 */
            GAIN_POINT_MJOR_ESTL, /* 취득학점_전필 */
            GAIN_POINT_MJOR_CHOS, /* 취득학점_전선 */
            GAIN_POINT_FREE, /* 취득학점_자선 */
            GAIN_POINT_TCPF, /* 취득학점_교직 */
            GAIN_POINT_PASS, /* 취득학점_PASS */
            SCO, /* 점수총점 */
            GPA_SCO, /* 평점총점 */
            AVMK, /* 평점평균 */
            CRET_GRD_DIV, /* 성적등급 */
            PERC_SCO, /* 백분위 */
            CRET_F_CNT, /* 성적F과목수 */
            ORDP_DEPT, /* 학과석차 */
            ORDP_DTL_DEPT, /* 전공석차 */
            ORDP_GRDE, /* 학년석차 */
            ORDP_ALL /* 전체석차 */
    FROM    SSJ110T /* 성적석차 테이블 */
    WHERE   STUD_ID = '${userId}'
            AND ALL_SMR_YN = 'N' /* 계절학기포함여부 */
    ORDER   BY ESTB_YEAR DESC,
            ESTB_SMR_CD DESC,
            APPL_POINT DESC
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

// 지정한 사용자의 학기별 시간표 검색 필터 목록을 불러옴
// @param userId: 사용자 학번
router.get(
  '/semester_timetable_search_filter',
  authJwt,
  async (req, res, next) => {
    const param = req.query;

    // 사용자 학번을 불러옴
    let userId = param.userId || req.user.userId;

    let query = `
      SELECT  A.ESTB_YEAR, /* 개설년도 */
              A.STUD_GRDE_CD, /* 학생학년 */
              (
                SELECT  REPLACE(RTRIM(NM_KOR), ' ', '')
                FROM    SCOM0000
                WHERE   CODE_DIV = 'SCOM10'
                        AND CODE_CD = A.STUD_GRDE_CD
              ) AS STUD_GRDE_NM, /* 학생학년 이름 */
              A.ESTB_SMR_CD, /* 개설학기 */
              (
                SELECT  REPLACE(RTRIM(NM_KOR), ' ', '')
                FROM    SCOM0000
                WHERE   CODE_DIV = 'SCOM11'
                        AND CODE_CD = A.ESTB_SMR_CD
              ) AS ESTB_SMR_NM /* 개설학기 이름 */
      FROM    SSG100T	A
      WHERE   A.STUD_ID = '${userId}' /* 학번 */
      GROUP   BY A.ESTB_YEAR,
              A.STUD_GRDE_CD,
              A.ESTB_SMR_CD
      ORDER   BY A.ESTB_YEAR DESC, /* 개설년도 */
              A.STUD_GRDE_CD DESC, /* 개설학년 */
              A.ESTB_SMR_CD DESC /* 개설학기 */
    `;

    let result = await executeQuery(query, (resultType, data) => {
      if (resultType) {
        res.status(200).header({ Authorization: req.authorization }).json(data);
      } else {
        // 쿼리에 오류가 발생함
        res.status(400).json(null);
      }
    });
  },
);

// 지정한 사용자의 학기별 시간표를 불러옴
// @param userId: 사용자 학번
// @param year: 개설년도
// @param semester: 개설학기
router.get('/semester_timetable', authJwt, async (req, res, next) => {
  const param = req.query;

  // 사용자 학번을 불러옴
  let userId = param.userId || req.user.userId;

  let query = `
      SELECT  G.PRD_CD,
              (
                SELECT  RTRIM(NM_KOR)
                FROM    SCOM0000
                WHERE   CODE_DIV = 'HSSU01'
                        AND CODE_CD = G.PRD_CD
              ) AS PRD_NM, /* 교시 이름 */
              G.STA_TM,
              G.END_TM,
              MAX(P1) P1,
              MAX(P2) P2,
              MAX(P3) P3,
              MAX(P4) P4,
              MAX(P5) P5,
              MAX(P6) P6,
              MAX(P7) P7
      FROM    (
                SELECT  E.PRD_CD,
                        SUBSTRING(E.STA_TM, 1, 2) + ':' + SUBSTRING(E.STA_TM, 3, 2) AS STA_TM,
                        SUBSTRING(E.END_TM, 1, 2) + ':' + SUBSTRING(E.END_TM, 3, 2) AS END_TM,
                        CASE  WHEN WEEK_CD = '01' AND PRD_CD = '00010' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '01' AND PRD_CD = '00020' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '01' AND PRD_CD = '00030' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '01' AND PRD_CD = '00040' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '01' AND PRD_CD = '00050' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '01' AND PRD_CD = '00060' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '01' AND PRD_CD = '00070' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '01' AND PRD_CD = '00080' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '01' AND PRD_CD = '00090' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '01' AND PRD_CD = '00100' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '01' AND PRD_CD = '00110' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '01' AND PRD_CD = '00120' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '01' AND PRD_CD = '00130' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '01' AND PRD_CD = '00140' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '01' AND PRD_CD = '00150' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              ELSE ''
                        END AS P1,
                        CASE  WHEN WEEK_CD = '02' AND PRD_CD = '00010' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '02' AND PRD_CD = '00020' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '02' AND PRD_CD = '00030' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '02' AND PRD_CD = '00040' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '02' AND PRD_CD = '00050' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '02' AND PRD_CD = '00060' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '02' AND PRD_CD = '00070' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '02' AND PRD_CD = '00080' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '02' AND PRD_CD = '00090' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '02' AND PRD_CD = '00100' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '02' AND PRD_CD = '00110' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '02' AND PRD_CD = '00120' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '02' AND PRD_CD = '00130' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '02' AND PRD_CD = '00140' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '02' AND PRD_CD = '00150' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              ELSE ''
                        END AS P2,
                        CASE  WHEN WEEK_CD = '03' AND PRD_CD = '00010' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '03' AND PRD_CD = '00020' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '03' AND PRD_CD = '00030' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '03' AND PRD_CD = '00040' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '03' AND PRD_CD = '00050' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '03' AND PRD_CD = '00060' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '03' AND PRD_CD = '00070' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '03' AND PRD_CD = '00080' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '03' AND PRD_CD = '00090' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '03' AND PRD_CD = '00100' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '03' AND PRD_CD = '00110' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '03' AND PRD_CD = '00120' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '03' AND PRD_CD = '00130' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '03' AND PRD_CD = '00140' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '03' AND PRD_CD = '00150' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              ELSE ''
                        END AS P3,
                        CASE  WHEN WEEK_CD = '04' AND PRD_CD = '00010' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '04' AND PRD_CD = '00020' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '04' AND PRD_CD = '00030' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '04' AND PRD_CD = '00040' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '04' AND PRD_CD = '00050' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '04' AND PRD_CD = '00060' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '04' AND PRD_CD = '00070' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '04' AND PRD_CD = '00080' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '04' AND PRD_CD = '00090' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '04' AND PRD_CD = '00100' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '04' AND PRD_CD = '00110' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '04' AND PRD_CD = '00120' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '04' AND PRD_CD = '00130' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '04' AND PRD_CD = '00140' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '04' AND PRD_CD = '00150' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              ELSE ''
                        END AS P4,
                        CASE  WHEN WEEK_CD = '05' AND PRD_CD = '00010' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '05' AND PRD_CD = '00020' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '05' AND PRD_CD = '00030' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '05' AND PRD_CD = '00040' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '05' AND PRD_CD = '00050' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '05' AND PRD_CD = '00060' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '05' AND PRD_CD = '00070' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '05' AND PRD_CD = '00080' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '05' AND PRD_CD = '00090' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '05' AND PRD_CD = '00100' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '05' AND PRD_CD = '00110' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '05' AND PRD_CD = '00120' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '05' AND PRD_CD = '00130' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '05' AND PRD_CD = '00140' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '05' AND PRD_CD = '00150' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              ELSE ''
                        END AS P5,
                        CASE  WHEN WEEK_CD = '06' AND PRD_CD = '00010' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '06' AND PRD_CD = '00020' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '06' AND PRD_CD = '00030' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '06' AND PRD_CD = '00040' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '06' AND PRD_CD = '00050' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '06' AND PRD_CD = '00060' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '06' AND PRD_CD = '00070' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '06' AND PRD_CD = '00080' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '06' AND PRD_CD = '00090' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '06' AND PRD_CD = '00100' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '06' AND PRD_CD = '00110' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '06' AND PRD_CD = '00120' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '06' AND PRD_CD = '00130' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '06' AND PRD_CD = '00140' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '06' AND PRD_CD = '00150' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              ELSE ''
                        END AS P6,
                        CASE  WHEN WEEK_CD = '07' AND PRD_CD = '00010' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '07' AND PRD_CD = '00020' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '07' AND PRD_CD = '00030' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '07' AND PRD_CD = '00040' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '07' AND PRD_CD = '00050' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '07' AND PRD_CD = '00060' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '07' AND PRD_CD = '00070' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '07' AND PRD_CD = '00080' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '07' AND PRD_CD = '00090' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '07' AND PRD_CD = '00100' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '07' AND PRD_CD = '00110' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '07' AND PRD_CD = '00120' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '07' AND PRD_CD = '00130' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '07' AND PRD_CD = '00140' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              WHEN WEEK_CD = '07' AND PRD_CD = '00150' THEN E.SUBJT_CD + '^' + E.POINT + '^' + E.EMP_ID + '^' + E.PRD_CD_NM + '^' + E.ROOM_CD
                              ELSE ''
                        END AS P7
                FROM    (
                          SELECT  C.PRD_CD,
                                  C.STA_TM,
                                  C.END_TM,
                                  D.WEEK_CD,
                                  (
                                    SELECT  ROOM_NM
                                    FROM    SCOM0601
                                    WHERE   ROOM_CD = D.ROOM_CD
                                  ) AS ROOM_CD,
                                  (
                                    SELECT  SUBJT_NM_KOR
                                    FROM    SGG100T
                                    WHERE   SUBJT_CD = D.SUBJT_CD
                                  ) AS SUBJT_CD,
                                  (
                                    SELECT  NM_KOR
                                    FROM    HRM100T
                                    WHERE   EMP_ID = D.EMP_ID
                                  ) AS EMP_ID,
                                  CONVERT(VARCHAR, D.POINT) + '학점' AS POINT,
                                  (
                                    SELECT  NM_KOR
                                    FROM    SCOM0000
                                    WHERE   CODE_DIV = 'HSSU01'
                                            AND CODE_CD = C.PRD_CD
                                  ) AS PRD_CD_NM
                          FROM    SSU010T C
                          LEFT    OUTER JOIN (
                                    SELECT  A.SUBJT_CD,
                                            B.PRD_CD,
                                            B.WEEK_CD,
                                            B.ROOM_CD,
                                            C.EMP_ID,
                                            D.POINT
                                    FROM    SSG100T A,
                                            SSU110T B,
                                            SSU120T C,
                                            SSU100T D
                                    WHERE   A.SUBJT_CD = B.SUBJT_CD
                                            AND A.ESTB_YEAR = B.ESTB_YEAR
                                            AND A.ESTB_SMR_CD = B.ESTB_SMR_CD
                                            AND A.DEPT_CD = B.DEPT_CD
                                            AND A.DTL_DEPT_CD = B.DTL_DEPT_CD
                                            AND A.SUBJT_CD = B.SUBJT_CD
                                            AND A.GRDE_CD = B.GRDE_CD
                                            AND A.DICL = B.DICL
                                            AND A.SUBJT_CD = C.SUBJT_CD
                                            AND A.ESTB_YEAR = C.ESTB_YEAR
                                            AND A.ESTB_SMR_CD = C.ESTB_SMR_CD
                                            AND A.DEPT_CD = C.DEPT_CD
                                            AND A.DTL_DEPT_CD = C.DTL_DEPT_CD
                                            AND A.SUBJT_CD = C.SUBJT_CD
                                            AND A.GRDE_CD = C.GRDE_CD
                                            AND A.DICL = C.DICL
                                            AND C.REPR_PRFS_YN = 'Y'
                                            AND D.CLOSE_YN = 'N'
                                            AND A.ESTB_YEAR = D.ESTB_YEAR
                                            AND A.ESTB_SMR_CD = D.ESTB_SMR_CD
                                            AND A.DEPT_CD = D.DEPT_CD
                                            AND A.DTL_DEPT_CD = D.DTL_DEPT_CD
                                            AND A.SUBJT_CD = D.SUBJT_CD
                                            AND A.GRDE_CD = D.GRDE_CD
                                            AND A.DICL = D.DICL
                                            AND A.ESTB_YEAR = '${param.year}'
                                            AND A.ESTB_SMR_CD = '${param.semester}'
                                            AND A.STUD_ID = '${userId}'
                                  ) D
                                  ON C.PRD_CD = D.PRD_CD
                        ) E
              ) G
      GROUP   BY G.PRD_CD,
              G.STA_TM,
              G.END_TM
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

// 지정한 사용자의 장학 현황을 불러옴
// @param userId: 사용자 학번
router.get('/scholarship', authJwt, async (req, res, next) => {
  const param = req.query;

  // 사용자 학번 또는 교번을 불러옴
  let userId = param.userId || req.user.userId;

  let query = `
    SELECT  A.STUD_ID, /* 학번 */
            A.YEAR, /* 장학년도 */
            A.YEAR + '년' AS YEAR_NM,
            A.SMR_CD, /* 장학학기 */
            (
              SELECT  REPLACE(RTRIM(NM_KOR), ' ', '')
              FROM    SCOM0000
              WHERE   CODE_DIV = 'SCOM11'
                      AND CODE_CD = A.SMR_CD
            ) AS SMR_NM, /* 장학학기 이름 */
            A.EFLN_GRDE_CD, /* 장학년도 */
            (
              SELECT  REPLACE(RTRIM(NM_KOR), ' ', '')
              FROM    SCOM0000
              WHERE   CODE_DIV = 'SCOM10'
                      AND CODE_CD = A.EFLN_GRDE_CD
            ) AS EFLN_GRDE_NM, /* 학생학년 이름 */
            B.UNIVIO_DIV, /* 교내외구분 */
            (
              SELECT  RTRIM(NM_KOR)
              FROM    SCOM0000
              WHERE   CODE_DIV = 'HSJH02'
                      AND CODE_CD <> '##########'
                      AND CODE_CD = B.UNIVIO_DIV
            ) AS UNIVIO_DIV_NM,
            B.EFLN_DIV, /* 장학구분 */
            (
              SELECT  RTRIM(NM_KOR)
              FROM    SCOM0000
              WHERE   CODE_DIV = 'HSJH01'
                      AND CODE_CD <> '##########'
                      AND CODE_CD = B.EFLN_DIV
            ) AS EFLN_DIV_NM,
            A.EFLN_CD, /* 장학코드 */
            B.EFLN_NM_KOR, /* 장학명 */
            A.EFEE_AMT,
            A.TUTN_AMT,
            A.KISUNG_AMT,
            A.ETC_AMT,
            A.EFLN_AMT AS AMT, /* 장학금 총액 */
            B.PAYT_DIV, /* 지급구분 */
            (
              SELECT  RTRIM(NM_KOR)
              FROM    SCOM0000
              WHERE   CODE_DIV = 'HSJH06'
                      AND CODE_CD <> '##########'
                      AND CODE_CD = B.PAYT_DIV
            ) AS PAYT_DIV_NM,
            C.INSPL_CD, /* 소득분위구분 */
            (
              SELECT  REPLACE(RTRIM(NM_KOR), ' ', '')
              FROM    SCOM0000
              WHERE   CODE_DIV = 'HSJH14'
                      AND CODE_CD <> '##########'
                      AND CODE_CD = C.INSPL_CD
            ) AS INSPL_NM,
            D.GOV_YN, /* 국가장학금신청여부 */
            CASE  WHEN D.GOV_YN = 0 THEN '신청안함'
                  WHEN D.GOV_YN = 1 THEN '신청함'
                  ELSE '신청안함'
            END AS GOV_YN_NM,
            D.DAE_YN, /* 학자금대출신청여부 */
            CASE  WHEN D.DAE_YN = 0 THEN '신청안함'
                  WHEN D.DAE_YN = 1 THEN '신청함'
                  ELSE '신청안함'
            END AS DAE_YN_NM,
            A.REMARK
    FROM    SJH100T A
    LEFT    OUTER JOIN SJH105T B
            ON (
              A.EFLN_CD = B.EFLN_CD
              AND A.YEAR = B.YEAR
              AND A.SMR_CD = B.SMR_CD
            )
    LEFT    OUTER JOIN SJH135T C
            ON (
              A.STUD_ID = C.STUD_ID
              AND A.YEAR = C.YEAR
              AND A.SMR_CD = C.SMR_CD
            )
    LEFT    OUTER JOIN SJH130T D
            ON (
              A.STUD_ID = D.STUD_ID
              AND A.YEAR = D.YEAR
              AND A.SMR_CD = D.SMR_CD
            )
    WHERE   A.STUD_ID = '${userId}'
            AND CFMT_YN = 'Y'
            AND ISNULL(A.CANC_YN,'N') = 'N'
    ORDER   BY A.YEAR DESC,
            A.SMR_CD DESC,
            A.EFLN_CD DESC
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

// 지정한 사용자의 등록금 고지서를 불러옴
// @param userId: 사용자 학번
router.get('/tuitions', authJwt, async (req, res, next) => {
  const param = req.query;

  // 사용자 학번을 불러옴
  let userId = param.userId || req.user.userId;

  let query = `
    SELECT  A.YEAR,
            A.YEAR + '년' AS YEAR_NM,
            A.SMR_CD,
            (
              SELECT  REPLACE(RTRIM(NM_KOR), ' ', '')
              FROM    SCOM0000
              WHERE   CODE_DIV = 'SCOM11'
                      AND CODE_CD = A.SMR_CD
            ) AS SMR_NM, /* 학기 이름 */
            (
              SELECT  K_STRUCT_NM
              FROM    SCOM0400
              WHERE   STRUCT_DIV = '20'
                      AND STRUCT_CD = A.STUD_DEPT_CD
            ) AS DEPT_NM, /* 학과 */
            (
              SELECT  K_STRUCT_DTL_NM
              FROM    SCOM0400
              WHERE   STRUCT_DIV = '30'
                      AND STRUCT_CD = A.STUD_DEPT_CD
                      AND STRUCT_DTL_CD = A.STUD_DTL_DEPT_CD
            ) AS DTL_DEPT_NM, /* 전공 */
            ISNULL(
            (
              SELECT  K_STRUCT_NM
              FROM    SCOM0400
              WHERE   STRUCT_DIV = '20'
                      AND STRUCT_CD = A.STUD_DEPT_CD
            ), '') + ' ' +
            ISNULL(
            (
              SELECT  K_STRUCT_DTL_NM
              FROM    SCOM0400
              WHERE   STRUCT_DIV = '30'
                      AND STRUCT_CD = A.STUD_DEPT_CD
                      AND STRUCT_DTL_CD = A.STUD_DTL_DEPT_CD
            ), '') AS FULL_DEPT_NM,
            A.STUD_GRDE_CD,
            (
              SELECT  REPLACE(RTRIM(NM_KOR), ' ', '')
              FROM    SCOM0000
              WHERE   CODE_DIV = 'SCOM10'
                      AND CODE_CD = A.STUD_GRDE_CD
            ) AS STUD_GRDE_NM, /* 학생학년 이름 */
            A.STUD_DEPT_CD,
            A.STUD_ID,
            B.NM_KOR,
            B.SCRG_VARB_CD,
            B.SCRG_STAT_CD,
            B.ZIP1 + B.ZIP2 AS ZIP1,
            B.ADD1,
            B.ADD2,
            ISNULL(
            (
              SELECT  RTRIM(NM_KOR)
              FROM    SCOM0000
              WHERE   CODE_DIV = 'SCOM31'
                      AND CODE_CD <> '##########'
                      AND USE_YN = 'Y'
                      AND CODE_CD = D.BANK_CD
            ), '') + ' 가상계좌' AS VACNT_INFO, /* 은행이름 */
            D.VACNT_NO, /* 가상계좌번호 */
            A.REG_DIV_YN, /* 분납신청여부 */
            CASE	WHEN A.REG_DIV_YN = 'Y' THEN '신청'
            ELSE '미신청'
            END AS REG_DIV_YN_NM,
            A.REG_DIV_AMT, /* 분납신청금액 */
            A.EFEE_AMT, /* 책정입학금액 */	
            A.TUTN_AMT, /* 책정수업료금액 */
            A.TOT_AMT, /* 책정금액계 */
            A.EFLN_EFEE_AMT, /* 장학입학금액 */
            A.EFLN_TUTN_AMT, /* 장학수업료금액 */
            A.REG_EFLN_AMT, /* 장학금 총핵 */
            A.GOJI_EFEE_AMT, /* 고지입학금액 */  	
            A.GOJI_TUTN_AMT, /* 고지수업료금액 */
            A.GOJI_TOT_AMT, /* 고지총금액 */
            A.ETC_PAYM_AMT, /* 지불금액 */
            A.ETC_PAYM_YN, /* 지불여부 */
            A.ETC_GOJI_AMT, /* 고지금액 */
            A.PAYM_TOT_AMT /* 납입금액 총핵 */
    FROM    SDR100T A
    INNER   JOIN SHJ100T B
            ON A.STUD_ID = B.STUD_ID
    LEFT    OUTER JOIN SHJ105T C
            ON A.STUD_ID = C.STUD_ID
    LEFT    OUTER JOIN SDR300T D /* 가상계번호 */
            ON (
              CASE  WHEN C.EXMT_NO IS NOT NULL AND C.TPEX_YEAR = D.YEAR AND D.SMR_CD = '10' THEN C.EXMT_NO
                    ELSE A.STUD_ID
              END = D.STUD_ID
              AND A.YEAR = D.YEAR
              AND A.SMR_CD = D.SMR_CD
            )
    WHERE   A.STUD_ID = '${userId}'
    ORDER   BY A.YEAR DESC,
            A.STUD_GRDE_CD DESC,
            A.SMR_CD DESC,
            A.STUD_ID
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

// 지정한 사용자의 등록금 고지서 년, 학년, 학기를 불러옴
// @param userId: 사용자 학번
router.get('/tuition_section', authJwt, async (req, res, next) => {
  const param = req.query;

  // 사용자 학번을 불러옴
  let userId = param.userId || req.user.userId;

  let query = `
    SELECT  YEAR,
            YEAR + '년' AS YEAR_NM,
            STUD_GRDE_CD,
            (
               SELECT  REPLACE(RTRIM(NM_KOR), ' ', '')
               FROM    SCOM0000
               WHERE   CODE_DIV = 'SCOM10'
                       AND CODE_CD = STUD_GRDE_CD
            ) AS STUD_GRDE_NM,
            SMR_CD,
            (
               SELECT  REPLACE(RTRIM(NM_KOR), ' ', '')
               FROM    SCOM0000
               WHERE   CODE_DIV = 'SCOM11'
                       AND CODE_CD = SMR_CD
             ) AS SMR_NM
    FROM    SDR120T
    WHERE   STUD_ID = '${userId}'
    GROUP   BY YEAR,
            STUD_GRDE_CD,
            SMR_CD
    ORDER   BY YEAR DESC,
            STUD_GRDE_CD DESC,
            SMR_CD DESC
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

// 지정한 사용자의 등록금 납부 현황을 불러옴
// @param userId: 사용자 학번
// @param year: 년도
// @param grade: 학년
// @param semester: 학번
router.get('/tuition_state', authJwt, async (req, res, next) => {
  const param = req.query;

  // 사용자 학번을 불러옴
  let userId = param.userId || req.user.userId;

  let query = `
    SELECT  A.STUD_ID, /* 학번 */
            CASE  WHEN C.REG_DIV_YN = 'Y' AND REG_DIV_AMT > 0 THEN 'M'
                  WHEN C.REG_DIV_YN = '' THEN 'N'
                  ELSE ISNULL(REG_DIV_YN, 'N')
            END AS REG_DIV_YN,
            CASE  WHEN (
                    CASE  WHEN C.REG_DIV_YN = 'Y' AND REG_DIV_AMT > 0 THEN 'M'
                          WHEN C.REG_DIV_YN = '' THEN 'N'
                          ELSE ISNULL(REG_DIV_YN, 'N')
                    END
                  ) = 'Y' THEN '신청확인중'
                  WHEN (
                    CASE  WHEN C.REG_DIV_YN = 'Y' AND REG_DIV_AMT > 0 THEN 'M'
                          WHEN C.REG_DIV_YN = '' THEN 'N'
                          ELSE ISNULL(REG_DIV_YN, 'N')
                    END
                  ) = 'N' THEN '미신청'
                  WHEN (
                    CASE  WHEN C.REG_DIV_YN = 'Y' AND REG_DIV_AMT > 0 THEN 'M'
                          WHEN C.REG_DIV_YN = '' THEN 'N'
                          ELSE ISNULL(REG_DIV_YN, 'N')
                    END
                  ) = 'M' THEN '신청완료'
            END AS REG_DIV_YN_NM,
            ISNULL(
              (
                SELECT  RTRIM(NM_KOR) NM_KOR
                FROM    SCOM0000
                WHERE   CODE_DIV = 'SCOM31'
                        AND CODE_CD <> '##########'
                        AND USE_YN ='Y'
                        AND CODE_CD = D.BANK_CD
              ), '') + ' 가상계좌' AS VACNT_INFO, /* 은행이름 */
            C.VACNT_NO, /* 가상계좌번호 */
            ISNULL(C.REG_DIV_AMT, 0) AS REG_DIV_AMT, /* 분납신청금액 */
            ISNULL(C.EFEE_AMT, 0) AS EFEE_AMT, /* 책정입학금액 */
            ISNULL(C.TUTN_AMT, 0) AS TUTN_AMT, /* 책정수업료금액 */
            ISNULL(C.TOT_AMT, 0) AS TOT_AMT, /* 책정금액계 */
            ISNULL(C.EFLN_EFEE_AMT, 0) AS EFLN_EFEE_AMT, /* 장학입학금액 */
            ISNULL(C.EFLN_TUTN_AMT, 0) AS EFLN_TUTN_AMT, /* 장학수업료금액 */
            ISNULL(C.GOJI_EFEE_AMT, 0) AS GOJI_EFEE_AMT, /* 고지입학금액 */
            ISNULL(C.GOJI_TUTN_AMT, 0) AS GOJI_TUTN_AMT, /* 고지수업료금액 */
            ISNULL(C.GOJI_TOT_AMT, 0) AS GOJI_TOT_AMT, /* 고지총금액 */
            ISNULL(C.ETC_PAYM_AMT, 0) AS ETC_PAYM_AMT, /* 지불금액 */
            ISNULL(C.ETC_PAYM_YN, 0) AS ETC_PAYM_YN, /* 지불여부 */
            ISNULL(C.ETC_GOJI_AMT, 0) AS ETC_GOJI_AMT, /* 고지금액 */
            ISNULL(C.PAYM_TOT_AMT, 0) AS PAYM_TOT_AMT, /* 납입금액 총액 */
            ISNULL(C.REG_EFLN_AMT, 0) AS REG_EFLN_AMT, /* 장학금 총핵 */
            C.YEAR,
            C.SMR_CD,
            ISNULL((C.GOJI_TOT_AMT - C.PAYM_TOT_AMT), 0) AS BLNC_ETC_TOT
    FROM    SHJ100T A /* 학적관리 테이블 */
    LEFT    OUTER JOIN SHJ105T B /* 입시관리 테이블 */
            ON A.STUD_ID = B.STUD_ID
    LEFT    OUTER JOIN SDR100T C /* 등록관리 */
            ON (
              YEAR = '${param.year}'
              AND SMR_CD = '${param.semester}'
              AND C.STUD_DEPT_CD = A.DEPT_CD
              AND C.STUD_ID = A.STUD_ID
            )
    LEFT    OUTER JOIN SDR300T D /* 가상계번호 */
            ON (
              C.STUD_ID = D.STUD_ID
              AND C.YEAR = D.YEAR
              AND C.SMR_CD = D.SMR_CD
            )
    WHERE   A.STUD_ID = '${userId}'
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

// 지정한 사용자의 등록금 납부를 불러옴
// @param userId: 사용자 학번
// @param year: 년도
// @param grade: 학년
// @param semester: 학번
router.get('/tuition_registration_fee', authJwt, async (req, res, next) => {
  const param = req.query;

  // 사용자 학번을 불러옴
  let userId = param.userId || req.user.userId;

  let query = `
    SELECT  STUD_ID, /* 학번 */
            YEAR, /* 연도 */
            SMR_CD, /* 학기 */
            STUD_DEPT_CD, /* 계열 */
            STUD_DTL_DEPT_CD, /* 전공 */
            STUD_GRDE_CD, /* 학년 */
            SEQ, /* SEQ */
            RECV_DIV, /* 수납처구분 */
            RECV_BANK_CD, /* 수납은행 */
            VACNT_NO, /* 계좌번호_가상 */
            RECV_AMT, /* 수납금 */
            RECV_DT, /* 수납일 */
            EFEE_AMT, /* 입학금 */
            TUTN_AMT, /* 등록금 */
            KISUNG_AMT, /* 기성회비 */
            REMARK /* 비고 */
    FROM    SDR120T /* 등록상세관리 테이블 */
    WHERE   YEAR = '${param.year}' /* 연도 */
            AND STUD_GRDE_CD = '${param.grade}' /* 학년 */
            AND SMR_CD = '${param.semester}' /* 학기 */
            AND STUD_ID = '${userId}' /* 학번 */
    ORDER   BY YEAR DESC,
            STUD_GRDE_CD DESC,
            SMR_CD DESC
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

// 지정한 사용자의 자율금 납부를 불러옴
// @param userId: 사용자 학번
// @param year: 년도
// @param grade: 학년
// @param semester: 학번
router.get('/tuition_autonomy_fee', authJwt, async (req, res, next) => {
  const param = req.query;

  // 사용자 학번을 불러옴
  let userId = param.userId || req.user.userId;

  let query = `
    SELECT  YEAR, /* 년도 */
            SMR_CD, /* 학기 */
            STUD_ID, /* 학번 */
            STUD_DEPT_CD, /* 계열 */
            STUD_DTL_DEPT_CD, /* 전공 */
            STUD_GRDE_CD, /* 학년 */
            REG_ETC_CD, /* 자율비구분 */
            (
              SELECT  RTRIM(NM_KOR)
              FROM    SCOM0000
              WHERE   CODE_DIV = 'HSDR11'
                      AND CODE_CD <> '##########'
                      AND CODE_CD = REG_ETC_CD
            ) AS REG_ETC_NM,
            SEQ, /* SEQ */
            RECV_DIV, /* 수납처구분 */
            RECV_BANK_CD, /* 수납은행 */
            VACNT_NO, /* 계좌번호_가상 */
            RECV_DT, /* 수납일 */
            RECV_AMT, /* 수납금액 */
            REMARK /* 비고 */
    FROM    SDR335T /* 자율비관리 테이블 */
    WHERE   YEAR = '${param.year}' /* 연도 */
            AND STUD_GRDE_CD = '${param.grade}' /* 학년 */
            AND SMR_CD = '${param.semester}' /* 학기 */
            AND STUD_ID = '${userId}' /* 학번 */
    ORDER   BY YEAR DESC,
            STUD_GRDE_CD DESC,
            SMR_CD DESC
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

// 지정한 사용자의 환불금을 불러옴
// @param userId: 사용자 학번
// @param year: 년도
// @param grade: 학년
// @param semester: 학번
router.get('/tuition_refund_fee', authJwt, async (req, res, next) => {
  const param = req.query;

  // 사용자 학번을 불러옴
  let userId = param.userId || req.user.userId;

  let query = `
    SELECT  YEAR, /* 년도 */
            SMR_CD, /* 학기 */
            STUD_ID, /* 학번 */
            SEQ, /* SEQ */
            REFD_DT, /* 환불일자 */
            REFD_DIV, /* 환불구분 */
            (
              SELECT  RTRIM(NM_KOR)
              FROM    SCOM0000
              WHERE   CODE_DIV = 'HSDR17'
                      AND CODE_CD <> '##########'
                      AND USE_YN = 'Y'
                      AND RELATION1 IN ('C', 'N')
                      AND CODE_CD = REFD_DIV
            ) AS REFD_DIV_NM,
            REFD_EFEE_AMT, /* 환불입학금 */
            REFD_TUTN_AMT, /* 환불수업료 */
            REFD_KISUNG_AMT, /* 환불기성회비 */
            REFD_AMT_TOT, /* 환불금액계 */
            REFD_ETC1_DIV, /* 자율비구분1 */
            (
              SELECT  RTRIM(NM_KOR)
              FROM    SCOM0000
              WHERE   CODE_DIV = 'HSDR11'
                      AND CODE_CD <> '##########'
                      AND CODE_CD = REFD_ETC1_DIV
            ) AS REFD_ETC1_DIV_NM,
            REFD_ETC1_AMT, /* 자율비환불금액1 */
            REFD_ETC2_DIV, /* 자율비구분2 */
            (
              SELECT  RTRIM(NM_KOR)
              FROM    SCOM0000
              WHERE   CODE_DIV = 'HSDR11'
                      AND CODE_CD <> '##########'
                      AND CODE_CD = REFD_ETC2_DIV
            ) AS REFD_ETC2_DIV_NM,
            REFD_ETC2_AMT, /* 자율비환불금액2 */
            REFD_ETC3_DIV, /* 자율비구분3 */
            (
              SELECT  RTRIM(NM_KOR)
              FROM    SCOM0000
              WHERE   CODE_DIV = 'HSDR11'
                      AND CODE_CD <> '##########'
                      AND CODE_CD = REFD_ETC3_DIV
            ) AS REFD_ETC3_DIV_NM,
            REFD_ETC3_AMT, /* 자율비환불금액3 */
            REFD_ETC4_DIV, /* 자율비구분4 */
            REFD_ETC4_AMT, /* 자율비환불금액4 */
            REFD_ETC5_DIV, /* 자율비구분5 */
            REFD_ETC5_AMT, /* 자율비환불금액5 */
            REFD_ETC_TOT, /* 자율비환불금액계 */
            REFD_BANK_CD, /* 환불은행구분 */
            (
              SELECT  RTRIM(NM_KOR)
              FROM    SCOM0000
              WHERE   CODE_DIV = 'SCOM31'
                      AND CODE_CD <> '##########'
                      AND CODE_CD = REFD_BANK_CD
            ) AS REFD_BANK_NM,
            REFD_BANK_NO, /* 환불계좌번호 */
            REFD_DEPOSITOR, /* 환불예금주 */
            REFD_DEPOSITOR_DIV, /* 환불예금주관계 */
            (
              SELECT  RTRIM(NM_KOR)
              FROM    SCOM0000
              WHERE   CODE_DIV = 'SCOM41'
                      AND CODE_CD <> '##########'
                      AND CODE_CD = REFD_DEPOSITOR_DIV
            ) AS REFD_DEPOSITOR_DIV_NM,
            REMARK /* 비고 */
    FROM    SDR115T
    WHERE   YEAR = '${param.year}' /* 연도 */
            AND SMR_CD = '${param.semester}' /* 학기 */
            AND STUD_ID = '${userId}' /* 학번 */
    ORDER   BY SEQ DESC
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

// 지정한 사용자의 권한을 불러옴
// @param userId: 사용자 아이디
router.get('/one_user_roles', authJwt, async (req, res, next) => {
  const param = req.query;

  // 사용자 학번 또는 교번을 불러옴
  let userId = param.userId || req.user.userId;

  let query = `
      SELECT  USER_ID,
              ROLE
      FROM    SIS501T
      WHERE   USER_ID = '${userId}'
              AND AVAILABLE = 1
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

// 사용자 이미지를 추가함
router.post('/user_image', authJwt, async (req, res, next) => {
  const param = req.body;

  // 사용자 학번 또는 교번을 불러옴
  let userId = param.userId || req.user.userId;

  let query = `
    INSERT  INTO SIS502T
            (
              USER_ID,
              DESTINATION_DIRECTORY,
              ORIGINAL_FILE_NAME,
              SAVE_FILE_NAME,
              SAVE_PATH,
              FILE_SIZE,
              CREATED_USER_ID,
              CREATED_USER_NAME,
              CREATED_USER_EMAIL
            )
    VALUES  (
              '${userId}',
              '${param.destinationDirectory}',
              '${param.originalFileName}',
              '${param.saveFileName}',
              '${param.savePath}',
              ${param.fileSize},
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

// 사용자 이미지를 삭제함
router.delete('/user_image', authJwt, async (req, res, next) => {
  const param = req.body;

  // 사용자 학번 또는 교번을 불러옴
  let userId = param.userId || req.user.userId;

  let query = `
    DELETE
    FROM    SIS502T
    WHERE   USER_ID = '${userId}'
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

// 지정한 사용자의 이미지를 불러옴
// @param userId: 사용자 아이디
router.get('/user_image', authJwt, async (req, res, next) => {
  const param = req.query;

  // 사용자 학번 또는 교번을 불러옴
  let userId = param.userId || req.user.userId;

  let query = `
    SELECT  TOP 1
            ID,
            USER_ID,
            DESTINATION_DIRECTORY,
            ORIGINAL_FILE_NAME,
            SAVE_FILE_NAME,
            SAVE_PATH,
            FILE_SIZE,
            CREATED_AT,
            CREATED_USER_ID,
            CREATED_USER_NAME,
            CREATED_USER_EMAIL
    FROM    SIS502T
    WHERE   USER_ID = '${userId}'
    ORDER   BY ID DESC
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

// 지정한 사용자의 복학 신청 이력을 불러옴
// @param userId: 사용자 아이디
router.get('/general_reinstatement', authJwt, async (req, res, next) => {
  const param = req.query;

  // 사용자 학번을 불러옴
  let userId = param.userId || req.user.userId;

  let query = `
    SELECT  A.STUD_ID,
            APPL_YEAR,
            APPL_YEAR + '년' AS APPL_YEAR_NM,
            APPL_SMR_CD,
            (
              SELECT  REPLACE(RTRIM(NM_KOR), ' ', '')
              FROM    SCOM0000
              WHERE   CODE_DIV = 'SCOM11'
                      AND CODE_CD = APPL_SMR_CD
            ) AS APPL_SMR_NM,
            APPL_SCRG_STAT_CD,
            (
              SELECT  RTRIM(NM_KOR)
              FROM    SCOM0000
              WHERE   CODE_DIV = 'HSHJ02'
                      AND CODE_CD <> '##########'
                      AND CODE_CD = APPL_SCRG_STAT_CD
            ) AS APPL_SCRG_STAT_NM,
            APPL_SCRG_VARB_CD,
            USE_FROM_DT,
            USE_TO_DT,
            A.RTSC_EXPT_YEAR,
            A.RTSC_EXPT_YEAR + '년' AS RTSC_EXPT_YEAR_NM,
            RTSC_GRDE_CD,
            (
              SELECT  REPLACE(RTRIM(NM_KOR), ' ', '')
              FROM    SCOM0000
              WHERE   CODE_DIV = 'SCOM10'
                      AND CODE_CD = RTSC_GRDE_CD
            ) AS RTSC_GRDE_NM,
            A.RTSC_EXPT_SMR_CD,
            (
              SELECT  REPLACE(RTRIM(NM_KOR), ' ', '')
              FROM    SCOM0000
              WHERE   CODE_DIV = 'SCOM11'
                      AND CODE_CD = A.RTSC_EXPT_SMR_CD
            ) AS RTSC_EXPT_SMR_NM,
            ADMT_REFUND_YN,
            SSJ_YN,
            '2' + PROC_STATE AS PROC_STATE,
            CASE  WHEN '2' + PROC_STATE = '1' THEN '휴복학신청'
                  WHEN '2' + PROC_STATE = '2' THEN '휴복학학과승인'
                  WHEN '2' + PROC_STATE = '3' THEN '휴복학최종승인'
                  WHEN '2' + PROC_STATE = '4' THEN '학과반려'
                  WHEN '2' + PROC_STATE = '5' THEN '최종반려'
                  WHEN'2' + PROC_STATE = '6' THEN '휴학최종취소'
                  ELSE ''
                  END AS PROC_STATE_NM,
            CONVERT(INT, SEQ) AS SEQ,
            DMIB_DT,
            FILE_NO
    FROM    SHJ200T A,
            SHJ100T B
    WHERE   A.STUD_ID = B.STUD_ID
            AND A.APPL_SCRG_VARB_CD = '00020'
            AND A.STUD_ID = '${userId}'
            AND SEQ = (
              SELECT  MAX(CONVERT(INT, SEQ))
              FROM    SHJ200T
              WHERE   STUD_ID = '${userId}'
                      --AND RTSC_EXPT_YEAR = ''
                      --AND RTSC_EXPT_SMR_CD = ''
                      AND APPL_SCRG_VARB_CD = '00020'
                      AND PROC_STATE = '3'
            )

    UNION   ALL

    SELECT  STUD_ID,
            APPL_YEAR,
            APPL_YEAR + '년' AS APPL_YEAR_NM,
            APPL_SMR_CD,
            (
              SELECT  REPLACE(RTRIM(NM_KOR), ' ', '')
              FROM    SCOM0000
              WHERE   CODE_DIV = 'SCOM11'
                      AND CODE_CD = APPL_SMR_CD
            ) AS APPL_SMR_NM,
            APPL_SCRG_STAT_CD,
            (
              SELECT  RTRIM(NM_KOR)
              FROM    SCOM0000
              WHERE   CODE_DIV = 'HSHJ02'
                      AND CODE_CD <> '##########'
                      AND CODE_CD = APPL_SCRG_STAT_CD
            ) AS APPL_SCRG_STAT_NM,
            APPL_SCRG_VARB_CD,
            USE_FROM_DT,
            USE_TO_DT,
            RTSC_EXPT_YEAR,
            RTSC_EXPT_YEAR + '년' AS RTSC_EXPT_YEAR_NM,
            RTSC_GRDE_CD,
            (
              SELECT  REPLACE(RTRIM(NM_KOR), ' ', '')
              FROM    SCOM0000
              WHERE   CODE_DIV = 'SCOM10'
                      AND CODE_CD = RTSC_GRDE_CD
            ) AS RTSC_GRDE_NM,
            RTSC_EXPT_SMR_CD,
            (
              SELECT  REPLACE(RTRIM(NM_KOR), ' ', '')
              FROM    SCOM0000
              WHERE   CODE_DIV = 'SCOM11'
                      AND CODE_CD = RTSC_EXPT_SMR_CD
            ) AS RTSC_EXPT_SMR_NM,
            ADMT_REFUND_YN,
            SSJ_YN,
            PROC_STATE, /* 진행상황 */
            CASE  WHEN PROC_STATE = '1' THEN '휴복학신청'
                  WHEN PROC_STATE = '2' THEN '휴복학학과승인'
                  WHEN PROC_STATE = '3' THEN '휴복학최종승인'
                  WHEN PROC_STATE = '4' THEN '학과반려'
                  WHEN PROC_STATE = '5' THEN '최종반려'
                  WHEN PROC_STATE = '6' THEN '휴학최종취소'
                  ELSE ''
                  END AS PROC_STATE_NM,
            CONVERT(INT, SEQ) AS SEQ,
            DMIB_DT,
            FILE_NO
    FROM    SHJ200T
    WHERE   STUD_ID = '${userId}'
            --AND APPL_YEAR = ''
            --AND APPL_SMR_CD = ''
            AND APPL_SCRG_VARB_CD = '00010'
            AND APPL_SCRG_STAT_CD IN ('00610', '00620', '00630')
            AND PROC_STATE IN ('1', '2')
    ORDER   BY CONVERT(INT, SEQ) DESC
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

// 지정한 사용자의 현재 복학 신청 이력을 불러옴
// @param userId: 사용자 아이디
router.get('/current_reinstatement', authJwt, async (req, res, next) => {
  const param = req.query;

  // 사용자 학번을 불러옴
  let userId = param.userId || req.user.userId;

  let query = `
    SELECT  COUNT(*) AS CNT
    FROM    SHJ200T
    WHERE   STUD_ID = '${userId}'
            AND APPL_SCRG_VARB_CD = '00010'
            AND PROC_STATE = '1'
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

// 지정한 사용자의 일반 복학 신청서를 추가함
// @param userId: 사용자 학번
// @param year: 년도
// @param semester: 학기
router.post('/reinstatement', authJwt, async (req, res, next) => {
  const param = req.body;

  // 사용자 학번을 불러옴
  let userId = param.userId || req.user.userId;

  let query = `
    INSERT  INTO SHJ200T (
              STUD_ID, /* 학번 */
              SEQ, /* 고유코드 */
              APPL_YEAR, /* 신청연도 */
              APPL_SMR_CD, /* 신청학기 */
              APPL_SCRG_STAT_CD, /* 신청학적상태코드 */
              APPL_SCRG_VARB_CD, /* 신청학적변동코드 */
              APPL_GRDE_CD, /* 신청학년 */
              APPL_DT, /* 신청일자 */
              SCRG_VARB_CD, /* 현재학적변동코드 */
              SCRG_STAT_CD, /* 현재학적상태코드 */
              ADMT_REFUND_YN, /* 등록금환불여부 */
              SSJ_YN, /* 성적인정여부 */
              PROC_STATE, /* 신청상태 */
              UPD_ID, /* 최종수정자 */
              UPD_DT, /* 최종수정일시 */
              UPD_IP, /* 최종수정IP */
              UPD_PGM /* 최종수정프로그램ID */
            )
    VALUES  (
              '${userId}',
              (
                SELECT  ISNULL(MAX(CONVERT(INT, SEQ)), 0) + 1
                FROM    SHJ200T
                WHERE   STUD_ID = '${userId}'
              ),
              '${param.year}',
              '${param.semester}',
              '00610',
              '00010',
              (
                SELECT  PROM_GRDE_CD
                FROM    SHJ100T
                WHERE   STUD_ID = '${userId}'
              ),
              CONVERT(VARCHAR(8), GETDATE(), 112),
              '00010',
              '00610',
              '',
              '',
              '1',
              '${userId}',
              CONVERT(VARCHAR(30), GETDATE(), 120),
              '',
              'MOBILE_WEB'
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

// 지정한 사용자의 일반 복학 신청서를 삭제함
// @param userId: 사용자 학번
// @param year: 년도
// @param semester: 학기
router.delete('/reinstatement', authJwt, async (req, res, next) => {
  const param = req.body;

  // 사용자 학번을 불러옴
  let userId = param.userId || req.user.userId;

  let query = `
    DELETE
    FROM    SHJ200T
    WHERE   STUD_ID = '${userId}'
            AND SEQ = ${param.seq}
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

// 지정한 사용자의 학생 강의 평가 이력(년도, 학년, 학기)을 불러옴
// @param userId: 사용자 아이디
router.get('/lecture_evaluation_group', authJwt, async (req, res, next) => {
  const param = req.query;

  // 사용자 학번을 불러옴
  let userId = param.userId || req.user.userId;

  let query = `
    SELECT  A.ESTB_YEAR,
            A.ESTB_YEAR + '년' AS ESTB_YEAR_NM,
            A.STUD_GRDE_CD,
            (
              SELECT  REPLACE(RTRIM(NM_KOR), ' ', '')
              FROM    SCOM0000
              WHERE   CODE_DIV = 'SCOM10'
                      AND CODE_CD = A.STUD_GRDE_CD
            ) AS STUD_GRDE_NM, /* 학생학년 이름 */
            A.ESTB_SMR_CD,
            (
              SELECT  REPLACE(RTRIM(NM_KOR), ' ', '')
              FROM    SCOM0000
              WHERE   CODE_DIV = 'SCOM11'
                      AND CODE_CD = A.ESTB_SMR_CD
            ) AS ESTB_SMR_NM /* 개설학기 이름 */
    FROM    (
              SELECT  A.SUBJT_CD,
                      A.SUBJT_DIV,
                      A.FAC_CD,
                      A.POINT,
                      A.THEO_TM,
                      A.PRAC_TM,
                      A.SUBJT_TM,
                      A.DEPT_CD,
                      A.DTL_DEPT_CD,
                      A.K_STRUCT_DTL_NM,
                      A.GRDE_CD,
                      A.DICL,
                      A.EMP_ID,
                      A.LTR_EVAL_DIV,
                      (
                        SELECT  COUNT(*)
                        FROM    SSU310T
                        WHERE   ESTB_YEAR = A.ESTB_YEAR
                                AND ESTB_SMR_CD = A.ESTB_SMR_CD
                                AND EVAL_KIND_DIV = A.LTR_EVAL_DIV
                      ) AS CNT1,
                      (
                        SELECT  COUNT(*)
                        FROM    SSU300T
                        WHERE   ESTB_YEAR = A.ESTB_YEAR
                                AND ESTB_SMR_CD = A.ESTB_SMR_CD
                                AND EVAL_KIND_DIV = A.LTR_EVAL_DIV
                                AND DEPT_CD = A.DEPT_CD
                                AND DTL_DEPT_CD = A.DTL_DEPT_CD
                                AND SUBJT_CD = A.SUBJT_CD
                                AND GRDE_CD = A.GRDE_CD
                                AND DICL = A.DICL
                                AND STUD_ID = B.STUD_ID
                                AND (SCO > 0 OR ANS_CN IS NOT NULL)
                      ) AS CNT2,
                      A.ESTB_YEAR,
                      A.ESTB_SMR_CD,
                      B.STUD_GRDE_CD
              FROM    (
                        SELECT  B.ESTB_YEAR,
                                B.ESTB_SMR_CD,
                                B.SUBJT_CD,
                                B.SUBJT_DIV,
                                B.FAC_CD,
                                B.POINT,
                                B.THEO_TM,
                                B.PRAC_TM,
                                B.SUBJT_TM,
                                B.DEPT_CD,
                                B.APLY_HRS,
                                B.DTL_DEPT_CD,
                                B.LTR_EVAL_DIV,
                                (
                                  SELECT  K_STRUCT_DTL_NM
                                  FROM    SCOM0400 
                                  WHERE   STRUCT_DIV = '30'
                                          AND USE_YN = 'Y'
                                          AND STRUCT_DTL_CD <> 'W'
                                          AND UP_CD = B.DEPT_CD
                                          AND STRUCT_DTL_CD = B.DTL_DEPT_CD
                                ) AS K_STRUCT_DTL_NM,
                                B.GRDE_CD,
                                B.DICL,
                                (
                                  SELECT  NM_KOR
                                  FROM    HRM100T
                                  WHERE   EMP_ID = C.EMP_ID
                                ) AS EMP_ID
                        FROM    SSU100T B,
                                SSU120T C
                        WHERE   B.ESTB_YEAR = C.ESTB_YEAR
                                AND B.ESTB_SMR_CD = C.ESTB_SMR_CD
                                AND B.DEPT_CD = C.DEPT_CD
                                AND B.DTL_DEPT_CD = C.DTL_DEPT_CD
                                AND B.SUBJT_CD = C.SUBJT_CD
                                AND B.GRDE_CD = C.GRDE_CD
                                AND B.DICL = C.DICL
                                AND B.CLOSE_YN = 'N'
                                AND C.REPR_PRFS_YN = 'Y'
                                AND B.LTR_EVAL_DIV IN ('00010', '00020', '00030', '00040')
                      ) A,
                      SSG100T B
              WHERE   B.ESTB_YEAR = A.ESTB_YEAR
                      AND B.ESTB_SMR_CD = A.ESTB_SMR_CD
                      AND B.DEPT_CD = A.DEPT_CD
                      AND B.DTL_DEPT_CD = A.DTL_DEPT_CD
                      AND B.SUBJT_CD = A.SUBJT_CD
                      AND B.GRDE_CD = A.GRDE_CD
                      AND B.DICL = A.DICL
                      AND B.STUD_ID = '${userId}' /* 학번 */
            ) A
    GROUP   BY A.ESTB_YEAR,
            A.STUD_GRDE_CD,
            A.ESTB_SMR_CD
    ORDER   BY A.ESTB_YEAR DESC,
            A.STUD_GRDE_CD DESC,
            A.ESTB_SMR_CD DESC 
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

// 지정한 사용자의 학생 강의 평가 이력을 불러옴
// @param userId: 사용자 아이디
// @param year: 년도
// @param semester: 학기
router.get('/lecture_evaluation', authJwt, async (req, res, next) => {
  const param = req.query;

  // 사용자 학번을 불러옴
  let userId = param.userId || req.user.userId;

  let query = `
    SELECT  A.SUBJT_CD,
            (
              SELECT  SUBJT_NM_KOR
              FROM    SGG100T
              WHERE   SUBJT_CD = A.SUBJT_CD
            ) AS SUBJT_NM, /* 교과목 */
            A.SUBJT_CD AS SUBJT_CD1,
            A.SUBJT_DIV,
            A.FAC_CD,
            (
              SELECT  REPLACE(RTRIM(NM_KOR), ' ', '')
              FROM    SCOM0000
              WHERE   CODE_DIV = 'HSGG02'
                      AND CODE_CD = A.FAC_CD
                      AND USE_YN = 'Y'
            ) AS FAC_NM, 
            A.POINT,
            A.THEO_TM,
            A.PRAC_TM,
            A.SUBJT_TM,
            A.DEPT_CD,
            (
              SELECT  K_STRUCT_NM
              FROM    SCOM0400
              WHERE   STRUCT_CD = A.DEPT_CD
            ) AS DEPT_NM, /* 학과 */
            A.DTL_DEPT_CD,
            A.K_STRUCT_DTL_NM, /* 전공 */
            A.GRDE_CD,
            (
              SELECT  REPLACE(RTRIM(NM_KOR), ' ', '')
              FROM    SCOM0000
              WHERE   CODE_DIV = 'SCOM10'
                      AND CODE_CD = A.GRDE_CD
            ) AS GRDE_NM, /* 학년 */
            A.DICL,
            A.EMP_ID,
            (
              ''
            ) AS EMP_NM,
            A.LTR_EVAL_DIV,
            CASE  WHEN CNT1 - CNT2 = 0 THEN '평가완료'
                  ELSE '평가필요'
                  END AS CNT,
            A.ESTB_YEAR,
            A.ESTB_YEAR + '년' AS ESTB_YEAR_NM,
            A.ESTB_SMR_CD,
            (
              SELECT  REPLACE(RTRIM(NM_KOR), ' ', '')
              FROM    SCOM0000
              WHERE   CODE_DIV = 'SCOM11'
                      AND CODE_CD = A.ESTB_SMR_CD
            ) AS ESTB_SMR_NM
    FROM    (
              SELECT  A.SUBJT_CD,
                      A.SUBJT_DIV,
                      A.FAC_CD,
                      A.POINT,
                      A.THEO_TM,
                      A.PRAC_TM,
                      A.SUBJT_TM,
                      A.DEPT_CD,
                      A.DTL_DEPT_CD,
                      A.K_STRUCT_DTL_NM,
                      A.GRDE_CD,
                      A.DICL,
                      A.EMP_ID,
                      A.LTR_EVAL_DIV,
                      (
                        SELECT  COUNT(*)
                        FROM    SSU310T
                        WHERE   ESTB_YEAR = A.ESTB_YEAR
                                AND ESTB_SMR_CD = A.ESTB_SMR_CD
                                AND EVAL_KIND_DIV = A.LTR_EVAL_DIV
                      ) AS CNT1,
                      (
                        SELECT  COUNT(*)
                        FROM    SSU300T
                        WHERE   ESTB_YEAR = A.ESTB_YEAR
                                AND ESTB_SMR_CD = A.ESTB_SMR_CD
                                AND EVAL_KIND_DIV = A.LTR_EVAL_DIV
                                AND DEPT_CD = A.DEPT_CD
                                AND DTL_DEPT_CD = A.DTL_DEPT_CD
                                AND SUBJT_CD = A.SUBJT_CD
                                AND GRDE_CD = A.GRDE_CD
                                AND DICL = A.DICL
                                AND STUD_ID = B.STUD_ID
                                AND (SCO > 0 OR ANS_CN IS NOT NULL)
                      ) AS CNT2,
                      A.ESTB_YEAR,
                      A.ESTB_SMR_CD
              FROM    (
                        SELECT  B.ESTB_YEAR,
                                B.ESTB_SMR_CD,
                                B.SUBJT_CD,
                                B.SUBJT_DIV,
                                B.FAC_CD,
                                B.POINT,
                                B.THEO_TM,
                                B.PRAC_TM,
                                B.SUBJT_TM,
                                B.DEPT_CD,
                                B.APLY_HRS,
                                B.DTL_DEPT_CD,
                                B.LTR_EVAL_DIV,
                                (
                                  SELECT  K_STRUCT_DTL_NM
                                  FROM    SCOM0400 
                                  WHERE   STRUCT_DIV = '30'
                                          AND USE_YN = 'Y'
                                          AND STRUCT_DTL_CD <> 'W'
                                          AND UP_CD = B.DEPT_CD
                                          AND STRUCT_DTL_CD = B.DTL_DEPT_CD
                                ) AS K_STRUCT_DTL_NM,
                                B.GRDE_CD,
                                B.DICL,
                                (
                                  SELECT  NM_KOR
                                  FROM    HRM100T
                                  WHERE   EMP_ID = C.EMP_ID
                                ) AS EMP_ID
                        FROM    SSU100T B,
                                SSU120T C
                        WHERE   B.ESTB_YEAR = C.ESTB_YEAR
                                AND B.ESTB_SMR_CD = C.ESTB_SMR_CD
                                AND B.DEPT_CD = C.DEPT_CD
                                AND B.DTL_DEPT_CD = C.DTL_DEPT_CD
                                AND B.SUBJT_CD = C.SUBJT_CD
                                AND B.GRDE_CD = C.GRDE_CD
                                AND B.DICL = C.DICL
                                AND B.CLOSE_YN = 'N'
                                AND C.REPR_PRFS_YN = 'Y'
                                AND B.LTR_EVAL_DIV IN ('00010', '00020', '00030', '00040')
                                AND B.ESTB_YEAR = '${param.year}' /* 년도 */
                                AND B.ESTB_SMR_CD = '${param.semester}' /* 학기 */
                      ) A,
                      SSG100T B
              WHERE   B.ESTB_YEAR = A.ESTB_YEAR
                      AND B.ESTB_SMR_CD = A.ESTB_SMR_CD
                      AND B.DEPT_CD = A.DEPT_CD
                      AND B.DTL_DEPT_CD = A.DTL_DEPT_CD
                      AND B.SUBJT_CD = A.SUBJT_CD
                      AND B.GRDE_CD = A.GRDE_CD
                      AND B.DICL = A.DICL
                      AND B.STUD_ID = '${userId}' /* 학번 */
            ) A 
    ORDER   BY A.DEPT_CD,
            A.DTL_DEPT_CD,
            A.SUBJT_CD
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

// 지정한 사용자의 학생 강의 평가 이력의 평가 항목을 불러옴
// @param userId: 사용자 아이디
// @param year: 년도
// @param semester: 학기
// @param questionType: 강의평가종류
// @param course: 과목
router.get('/lecture_evaluation_question', authJwt, async (req, res, next) => {
  const param = req.query;

  // 사용자 학번을 불러옴
  let userId = param.userId || req.user.userId;

  let query = `
    SELECT  A.EVAL_KIND_DIV,
            (
              SELECT  RTRIM(NM_KOR)
              FROM    SCOM0000
              WHERE   CODE_DIV = 'HSSU13'
                      AND CODE_CD = A.EVAL_KIND_DIV
            ) AS EVAL_KIND_DIV_NM,
            A.EVAL_TERR_DIV,
            (
              SELECT  RTRIM(NM_KOR)
              FROM    SCOM0000
              WHERE   CODE_DIV = 'HSSU15'
                      AND CODE_CD = A.EVAL_TERR_DIV
            ) AS EVAL_TERR_DIV_NM,
            A.EVAL_NO,
            A.EVAL_ITEM_NM,
            A.ANS_DIV,
            B.ANS_CN,
            B.SCO
    FROM    SSU310T A
    LEFT    OUTER JOIN SSU300T B
            ON A.ESTB_YEAR = B.ESTB_YEAR
            AND A.ESTB_SMR_CD = B.ESTB_SMR_CD
            AND A.EVAL_KIND_DIV = B.EVAL_KIND_DIV
            AND A.EVAL_NO = B.EVAL_NO
            AND B.STUD_ID = '${userId}'
    WHERE   A.ESTB_YEAR = '${param.year}'
            AND A.ESTB_SMR_CD = '${param.semester}'
            AND A.EVAL_KIND_DIV = '${param.questionType}'
            AND B.SUBJT_CD = '${param.course}'
    ORDER   BY A.EVAL_KIND_DIV,
            A.EVAL_NO
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

// 지정한 사용자의 학생 강의 평가 이력의 평가 항목을 저장함
// @param userId: 사용자 아이디
// @param year: 년도
// @param semester: 학기
// @param questionType: 강의평가종류
// @param course: 과목
router.post('/lecture_evaluation_answer', authJwt, async (req, res, next) => {
  const param = req.body;

  // 사용자 학번을 불러옴
  let userId = param.userId || req.user.userId;

  // 쿼리를 정의함
  let query = '';
  let subQuery = '';

  // 수업 정보를 정의함
  let course = param.course;

  // 질문 항목의 학생 답변을 정의함
  let answer = param.answer;

  // 처리한 대기열을 정의함
  let doneCount = answer.length;

  // 학생의 답변을 저장함
  await answer.map(async (data) => {
    query = `
      SELECT  COUNT(*) AS CNT
      FROM    SSU300T
      WHERE   STUD_ID = '${userId}'
              AND ESTB_YEAR = '${course.ESTB_YEAR}'
              AND ESTB_SMR_CD = '${course.ESTB_SMR_CD}'
              AND DEPT_CD = '${course.DEPT_CD}'
              AND DTL_DEPT_CD = '${course.DTL_DEPT_CD}'
              AND SUBJT_CD = '${course.SUBJT_CD}'
              AND GRDE_CD = '${course.GRDE_CD}'
              AND DICL = '${course.DICL}'
              AND EVAL_KIND_DIV = '${data.EVAL_KIND_DIV}'
              AND EVAL_NO = '${data.EVAL_NO}' 
    `;

    await executeQuery(query, (resultType, data2) => {
      if (resultType) {
        if (data2.rowData[0].CNT === 0) {
          /* Insert */

          subQuery = `
            INSERT  INTO SSU300T
                    (
                      ESTB_YEAR,
                      ESTB_SMR_CD,
                      DEPT_CD,
                      DTL_DEPT_CD,
                      SUBJT_CD,
                      GRDE_CD,
                      DICL,
                      STUD_ID,
                      STUD_DEPT_CD,
                      STUD_DTL_DEPT_CD,
                      STUD_GRDE_CD,
                      EVAL_KIND_DIV,
                      EVAL_NO,
                      ANS_CN,
                      SCO,
                      REMARK,
                      UPD_ID,
                      UPD_PGM,
                      UPD_IP,
                      UPD_DT
                    )
            VALUES  (
                      '${course.ESTB_YEAR}',
                      '${course.ESTB_SMR_CD}',
                      '${course.DEPT_CD}',
                      '${course.DTL_DEPT_CD}',
                      '${course.SUBJT_CD}',
                      '${course.GRDE_CD}',
                      '${course.DICL}',
                      '${userId}',
                      '${course.DEPT_CD}',
                      '${course.DTL_DEPT_CD}',
                      '${course.GRDE_CD}',
                      '${data.EVAL_KIND_DIV}',
                      '${data.EVAL_NO}',
                      '${data.ANS_CN}',
                      ${data.SCO},
                      NULL,
                      '${userId}',
                      CONVERT(VARCHAR(30), GETDATE(), 120),
                      '',
                      'MOBILE_WEB'
                    )
          `;
        } else {
          /* Update */

          subQuery = `
            UPDATE  SSU300T
            SET     ANS_CN = '${data.ANS_CN}',
                    SCO = ${data.SCO},
                    UPD_ID = '${userId}',
                    UPD_DT = CONVERT(VARCHAR(30), GETDATE(), 120),
                    UPD_IP = '',
                    UPD_PGM = 'MOBILE_WEB'
            WHERE   ESTB_YEAR = '${course.ESTB_YEAR}'
                    AND ESTB_SMR_CD = '${course.ESTB_SMR_CD}'
                    AND DEPT_CD = '${course.DEPT_CD}'
                    AND DTL_DEPT_CD = '${course.DTL_DEPT_CD}'
                    AND SUBJT_CD = '${course.SUBJT_CD}'
                    AND STUD_ID = '${userId}'
                    AND GRDE_CD = '${course.GRDE_CD}'
                    AND DICL = '${course.DICL}'
                    AND EVAL_KIND_DIV = '${data.EVAL_KIND_DIV}'
                    AND EVAL_NO = '${data.EVAL_NO}'
          `;
        }

        executeQuery(subQuery, (subResultType, subData) => {
          if (subResultType) {
            doneCount -= 1;

            if (doneCount === 0) {
              res
                .status(200)
                .header({ Authorization: req.authorization })
                .json(subData);
            }
          }
        });
      }
    });
  });

  /*
  let query = `
    DELETE
    FROM    SHJ200T
    WHERE   STUD_ID = '${userId}'
            AND SEQ = ${param.seq}
  `;

  let result = await executeQuery(query, (resultType, data) => {
    if (resultType) {
      res.status(200).header({ Authorization: req.authorization }).json(data);
    } else {
      // 쿼리에 오류가 발생함
      res.status(400).json(null);
    }
  });
  */
});

// 지정한 사용자의 복학 예정 정보를 불러옴(군휴학 제외)
// @param userId: 사용자 학번
router.get('/return_general_reinstatement', authJwt, async (req, res, next) => {
  const param = req.query;

  // 사용자 학번을 불러옴
  let userId = param.userId || req.user.userId;

  let query = `
      SELECT  TOP 1
              STUD_ID, /* 학번 */
              RTSC_EXPT_YEAR, /* 복학예정연도 */
              RTSC_EXPT_SMR_CD, /* 복학예정학기 */
              RTSC_EXPT_DT /* 복학예정일 */
      FROM    SHJ200T /* 학적변동관리 테이블 */
      WHERE   STUD_ID = '${userId}'
              AND APPL_SCRG_STAT_CD NOT IN ('00810', '00820', '00220', '00221', '00620')
              AND RTSC_EXPT_YEAR = YEAR(GETDATE())
      ORDER   BY CONVERT(INT, SEQ) DESC
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

// 현재 날짜가 납입고지서 출력 기간인지 비교함
router.get('/tuition_period', authJwt, async (req, res, next) => {
  const param = req.query;

  let query = `
    SELECT  TOP 1
            APLY_YEAR,
            APLY_SMR_CD,
            SDT_DT + STM_TM AS START_DT,
            SDT_DT,
            STM_TM,
            ENT_DT + EDTM_TM AS END_DT,
            ENT_DT,
            EDTM_TM
    FROM    SCOM0100
    WHERE   SCHD_DIV = '07010' /* 납입고지서출력 */
            AND APLY_YEAR = FORMAT(GETDATE(), 'yyyy')
            AND SDT_DT + STM_TM <= FORMAT(GETDATE(), 'yyyyMMddHHmm')
            AND ENT_DT + EDTM_TM >= FORMAT(GETDATE(), 'yyyyMMddHHmm')
            --AND SDT_DT + STM_TM <= '202201112300'
            --AND ENT_DT + EDTM_TM >= '202201112300'
            --AND SDT_DT + STM_TM <= '202002200000'
            --AND ENT_DT + EDTM_TM >= '202002200000'
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

// 등록금 고지서 안내 사항을 불러옴
// @param year: 년도
// @param semester: 학기
router.get('/tuition_bill_description', authJwt, async (req, res, next) => {
  const param = req.query;

  let query = `
    SELECT  FROMTO_DT,
            PAY_POS, /* 납입장소 */
            BANK_SIGN,
            (
              SELECT  RTRIM(NM_KOR)
              FROM    SCOM0000
              WHERE   CODE_DIV = 'HSDR21'
                      AND CODE_CD <> '##########'
                      AND USE_YN ='Y'
                      AND A.FREE_GB = CODE_CD
            ) AS FREE_NM,
            INFO_MEMO1,
            INFO_MEMO2,
            INFO_MEMO3,
            FREE_GB
    FROM    SCO060T A
    WHERE   YEAR = '${param.year}'
            AND SMR_CD = '${param.semester}'
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

// 등록금 고지서를 불러옴
// @param userId: 사용자 학번
// @param year: 년도
// @param semester: 학기
router.get('/tuition_bill', authJwt, async (req, res, next) => {
  const param = req.query;

  // 사용자 학번을 불러옴
  let userId = param.userId || req.user.userId;

  let query = `
    SELECT  A.YEAR,
            A.YEAR + '년' AS YEAR_NM,
            A.SMR_CD,
            (
              SELECT  REPLACE(RTRIM(NM_KOR), ' ', '')
              FROM    SCOM0000
              WHERE   CODE_DIV = 'SCOM11'
                      AND CODE_CD = A.SMR_CD
            ) AS SMR_CD_NM, /* 학기 이름 */
            A.STUD_GRDE_CD,
            A.STUD_ID,
            A.STUD_DEPT_CD,
            A.STUD_DTL_DEPT_CD,
            B.DEPT_NM,
            B.DTL_DEPT_NM,
            B.NM_KOR,
            REG_STAT,
            PAYM_YN,
            PAYM_TOT_AMT,
            REFD_STAT_YN,
            EFEE_AMT, /* 책정입학금 */
            TUTN_AMT, /* 책정수업료 */
            KISUNG_AMT, /* 책정기성회비 */
            TOT_AMT,
            EFLN_EFEE_AMT, /* 장학입학금 */
            EFLN_TUTN_AMT, /* 장힉수업료 */
            EFLN_KISUNG_AMT, /* 징학기성회비 */
            EFLN_ETC_AMT, /* 장학기타 */
            REG_EFLN_AMT,
            REG_RBAS_YN,
            REG_DIV_YN,
            REG_DIV_DT,
            A.REG_DIV_AMT,
            CASE  WHEN GOJI_TOT_AMT - PAYM_TOT_AMT > A.REG_DIV_AMT THEN CEILING(A.REG_DIV_AMT)
                  WHEN GOJI_TOT_AMT - PAYM_TOT_AMT <= A.REG_DIV_AMT THEN GOJI_TOT_AMT- PAYM_TOT_AMT
                  ELSE A.REG_DIV_AMT
                  END AS REG_DIV_AMT_2,
            EXT_DIV_YN,
            GOJI_EFEE_AMT, /* 고지입학금 */
            GOJI_TUTN_AMT, /* 고지수업료 */
            GOJI_KISUNG_AMT, /* 고지기성회 */
            GOJI_TOT_AMT, /* 고지총합계 */
            CASE WHEN ETC_GOJI_AMT > 0 THEN 1 ELSE 0 END 	ETC_GOJI_AMT_YN, /* 고지금액 */
            ETC_GOJI_AMT,
            CRE_DIV,
            A.VACNT_NO,
            B.SCRG_VARB_CD,
            B.SCRG_STAT_CD,
            SUM_POINT,
            D.BANK_CD,
            (
              SELECT  REPLACE(RTRIM(NM_KOR), ' ', '')
              FROM    SCOM0000
              WHERE   CODE_DIV = 'SCOM31'
                      AND CODE_CD = D.BANK_CD
            ) AS BANK_NM, /* 은행 이름 */
            (
              SELECT  COUNT(*) + 1
              FROM    SDR120T
              WHERE   YEAR = A.YEAR
                      AND SMR_CD = A.SMR_CD
                      AND STUD_ID = A.STUD_ID
            ) AS PAYM_CNT,
            A.REMARK,
            A.UPD_DT
    FROM    SDR100T A
    LEFT    OUTER JOIN SHJ100T B
            ON A.STUD_ID = B.STUD_ID
    LEFT    OUTER JOIN (
              SELECT  A.STUD_ID,
                      SUM(POINT) AS SUM_POINT
              FROM    SSG100T A
              WHERE   A.ESTB_YEAR = '${param.year}'
                      AND A.ESTB_SMR_CD = '${param.semester}'
              GROUP   BY A.STUD_ID
            ) C
            ON C.STUD_ID = A.STUD_ID
    LEFT    OUTER JOIN SDR300T D /* 가상계번호 */
            ON A.STUD_ID = D.STUD_ID
            AND A.YEAR = D.YEAR
            AND A.SMR_CD = D.SMR_CD
    WHERE   REG_RBAS_YN = 'N'
            AND A.YEAR = '${param.year}'
            AND A.SMR_CD = '${param.semester}'
            --AND A.REG_STAT = '' /* 등록상태 */
            --AND B.STUD_DIV = ''
            AND A.STUD_ID = '${userId}'
            --AND B.SCRG_VARB_CD IN ('00010', '00020') /* 학적변동사항 */
            --AND B.SCRG_STAT_CD = ''
            --AND A.CRE_DIV = '' /* 등록대상 */
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

// 자율금 고지서를 불러옴
// @param year: 년도
// @param semester: 학기
// @param grade: 학생의 학년
// @param dept: 학생의 학과
router.get('/tuition_etc_bill', authJwt, async (req, res, next) => {
  const param = req.query;

  let query = `
    SELECT  TOP 2
            AMT,
            USE_YN,
            GRDE_CD,
            REMARK,
            REG_ETC_CD,
            (
              SELECT  REPLACE(RTRIM(NM_KOR), ' ', '')
              FROM    SCOM0000
              WHERE   CODE_DIV = 'HSDR11'
                      AND CODE_CD = A.REG_ETC_CD
            ) AS REG_ETC_NM /* 항목 이름 */
    FROM    SDR330T A
    WHERE   YEAR = '${param.year}'
            AND SMR_CD = '${param.semester}'
            AND GRDE_CD = '${param.grade}'
            AND DEPT_CD = '${param.dept}'
            AND USE_YN = 'Y'
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

//
router.post('/user_one', authJwt, async (req, res, next) => {
  res.status(200).header({ Authorization: req.authorization }).json({
    success: true,
    data: req.user,
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
