// Сервіс для роботи з Firebase
class FirebaseService {
    constructor() {
        this.database = database;
        this.auth = auth;
        this.currentUser = null;
        this.isAdmin = false;
    }

    // === АВТОРИЗАЦІЯ ===
    async register(email, password, userData) {
        try {
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Зберігаємо додаткові дані в Firebase
            await this.database.ref('users/' + user.uid).set({
                email: user.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                createdAt: Date.now(),
                isAdmin: ADMIN_EMAILS.includes(email)
            });
            
            return { success: true, user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async login(email, password) {
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Перевіряємо чи адмін
            const userSnapshot = await this.database.ref('users/' + user.uid).once('value');
            const userData = userSnapshot.val();
            this.isAdmin = userData?.isAdmin || false;
            this.currentUser = { ...user, ...userData, uid: user.uid };
            
            return { success: true, user: this.currentUser };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    logout() {
        return this.auth.signOut();
    }

    // === ТЕСТИ ===
    async createTest(testData) {
        const testId = this.database.ref().child('tests').push().key;
        const test = {
            id: testId,
            ...testData,
            createdBy: this.currentUser.email,
            createdAt: Date.now(),
            active: true
        };
        
        await this.database.ref('tests/' + testId).set(test);
        return test;
    }

    async getTests() {
        const snapshot = await this.database.ref('tests').once('value');
        const tests = snapshot.val() || {};
        return Object.values(tests).filter(test => test.active);
    }

    async updateTest(testId, testData) {
        await this.database.ref('tests/' + testId).update(testData);
    }

    async deleteTest(testId) {
        await this.database.ref('tests/' + testId).remove();
        // Видаляємо всі питання цього тесту
        await this.database.ref('questions').orderByChild('testId').equalTo(testId).once('value', snapshot => {
            snapshot.forEach(child => {
                child.ref.remove();
            });
        });
    }

    // === ПИТАННЯ ===
    async createQuestion(questionData) {
        const questionId = this.database.ref().child('questions').push().key;
        const question = {
            id: questionId,
            ...questionData,
            createdAt: Date.now()
        };
        
        await this.database.ref('questions/' + questionId).set(question);
        return question;
    }

    async getQuestions(testId) {
        const snapshot = await this.database.ref('questions').orderByChild('testId').equalTo(testId).once('value');
        const questions = snapshot.val() || {};
        return Object.values(questions);
    }

    // === РЕЗУЛЬТАТИ ===
    async saveResult(resultData) {
        const resultId = this.database.ref().child('results').push().key;
        const result = {
            id: resultId,
            ...resultData,
            userId: this.currentUser.uid,
            userEmail: this.currentUser.email,
            userName: `${this.currentUser.firstName} ${this.currentUser.lastName}`,
            completedAt: Date.now(),
            status: 'waiting'
        };
        
        await this.database.ref('results/' + resultId).set(result);
        return result;
    }

    async getUserResults() {
        const snapshot = await this.database.ref('results')
            .orderByChild('userId')
            .equalTo(this.currentUser.uid)
            .once('value');
        const results = snapshot.val() || {};
        return Object.values(results).sort((a, b) => b.completedAt - a.completedAt);
    }

    async getAllResults() {
        const snapshot = await this.database.ref('results').once('value');
        const results = snapshot.val() || {};
        return Object.values(results).sort((a, b) => b.completedAt - a.completedAt);
    }

    async updateResultStatus(resultId, status) {
        await this.database.ref('results/' + resultId + '/status').set(status);
    }

    // === КОРИСТУВАЧІ ===
    async getAllUsers() {
        const snapshot = await this.database.ref('users').once('value');
        const users = snapshot.val() || {};
        return Object.entries(users).map(([uid, user]) => ({ uid, ...user }));
    }

    async deleteUser(userId) {
        await this.database.ref('users/' + userId).remove();
        // Видаляємо всі результати користувача
        await this.database.ref('results').orderByChild('userId').equalTo(userId).once('value', snapshot => {
            snapshot.forEach(child => {
                child.ref.remove();
            });
        });
    }

    // === СИНХРОНІЗАЦІЯ ===
    onAuthStateChanged(callback) {
        return this.auth.onAuthStateChanged(callback);
    }

    onTestsChanged(callback) {
        return this.database.ref('tests').on('value', snapshot => {
            const tests = snapshot.val() || {};
            callback(Object.values(tests).filter(test => test.active));
        });
    }

    onResultsChanged(callback) {
        return this.database.ref('results').on('value', snapshot => {
            const results = snapshot.val() || {};
            callback(Object.values(results).sort((a, b) => b.completedAt - a.completedAt));
        });
    }

    // === ЕКСПОРТ/ІМПОРТ ===
    async exportData() {
        const [tests, questions, results, users] = await Promise.all([
            this.database.ref('tests').once('value'),
            this.database.ref('questions').once('value'),
            this.database.ref('results').once('value'),
            this.database.ref('users').once('value')
        ]);

        return {
            tests: tests.val() || {},
            questions: questions.val() || {},
            results: results.val() || {},
            users: users.val() || {},
            exportedAt: Date.now(),
            exportedBy: this.currentUser.email
        };
    }

    async importData(data) {
        if (!data.tests || !data.questions || !data.results || !data.users) {
            throw new Error('Невірний формат даних');
        }

        // Очищаємо базу
        await this.database.ref('tests').remove();
        await this.database.ref('questions').remove();
        await this.database.ref('results').remove();
        await this.database.ref('users').remove();

        // Імпортуємо дані
        await this.database.ref('tests').set(data.tests);
        await this.database.ref('questions').set(data.questions);
        await this.database.ref('results').set(data.results);
        await this.database.ref('users').set(data.users);

        return true;
    }
}

// Створюємо глобальний екземпляр
const firebaseService = new FirebaseService();
