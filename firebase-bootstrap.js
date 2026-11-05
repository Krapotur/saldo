import { authReady, saldoAuth } from "./firebase-client.js";

const dataFields = {
  transactions: "saldo-transactions-v1",
  categories: "saldo-categories-v1",
  goals: "saldo-goals-v1",
  activeGoalId: "saldo-active-goal-v1",
  savings: "saldo-savings-v1",
  debts: "saldo-debts-v1",
  expensePlans: "saldo-expense-plans-v1",
  pin: "saldo-pin-v1"
};

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

try {
  const user = await authReady;
  if (!user) throw new Error("Нет активной Firebase-сессии.");
  const cacheKey = `saldo-user-cache-v1:${user.uid}`;
  const pendingKey = `saldo-user-pending-v1:${user.uid}`;
  const cachedData = readJson(cacheKey, {});
  const pendingData = readJson(pendingKey, {});
  let remoteAvailable = false;
  let data = cachedData;
  let profile = readJson(`saldo-user-profile-v1:${user.uid}`, {});

  try {
    data = await saldoAuth.loadData();
    profile = await saldoAuth.loadProfile();
    remoteAvailable = true;
  } catch (error) {
    console.info("Офлайн-режим: загружены локальные данные пользователя.", error);
  }

  data = { ...data, ...pendingData };
  writeJson(cacheKey, data);
  writeJson(`saldo-user-profile-v1:${user.uid}`, profile);
  Object.entries(dataFields).forEach(([field, key]) => {
    if (Object.hasOwn(data, field)) {
      const value = field === "pin" ? { pin: data[field] } : data[field];
      writeJson(key, value);
    } else {
      localStorage.removeItem(key);
    }
  });
  localStorage.setItem("saldo-local-accounts-v1", JSON.stringify([{
    id: user.uid,
    displayName: profile.displayName || user.displayName || "Пользователь",
    login: profile.login || user.email?.split("@")[0] || ""
  }]));
  localStorage.setItem("saldo-local-session-v1", JSON.stringify({ accountId: user.uid }));

  let syncInProgress = false;
  const synchronizePending = async () => {
    if (!navigator.onLine || syncInProgress) return;
    syncInProgress = true;
    try {
      while (navigator.onLine) {
        const pending = readJson(pendingKey, {});
        const [field] = Object.keys(pending);
        if (!field) break;
        const value = pending[field];
        await saldoAuth.saveData({ [field]: value });
        const latest = readJson(pendingKey, {});
        if (JSON.stringify(latest[field]) === JSON.stringify(value)) {
          delete latest[field];
          writeJson(pendingKey, latest);
        }
      }
    } catch (error) {
      console.warn("Синхронизация отложена до восстановления соединения.", error);
    } finally {
      syncInProgress = false;
    }
  };

  window.saldoPersistData = async (field, value) => {
    if (!Object.hasOwn(dataFields, field)) throw new Error("Неизвестное поле данных.");
    const latestData = readJson(cacheKey, {});
    latestData[field] = value;
    writeJson(cacheKey, latestData);
    const pending = readJson(pendingKey, {});
    pending[field] = value;
    writeJson(pendingKey, pending);
    data = latestData;
    await synchronizePending();
  };
  window.addEventListener("online", synchronizePending);
  if (remoteAvailable) await synchronizePending();
  await import("./app.js");
} catch (error) {
  console.error("Не удалось загрузить данные Saldo из Firestore", error);
  window.location.replace("register.html?mode=login");
}
