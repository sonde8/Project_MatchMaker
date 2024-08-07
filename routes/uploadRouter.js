const express = require('express');
const multer = require('multer');
const path = require('path');
const conn = require('../config/DB');
const router = express.Router();

// 이미지 파일을 업로드 하기 위한 multer미들웨어
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 이하만 가능
});

router.post('/upload', upload.single('img'), (req, res) => {
    const userId = req.session.idName;
    const imageBuffer = req.file.buffer;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    // DB에 이미지 buffer 저장
    conn.query('UPDATE user_info SET user_photo = ? WHERE user_id = ?', [imageBuffer, userId], (error) => {
        if (error) {
            console.error('Error updating profile image:', error);
            return res.status(500).json({ error: 'Failed to update profile image' });
        }
        res.json({ message: '프로필 사진 설정이 완료되었습니다!' });
    });
});

router.get('/profile-image/:userId', (req, res) => {
    const userId = req.params.userId;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    conn.query('SELECT user_photo FROM user_info WHERE user_id = ?', [userId], (error, results) => {
        if (error) {
            console.error('Error retrieving profile image:', error);
            return res.status(500).json({ error: 'Failed to retrieve profile image' });
        }

        if (results.length === 0 || !results[0].user_photo) {
            return res.status(404).json({ error: 'Profile image not found' });
        }

        const imageBuffer = results[0].user_photo;
        res.writeHead(200, {
            'Content-Type': 'image/jpeg', // 이미지 타입에 따른 코드조정
            'Content-Length': imageBuffer.length,
        });
        res.end(imageBuffer);
    });
});

module.exports = router;
