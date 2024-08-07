const express = require('express')
const router = express.Router()
const conn = require('../config/DB')
const md5 = require('md5');





// 풋살을 하기 위한 회원들의 회원가입
router.post('/join1', (req, res) => {
    console.log('join 실행', req.body);

    let { user_id, user_pw, user_nick, user_birthdate, user_gender, user_phone } = req.body;

    let hashedPw = md5(user_pw);

    // 새로 가입한 유저의 기본 값들 정의
    let user_rate = 1500
    let user_rank = '3부리그, 3군'
    let user_shooting_point = 0
    let user_pass_point = 0
    let user_dribble_point = 0
    let user_stamina_point = 0
    let user_manner_point = 0
    let user_smile_point = 0
    let joined_at = new Date()

    let sql = `INSERT INTO user_info (
        user_id, user_pw, user_nick, user_birthdate, user_gender, user_phone, 
        user_rate, user_rank, user_shooting_point, user_pass_point, user_dribble_point, 
        user_stamina_point, user_manner_point, user_smile_point, joined_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

    conn.query(sql, [
        user_id, hashedPw, user_nick, user_birthdate, user_gender, user_phone,
        user_rate, user_rank, user_shooting_point, user_pass_point, user_dribble_point,
        user_stamina_point, user_manner_point, user_smile_point, joined_at
    ], (err, rows) => {
        console.log("rows", rows);
        if (err) {
            console.error('Database insert error:', err);
            res.send("<script>alert('다시 시도해주세요.'); window.history.back();</script>");
        } else {
            console.log('insert 완료', rows);
            req.session.idName = user_id
            req.session.nick = user_nick
            req.session.rate = user_rate
            req.session.rank = user_rank
            res.redirect("/main_login");
        }
    })
})

// 풋살장 사장님 회원가입
router.post("/boss_join", (req, res) => {
    console.log("풋살장 관리자 회원가입", req.body);

    const { id, pw, confirm_pw, name, phone } = req.body;

    // 비밀번호와 비밀번호 확인이 일치하는지 확인
    if (pw !== confirm_pw) {
        res.send("<script>alert('비밀번호가 일치하지 않습니다.'); window.location.href='/boss_join1';</script>");
        return;
    }

    const hashedPw = md5(pw);

    const sql = "INSERT INTO boss_info (boss_id, boss_pw, boss_name, boss_phone) VALUES (?, ?, ?, ?)";
    conn.query(sql, [id, hashedPw, name, phone], (err, rows) => {
        if (err) {
            console.error('Error inserting into boss_info:', err);
            res.send("<script>alert('회원가입에 실패했습니다. 다시 시도해 주십시오.'); window.location.href='/boss_join1';</script>");
            return;
        }

        console.log('Insert 완료', rows);

        if (rows.affectedRows > 0) {
            req.session.idName = id;
            res.redirect('/field_join');
        } else {
            res.send("<script>alert('다시 시도해 주십시오.'); window.location.href='/boss_join1';</script>");
        }
    });
});

// 구장 정보 등록 router -> 코트 정보도 같이 입력됨
router.post("/field_join", (req, res) => {
    console.log("구장 정보 등록", req.body);
    let { field_name, field_addr, field_detail, court_count, main_region, sub_region, field_oper_st_time, field_oper_ed_time } = req.body;
    let region = `${main_region}, ${sub_region}`;
    let boss_id = req.session.idName;

    if (!boss_id) {
        return res.status(400).send('로그인이 필요합니다.');
    }

    // field_info 테이블에 데이터 삽입
    let sql = `INSERT INTO field_info (field_name, field_addr, field_detail, boss_id, field_region, field_oper_st_time, field_oper_ed_time) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    let fieldData = [field_name, field_addr, field_detail, boss_id, region, field_oper_st_time, field_oper_ed_time];

    conn.query(sql, fieldData, (err, result) => {
        if (err) {
            console.error('쿼리 실행 오류:', err);
            return res.status(500).send('서버 오류');
        }

        console.log('insert 완료', result);

        // 삽입된 field_info의 field_idx 값 가져오기
        let field_idx = result.insertId;
        req.session.field_idx = field_idx;

        // court_info 테이블에 데이터 삽입
        let courtSql = `INSERT INTO court_info (field_idx, court_name) VALUES (?, ?)`;

        // 가지고 있는 코트 개수만큼 반복
        let courtInserts = [];
        for (let i = 1; i <= court_count; i++) {
            let courtName = `코트${i}`;
            courtInserts.push(new Promise((resolve, reject) => {
                conn.query(courtSql, [field_idx, courtName], (err, result) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(result);
                });
            }));
        }

        // 모든 court_info 삽입이 완료될 때까지 기다림
        Promise.all(courtInserts)
            .then(results => {
                console.log('모든 코트 정보 삽입 완료', results);
                res.redirect('/boss_main');
            })
            .catch(err => {
                console.error('코트 정보 삽입 오류:', err);
                res.status(500).send('서버 오류');
            });
    });
});



// 로그인 기능 router
router.post("/login", (req, res) => {
    console.log("login", req.body);
    let { id, pw } = req.body;

    let hashedPw = md5(pw);

    let userOrboss = Object.keys(req.body)[0];

    if (userOrboss === "user") {
        let sql = 'SELECT user_id, user_nick, user_rate, user_rank FROM user_info WHERE user_id = ? AND user_pw = ?';
        conn.query(sql, [id, hashedPw], (err, rows) => {
            console.log("rows", rows);
            if (rows.length > 0) {
                req.session.idName = id;
                req.session.nick = rows[0].user_nick;
                req.session.rate = rows[0].user_rate;
                req.session.rank = rows[0].user_rank;
                console.log(req.session.idName);
                res.redirect('/main_login');
            } else {
                res.send("<script>alert('아이디 혹은 비밀번호를 잘못 입력하셨습니다.'); window.location.href='/login1';</script>")
            }
        });
    } else {
        let sql1 = 'SELECT boss_id, boss_name FROM boss_info WHERE boss_id = ? AND boss_pw = ?';

        conn.query(sql1, [id, hashedPw], (err, rows) => {

            if (err) {
                console.log(err)
            }
            console.log("rows", rows);

            let boss_id = req.body.id;
            let sql2 = "SELECT field_idx FROM field_info WHERE boss_id = ?";
            conn.query(sql2, boss_id, (err, rows) => {
                if (rows.length > 0) {  // 로그인 성공
                    req.session.idName = id;
                    req.session.fieldIdx = rows[0].field_idx;
                    console.log(req.session.idName);
                    res.redirect('/boss_main');
                } else {
                    res.send("<script>alert('아이디 혹은 비밀번호를 잘못 입력하셨습니다.'); window.location.href='/login1';</script>")
                }
            });
        });
    }

});

// 로그아웃 기능 router
router.get("/logout", (req, res) => {
    console.log("로그아웃");
    req.session.destroy();
    res.send('<script>window.location.href="/"</script>');
});

// 일반회원 마이페이지 기능 router
router.get("/myPage", (req, res) => {
    console.log(req.session.idName);
    let id = req.session.idName;

    const currentDate = new Date();
    const currentDateString = currentDate.toISOString().split('T')[0];
    const currentTimeString = currentDate.toTimeString().split(' ')[0].substring(0, 5);


    let sql1 = 'SELECT * FROM user_info WHERE user_id = ?;'
    let sql2 = `
        SELECT *
        FROM match_info1
        WHERE match_idx IN (
            SELECT match_idx
            FROM team_info1
            WHERE teamA_user1 = ?
                OR teamA_user2 = ?
                OR teamA_user3 = ?
                OR teamA_user4 = ?
                OR teamA_user5 = ?
                OR teamB_user1 = ?
                OR teamB_user2 = ?
                OR teamB_user3 = ?
                OR teamB_user4 = ?
                OR teamB_user5 = ?);`
    let sql3 = `
        SELECT * 
        FROM team_info1 
        WHERE teamA_user1 = ?
            OR teamA_user2 = ?
            OR teamA_user3 = ?
            OR teamA_user4 = ?
            OR teamA_user5 = ?
            OR teamB_user1 = ?
            OR teamB_user2 = ?
            OR teamB_user3 = ?
            OR teamB_user4 = ?
            OR teamB_user5 = ?;`

    // 첫 번째 쿼리 실행
    conn.query(sql1, [id], (err1, userInfoRows) => {
        if (err1) {
            console.error('첫 번째 쿼리 실행 오류: ', err1);
            return res.status(500).send('서버 오류');
        }

        // 두 번째 쿼리 실행
        conn.query(sql2, [id, id, id, id, id, id, id, id, id, id], (err2, matchInfoRows) => {
            if (err2) {
                console.error('두 번째 쿼리 실행 오류: ', err2);
                return res.status(500).send('서버 오류');
            }


            // 각 경기 정보에 대해 시간 비교 수행
            const matchInfoWithTimestamps = matchInfoRows.map(match => {
                const matchDateTime = new Date(`${match.match_date}T${match.match_ed_dt}`);
                match.matchTimestamp = matchDateTime.getTime();
                match.isMatchEnded = currentDate.getTime() > match.matchTimestamp;
                return match;
            });
            
            // 세 번째 쿼리 실행
            conn.query(sql3, [id, id, id, id, id, id, id, id, id, id], (err3, teamInfoRows) => {
                console.log("matchInfo", matchInfoWithTimestamps);

                // 네 번째 쿼리 실행
                let sql4 = `
                SELECT r.reserv_idx, r.user_id, r.reserv_dt, r.reserv_st_tm, r.reserv_ed_tm, r.match_idx,
                    c.court_name, 
                    f.field_name
                FROM reservation_info r
                LEFT JOIN court_info c ON r.court_idx = c.court_idx
                LEFT JOIN field_info f ON c.field_idx = f.field_idx
                LEFT JOIN team_info1 t ON r.match_idx = t.match_idx
                WHERE ? IN (t.teamA_user1, t.teamA_user2, t.teamA_user3, t.teamA_user4, t.teamA_user5, 
                            t.teamB_user1, t.teamB_user2, t.teamB_user3, t.teamB_user4, t.teamB_user5);`;

                conn.query(sql4, [id], (err4, reservInfoRows) => {
                    if (err4) {
                        console.error('네 번째 쿼리 실행 오류: ', err4);
                        return res.status(500).send('서버 오류');
                    }
                    console.log("reservInfoRows", reservInfoRows);

                    // 네 쿼리 결과를 한 번에 렌더링
                    res.render("myPage", {
                        userInfo: userInfoRows,
                        matchInfo: matchInfoWithTimestamps,
                        currentTimestamp: currentDate.getTime(),
                        currentDateString: currentDateString,
                        currentTimeString: currentTimeString,
                        matchInfoRows: matchInfoRows,
                        teamInfoRows: teamInfoRows,
                        id: id,
                        userInfoRowsProfile: userInfoRows.user_photo,
                        reservInfoRows:reservInfoRows
                    });
                });
            });
        });
    });
});

// 일반회원 정보수정 기능 router
router.post("/update", (req, res) => {
    console.log("update", req.body);
    console.log(req.session.idName);

    let { nick, phone } = req.body;
    let sql = 'UPDATE user_info SET user_nick = ?, user_phone = ? WHERE user_id = ?';
    conn.query(sql, [nick, phone, req.session.idName], (err, rows) => {
        console.log("rows", rows);
        if (rows.affectedRows > 0) {
            res.redirect('/user/myPage');
        } else {
            res.send(`
                <script>
                    alert('다시 한번 시도해주세요.')
                    window.location.href="/update"
                </script>
            `);
        }
    });
});


// 풋살장 관리자의 마이페이지에서 boss_info 테이블 업데이트 기능 router
router.post("/boss_info_update", (req, res) => {
    console.log("boss_info_update", req.body);
    let id = req.session.idName;
    let { name, pw, phone } = req.body;
    let hashedPw = md5(pw);
    let sql = 'UPDATE boss_info SET boss_pw = ?, boss_name = ?, boss_phone = ? WHERE boss_id = ?';
    conn.query(sql, [hashedPw, name, phone, id], (err, rows) => {
        console.log("rows", rows);
        if (rows.affectedRows > 0) {
            res.redirect('/boss_myPage1');
        } else {
            res.send(`
                <script>
                    alert('다시 한번 시도해주세요.')
                    window.location.href="/boss_myPage1"
                </script>
            `);
        }
    });
});


// 풋살장 관리자의 마이페이지에서 field_info 테이블 업데이트 기능 router
router.post("/field_info_update", (req, res) => {
    console.log("field_info_update", req.body);

    let { field_name, field_addr, field_detail } = req.body;
    let boss_id = req.session.idName;

    let sql = 'UPDATE field_info SET field_name = ?, field_addr = ?, field_detail = ? WHERE boss_id = ?';
    conn.query(sql, [field_name, field_addr, field_detail, boss_id], (err, rows) => {
        console.log("rows", rows);
        if (rows.affectedRows > 0) {
            res.redirect('/boss_myPage1');
        } else {
            res.send(`
                <script>
                    alert('다시 한번 시도해주세요.')
                    window.location.href="/boss_myPage1"
                </script>
            `);
        }
    });
});


// 풋살장 관리자의 마이페이지에서 court_info 테이블 업데이트 기능 router
router.post("/court_info_update", (req, res) => {
    console.log("court_info_update, ", `req.body: ${req.body}`);

    let { court_count } = req.body;
    court_count = parseInt(court_count, 10);  // 입력된 코트 수를 정수로 변환
    let boss_id = req.session.idName;

    if (!boss_id) {
        return res.status(400).send('로그인이 필요합니다.');
    }

    // field_info 테이블에서 현재 로그인 되어있는 boss_id를 통해 field_idx 가져오기
    let sql = `SELECT field_idx FROM field_info WHERE boss_id = ?`;
    conn.query(sql, [boss_id], (err, result) => {
        if (err) {
            console.error('쿼리 실행 오류:', err);
            return res.status(500).send('서버 오류');
        }

        if (result.length === 0) {
            return res.status(404).send('구장 정보를 찾을 수 없습니다.');
        }

        let field_idx = result[0].field_idx;

        // 현재 코트 수 가져오기
        let currentCourtSql = `SELECT court_idx FROM court_info WHERE field_idx = ? ORDER BY court_idx`;
        conn.query(currentCourtSql, [field_idx], (err, result) => {
            if (err) {
                console.error('쿼리 실행 오류:', err);
                return res.status(500).send('서버 오류');
            }

            let currentCourtCount = result.length;

            if (court_count > currentCourtCount) {
                // 코트 수가 더 많아진 경우 - 코트 추가
                let insertCourtSql = `INSERT INTO court_info (field_idx, court_name) VALUES (?, ?)`;
                let courtInserts = [];
                for (let i = currentCourtCount + 1; i <= court_count; i++) {
                    let courtName = `코트${i}`;
                    courtInserts.push(new Promise((resolve, reject) => {
                        conn.query(insertCourtSql, [field_idx, courtName], (err, result) => {
                            if (err) {
                                return reject(err);
                            }
                            resolve(result);
                        });
                    }));
                }
                Promise.all(courtInserts)
                    .then(results => {
                        console.log('코트 추가 완료', results);
                        res.redirect('/boss_myPage1');
                    })
                    .catch(err => {
                        console.error('코트 추가 오류:', err);
                        res.status(500).send('서버 오류');
                    });
            } else if (court_count < currentCourtCount) {
                // 코트 수가 더 적어진 경우 - 코트 삭제
                let deleteCourtSql = `DELETE FROM court_info WHERE court_idx >= ? AND field_idx = ?`;
                let deleteIndex = result[court_count].court_idx;  // 남길 코트의 마지막 court_idx

                conn.query(deleteCourtSql, [deleteIndex, field_idx], (err, result) => {
                    if (err) {
                        console.error('쿼리 실행 오류:', err);
                        return res.status(500).send('서버 오류');
                    }
                    console.log('코트 삭제 완료', result);
                    res.redirect('/boss_myPage1');
                });
            } else {
                // 코트 수가 같은 경우 - 아무 것도 하지 않음
                res.redirect('/boss_myPage1');
            }
        });
    });
});


// 매치에서 방 만들기 했을 때 match_info 테이블에 정보를 insert 기능하는 router
router.post("/create_match", (req, res) => {
    console.log("match_info테이블", req.body);
    let { match_title, female_match_yn, rate_match_yn, main_region, sub_region, match_date, selected_times, match_info } = req.body;

    let boss_id = req.session.idName;
    let join_user = boss_id;
    let created_at = new Date();
    let match_region = `${main_region}, ${sub_region}`;

    // selected_times 처리
    let times = selected_times.split(',');
    let match_st_dt = times[0];
    let match_ed_dt = times[times.length - 1];
    console.log(`match_st_dt: ${match_st_dt}, match_ed_dt: ${match_ed_dt}`);

    female_match_yn = req.body.female_match_yn === "on" ? 'Y' : 'N';
    rate_match_yn = req.body.rate_match_yn === "on" ? 'Y' : 'N';
    let result_btn = 'N';

    let sql = "insert into match_info1 (match_title, join_user, match_region, match_date, match_st_dt, match_ed_dt, female_match_yn, rate_match_yn, created_at, match_info, result_btn) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    conn.query(sql, [match_title, join_user, match_region, match_date, match_st_dt, match_ed_dt, female_match_yn, rate_match_yn, created_at, match_info, result_btn], (err, rows) => {
        if (err) {
            console.error('Insert error:', err);
            res.status(500).send(`<script>alert('오류가 발생했습니다. 다시 시도해 주세요.'); window.location.href="/create_match";</script>`);
            return;
        }
        console.log('insert 완료:', rows);
        if (rows.affectedRows > 0) {
            res.redirect('/user/match');
        } else {
            res.send(`<script>alert('다시 시도해 주세요.'); window.location.href="/create_match";</script>`);
        }
    });
});

// 매치 페이지에서 방 리스트를 보여주는 라우터
router.get("/match", (req, res) => {
    console.log("req.query.page", req.query.page);
    let page = parseInt(req.query.page) || 1;  // 쿼리 파라미터에서 페이지 번호 읽기
    const itemsPerPage = 10;
    const offset = (page - 1) * itemsPerPage;

    console.log(`현재 페이지: ${page}, 가져올 방 리스트 수: ${itemsPerPage}, 조회할 데이터의 시작 위치: ${offset}`);

    let sqlCount = `
    SELECT COUNT(*) as totalCount
    FROM match_info1
    `;

    let sqlData = `
    SELECT m.match_idx, m.match_title, m.match_region, m.match_date, m.match_st_dt, m.match_ed_dt, 
           m.female_match_yn, m.rate_match_yn, m.match_info, m.join_user,
           u.user_rank as team_leader_rank
    FROM match_info1 m
    LEFT JOIN user_info u ON u.user_id = SUBSTRING_INDEX(m.join_user, ',', 1)
    LIMIT ? OFFSET ?
    `;

    conn.query(sqlCount, (err, countResults) => {
        if (err) {
            console.error('데이터 조회 오류:', err);
            res.send(`<script>alert("데이터를 가져오는 중 오류가 발생했습니다."); window.history.go(-1);</script>`);
        } else {
            const totalCount = countResults[0].totalCount;
            const totalPages = Math.ceil(totalCount / itemsPerPage);

            conn.query(sqlData, [itemsPerPage, offset], (err, results) => {
                if (err) {
                    console.error('데이터 조회 오류:', err);
                    res.send(`<script>alert("데이터를 가져오는 중 오류가 발생했습니다."); window.history.go(-1);</script>`);
                } else {
                    console.log('쿼리 결과:', results);
                    res.render("match", {
                        matches: results,
                        idName: req.session.idName,
                        rate: req.session.rate,
                        rank: req.session.rank,
                        currentPage: page,
                        totalPages: totalPages
                    });
                }
            });
        }
    });
});



// 경기참가 버튼 클릭 시 호출되는 라우터
router.post("/join_game", (req, res) => {
    const newUserId = req.session.idName;
    const match_idx = req.body.match_idx; // match_idx 값 가져오기
    console.log(req.session.idName, "id값"); // 새로운 사용자의 user_id
    console.log(req.body.match_idx, "match_idx값"); // 새로운 사용자의 user_id

    let sql = "SELECT join_user FROM match_info1 WHERE match_idx = ?";



    conn.query(sql, [match_idx], (err, results) => {
        let currentJoinUser = results[0].join_user || "";
        let currentJoinUsers = currentJoinUser.split(",").map(user => user.trim()); // 현재 join_user 컬럼
        if (currentJoinUsers.includes(newUserId)) {
            res.send(`<script>alert('어머 이미 가입 되셨네용 ~');
                window.history.back();</script>`);
        } else {
            currentJoinUsers.push(newUserId); // 새로운 사용자 추가
            let join_user = currentJoinUsers.join(", "); // 배열을 문자열로 변환

            sql = "UPDATE match_info1 SET join_user = ? WHERE match_idx = ?";
            conn.query(sql, [join_user, match_idx], (err, results) => {
                if (err) {
                    console.error('데이터 업데이트 오류:', err);
                    res.send("데이터를 업데이트하는 중 오류가 발생했습니다.");
                } else {
                    res.send(`<script>alert('경기 참가 완료!');
                window.location.href="/match_room/${match_idx}";</script>`);
                }
            });
        }
    });
});

// 경기탈퇴 버튼 클릭 시 호출되는 라우터
router.post("/cancel_game", (req, res) => {
    const cancelUserId = req.session.idName;
    const match_idx = req.body.match_idx;

    console.log(req.session.idName, "id값");
    console.log(req.body.match_idx, "match_idx값");

    let sql = "SELECT join_user FROM match_info1 WHERE match_idx = ?";
    conn.query(sql, [match_idx], (err, results) => {
        if (err) {
            console.error('데이터베이스 조회 오류:', err);
            return res.send(`<script>alert("데이터를 조회하는 중 오류가 발생했습니다."); window.history.go(-1);</script>`);
        }

        let currentJoinUser = results[0].join_user || "";
        let currentJoinUsers = currentJoinUser.split(",").map(user => user.trim());

        const index = currentJoinUsers.indexOf(cancelUserId);
        if (index === -1) {
            return res.send(`<script>alert("탈퇴할 사용자를 찾을 수 없습니다."); window.history.go(-1);</script>`);
        }

        // 탈퇴 여부 확인을 위한 페이지를 반환
        res.send(`
            <form id="confirmForm" action="/user/confirm_cancel_game" method="post">
                <input type="hidden" name="match_idx" value="${match_idx}" />
                <input type="hidden" name="user_id" value="${cancelUserId}" />
                <script>
                    if (confirm('정말 탈퇴하시겠습니까?')) {
                        document.getElementById('confirmForm').submit();
                    } else {
                        window.history.back();
                    }
                </script>
            </form>
        `);
    });
});

// 탈퇴 확정 처리를 위한 라우터
router.post("/confirm_cancel_game", (req, res) => {
    const cancelUserId = req.body.user_id;
    const match_idx = req.body.match_idx;
    console.log('탈퇴회원: ', cancelUserId);
    let sql = "SELECT join_user FROM match_info1 WHERE match_idx = ?";
    conn.query(sql, [match_idx], (err, results) => {
        if (err) {
            console.error('데이터베이스 조회 오류:', err);
            return res.send(`<script>alert("데이터를 조회하는 중 오류가 발생했습니다."); window.history.go(-1);</script>`);
        }

        let currentJoinUser = results[0].join_user || "";
        let currentJoinUsers = currentJoinUser.split(",").map(user => user.trim());

        const index = currentJoinUsers.indexOf(cancelUserId);
        if (index === -1) {
            return res.send(`<script>alert("탈퇴할 사용자를 찾을 수 없습니다."); window.history.go(-1);</script>`);
        }

        currentJoinUsers.splice(index, 1);
        let join_user = currentJoinUsers.join(", ");

        sql = "UPDATE match_info1 SET join_user = ? WHERE match_idx = ?";
        conn.query(sql, [join_user, match_idx], (err, results) => {
            if (err) {
                console.error('데이터 업데이트 오류:', err);
                return res.send(`<script>alert("데이터를 업데이트하는 중 오류가 발생했습니다."); window.history.go(-1);</script>`);
            }
            res.send(`<script>alert("탈퇴가 완료되었습니다."); window.history.go(-1);</script>`);
        });
    });
});



// 팀 확정 후, 테이블 저장 라우터
router.post("/team", (req, res) => {
    console.log("team", req.body);

    const match_idx = parseInt(req.body.match_idx);
    const teamA_user1 = req.body.teamA_user1;
    const teamA_user2 = req.body.teamA_user2;
    const teamA_user3 = req.body.teamA_user3;
    const teamA_user4 = req.body.teamA_user4;
    const teamA_user5 = req.body.teamA_user5;
    const teamB_user1 = req.body.teamB_user1;
    const teamB_user2 = req.body.teamB_user2;
    const teamB_user3 = req.body.teamB_user3;
    const teamB_user4 = req.body.teamB_user4;
    const teamB_user5 = req.body.teamB_user5;
    const created_at = new Date();



    // match_idx가 존재하지 않으면 INSERT 쿼리 실행

    let sql = 'INSERT INTO team_info1 (teamA_user1, teamA_user2, teamA_user3, teamA_user4, teamA_user5, teamB_user1, teamB_user2, teamB_user3, teamB_user4, teamB_user5, match_idx, created_at) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

    // team_info 테이블에 삽입
    conn.query(sql, [teamA_user1, teamA_user2, teamA_user3, teamA_user4, teamA_user5, teamB_user1, teamB_user2, teamB_user3, teamB_user4, teamB_user5, match_idx, created_at], (err, rows) => {

        if (err) {
            console.error('SQL 오류:', err);
            return res.send(`<script>alert("이미 팀이 구성되었습니다. 구장예약을 해주세요"); window.history.go(-1);</script>`);
        }

        console.log("team rows", rows);
        res.send(`<script>alert("밸런스 매칭 완료! 구장예약을 해주세요"); window.history.go(-1);</script>`);
    });
});


module.exports = router;