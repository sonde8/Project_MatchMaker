const express = require('express')
const router = express.Router()
const conn = require('../config/DB');
const path = require('path');
const fs = require('fs');


// 메인 페이지
router.get('/', (req, res) => {

    if (req.session.idName) {
        console.log(`ID : ${req.session.idName}`);
        res.render('main1', { idName: req.session.idName });
    } else {
        res.render('main1');
    };
});


router.get('/main_login', (req, res) => {

    if (req.session.idName) {
        console.log(`ID : ${req.session.idName}`);
        res.render('main_login', { idName: req.session.idName });
    } else {
        res.render('main_login');
    };
});

// 사장님 로그인 후
router.get('/boss_main', (req, res) => {

    res.render('boss_main');
});

// 일반 회원 회원가입 페이지
router.get('/join1', (req, res) => {
    res.render('join1');
});


// 풋살장 구장주 회원가입 페이지
router.get('/boss_join1', (req, res) => {
    res.render('boss_join1')
})

router.get("/join_select1", (req, res) => {
    res.render("join_select1");
});

// 구장 등록 페이지
router.get("/field_join", (req, res) => {
    res.render("field_join");
});


// 로그인 페이지 열어주기
router.get("/login1", (req, res) => {
    res.render("login1");
});


// 풋살장 구장주의 마이페이지
router.get("/boss_myPage1", (req, res) => {
    console.log(req.session.idName);
    let id = req.session.idName;

    
    let sql1 = 'SELECT * FROM boss_info WHERE boss_id = ?;'
    let sql2 = 'SELECT * FROM field_info WHERE boss_id = ?;'
    let sql3 = 'SELECT * FROM court_info WHERE field_idx = (SELECT field_idx FROM field_info WHERE boss_id = ?);'
    conn.query(sql1, [id], (err1, bossInfoRows) => {
        console.log("bossInfoRows", bossInfoRows);
        conn.query(sql2, [id], (err2, fieldInfoRows) => {
            conn.query(sql3, [id], (err3, courtInfoRows) => {
                console.log(courtInfoRows.length);
                res.render("boss_myPage1", { 
                    idName: req.session.idName,
                    bossInfo: bossInfoRows,
                    fieldInfo: fieldInfoRows,
                    courtInfo: courtInfoRows,
                    courtcount: courtInfoRows.length
                });
            });

        });
        
    });
    
});


// 밸런스 매칭 기능 페이지 열어주기
router.get("/bal_rate_tmmatch", (req, res) => {
    res.render("bal_rate_tmmatch");
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 매치 페이지 
router.get("/match", (req, res) => {
    res.render("match", { idName: req.session.idName, rate: req.session.rate });
});

// 방 만들기 페이지
router.get("/create_match", (req, res) => {
    res.render("create_match", { idName: req.session.idName });
});


// buffer를 Base64 URL로 바꾸는 함수
function bufferToBase64Url(buffer) {
    if (!buffer) {
        return null;
    }

    const base64 = buffer.toString('base64');
    return `data:image/png;base64,${base64}`;
};

// 매칭방 입장 페이지
router.get('/match_room/:match_idx', (req, res) => {
    const match_idx = req.params.match_idx;
    console.log(`match_idx : ${match_idx}`);

    let sql = "SELECT * FROM match_info1 WHERE match_idx = ?";
    conn.query(sql, [match_idx], (err, result) => {
        if (err) {
            console.error(err);
            return res.send("매치 정보를 가져오는 중 오류가 발생했습니다.");
        }

        if (result.length === 0) {
            return res.status(404).send("매칭 정보를 찾을 수 없습니다.");
        }

        let match = result[0];
        let join_users = match.join_user ? match.join_user.split(",").map(user => user.trim()).filter(user => user) : [];
        console.log("join_users", join_users);

        if (join_users.length > 0) {
            let placeholders = join_users.map(() => '?').join(',');
            let user_sql = `SELECT user_id, user_nick, user_rate, user_rank, user_photo FROM user_info WHERE user_id IN (${placeholders})`;

            conn.query(user_sql, join_users, (err, users) => {
                if (err) {
                    console.error(err);
                    return res.send("사용자 정보를 가져오는 중 오류가 발생했습니다.");
                }
                let user_nick = {};
                let user_rate = {};
                let user_rank = {};
                let user_photo = {};

                users.forEach(user => {
                    user_nick[user.user_id] = user.user_nick;
                    user_rate[user.user_id] = user.user_rate;
                    user_rank[user.user_id] = user.user_rank;
                    user_photo[user.user_id] = bufferToBase64Url(user.user_photo); // user_photo를 Base64 URL로 바꾸는 작업
                });

                const teamLeader = join_users[0]; // 방장 아이디 값 저장
                console.log("teamLeader", teamLeader);

                // 점수 매치 체크 및 랭크 비교
                if (match.rate_match_yn === 'Y') {
                    // 먼저 user_rank[teamLeader]가 정의되어 있는지 확인
                    if (req.session.rank.split(',')[0] !== user_rank[teamLeader].split(',')[0]) {
                        console.log("user_rank[teamLeader].split(',')[0]", user_rank[teamLeader].split(',')[0]);
                        res.send("<script>alert('이 방에는 접속하실 수 없습니다.'); window.location.href='/user/match';</script>");
                        return;
                    } else if (!user_rank[teamLeader]) {
                        // user_rank[teamLeader]가 undefined인 경우 오류를 로그로 출력
                        console.error('Error: user_rank[teamLeader] is undefined');
                        res.send("<script>alert('팀 리더 정보가 없습니다.'); window.location.href='/user/match';</script>");
                        return;
                    }
                }
                console.log("user_photo", user_photo);
                console.log("user_nick", user_nick);
                res.render('match_room', {
                    match: match,
                    idName: req.session.idName,
                    join_users: join_users,
                    user_nick: user_nick,
                    user_rate: user_rate,
                    user_rank: user_rank,
                    user_photo: user_photo,
                    teamLeader: teamLeader,
                    match_idx: match_idx // match_idx 값을 렌더링에 포함
                });
            });
        } else {
            res.render('match_room', {
                match: match,
                idName: req.session.idName,
                join_users: [],
                user_info: {},
                match_idx: match_idx // match_idx 값을 렌더링에 포함
            });
        }
    });
});



// 채팅 가져오기
router.get('/getMessages', (req, res) => {
    const match_idx = req.query.match_idx;

    const messageSql = "SELECT * FROM messages WHERE match_idx = ?";
    
    conn.query(messageSql, [match_idx], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("채팅 내용을 가져오는 중 오류가 발생했습니다.");
        }
        
        // 결과를 JSON 형식으로 클라이언트에 응답
        res.json(results);
    });
});

//채팅정보 저장 라우터~~~~
router.post('/match_room/:match_idx', (req, res) => {
    const { match_idx,timestamp, message} = req.body;
    const nick = req.session.nick;
    
  

    console.log(`match_idx : ${match_idx}, timestamp: ${timestamp}, message: ${message}, nick: ${nick}`);

    const sql = "INSERT INTO messages (match_idx, timestamp, nick, message) VALUES (?, ?, ?, ?)";

    conn.query(sql, [match_idx, timestamp, nick, message], (err, result) => {
        if (err) {
            console.error('Error inserting message into database:', err);
            return res.status(500).send("채팅 메시지를 저장하는 중 오류가 발생했습니다.");
        }

        res.status(200).send("Message saved successfully");
    });
});


module.exports = router;