const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('.')); // отдаём html/css/js

const RATINGS_FILE = path.join(__dirname, 'ratings.json');

// Загружаем или создаём файл
function loadRatings() {
    if (!fs.existsSync(RATINGS_FILE)) {
        fs.writeFileSync(RATINGS_FILE, JSON.stringify([], null, 2));
        return [];
    }
    const data = fs.readFileSync(RATINGS_FILE);
    return JSON.parse(data);
}

function saveRatings(ratings) {
    fs.writeFileSync(RATINGS_FILE, JSON.stringify(ratings, null, 2));
}

// GET /api/reviews
app.get('/api/reviews', (req, res) => {
    const ratings = loadRatings();
    // последние 50, сортируем новые сверху
    const lastReviews = ratings.slice(-50).reverse();
    res.json(lastReviews);
});

// POST /api/reviews
app.post('/api/reviews', (req, res) => {
    const { nickname, moderName, rating, comment } = req.body;
    
    if (!nickname || !moderName || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Некоректні дані' });
    }
    
    const ratings = loadRatings();
    const newReview = {
        id: Date.now(),
        nickname: nickname.slice(0, 30),
        moderName,
        rating: Number(rating),
        comment: comment ? comment.slice(0, 300) : '',
        createdAt: new Date().toISOString()
    };
    ratings.push(newReview);
    saveRatings(ratings);
    
    res.status(201).json({ success: true, review: newReview });
});

app.listen(PORT, () => {
    console.log(`✅ Сервер запущено: http://localhost:${PORT}`);
});
