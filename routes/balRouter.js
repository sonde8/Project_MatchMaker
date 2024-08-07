const express = require('express');
const router = express.Router();
const conn = require('../config/DB');

// 점수 배열을 입력받아 5명의 팀을 구성하는 모든 조합을 반환
function getCombinations(arr, size) {
    if (size > arr.length) return [];
    if (size === arr.length) return [arr];
    if (size === 1) return arr.map(el => [el]);

    const combinations = [];
    arr.forEach((el, idx) => {
        const smallerCombinations = getCombinations(arr.slice(idx + 1), size - 1);
        smallerCombinations.forEach(comb => {
            combinations.push([el, ...comb]);
        });
    });

    return combinations;
}

// 주어진 팀을 제외한 나머지 팀 반환
function getRemainingTeam(fullTeam, selectedTeam) {
    return fullTeam.filter(player => !selectedTeam.includes(player));
}

// 평균 계산 함수
function calculateAverage(arr) {
    const sum = arr.reduce((acc, val) => acc + val, 0);
    return sum / arr.length;
}

// 점수 배열을 기반으로 최적의 팀 구성 반환
function findBestTeams(scores) {
    const players = Array.from({ length: scores.length }, (_, i) => i);
    const allCombinations = getCombinations(players, 5);

    let bestTeams = null;
    let smallestDifference = Infinity;

    allCombinations.forEach(teamA => {
        const teamB = getRemainingTeam(players, teamA);
        const avgA = calculateAverage(teamA.map(player => scores[player]));
        const avgB = calculateAverage(teamB.map(player => scores[player]));
        const difference = Math.abs(avgA - avgB);

        if (difference < smallestDifference) {
            smallestDifference = difference;
            bestTeams = { teamA, teamB, avgA, avgB };
            console.log("bestTeams", bestTeams);
        }
    });

return bestTeams;
}


// 참가자들 정보를 받아와 팀구성 기능
router.post("/tmmatch", (req, res) => {
    console.log("req.body", req.body);
    const join_users = req.body.user_id;
    const match_idx = req.body.match_idx;
    const user_rates = req.body.user_rate;
    const balanceMatched = req.body.balanceMatched;
    console.log("user_rates", user_rates);

    // join_users는 배열 형식으로 user_id가 전달될 것으로 가정합니다.
    const user_ids = Array.isArray(join_users) ? join_users : [join_users];  
    console.log("user_ids", user_ids);


    // user_info 테이블에서 user_id에 대한 user_rate를 SELECT
    const sql = 'SELECT user_id, user_rate FROM user_info WHERE user_id IN (?)';
    conn.query(sql, [user_ids], (err, results) => {
        if (err) {
            console.error('SQL 오류:', err);
            return res.send('<script>alert("다시 시도해 주세요"); window.location.href="/create_match";</script>');
        }

        if (results.length !== 10) {
            return res.send('<script>alert("참가자 수가 10명이 아닙니다."); window.history.back();</script>');
        }


        const user_ids = results.map(result => result.user_id);
        const scores = results.map(result => result.user_rate);

        const userInfo = {};
        results.forEach(result => {
            userInfo[result.user_id] = result.user_rate;
        });

        // 최적의 팀을 구성
        const bestTeams = findBestTeams(scores);
        if (!bestTeams || !bestTeams.teamA.length || !bestTeams.teamB.length) {
            return res.send(`<script>alert('팀 구성이 불가합니다.'); window.history.back();</script>`);
        }

        const teamA = bestTeams.teamA.map(index => ({ user_id: user_ids[index], user_rate: userInfo[user_ids[index]] }));
        const teamB = bestTeams.teamB.map(index => ({ user_id: user_ids[index], user_rate: userInfo[user_ids[index]] }));

        // 팀 평균 계산
        const avgTeamA = calculateAverage(teamA.map(player => player.user_rate));
        const avgTeamB = calculateAverage(teamB.map(player => player.user_rate));

        // 팀 정보를 HTML로 렌더링하기 위해 필요한 데이터를 전송
        res.render('match_room', {
            match: req.body,  // 기존 매칭 정보
            join_users: join_users,
            user_info: userInfo,
            teamA: teamA,
            teamB: teamB,
            avgTeamA: avgTeamA,
            avgTeamB: avgTeamB,
            idName: req.session.idName,
            balanceMatched:balanceMatched,
            match_idx:match_idx
        });
    });
});

module.exports = router;
