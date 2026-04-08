const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('.'));

const RATINGS_FILE = path.join(__dirname, 'ratings.json');

function loadRatings() {
    if (!fs.existsSync(RATINGS_FILE)) return [];
    return JSON.parse(fs.readFileSync(RATINGS_FILE));
}

function saveRatings(ratings) {
    fs.writeFileSync(RATINGS_FILE, JSON.stringify(ratings, null, 2));
}

app.get('/api/reviews', (req, res) => {
    res.json(loadRatings());
});

app.post('/api/reviews', (req, res) => {
    const { nickname, moderName, rating, comment } = req.body;
    if (!nickname || !moderName || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Невірні дані' });
    }
    const ratings = loadRatings();
    const newReview = {
        id: Date.now(),
        nickname: nickname.slice(0, 30),
        moderName,
        rating: Number(rating),
        comment: (comment || '').slice(0, 300),
        createdAt: new Date().toISOString(),
        complaints: 0
    };
    ratings.push(newReview);
    saveRatings(ratings);
    res.status(201).json({ success: true });
});

app.post('/api/complaint', (req, res) => {
    const { reviewId } = req.body;
    let ratings = loadRatings();
    const review = ratings.find(r => r.id === reviewId);
    if (review) {
        review.complaints = (review.complaints || 0) + 1;
        saveRatings(ratings);
    }
    res.json({ success: true });
});

// Админка: удалить отзыв
app.post('/api/admin/delete', (req, res) => {
    const { password, reviewId } = req.body;
    if (password !== 'admin123') return res.status(403).json({ error: 'Невірний пароль' });
    let ratings = loadRatings();
    ratings = ratings.filter(r => r.id !== reviewId);
    saveRatings(ratings);
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`✅ Сервер: http://localhost:${PORT}`);
});
