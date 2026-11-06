// firebase.js — شرارة (Janabi AI)
// حسابات المستخدمين والمزامنة السحابية عبر Firebase JS SDK (Modular v10.14.1) من gstatic بلا تتبع اعلاني

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  deleteUser
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBaIImH2pnAGx_n5dReO0qy322dP8Hk-ww",
  authDomain: "sharara-fd0a3.firebaseapp.com",
  projectId: "sharara-fd0a3",
  storageBucket: "sharara-fd0a3.firebasestorage.app",
  messagingSenderId: "133014043470",
  appId: "1:133014043470:web:efdd7efc0746cd5e3c7c1f"
};

let app = null;
let auth = null;
let db = null;
let currentUser = null;
let syncTimeout = null;
let unsubLive = null;
const SYNCED_KEY = "sharara_synced_at";
function getSyncedAt(){ try { return Number(localStorage.getItem(SYNCED_KEY) || 0); } catch (e) { return 0; } }
function setSyncedAt(v){ try { localStorage.setItem(SYNCED_KEY, String(v || Date.now())); } catch (e) {} }
function hasContent(st){ return !!st && ((Array.isArray(st.tasks) && st.tasks.length) || (Array.isArray(st.habits) && st.habits.length) || (Array.isArray(st.history) && st.history.length) || (st.mainGoal && String(st.mainGoal.text || st.mainGoal || "").trim())); }
let applying = false;
function applyCloud(data){ applying = true; try { if (window.ShararaApp && typeof window.ShararaApp.applySyncedState === "function") { window.ShararaApp.applySyncedState(data); } } finally { applying = false; } setSyncedAt(Date.now() + 5); }
const googleProvider = new GoogleAuthProvider();

function translateFirebaseError(err) {
  const code = (err && err.code) ? String(err.code) : "";
  if (code.includes("user-not-found") || code.includes("invalid-credential")) {
    return "البريد الالكتروني او كلمة السر غير صحيحة.";
  }
  if (code.includes("wrong-password")) {
    return "كلمة السر غير صحيحة.";
  }
  if (code.includes("email-already-in-use")) {
    return "هذا البريد الالكتروني مسجل مسبقا، جرب تسجيل الدخول.";
  }
  if (code.includes("weak-password")) {
    return "كلمة السر ضعيفة، اختار كلمة سر من 6 حروف او ارقام على الاقل.";
  }
  if (code.includes("invalid-email")) {
    return "صيغة البريد الالكتروني غير صحيحة.";
  }
  if (code.includes("popup-closed-by-user")) {
    return "انغلقت نافذة تسجيل الدخول قبل ما يكمل.";
  }
  if (code.includes("network-request-failed")) {
    return "ماكو اتصال بالانترنت حاليا، شغلك محفوظ بجهازك ويتزامن لما يرجع النت.";
  }
  if (code.includes("requires-recent-login")) {
    return "لأمان حسابك، سجل خروج وادخل من جديد قبل مسح الحساب.";
  }
  return "صار خطأ بالاتصال، تأكد من الانترنت وحاول مرة ثانية.";
}

function mergeLocalAndCloud(localState, cloudState) {
  if (!cloudState || typeof cloudState !== "object") return localState;
  if (!localState || typeof localState !== "object") return cloudState;

  const localUpdated = Number(localState.updatedAt || 0);
  const cloudUpdated = Number(cloudState.updatedAt || 0);

  // نختار النسخة الاحدث كأساس مع دمج السجل والشارات والستريك حتى ما يضيع اي تقدم قبل التسجيل
  const base = localUpdated >= cloudUpdated ? Object.assign({}, cloudState, localState) : Object.assign({}, localState, cloudState);

  // دمج اسم المستخدم واعدادات البداية اذا كانت موجودة محليا قبل التسجيل
  if (!base.profile || !base.profile.name) {
    base.profile = (localState.profile && localState.profile.name) ? localState.profile : (cloudState.profile || { name: "", bigGoal: "study", wakeTime: "07:00", onboarded: false });
  }

  // دمج الشارات بدون تكرار
  const badgesSet = new Set([
    ...(Array.isArray(localState.badgesUnlocked) ? localState.badgesUnlocked : []),
    ...(Array.isArray(cloudState.badgesUnlocked) ? cloudState.badgesUnlocked : [])
  ]);
  base.badgesUnlocked = Array.from(badgesSet);

  // دمج السجل اليومي (سجل واحد لكل يوم، ناخذ النسبة الاعلى ودقائق التركيز الاعلى)
  const historyMap = new Map();
  const addHistoryList = (list) => {
    if (!Array.isArray(list)) return;
    list.forEach((item) => {
      if (!item || !item.date || Number(item.percent || 0) <= 0) return;
      const existing = historyMap.get(item.date);
      if (!existing || Number(item.percent || 0) >= Number(existing.percent || 0)) {
        historyMap.set(item.date, {
          date: String(item.date),
          percent: Number(item.percent || 0),
          goalDone: Boolean(item.goalDone || (existing && existing.goalDone)),
          focusMinutes: Math.max(Number(item.focusMinutes || 0), Number(existing ? existing.focusMinutes || 0 : 0)),
          habitsDone: Math.max(Number(item.habitsDone || 0), Number(existing ? existing.habitsDone || 0 : 0)),
          tasksDone: Math.max(Number(item.tasksDone || 0), Number(existing ? existing.tasksDone || 0 : 0))
        });
      }
    });
  };
  addHistoryList(cloudState.history);
  addHistoryList(localState.history);
  base.history = Array.from(historyMap.values()).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 60);

  // الحفاظ على الستريك الاعلى وتاريخ اول يوم
  base.streak = Math.max(Number(localState.streak || 0), Number(cloudState.streak || 0));
  if (localState.firstStartDate && cloudState.firstStartDate) {
    base.firstStartDate = localState.firstStartDate < cloudState.firstStartDate ? localState.firstStartDate : cloudState.firstStartDate;
  } else {
    base.firstStartDate = localState.firstStartDate || cloudState.firstStartDate;
  }

  base.updatedAt = Date.now();
  return base;
}

async function pullAndMergeCloudState(user) {
  if (!db || !user) return null;
  try {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    const localState = window.ShararaApp && typeof window.ShararaApp.getState === "function"
      ? window.ShararaApp.getState()
      : null;

    if (snap.exists()) {
      const cloudData = snap.data();
      const localDirty = localState && hasContent(localState) && Number(localState.updatedAt || 0) > getSyncedAt();
      if (!localDirty) {
        applyCloud(cloudData);
        return cloudData;
      }
      const merged = mergeLocalAndCloud(localState, cloudData);
      if (user.displayName && merged.profile && !merged.profile.name) {
        merged.profile.name = user.displayName;
      }
      await setDoc(ref, merged, { merge: true });
      if (window.ShararaApp && typeof window.ShararaApp.applySyncedState === "function") {
        window.ShararaApp.applySyncedState(merged);
      }
      return merged;
    } else if (localState) {
      // نقل بيانات المستخدم قبل التسجيل الى حسابه الجديد في users/{uid}
      const payload = Object.assign({}, localState, {
        updatedAt: Date.now()
      });
      if (user.displayName && payload.profile && !payload.profile.name) {
        payload.profile.name = user.displayName;
      }
      await setDoc(ref, payload, { merge: true });
      return payload;
    }
  } catch (err) {
    console.warn("Sharara Cloud Sync Warning:", err);
  }
  return null;
}

async function pushStateToCloud(stateObj) {
  if (!db || !currentUser || !stateObj) return false;
  try {
    const ref = doc(db, "users", currentUser.uid);
    const cleanData = JSON.parse(JSON.stringify(stateObj));
    cleanData.updatedAt = Date.now();
    await setDoc(ref, cleanData, { merge: true });
    setSyncedAt(cleanData.updatedAt);
    return true;
  } catch (err) {
    console.warn("Sharara Cloud Push Warning:", err);
    return false;
  }
}

function schedulePush(stateObj) {
  if (applying || !currentUser || !navigator.onLine) return;
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    pushStateToCloud(stateObj);
  }, 1200);
}

function initFirebase() {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    onAuthStateChanged(auth, async (user) => {
      currentUser = user || null;
      if (window.ShararaApp && typeof window.ShararaApp.onAuthChanged === "function") {
        window.ShararaApp.onAuthChanged(currentUser);
      }
      if (unsubLive) { unsubLive(); unsubLive = null; }
      if (currentUser && navigator.onLine) {
        await pullAndMergeCloudState(currentUser);
      }
      if (currentUser) {
        unsubLive = onSnapshot(doc(db, "users", currentUser.uid), (snap) => {
          if (!snap.exists() || snap.metadata.hasPendingWrites) return;
          const cloud = snap.data();
          const local = window.ShararaApp && window.ShararaApp.getState ? window.ShararaApp.getState() : null;
          if (!local || Number(cloud.updatedAt || 0) > Number(local.updatedAt || 0)) applyCloud(cloud);
        }, (err) => console.warn("Sharara live sync:", err));
      }
    });

    window.addEventListener("online", () => {
      if (currentUser && window.ShararaApp && typeof window.ShararaApp.getState === "function") {
        pushStateToCloud(window.ShararaApp.getState());
      }
    });
  } catch (err) {
    console.warn("Firebase Init Warning:", err);
  }
}

window.ShararaFirebase = {
  init: initFirebase,
  getCurrentUser: () => currentUser,
  syncState: (stateObj) => schedulePush(stateObj),
  forceSyncNow: async (stateObj) => {
    if (!currentUser) return false;
    return await pushStateToCloud(stateObj);
  },
  registerEmail: async (name, email, password) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (name && name.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }
      if (window.ShararaApp && typeof window.ShararaApp.setProfileName === "function" && name && name.trim()) {
        window.ShararaApp.setProfileName(name.trim());
      }
      await pullAndMergeCloudState(cred.user);
      return { ok: true, user: cred.user };
    } catch (err) {
      return { ok: false, error: translateFirebaseError(err) };
    }
  },
  loginEmail: async (email, password) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      await pullAndMergeCloudState(cred.user);
      return { ok: true, user: cred.user };
    } catch (err) {
      return { ok: false, error: translateFirebaseError(err) };
    }
  },
  loginGoogle: async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred.user && cred.user.displayName && window.ShararaApp && typeof window.ShararaApp.setProfileName === "function") {
        window.ShararaApp.setProfileName(cred.user.displayName);
      }
      await pullAndMergeCloudState(cred.user);
      return { ok: true, user: cred.user };
    } catch (err) {
      return { ok: false, error: translateFirebaseError(err) };
    }
  },
  resetPassword: async (email) => {
    try {
      if (!email || !email.trim()) {
        return { ok: false, error: "اكتب بريدك الالكتروني اولا حتى نرسل رابط استعادة كلمة السر." };
      }
      await sendPasswordResetEmail(auth, email.trim());
      return { ok: true };
    } catch (err) {
      return { ok: false, error: translateFirebaseError(err) };
    }
  },
  logout: async () => {
    try {
      await signOut(auth);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: translateFirebaseError(err) };
    }
  },
  deleteAccountAndData: async () => {
    try {
      if (currentUser && db) {
        const ref = doc(db, "users", currentUser.uid);
        await deleteDoc(ref);
        await deleteUser(currentUser);
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: translateFirebaseError(err) };
    }
  }
};

initFirebase();
