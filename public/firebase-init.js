// Firebase initialization for KiddoTube
// Replace any placeholder values if your Firebase console shows different settings.
const firebaseConfig = {
  apiKey: "AIzaSyBnZk0qPZDiPpCxf6fJHR0Y-RBVMoal46E",
  authDomain: "kiddotube-515c6.firebaseapp.com",
  projectId: "kiddotube-515c6",
  storageBucket: "kiddotube-515c6.appspot.com",
  messagingSenderId: "169803341897",
  appId: "1:169803341897:web:PLACEHOLDER"
};

if (typeof firebase !== 'undefined' && firebase && firebase.initializeApp) {
  try {
    // Initialize only if not already initialized
    if (!firebase.apps || firebase.apps.length === 0) {
      firebase.initializeApp(firebaseConfig);
      console.log('Firebase initialized');
    }
  } catch (e) {
    console.warn('Firebase init error:', e && e.message);
  }
}

// Lightweight wrapper to avoid calling firebase when not available
window.FirebaseAuthWrapper = {
  register: function(email, password) {
    if (!window.firebase || !firebase.auth) return Promise.reject(new Error('Firebase not available'));
    return firebase.auth().createUserWithEmailAndPassword(email, password);
  },
  login: function(email, password) {
    if (!window.firebase || !firebase.auth) return Promise.reject(new Error('Firebase not available'));
    return firebase.auth().signInWithEmailAndPassword(email, password);
  },
  // Google sign-in using popup
  signInWithGoogle: function() {
    if (!window.firebase || !firebase.auth || !firebase.auth.GoogleAuthProvider) return Promise.reject(new Error('Firebase not available'));
    const provider = new firebase.auth.GoogleAuthProvider();
    return firebase.auth().signInWithPopup(provider);
  },
  signOut: function() {
    if (!window.firebase || !firebase.auth) return Promise.reject(new Error('Firebase not available'));
    return firebase.auth().signOut();
  },
  onAuthStateChanged: function(cb) {
    if (!window.firebase || !firebase.auth) return;
    return firebase.auth().onAuthStateChanged(cb);
  }
  ,
  sendPasswordResetEmail: function(email) {
    if (!window.firebase || !firebase.auth) return Promise.reject(new Error('Firebase not available'));
    return firebase.auth().sendPasswordResetEmail(email);
  }
};
