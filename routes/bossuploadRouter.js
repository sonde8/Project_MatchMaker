const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const conn = require('../config/DB')

const router = express.Router();


const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/upload', upload.single('img'), (req, res) => {
    const bossId = req.session.idName;
    const imageBuffer = req.file.buffer;
    

    if (!bossId) {
        return res.status(400).json({ error: 'Boss ID is required' });
    }

    conn.query('UPDATE boss_info SET boss_photo = ? WHERE boss_id = ?', [imageBuffer, bossId], (error) => {
        if (error) throw error;
        res.json({ message: 'Profile image uploaded successfully' });
    });
});

router.get('/profile-image/:bossId', (req, res) => {
    const bossId = req.params.bossId;

    if (!bossId) {
        return res.status(400).json({ error: 'Boss ID is required' });
    }

    conn.query('SELECT boss_photo FROM boss_info WHERE boss_id = ?', [bossId], (error, results) => {
        if (error) throw error;

        const imageBuffer = results[0]?.boss_photo;
        if (imageBuffer) {
            res.writeHead(200, {
                'Content-Type': 'image/jpeg',
                'Content-Length': imageBuffer.length
            });
            res.end(imageBuffer);
        } else {
            res.status(404).json({ error: 'Profile image not found' });
        }
    });
});

module.exports = router;
