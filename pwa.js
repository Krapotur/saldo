(() => {
  const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  if (standalone) {
    const profileButton = document.querySelector("#profileInstallButton");
    if (profileButton) profileButton.hidden = true;
    return;
  }

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const shownKey = "saldo-install-tip-shown-v1";
  let installEvent;
  const button = document.createElement("button");
  button.className = "pwa-install-button";
  button.type = "button";
  button.textContent = "Установить приложение";
  button.hidden = true;
  document.body.append(button);

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installEvent = event;
  });

  window.saldoInstallApp = async () => {
    if (installEvent) {
      const promptEvent = installEvent;
      installEvent = null;
      await promptEvent.prompt();
      const result = await promptEvent.userChoice;
      if (result?.outcome === "accepted") button.hidden = true;
      return;
    }
    if (isIos) {
      window.alert("Чтобы установить Saldo, нажмите «Поделиться», затем «На экран Домой».");
      return;
    }
    window.alert("Установка пока недоступна в этом браузере. Откройте меню браузера и выберите «Установить приложение» или «Добавить на главный экран».");
  };

  button.addEventListener("click", window.saldoInstallApp);

  try {
    if (!localStorage.getItem(shownKey)) {
      localStorage.setItem(shownKey, "1");
      button.hidden = false;
      window.setTimeout(() => { button.hidden = true; }, 10000);
    }
  } catch {
    button.hidden = false;
    window.setTimeout(() => { button.hidden = true; }, 10000);
  }

  window.addEventListener("appinstalled", () => {
    button.hidden = true;
    const profileButton = document.querySelector("#profileInstallButton");
    if (profileButton) profileButton.hidden = true;
    installEvent = null;
  });
})();
