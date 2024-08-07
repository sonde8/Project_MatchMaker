const express = require('express');
const router = express.Router();
const conn = require('../config/DB');

// 예약관리 페이지 
router.get('/manage_reserv', (req, res) => {
    let boss_id = req.session.idName;
    let field_idx = req.session.fieldIdx;
    console.log("field_idx", field_idx);

    // Step 1: Get court indexes and names
    const sql1 = "SELECT court_idx, court_name FROM court_info WHERE field_idx = ?";
    conn.query(sql1, [field_idx], (err, courts) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Database query error");
        }

        if (courts.length > 0) {
            const court_idxs = courts.map(court => court.court_idx);
            const court_names = courts.map(court => court.court_name);
            console.log("court_idxs : ", court_idxs);
            console.log("court_names : ", court_names);

            // Step 2: Get reservation info and related match and team data
            const sql2 = `
                SELECT r.reserv_idx, r.user_id, r.reserv_dt, r.reserv_st_tm, r.reserv_ed_tm,
                    c.court_name, 
                    m.match_title,
                    t.teamA_user1, t.teamA_user2, t.teamA_user3, t.teamA_user4, t.teamA_user5,
                    t.teamB_user1, t.teamB_user2, t.teamB_user3, t.teamB_user4, t.teamB_user5
                FROM reservation_info r
                LEFT JOIN match_info1 m ON r.match_idx = m.match_idx
                LEFT JOIN team_info1 t ON r.match_idx = t.match_idx
                LEFT JOIN court_info c ON r.court_idx = c.court_idx
                WHERE r.court_idx IN (?)`;

            conn.query(sql2, [court_idxs], (err, reservations) => {
                console.log("reservations", reservations);
                if (err) {
                    console.error(err);
                    return res.status(500).send("Database query error");
                }
                console.log("reservations", reservations);

                // Step 3: Render the page with fetched data
                res.render('manage_reserv', {
                    idName: req.session.idName,
                    boss_id: boss_id,
                    court_names: court_names,
                    court_idxs: court_idxs,
                    reservations: reservations
                });
            });
        } else {
            res.render('manage_reserv', { boss_id: boss_id, court_names: [], court_idxs: [], reservations: [] });
        }
    });
});


// 예약 내역에서 경기 종료후 사장님이 경기결과를 설정하는 페이지
router.get('/result_set/:reserv_idx', (req, res) => {
    const reserv_idx = req.params.reserv_idx;

    const sql = `
        SELECT r.reserv_idx, r.user_id, r.reserv_dt, r.reserv_st_tm, r.reserv_ed_tm,
            c.court_name, 
            m.match_title, m.rate_match_yn, m.result_btn, m.match_idx,
            t.teamA_user1, t.teamA_user2, t.teamA_user3, t.teamA_user4, t.teamA_user5,
            t.teamB_user1, t.teamB_user2, t.teamB_user3, t.teamB_user4, t.teamB_user5
        FROM reservation_info r
        LEFT JOIN match_info1 m ON r.match_idx = m.match_idx
        LEFT JOIN team_info1 t ON r.match_idx = t.match_idx
        LEFT JOIN court_info c ON r.court_idx = c.court_idx
        WHERE r.reserv_idx = ?`;
    const sql2 = 'SELECT * FROM user_info WHERE user_id IN (?)';


    conn.query(sql, [reserv_idx], (err, reservation) => {
        console.log("reservation", reservation);

        if (err) {
            console.error(err);
            return res.status(500).send("Database query error");
        }

        if (reservation.length > 0) {

            const userList = [
                reservation[0].teamA_user1,
                reservation[0].teamA_user2,
                reservation[0].teamA_user3,
                reservation[0].teamA_user4,
                reservation[0].teamA_user5,
                reservation[0].teamB_user1,
                reservation[0].teamB_user2,
                reservation[0].teamB_user3,
                reservation[0].teamB_user4,
                reservation[0].teamB_user5
            ];

            // sql2 쿼리 수정
            const sql2 = `SELECT * FROM user_info WHERE user_id IN (?)`;

            // userList 배열을 쿼리에 전달
            conn.query(sql2, [userList], (err2, users) => {
                if (err2) {
                    console.error(err2);
                    return res.status(500).send("Database query error");
                }

                // user_id와 user_rate를 매칭하여 team_user, user_rate 형식으로 출력
                const teamAUsers = [];
                const teamBUsers = [];

                // user_id와 user_rate를 매칭하여 team_user, user_rate 형식으로 저장
                reservation.forEach(reserve => {
                    for (let i = 1; i <= 5; i++) {
                        const teamA_user = reserve[`teamA_user${i}`];
                        const teamB_user = reserve[`teamB_user${i}`];

                        const userA = users.find(user => user.user_id === teamA_user);
                        const userB = users.find(user => user.user_id === teamB_user);

                        if (userA) {
                            const userDataA = {
                                [`TeamA_user${i}`]: {
                                    user_id: userA.user_id,
                                    user_rate: userA.user_rate
                                }
                            };
                            teamAUsers.push(userDataA);
                        } else {
                            const userDataA = {
                                [`TeamA_user${i}`]: {
                                    user_id: 'User not found',
                                    user_rate: 'User not found'
                                }
                            };
                            teamAUsers.push(userDataA);
                        }

                        if (userB) {
                            const userDataB = {
                                [`TeamB_user${i}`]: {
                                    user_id: userB.user_id,
                                    user_rate: userB.user_rate
                                }
                            };
                            teamBUsers.push(userDataB);
                        } else {
                            const userDataB = {
                                [`TeamB_user${i}`]: {
                                    user_id: 'User not found',
                                    user_rate: 'User not found'
                                }
                            };
                            teamBUsers.push(userDataB);
                        }
                    }
                });


                const teamAUser1Rate = teamAUsers[0].TeamA_user1.user_rate
                const teamAUser2Rate = teamAUsers[1].TeamA_user2.user_rate
                const teamAUser3Rate = teamAUsers[2].TeamA_user3.user_rate
                const teamAUser4Rate = teamAUsers[3].TeamA_user4.user_rate
                const teamAUser5Rate = teamAUsers[4].TeamA_user5.user_rate
                const teamBUser1Rate = teamBUsers[0].TeamB_user1.user_rate
                const teamBUser2Rate = teamBUsers[1].TeamB_user2.user_rate
                const teamBUser3Rate = teamBUsers[2].TeamB_user3.user_rate
                const teamBUser4Rate = teamBUsers[3].TeamB_user4.user_rate
                const teamBUser5Rate = teamBUsers[4].TeamB_user5.user_rate
                const reservation_idx = reservation[0].reserv_idx

                const teamAavgRate = (teamAUsers[0].TeamA_user1.user_rate + teamAUsers[1].TeamA_user2.user_rate + teamAUsers[2].TeamA_user3.user_rate + teamAUsers[3].TeamA_user4.user_rate + teamAUsers[4].TeamA_user5.user_rate) / 5
                const teamBavgRate = (teamBUsers[0].TeamB_user1.user_rate + teamBUsers[1].TeamB_user2.user_rate + teamBUsers[2].TeamB_user3.user_rate + teamBUsers[3].TeamB_user4.user_rate + teamBUsers[4].TeamB_user5.user_rate) / 5

                res.render('result_set', {
                    idName: req.session.idName,
                    reservation: reservation[0],
                    users: users,  // 결과를 템플릿에 전달
                    teamAUsers: teamAUsers,
                    teamBUsers: teamBUsers,
                    teamAUser1Rate: teamAUser1Rate,
                    teamAUser2Rate: teamAUser2Rate,
                    teamAUser3Rate: teamAUser3Rate,
                    teamAUser4Rate: teamAUser4Rate,
                    teamAUser5Rate: teamAUser5Rate,
                    teamBUser1Rate: teamBUser1Rate,
                    teamBUser2Rate: teamBUser2Rate,
                    teamBUser3Rate: teamBUser3Rate,
                    teamBUser4Rate: teamBUser4Rate,
                    teamBUser5Rate: teamBUser5Rate,
                    teamAavgRate: teamAavgRate,
                    teamBavgRate: teamBavgRate,
                    reservation_idx: reservation_idx
                });
            });

        } else {
            res.status(404).send("Reservation not found");
        }
    });

});

// 경기결과를 설정하기 위한 기능 라우터
router.post('/set_winner', (req, res) => {
    const { winner, reserv_idx } = req.body;
    console.log(req.body);

    // 예제 쿼리: 승자 정보를 reservation_info 테이블에 업데이트 (실제 데이터베이스 구조에 따라 변경 필요)
    const sql = `UPDATE reservation_info SET winner = ? WHERE reserv_idx = ?`;
    conn.query(sql, [winner, reserv_idx], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Database query error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }
        res.json({ success: true });
    });
});

// 예약관리 라우터
router.post('/reserv', (req, res) => {
    const user_id = req.session.idName;
    const sql = "SELECT f.boss_id, c.court_name, c.court_idx FROM court_info c JOIN field_info f ON f.field_idx = c.field_idx";

    conn.query(sql, (err, results) => {
        if (err) {
            console.error("500 에러 ~", err);
            return res.status(500).send("Database query error");
        }

        if (results.length === 0) {
            return res.status(404).send("No results found");
        }

        const boss_id = results[0].boss_id;
        const court_name = results[0].court_name;
        const court_idx = results[0].court_idx;

        console.log("Boss ID:", boss_id); // Log boss ID
        console.log("Session ID:", req.session.idName); // Log session ID

        const sql2 = "SELECT * FROM reservation_info WHERE court_idx = ?";
        conn.query(sql2, [court_idx], (err, reservationResults) => {
            if (err) {
                console.error("500 에러 ~", err);
                return res.status(500).send("Database query error");
            }

            res.render("manage_resrv", { boss_id, court_name, court_idx, reservations: reservationResults, idName: req.session.idName });
        });
    });
});


// 예약 취소 라우터 
router.post('/cancel_reservation', (req, res) => {
    console.log("req.body", req.body);
    const reserv_idx = req.body.reserv_idx;
    console.log("reserv_idx : ", reserv_idx);

    const sql = "DELETE FROM reservation_info WHERE reserv_idx = ?";
    conn.query(sql, [reserv_idx], (err, results) => {
        if (err) {
            console.error("500 에러 ~", err);
            return res.status(500).send("삭제 실패");
        } else {
            console.log("삭제 성공");
            res.redirect('manage_reserv');
        }
    });
});

// 레이트 부여 라우터
router.post('/update_ratings', async (req, res) => {
    console.log("req.body", req.body);

    let update_rank = "";

    const updateUserInfo = [
        { id: req.body.teamA_user1, user_rate: req.body.new_rateA[0] },
        { id: req.body.teamA_user2, user_rate: req.body.new_rateA[1] },
        { id: req.body.teamA_user3, user_rate: req.body.new_rateA[2] },
        { id: req.body.teamA_user4, user_rate: req.body.new_rateA[3] },
        { id: req.body.teamA_user5, user_rate: req.body.new_rateA[4] },
        { id: req.body.teamB_user1, user_rate: req.body.new_rateB[0] },
        { id: req.body.teamB_user2, user_rate: req.body.new_rateB[1] },
        { id: req.body.teamB_user3, user_rate: req.body.new_rateB[2] },
        { id: req.body.teamB_user4, user_rate: req.body.new_rateB[3] },
        { id: req.body.teamB_user5, user_rate: req.body.new_rateB[4] }
    ];

    console.log("updateUserInfo", updateUserInfo);
    console.log("user_rate[0]", updateUserInfo[0].user_rate);
    console.log("updateUserInfo의 길이", updateUserInfo.length);
    console.log("updateUserInfo[0]", updateUserInfo[0]);

    const sql = 'UPDATE user_info SET user_rate = ?, user_rank = ? WHERE user_id = ?';
    const sql2 = 'UPDATE match_info1 SET team_a = "W", team_b = "L", result_btn = "Y" WHERE match_idx = (SELECT match_idx FROM reservation_info WHERE reserv_idx = ?)';
    const sql3 = 'UPDATE match_info1 SET team_a = "L", team_b = "W", result_btn = "Y" WHERE match_idx = (SELECT match_idx FROM reservation_info WHERE reserv_idx = ?)';
    // sql4 는 삭제해도 가능할 듯 (테이블 값들 다 삭제한 후에)
    const sql4 = 'UPDATE match_info1 SET result_btn = "Y" WHERE match_idx = (SELECT match_idx FROM reservation_info WHERE reserv_idx = ?)';

    try {
        // 각 사용자 레이트 업데이트
        for (const user of updateUserInfo) {
            if (user.user_rate >= 1760) {
                update_rank = '1부리그, 1군';
            } else if (user.user_rate >= 1730) {
                update_rank = '1부리그, 2군';
            } else if (user.user_rate >= 1700) {
                update_rank = '1부리그, 3군';
            } else if (user.user_rate >= 1660) {
                update_rank = '2부리그, 1군';
            } else if (user.user_rate >= 1630) {
                update_rank = '2부리그, 2군';
            } else if (user.user_rate >= 1600) {
                update_rank = '2부리그, 3군';
            } else if (user.user_rate >= 1560) {
                update_rank = '3부리그, 1군';
            } else if (user.user_rate >= 1530) {
                update_rank = '3부리그, 2군';
            } else if (user.user_rate >= 1500) {
                update_rank = '3부리그, 3군';
            } else if (user.user_rate >= 1460) {
                update_rank = '4부리그, 1군';
            } else if (user.user_rate >= 1430) {
                update_rank = '4부리그, 2군';
            } else if (user.user_rate >= 1400) {
                update_rank = '4부리그, 3군';
            } else if (user.user_rate >= 1360) {
                update_rank = '5부리그, 1군';
            } else if (user.user_rate >= 1330) {
                update_rank = '5부리그, 2군';
            } else {
                update_rank = '5부리그, 3군';
            }

            await new Promise((resolve, reject) => {
                conn.query(sql, [user.user_rate, update_rank, user.id], (err, results) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        }

        // 매치 결과 업데이트
        if (req.body.exist_rateA[0] < req.body.new_rateA[0] && req.body.rate_match_yn == null) {
            await new Promise((resolve, reject) => {
                conn.query(sql2, [req.body.reservation_idx], (err, rows) => {
                    console.log("rows", rows);
                    if (err) return reject(err);
                    resolve();
                });
            });
            res.status(200).send('<script>alert("레이트 업데이트 성공! A팀 승리!"); window.history.go(-1);</script>');
        } else if (req.body.exist_rateA[0] > req.body.new_rateA[0] && req.body.rate_match_yn == null) {
            await new Promise((resolve, reject) => {
                conn.query(sql3, [req.body.reservation_idx], (err, rows) => {
                    console.log("rows", rows);
                    if (err) return reject(err);
                    resolve();
                });
            });
            res.status(200).send('<script>alert("레이트 업데이트 성공! B팀 승리!"); window.history.go(-1);</script>');
        } else {
            await new Promise((resolve, reject) => {
                conn.query(sql4, [req.body.reservation_idx], (err, rows) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
            res.status(200).send('<script>alert("이미 점수부여가 됬을걸요"); window.history.go(-1);</script>');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('<script>alert("승리한 팀을 선택해주세요."); window.history.go(-1);</script>');
    }
});

module.exports = router;
