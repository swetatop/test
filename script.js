const API_URL = '/api/reviews';

let currentRating = 0;

// Звездочки
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
    span.addEventListener('click', () => {
        updateStars(parseInt(span.dataset.value));
    });
    span.addEventListener('mouseenter', () => {
        const val = parseInt(span.dataset.value);
        starContainer.querySelectorAll('span').forEach((s, i) => {
            if (i < val) s.style.color = '#ffcc00';
            else s.style.color = '#555';
        });
    });
    span.addEventListener('mouseleave', () => {
        starContainer.querySelectorAll('span').forEach(s => s.style.color = '');
        updateStars(currentRating);
    });
});
updateStars(0);

// Загрузка отзывов
async function loadReviews() {
    try {
        const res = await fetch(API_URL);
        const reviews = await res.json();
        const container = document.getElementById('reviewsList');
        
        if (!reviews.length) {
            container.innerHTML = '<p>😐 Поки що немає відгуків. Стань першим!</p>';
            return;
        }
        
        container.innerHTML = reviews.map(r => `
            <div class="review-item">
                <div class="review-header">
                    <span class="review-author">👤 ${escapeHtml(r.nickname)}</span>
                    <span class="review-moder">🛡️ ${escapeHtml(r.moderName)}</span>
                    <span class="review-rating">⭐ ${r.rating}/5</span>
                </div>
                ${r.comment ? `<div class="review-comment">💬 ${escapeHtml(r.comment)}</div>` : ''}
                <div class="review-date">📅 ${new Date(r.createdAt).toLocaleString()}</div>
            </div>
        `).join('');
    } catch (err) {
        console.error(err);
        document.getElementById('reviewsList').innerHTML = '<p>❌ Не вдалося завантажити відгуки</p>';
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Отправка формы
document.getElementById('ratingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nickname = document.getElementById('nickname').value.trim();
    const moderName = document.getElementById('moderName').value;
    const rating = currentRating;
    const comment = document.getElementById('comment').value.trim();
    const msgDiv = document.getElementById('formMessage');
    
    if (!nickname) {
        msgDiv.innerHTML = '<div class="message error">Введіть нікнейм!</div>';
        return;
    }
    if (!moderName) {
        msgDiv.innerHTML = '<div class="message error">Виберіть модера!</div>';
        return;
    }
    if (rating === 0) {
        msgDiv.innerHTML = '<div class="message error">Поставте оцінку (зірки)!</div>';
        return;
    }
    
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nickname, moderName, rating, comment })
        });
        const data = await res.json();
        if (res.ok) {
            msgDiv.innerHTML = '<div class="message success">✅ Дякуємо! Ваш відгук додано.</div>';
            document.getElementById('ratingForm').reset();
            updateStars(0);
            loadReviews();
            setTimeout(() => msgDiv.innerHTML = '', 3000);
        } else {
            msgDiv.innerHTML = `<div class="message error">❌ Помилка: ${data.error || 'спробуйте пізніше'}</div>`;
        }
    } catch (err) {
        msgDiv.innerHTML = '<div class="message error">❌ Помилка сервера</div>';
    }
});

loadReviews();
