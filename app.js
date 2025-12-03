// Основний файл додатка
class TestingApp {
    constructor() {
        this.initElements();
        this.initFirebase();
        this.bindEvents();
        this.currentTest = null;
        this.testQuestions = [];
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.testTimer = null;
        this.timeLeft = 0;
    }

    initElements() {
        // Сторінки
        this.pages = {
            main: document.getElementById('mainPage'),
            dashboard: document.getElementById('dashboard'),
            test: document.getElementById('testPage'),
            results: document.getElementById('resultsPage'),
            admin: document.getElementById('adminPage')
        };

        // Головна сторінка
        this.loginBtn = document.getElementById('loginBtn');
        this.registerBtn = document.getElementById('registerBtn');
        this.backFromLogin = document.getElementById('backFromLogin');
        this.backFromRegister = document.getElementById('backFromRegister');
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        this.buttonsContainer = document.querySelector('.buttons-container');
        this.loginFormElement = document.getElementById('loginFormElement');
        this.registerFormElement = document.getElementById('registerFormElement');

        // Кабінет
        this.userName = document.getElementById('userName');
        this.userEmail = document.getElementById('userEmail');
        this.testsPassed = document.getElementById('testsPassed');
        this.lastTestDate = document.getElementById('lastTestDate');
        this.adminPanelBtn = document.getElementById('adminPanelBtn');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.testsList = document.getElementById('testsList');
        this.resultsList = document.getElementById('resultsList');

        // Тест
        this.testTitle = document.getElementById('testTitle');
        this.timer = document.getElementById('timer');
        this.questionCounter = document.getElementById('questionCounter');
        this.progressPercent = document.getElementById('progressPercent');
        this.progressFill = document.getElementById('progressFill');
        this.questionNumber = document.getElementById('questionNumber');
        this.questionText = document.getElementById('questionText');
        this.answersContainer = document.getElementById('answersContainer');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.finishBtn = document.getElementById('finishBtn');
        this.backFromTest = document.getElementById('backFromTest');

        // Результати
        this.detailTestName = document.getElementById('detailTestName');
        this.detailDate = document.getElementById('detailDate');
        this.detailTime = document.getElementById('detailTime');
        this.newTestBtn = document.getElementById('newTestBtn');
        this.toDashboardBtn = document.getElementById('toDashboardBtn');
    }

    initFirebase() {
        // Слухаємо зміни стану авторизації
        firebaseService.onAuthStateChanged((user) => {
            if (user) {
                // Користувач увійшов
                this.showDashboard();
                this.loadUserData();
                this.loadTests();
                this.loadUserResults();
                
                // Перевіряємо чи адмін
                if (ADMIN_EMAILS.includes(user.email)) {
                    this.adminPanelBtn.style.display = 'flex';
                }
            } else {
                // Користувач вийшов
                this.showPage('main');
                this.adminPanelBtn.style.display = 'none';
            }
        });

        // Слухаємо зміни тестів
        firebaseService.onTestsChanged((tests) => {
            this.displayTests(tests);
        });

        // Слухаємо зміни результатів
        firebaseService.onResultsChanged((results) => {
            this.displayUserResults(results.filter(r => r.userId === firebaseService.currentUser?.uid));
        });
    }

    bindEvents() {
        // Головна сторінка
        this.loginBtn.addEventListener('click', () => this.showLoginForm());
        this.registerBtn.addEventListener('click', () => this.showRegisterForm());
        this.backFromLogin.addEventListener('click', () => this.showMainPage());
        this.backFromRegister.addEventListener('click', () => this.showMainPage());
        this.loginFormElement.addEventListener('submit', (e) => this.handleLogin(e));
        this.registerFormElement.addEventListener('submit', (e) => this.handleRegister(e));

        // Кабінет
        this.logoutBtn.addEventListener('click', () => this.handleLogout());
        this.adminPanelBtn.addEventListener('click', () => this.showAdminPage());

        // Тест
        this.prevBtn.addEventListener('click', () => this.prevQuestion());
        this.nextBtn.addEventListener('click', () => this.nextQuestion());
        this.finishBtn.addEventListener('click', () => this.finishTest());
        this.backFromTest.addEventListener('click', () => this.backToDashboardFromTest());

        // Результати
        this.newTestBtn.addEventListener('click', () => this.showDashboard());
        this.toDashboardBtn.addEventListener('click', () => this.showDashboard());
    }

    // ===== УПРАВЛІННЯ СТОРІНКАМИ =====
    showPage(pageName) {
        Object.values(this.pages).forEach(page => page.classList.remove('active'));
        this.pages[pageName]?.classList.add('active');
    }

    showMainPage() {
        this.showPage('main');
        this.buttonsContainer.style.display = 'flex';
        this.loginForm.style.display = 'none';
        this.registerForm.style.display = 'none';
    }

    showLoginForm() {
        this.buttonsContainer.style.display = 'none';
        this.loginForm.style.display = 'block';
    }

    showRegisterForm() {
        this.buttonsContainer.style.display = 'none';
        this.registerForm.style.display = 'block';
    }

    showDashboard() {
        this.showPage('dashboard');
        this.loadUserData();
        this.loadTests();
        this.loadUserResults();
    }

    showAdminPage() {
        this.showPage('admin');
        // Ініціалізація адмін-панелі буде в admin.js
        if (typeof initAdminPanel === 'function') {
            initAdminPanel();
        }
    }

    // ===== АВТОРИЗАЦІЯ =====
    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (!email || !password) {
            alert('Заповніть всі поля!');
            return;
        }

        const result = await firebaseService.login(email, password);
        if (result.success) {
            alert('Успішний вхід!');
            this.loginFormElement.reset();
        } else {
            alert('Помилка входу: ' + result.error);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            alert('Заповніть всі поля!');
            return;
        }

        if (password !== confirmPassword) {
            alert('Паролі не співпадають!');
            return;
        }

        const result = await firebaseService.register(email, password, { firstName, lastName });
        if (result.success) {
            alert('Реєстрація успішна!');
            this.registerFormElement.reset();
        } else {
            alert('Помилка реєстрації: ' + result.error);
        }
    }

    async handleLogout() {
        await firebaseService.logout();
        alert('Ви вийшли з системи.');
    }

    // ===== ЗАВАНТАЖЕННЯ ДАНИХ =====
    async loadUserData() {
        const user = firebaseService.currentUser;
        if (!user) return;

        this.userName.textContent = `${user.firstName} ${user.lastName}`;
        this.userEmail.textContent = user.email;

        // Завантажуємо статистику
        const results = await firebaseService.getUserResults();
        this.testsPassed.textContent = results.length;
        if (results.length > 0) {
            const lastResult = results[0];
            const date = new Date(lastResult.completedAt);
            this.lastTestDate.textContent = date.toLocaleDateString('uk-UA');
        } else {
            this.lastTestDate.textContent = '-';
        }
    }

    async loadTests() {
        const tests = await firebaseService.getTests();
        this.displayTests(tests);
    }

    displayTests(tests) {
        this.testsList.innerHTML = '';

        if (tests.length === 0) {
            this.testsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book-open"></i>
                    <p>Поки що немає доступних тестів</p>
                </div>
            `;
            return;
        }

        tests.forEach(test => {
            const testCard = document.createElement('div');
            testCard.className = 'test-card';
            testCard.innerHTML = `
                <div class="test-card-title">${test.name}</div>
                <div class="test-card-description">${test.description || 'Без опису'}</div>
                <div class="test-card-meta">
                    <span><i class="fas fa-clock"></i> ${test.time} хв</span>
                    <span><i class="fas fa-question-circle"></i> ${test.questionsCount || '?'} питань</span>
                </div>
                <button class="test-card-btn" onclick="app.startTest('${test.id}')">
                    <i class="fas fa-play"></i> Пройти тест
                </button>
            `;
            this.testsList.appendChild(testCard);
        });
    }

    async loadUserResults() {
        const results = await firebaseService.getUserResults();
        this.displayUserResults(results);
    }

    displayUserResults(results) {
        this.resultsList.innerHTML = '';

        if (results.length === 0) {
            this.resultsList.innerHTML = `
                <div class="empty-row">
                    <i class="fas fa-inbox"></i>
                    <p>У вас ще немає результатів</p>
                </div>
            `;
            return;
        }

        results.forEach(result => {
            const statusClass = {
                waiting: 'status-waiting',
                passed: 'status-passed',
                failed: 'status-failed'
            }[result.status] || 'status-waiting';

            const statusText = {
                waiting: 'ОЧІКУЄ',
                passed: 'ПРОЙШОВ',
                failed: 'НЕ ПРОЙШОВ'
            }[result.status] || 'ОЧІКУЄ';

            const timeSpent = Math.floor(result.timeSpent / 60) + ':' + (result.timeSpent % 60).toString().padStart(2, '0');
            const date = new Date(result.completedAt).toLocaleDateString();

            const row = document.createElement('div');
            row.className = 'result-row';
            row.innerHTML = `
                <div>${result.testName}</div>
                <div>${date}</div>
                <div>${timeSpent}</div>
                <div class="${statusClass}">${statusText}</div>
            `;
            this.resultsList.appendChild(row);
        });
    }

    // ===== СИСТЕМА ТЕСТУВАННЯ =====
    async startTest(testId) {
        try {
            // Завантажуємо тест
            const tests = await firebaseService.getTests();
            this.currentTest = tests.find(t => t.id === testId);
            
            if (!this.currentTest) {
                alert('Тест не знайдено!');
                return;
            }

            // Завантажуємо питання
            this.testQuestions = await firebaseService.getQuestions(testId);
            
            if (this.testQuestions.length === 0) {
                alert('Для цього тесту ще немає питань!');
                return;
            }

            // Перемішуємо питання
            this.testQuestions = [...this.testQuestions].sort(() => Math.random() - 0.5);

            // Ініціалізуємо змінні
            this.currentQuestionIndex = 0;
            this.userAnswers = new Array(this.testQuestions.length).fill(null);
            this.timeLeft = this.currentTest.time * 60;

            // Оновлюємо інтерфейс
            this.testTitle.textContent = this.currentTest.name;
            this.startTimer();
            this.loadQuestion();
            this.showPage('test');
        } catch (error) {
            alert('Помилка завантаження тесту: ' + error.message);
        }
    }

    startTimer() {
        clearInterval(this.testTimer);
        this.updateTimerDisplay();
        
        this.testTimer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            if (this.timeLeft <= 0) {
                clearInterval(this.testTimer);
                this.finishTest();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    loadQuestion() {
        const question = this.testQuestions[this.currentQuestionIndex];
        
        this.questionNumber.textContent = `ПИТАННЯ ${this.currentQuestionIndex + 1}`;
        this.questionCounter.textContent = `${this.currentQuestionIndex + 1}/${this.testQuestions.length}`;
        this.questionText.textContent = question.text;
        
        const progress = ((this.currentQuestionIndex + 1) / this.testQuestions.length) * 100;
        this.progressPercent.textContent = `${Math.round(progress)}%`;
        this.progressFill.style.width = `${progress}%`;
        
        this.answersContainer.innerHTML = '';
        
        if (question.type === 'single') {
            this.createSingleChoiceQuestion(question);
        } else if (question.type === 'multiple') {
            this.createMultipleChoiceQuestion(question);
        } else if (question.type === 'text') {
            this.createTextQuestion(question);
        }
        
        this.prevBtn.disabled = this.currentQuestionIndex === 0;
        
        if (this.currentQuestionIndex === this.testQuestions.length - 1) {
            this.nextBtn.style.display = 'none';
            this.finishBtn.style.display = 'flex';
        } else {
            this.nextBtn.style.display = 'flex';
            this.finishBtn.style.display = 'none';
        }
    }

    createSingleChoiceQuestion(question) {
        question.answers.forEach((answer, index) => {
            const option = document.createElement('div');
            option.className = `answer-option ${this.userAnswers[this.currentQuestionIndex] === index ? 'selected' : ''}`;
            option.innerHTML = `
                <div class="option-marker">${String.fromCharCode(65 + index)}</div>
                <div class="answer-text">${answer.text}</div>
            `;
            option.addEventListener('click', () => {
                this.userAnswers[this.currentQuestionIndex] = index;
                this.loadQuestion();
            });
            this.answersContainer.appendChild(option);
        });
    }

    createMultipleChoiceQuestion(question) {
        question.answers.forEach((answer, index) => {
            const isSelected = Array.isArray(this.userAnswers[this.currentQuestionIndex]) && 
                              this.userAnswers[this.currentQuestionIndex].includes(index);
            const option = document.createElement('div');
            option.className = `answer-option ${isSelected ? 'selected' : ''}`;
            option.innerHTML = `
                <div class="option-marker">${String.fromCharCode(65 + index)}</div>
                <div class="answer-text">${answer.text}</div>
            `;
            option.addEventListener('click', () => {
                if (!Array.isArray(this.userAnswers[this.currentQuestionIndex])) {
                    this.userAnswers[this.currentQuestionIndex] = [];
                }
                
                const idx = this.userAnswers[this.currentQuestionIndex].indexOf(index);
                if (idx === -1) {
                    this.userAnswers[this.currentQuestionIndex].push(index);
                } else {
                    this.userAnswers[this.currentQuestionIndex].splice(idx, 1);
                }
                
                this.loadQuestion();
            });
            this.answersContainer.appendChild(option);
        });
    }

    createTextQuestion(question) {
        const textarea = document.createElement('textarea');
        textarea.placeholder = 'Введіть вашу відповідь тут...';
        textarea.value = this.userAnswers[this.currentQuestionIndex] || '';
        textarea.addEventListener('input', (e) => {
            this.userAnswers[this.currentQuestionIndex] = e.target.value;
        });
        this.answersContainer.appendChild(textarea);
        this.answersContainer.classList.add('text-answer');
    }

    prevQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.loadQuestion();
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.testQuestions.length - 1) {
            this.currentQuestionIndex++;
            this.loadQuestion();
        }
    }

    async finishTest() {
        clearInterval(this.testTimer);
        
        if (!this.currentTest) return;
        
        try {
            // Створюємо результат
            const resultData = {
                testId: this.currentTest.id,
                testName: this.currentTest.name,
                userAnswers: this.userAnswers,
                timeSpent: (this.currentTest.time * 60) - this.timeLeft,
                questions: this.testQuestions
            };
            
            const result = await firebaseService.saveResult(resultData);
            
            // Оновлюємо сторінку результатів
            this.detailTestName.textContent = result.testName;
            this.detailDate.textContent = new Date(result.completedAt).toLocaleDateString('uk-UA');
            
            const minutesUsed = Math.floor(result.timeSpent / 60);
            const secondsUsed = result.timeSpent % 60;
            this.detailTime.textContent = `${minutesUsed}:${secondsUsed.toString().padStart(2, '0')}`;
            
            this.showPage('results');
            this.loadUserResults();
            
        } catch (error) {
            alert('Помилка збереження результату: ' + error.message);
            this.showDashboard();
        }
    }

    backToDashboardFromTest() {
        if (confirm('Вийти з тесту? Прогрес буде втрачено.')) {
            clearInterval(this.testTimer);
            this.showDashboard();
        }
    }
}

// Створюємо глобальний екземпляр додатка
const app = new TestingApp();
