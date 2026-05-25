const firebaseConfig = {
apiKey: "AIzaSyDf1MfL8M3SobumzCp1HZJggzRPmZeipI8",
authDomain: "ugcrimereport.firebaseapp.com",
projectId: "ugcrimereport",
storageBucket: "ugcrimereport.firebasestorage.app",
messagingSenderId: "309651447324",
appId: "1:309651447324:web:53cb0e0c50eabd39c8c9d9",
measurementId: "G-8XF31FF9Z3"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
