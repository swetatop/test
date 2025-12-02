// Головний JavaScript файл
document.addEventListener('DOMContentLoaded', function() {
    // Імітація завантаження
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
    }, 1500);
    
    // Обробка форми входу
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            // Тимчасово - просто перехід
            showNotification('Вхід виконано успішно!', 'success');
            
            // Тут буде запит до сервера
            console.log('Логін:', { email, password });
        });
    }
    
    // Обробка форми реєстрації
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const firstName = document.getElementById('regFirstName').value;
            const lastName = document.getElementById('regLastName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;
            
            // Валідація
            if (password !== confirmPassword) {
                showNotification('Паролі не співпадають!', 'error');
                return;
            }
            
            if (!document.querySelector('input[name="agreeTerms"]').checked) {
                showNotification('Потрібно погодитись з умовами!', 'error');
                return;
            }
            
            showNotification('Реєстрація успішна! Перевірте вашу пошту.', 'success');
            
            // Тут буде запит до сервера
            console.log('Реєстрація:', { firstName, lastName, email, password });
        });
    }
    
    // Функція сповіщень
    function showNotification(message, type = 'info') {
        // Створюємо сповіщення
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <strong>${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</strong>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Показуємо
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Ховаємо через 5 секунд
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 400);
        }, 5000);
    }
    
    // Ефекти при наведенні на поля вводу
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });
    
    // Забуття пароля
    const forgotPassword = document.querySelector('.forgot-password');
    if (forgotPassword) {
        forgotPassword.addEventListener('click', function(e) {
            e.preventDefault();
            const email = prompt('Введіть вашу електронну пошту для відновлення пароля:');
            if (email) {
                showNotification('Лист для відновлення пароля відправлено на ' + email, 'info');
            }
        });
    }
});