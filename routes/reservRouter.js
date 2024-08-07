const express = require('express');
const router = express.Router();
const conn = require('../config/DB');

// 예약 페이지 라우트
router.get('/reservAll', (req, res) => {
    const selectedFieldIdx = req.query.field_idx || '';
    const selectedCourtIdx = req.query.court_idx || '';
    const selectedreservDate = req.query.reserv_dt || '';
    const matchIdx = req.query.match_idx || '';
    const currentDate = new Date();
    const currentDateString = currentDate.toISOString().split('T')[0];
    const currentTimeString = currentDate.toTimeString().split(' ')[0];
    console.log("match_idx", matchIdx);

    const sql1 = 'SELECT * FROM field_info';

    conn.query(sql1, (err, fields) => {
        if (err) {
            return res.status(500).send(err);
        }

        let sql2 = 'SELECT * FROM court_info';
        let queryParams = [];

        if (selectedFieldIdx) {
            sql2 += ' WHERE field_idx = ?';
            queryParams.push(selectedFieldIdx);
        }

        conn.query(sql2, queryParams, (err, courts) => {
            if (err) {
                return res.status(500).send(err);
            }

            let sql3 = 'SELECT field_oper_st_time, field_oper_ed_time FROM field_info';
            let queryParams3 = [];

            if (selectedFieldIdx) {
                sql3 += ' WHERE field_idx = ?';
                queryParams3.push(selectedFieldIdx);
            }

            conn.query(sql3, queryParams3, (err, fieldoperTimes) => {
                if (err) {
                    return res.status(500).send(err);
                }

                let sql4 = 'SELECT reserv_dt, reserv_st_tm, reserv_ed_tm FROM reservation_info WHERE court_idx = ?';
                let queryParams4 = [];

                if (selectedCourtIdx) {
                    queryParams4.push(selectedCourtIdx);
                }

                if (selectedCourtIdx) {
                    conn.query(sql4, queryParams4, (err, reservations) => {
                        if (err) {
                            return res.status(500).send(err);
                        }

                        res.render('reserv', {
                            idName: req.session.idName,
                            fields: fields,
                            courts: courts,
                            selected_field_idx: selectedFieldIdx,
                            selected_court_idx: selectedCourtIdx,
                            fieldoperTimes: fieldoperTimes,
                            field_oper_st_time: fieldoperTimes[0].field_oper_st_time,
                            field_oper_ed_time: fieldoperTimes[0].field_oper_ed_time,
                            reserv_date: selectedreservDate,
                            current_date: currentDateString, // 현재 날짜를 템플릿으로 전달
                            current_time: currentTimeString, // 현재 시간을 템플릿으로 전달
                            reservations: reservations,
                            match_idx: matchIdx // match_idx 추가
                        });
                    });
                } else {
                    res.render('reserv', {
                        idName: req.session.idName,
                        fields: fields,
                        courts: courts,
                        selected_field_idx: selectedFieldIdx,
                        selected_court_idx: selectedCourtIdx,
                        fieldoperTimes: fieldoperTimes,
                        field_oper_st_time: fieldoperTimes[0].field_oper_st_time,
                        field_oper_ed_time: fieldoperTimes[0].field_oper_ed_time,
                        reserv_date: selectedreservDate,
                        current_date: currentDateString, // 현재 날짜를 템플릿으로 전달
                        current_time: currentTimeString, // 현재 시간을 템플릿으로 전달
                        reservations: [],
                        match_idx: matchIdx // match_idx 추가
                    });
                }
            });
        });
    });
});



router.post('/reserv', (req, res) => {
    const { court_idx, reserv_dt, reserv_tm, match_idx } = req.body;
    const user_id = req.session.idName;
    const created_at = new Date();
    let reserv_st_tm = Array.isArray(reserv_tm) ? reserv_tm[0] : reserv_tm;
    let reserv_ed_tm = Array.isArray(reserv_tm) ? reserv_tm[reserv_tm.length - 1] : reserv_tm;
    const finalMatchIdx = match_idx || null; // 빈 문자열이 아닌 null로 설정

    const sql = 'INSERT INTO reservation_info (user_id, court_idx, reserv_dt, created_at, reserv_st_tm, reserv_ed_tm, match_idx) VALUES (?, ?, ?, ?, ?, ?, ?)';

    if (reserv_ed_tm > reserv_st_tm) {
        conn.query(sql, [user_id, court_idx, reserv_dt, created_at, reserv_st_tm, reserv_ed_tm, finalMatchIdx], (err, rows) => {
            if (err) {
                console.error('Error inserting reservation: ' + err);
                res.send('<script>alert("예약에 실패했습니다."); window.location.href="/reserv/reservAll";</script>');
                return;
            }

            console.log('reservation 완료', rows);
            res.send('<script>alert("예약 성공!!"); window.location.href="/user/match";</script>');
        });
    } else {
        res.send('<script>alert("예약시작시간보다 종료시간이 더 빠릅니다"); window.location.href="/reserv/reservAll";</script>');
    }
});


module.exports = router;
