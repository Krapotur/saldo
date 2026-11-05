import "./firebase-client.js";

(() => {
  const LOCAL_ACCOUNTS_STORAGE_KEY = "saldo-local-accounts-v1";
  const LOCAL_SESSION_STORAGE_KEY = "saldo-local-session-v1";
  const PASSWORD_HASH_ITERATIONS = 120000;
  const form = document.querySelector("#registrationForm");
  if (!form) return;

  const elements = {
    name: document.querySelector("#registrationName"),
    login: document.querySelector("#registrationLogin"),
    password: document.querySelector("#registrationPassword"),
    passwordConfirm: document.querySelector("#registrationPasswordConfirm"),
    submit: document.querySelector("#registrationSubmit"),
    status: document.querySelector("#registrationStatus"),
    nameField: document.querySelector("#registrationName").closest(".auth-field"),
    confirmPasswordField: document.querySelector("#registrationPasswordConfirm").closest(".auth-field"),
    passwordHint: document.querySelector("#registrationPasswordHint"),
    title: document.querySelector("#registrationTitle"),
    kicker: document.querySelector("#authModeKicker"),
    intro: document.querySelector("#authModeIntro"),
    switchPrompt: document.querySelector("#authSwitchPrompt"),
    switchButton: document.querySelector("#authSwitchButton"),
    errors: {
      name: document.querySelector("#registrationNameError"),
      login: document.querySelector("#registrationLoginError"),
      password: document.querySelector("#registrationPasswordError"),
      passwordConfirm: document.querySelector("#registrationPasswordConfirmError")
    }
  };

  let authMode = "register";

  function setFieldError(field, message) {
    elements.errors[field].textContent = message;
    elements[field].setAttribute("aria-invalid", String(Boolean(message)));
  }

  function setStatus(message, state = "") {
    elements.status.textContent = message;
    elements.status.dataset.state = state;
  }

  function clearErrors() {
    Object.keys(elements.errors).forEach((field) => setFieldError(field, ""));
    setStatus("");
  }

  function normalizeName(value) {
    return value.trim().replace(/\s+/g, " ");
  }

  function normalizeLogin(value) {
    return value.trim().toLowerCase();
  }

  function loadLocalAccounts() {
    try {
      const accounts = JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_STORAGE_KEY));
      if (!Array.isArray(accounts)) return [];
      return accounts.map((account) => account && !account.login && account.email
        ? { ...account, login: normalizeLogin(account.email) }
        : account);
    } catch {
      return [];
    }
  }

  function getCryptoApi() {
    return window.crypto || globalThis.crypto;
  }

  function bytesToBase64(bytes) {
    return btoa(String.fromCharCode(...bytes));
  }

  async function hashPassword(password, salt) {
    const cryptoApi = getCryptoApi();
    if (!cryptoApi?.subtle || !cryptoApi?.getRandomValues) {
      throw new Error("Браузер не поддерживает безопасное локальное хранение паролей. Используйте современный браузер.");
    }
    const key = await cryptoApi.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const hash = await cryptoApi.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: PASSWORD_HASH_ITERATIONS, hash: "SHA-256" },
      key,
      256
    );
    return bytesToBase64(new Uint8Array(hash));
  }

  function base64ToBytes(value) {
    return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
  }

  function setSession(account) {
    localStorage.setItem(LOCAL_SESSION_STORAGE_KEY, JSON.stringify({ accountId: account.id, createdAt: new Date().toISOString() }));
  }

  async function signInLocalAccount(login, password) {
    const account = loadLocalAccounts().find((item) => item.login === login);
    if (!account?.password?.salt || !account.password.hash || account.password.algorithm !== "PBKDF2-SHA-256") {
      throw new Error("Неверный логин или пароль.");
    }
    const salt = base64ToBytes(account.password.salt);
    const actualHash = await hashPassword(password, salt);
    if (actualHash !== account.password.hash) throw new Error("Неверный логин или пароль.");
    setSession(account);
  }

  function createLocalAccountId(cryptoApi) {
    if (typeof cryptoApi.randomUUID === "function") return cryptoApi.randomUUID();
    const bytes = new Uint8Array(16);
    cryptoApi.getRandomValues(bytes);
    return `local-${bytesToBase64(bytes).replace(/[+/=]/g, "")}`;
  }

  async function createLocalAccount(payload) {
    const cryptoApi = getCryptoApi();
    if (!cryptoApi?.subtle || !cryptoApi?.getRandomValues) {
      throw new Error("Браузер не поддерживает безопасное локальное хранение паролей. Используйте современный браузер.");
    }

    const accounts = loadLocalAccounts();
    if (accounts.some((account) => account.login === payload.login)) {
      const error = new Error("Этот логин уже используется на данном устройстве.");
      error.code = "local/login-already-in-use";
      throw error;
    }

    const salt = new Uint8Array(16);
    cryptoApi.getRandomValues(salt);
    const account = {
      id: createLocalAccountId(cryptoApi),
      displayName: payload.displayName,
      login: payload.login,
      password: {
        algorithm: "PBKDF2-SHA-256",
        iterations: PASSWORD_HASH_ITERATIONS,
        salt: bytesToBase64(salt),
        hash: await hashPassword(payload.password, salt)
      },
      createdAt: new Date().toISOString()
    };

    localStorage.setItem(LOCAL_ACCOUNTS_STORAGE_KEY, JSON.stringify([...accounts, account]));
    setSession(account);
    return account;
  }

  function validateForm() {
    clearErrors();
    const values = {
      displayName: normalizeName(elements.name.value),
      login: normalizeLogin(elements.login.value),
      password: elements.password.value,
      passwordConfirm: elements.passwordConfirm.value
    };
    let firstInvalid = null;

    if (authMode === "register" && values.displayName.length < 2) {
      setFieldError("name", "Введите имя длиной не менее 2 символов.");
      firstInvalid ||= elements.name;
    }
    const validLogin = /^[a-z0-9._-]{3,24}$/.test(values.login);
    const legacyEmailLogin = authMode === "login" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.login);
    if (!validLogin && !legacyEmailLogin) {
      setFieldError("login", "Логин: 3–24 символа, латинские буквы, цифры, точка, дефис или подчёркивание.");
      firstInvalid ||= elements.login;
    }
    if (authMode === "register" && values.password.length < 8) {
      setFieldError("password", "Пароль должен содержать не менее 8 символов.");
      firstInvalid ||= elements.password;
    }
    if (authMode === "register" && values.password !== values.passwordConfirm) {
      setFieldError("passwordConfirm", "Пароли не совпадают.");
      firstInvalid ||= elements.passwordConfirm;
    }
    return { values, firstInvalid };
  }

  function setSubmitting(isSubmitting) {
    elements.submit.disabled = isSubmitting;
    elements.submit.innerHTML = isSubmitting
      ? authMode === "login" ? "Входим…" : "Создаём аккаунт…"
      : authMode === "login" ? "Войти →" : "Создать аккаунт <span>→</span>";
  }

  function setAuthMode(mode) {
    authMode = mode;
    const isLogin = mode === "login";
    elements.nameField.hidden = isLogin;
    elements.confirmPasswordField.hidden = isLogin;
    elements.name.required = !isLogin;
    elements.passwordConfirm.required = !isLogin;
    elements.password.autocomplete = isLogin ? "current-password" : "new-password";
    elements.title.textContent = isLogin ? "С возвращением" : "Создайте аккаунт";
    elements.kicker.textContent = isLogin ? "ВХОД В АККАУНТ" : "НОВЫЙ АККАУНТ";
    elements.intro.textContent = isLogin ? "Войдите, чтобы открыть свои финансовые данные." : "Начните вести личные финансы в Saldo.";
    elements.passwordHint.textContent = isLogin ? "Введите пароль от локального аккаунта." : "Используйте не менее 8 символов.";
    elements.submit.textContent = isLogin ? "Войти →" : "Создать аккаунт →";
    elements.switchPrompt.textContent = isLogin ? "Ещё нет аккаунта?" : "Уже есть аккаунт?";
    elements.switchButton.textContent = isLogin ? "Зарегистрироваться" : "Войти";
    form.reset();
    clearErrors();
    const url = new URL(window.location.href);
    if (isLogin) url.searchParams.set("mode", "login");
    else url.searchParams.delete("mode");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    (isLogin ? elements.login : elements.name).focus();
  }

  function formatRegistrationError(error) {
    if (error?.code === "auth/email-already-in-use") return "Этот логин уже зарегистрирован.";
    if (error?.code === "auth/invalid-credential" || error?.code === "auth/user-not-found" || error?.code === "auth/wrong-password") return "Неверный логин или пароль.";
    if (error?.code === "auth/too-many-requests") return "Слишком много попыток. Попробуйте позже.";
    if (error?.code === "auth/weak-password") return "Выберите более надёжный пароль.";
    if (error?.code === "auth/network-request-failed") return "Не удалось подключиться к сервису. Проверьте интернет и повторите попытку.";
    return error?.message || "Не удалось создать аккаунт. Повторите попытку позже.";
  }

  async function registerAccount(payload) {
    const register = window.saldoFirebaseAuth?.register;
    if (typeof register !== "function") throw new Error("Firebase Authentication не загружен.");
    await register(payload);
    return "firebase";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const { values, firstInvalid } = validateForm();
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    setSubmitting(true);
    try {
      if (authMode === "login") {
        const login = window.saldoFirebaseAuth?.login;
        if (typeof login !== "function") throw new Error("Firebase Authentication не загружен.");
        await login({ login: values.login, password: values.password });
        form.reset();
        setStatus("Вы вошли. Открываем приложение…", "success");
        window.location.replace("./");
        return;
      }

      const accountSource = await registerAccount({
        displayName: values.displayName,
        login: values.login,
        password: values.password
      });
      form.reset();
      setStatus("Аккаунт создан. Переходим к приложению…", "success");
      window.location.replace("./");
    } catch (error) {
      setStatus(formatRegistrationError(error), "error");
    } finally {
      setSubmitting(false);
    }
  });

  elements.switchButton.addEventListener("click", () => setAuthMode(authMode === "register" ? "login" : "register"));

  ["name", "login", "password", "passwordConfirm"].forEach((field) => {
    elements[field].addEventListener("input", () => {
      setFieldError(field, "");
      setStatus("");
    });
  });

  [
    ["#toggleRegistrationPassword", elements.password],
    ["#toggleRegistrationPasswordConfirm", elements.passwordConfirm]
  ].forEach(([selector, input]) => {
    const button = document.querySelector(selector);
    button.addEventListener("click", () => {
      const showPassword = input.type === "password";
      input.type = showPassword ? "text" : "password";
      button.setAttribute("aria-label", showPassword ? "Скрыть пароль" : "Показать пароль");
      button.setAttribute("aria-pressed", String(showPassword));
    });
  });

  const requestedMode = new URLSearchParams(window.location.search).get("mode");
  const hasLocalAccounts = loadLocalAccounts().length > 0;
  setAuthMode(requestedMode === "login" || (!requestedMode && hasLocalAccounts) ? "login" : "register");
})();
