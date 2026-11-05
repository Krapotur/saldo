import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getAuth,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  deleteUser,
  signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { deleteDoc, doc, getDoc, getFirestore, setDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAgrdkwKw34FKcPevuYi3fb2pQQXHtECpY",
  authDomain: "saldo-322f2.firebaseapp.com",
  projectId: "saldo-322f2",
  storageBucket: "saldo-322f2.firebasestorage.app",
  messagingSenderId: "71913797218",
  appId: "1:71913797218:web:8858f797ec3ba11bc8c33b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const LOGIN_DOMAIN = "users.saldo-322f2.firebaseapp.com";
export const authReady = new Promise((resolve) => {
  let unsubscribe = () => {};
  unsubscribe = onAuthStateChanged(auth, (user) => {
    unsubscribe();
    resolve(user);
  });
});

function toEmail(login) {
  if (login.includes("@")) return login.toLowerCase();
  return `${login.toLowerCase()}@${LOGIN_DOMAIN}`;
}

const userDoc = () => {
  if (!auth.currentUser) throw new Error("Войдите в аккаунт, чтобы продолжить.");
  return doc(db, "users", auth.currentUser.uid);
};

export const saldoAuth = {
  async register({ login, password, displayName }) {
    const credential = await createUserWithEmailAndPassword(auth, toEmail(login), password);
    await setDoc(doc(db, "users", credential.user.uid), {
      profile: { login: login.toLowerCase(), displayName, createdAt: new Date().toISOString() },
      data: {}
    });
  },
  async login({ login, password }) {
    await signInWithEmailAndPassword(auth, toEmail(login), password);
  },
  async logout() {
    await signOut(auth);
  },
  async deleteAccount(password) {
    const user = auth.currentUser;
    if (!user?.email) throw new Error("Для удаления аккаунта требуется войти снова.");
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    await deleteDoc(doc(db, "users", user.uid));
    await deleteUser(user);
  },
  async loadData() {
    const snapshot = await getDoc(userDoc());
    return snapshot.exists() ? snapshot.data().data || {} : {};
  },
  async loadProfile() {
    const snapshot = await getDoc(userDoc());
    return snapshot.exists() ? snapshot.data().profile || {} : {};
  },
  async saveData(data) {
    await setDoc(userDoc(), { data }, { merge: true });
  },
  get currentUser() {
    return auth.currentUser;
  }
};

window.saldoFirebaseAuth = saldoAuth;
