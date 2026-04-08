const API_URL = '/api/reviews';
let currentRating = 0;
let currentModer = '';

// Тема
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
    const body = document.body;
    const current = body.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);
    themeToggle.textContent = newTheme === 'dark' ? '🌙' : '☀️';
});

// Выбор модера
document.querySelectorAll('.moder-card').forEach(card => {
    card.addEventListener('click', () => {
        document.querySelectorAll('.moder-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        currentModer = card.dataset.moder;
        document.getElementById('selectedModer').value = currentModer;
    });
});

// Звезды
const starContainer = document.getElementById('starRating');
const ratingInput = document.getElementById('ratingValue');

function updateStars(rating) {
    const stars = starContainer.children;
    for (let i = 0; i < stars.length; i++) {
        if (i < rating) stars[i].classList.add('star-active');
        else stars[i].classList.remove('star-active');
    }
    ratingInput.value = rating;
    currentRating = rating;
}

starContainer.innerHTML = '★★★★★'.split('').map((star, idx) => 
    `<span data-value="${idx+1}">${star}</span>`
).join('');

starContainer.querySelectorAll('span').forEach(span => {
    span.addEventListener('click', () => updateStars(parseInt(span.dataset.value)));
});
updateStars(0);

// Капча
let captchaAnswer = 0;
function generateCaptcha() {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    document.getElementById('captchaQuestion').innerHTML = `${a} + ${b} = ?`;
    captchaAnswer = a + b;
}
generateCaptcha();

// Загрузка отзывов и рейтинга
async function loadReviews() {
    try {
        const res = await fetch(API_URL);
        const reviews = await res.json();
        
        // Рейтинг модеров
        const stats = {};
        reviews.forEach(r => {
            if (!stats[r.moderName]) stats[r.moderName] = { sum: 0, count: 0 };
            stats[r.moderName].sum += r.rating;
            stats[r.moderName].count++;
        });
        
        const statsDiv = document.getElementById('moderStats');
        if (Object.keys(stats).length === 0) {
            statsDiv.innerHTML = '<p>Поки немає оцінок</p>';
        } else {
            statsDiv.innerHTML = Object.entries(stats).map(([name, data]) => `
                <div class="stat-item">
                    <strong>${name}</strong><br>
                    ⭐ ${(data.sum / data.count).toFixed(1)} (${data.count} відгуків)
                </div>
            `).join('');
        }
        
        // Список отзывов
        const container = document.getElementById('reviewsList');
        if (!reviews.length) {
            container.innerHTML = '<p>😐 Поки що немає відгуків</p>';
            return;
        }
        
        container.innerHTML = reviews.slice(-30).reverse().map(r => `
            <div class="review-item" data-id="${r.id}">
                <div class="review-header">
                    <span>👤 ${escapeHtml(r.nickname)}</span>
                    <span>🛡️ ${escapeHtml(r.moderName)}</span>
                    <span>⭐ ${r.rating}/5</span>
                    <button class="complaint-btn" data-id="${r.id}">🚨</button>
                </div>
                ${r.comment ? `<div>💬 ${escapeHtml(r.comment)}</div>` : ''}
                <div style="font-size:12px; color:gray;">📅 ${new Date(r.createdAt).toLocaleString()}</div>
            </div>
        `).join('');
        
        // Жалобы
        document.querySelectorAll('.complaint-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = btn.dataset.id;
                await fetch('/api/complaint', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reviewId: parseInt(id) })
                });
                alert('🚨 Скаргу відправлено адміністратору');
            });
        });
    } catch (err) {
        console.error(err);
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

// Отправка формы
document.getElementById('ratingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nickname = document.getElementById('nickname').value.trim();
    const rating = currentRating;
    const comment = document.getElementById('comment').value.trim();
    const captcha = parseInt(document.getElementById('captchaAnswer').value);
    const msgDiv = document.getElementById('formMessage');
    const btn = document.getElementById('submitBtn');
    const spinner = btn.querySelector('.spinner');
    const btnText = btn.querySelector('span');
    
    if (!nickname) return msgDiv.innerHTML = '<div class="message error">Введи нікнейм!</div>';
    if (!currentModer) return msgDiv.innerHTML = '<div class="message error">Виберіть модератора!</div>';
    if (rating === 0) return msgDiv.innerHTML = '<div class="message error">Постав оцінку!</div>';
    if (captcha !== captchaAnswer) return msgDiv.innerHTML = '<div class="message error">Невірна капча!</div>';
    
    spinner.classList.remove('hidden');
    btnText.classList.add('hidden');
    
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nickname, moderName: currentModer, rating, comment })
        });
        const data = await res.json();
        if (res.ok) {
            msgDiv.innerHTML = '<div class="message success">✅ Дякуємо! Відгук додано 🎉</div>';
            document.getElementById('ratingForm').reset();
            updateStars(0);
            document.querySelectorAll('.moder-card').forEach(c => c.classList.remove('selected'));
            currentModer = '';
            generateCaptcha();
            loadReviews();
            setTimeout(() => msgDiv.innerHTML = '', 3000);
        } else {
            msgDiv.innerHTML = `<div class="message error">❌ ${data.error}</div>`;
        }
    } catch (err) {
        msgDiv.innerHTML = '<div class="message error">❌ Помилка сервера</div>';
    } finally {
        spinner.classList.add('hidden');
        btnText.classList.remove('hidden');
    }
});

loadReviews();
setInterval(loadReviews, 30000);
