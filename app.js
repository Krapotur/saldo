const STORAGE_KEY = "saldo-transactions-v1";
const GOAL_KEY = "saldo-goal-v1";
const GOALS_STORAGE_KEY = "saldo-goals-v1";
const ACTIVE_GOAL_STORAGE_KEY = "saldo-active-goal-v1";
const CATEGORY_STORAGE_KEY = "saldo-categories-v1";
const SAVINGS_STORAGE_KEY = "saldo-savings-v1";
const DEBTS_STORAGE_KEY = "saldo-debts-v1";
const EXPENSE_PLANS_STORAGE_KEY = "saldo-expense-plans-v1";
const PIN_STORAGE_KEY = "saldo-pin-v1";
const LOCAL_ACCOUNTS_STORAGE_KEY = "saldo-local-accounts-v1";
const LOCAL_SESSION_STORAGE_KEY = "saldo-local-session-v1";
const formatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });
let expensePlansMigrated = false;

const icons = {
  "Продукты": "🛍️", "Кафе": "☕", "Транспорт": "◉", "Дом": "⌂", "Здоровье": "✚", "Развлечения": "✦", "Покупки": "◇", "Зарплата": "▣", "Фриланс": "✎", "Перевод": "↗", "Другое": "•"
};
const palette = { "Продукты": "#6559da", "Кафе": "#bd8ad8", "Транспорт": "#f5d66c", "Дом": "#fa9b86", "Здоровье": "#8fc6f1", "Развлечения": "#d7a6ed", "Покупки": "#fa9b86", "Другое": "#aab3c0" };
const DEFAULT_CATEGORIES = {
  expense: ["Продукты", "Кафе", "Транспорт", "Дом", "Здоровье", "Развлечения", "Покупки", "Другое"],
  income: ["Зарплата", "Фриланс", "Перевод", "Другое"]
};
const GOAL_EXPENSE_CATEGORY = "Цели";

function isValidPin(value) {
  return /^[0-9]{4}$/.test(value);
}

function loadPin() {
  try {
    const stored = JSON.parse(localStorage.getItem(PIN_STORAGE_KEY));
    const pin = typeof stored === "string" ? stored : stored?.pin;
    return isValidPin(pin) ? pin : "";
  } catch {
    return "";
  }
}

function loadLocalAccount() {
  try {
    const session = JSON.parse(localStorage.getItem(LOCAL_SESSION_STORAGE_KEY));
    const accounts = JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_STORAGE_KEY));
    if (!session?.accountId || !Array.isArray(accounts)) return null;
    const account = accounts.find((item) => item?.id === session.accountId);
    if (!account?.displayName || !(account?.login || account?.email)) return null;
    return { displayName: String(account.displayName), login: String(account.login || account.email) };
  } catch {
    return null;
  }
}

const state = {
  transactions: loadTransactions(),
  categories: loadCategories(),
  goals: loadGoals(),
  savings: loadSavings(),
  debts: loadDebts(),
  expensePlans: loadExpensePlans(),
  debtViewIndex: -1,
  activeGoalId: localStorage.getItem(ACTIVE_GOAL_STORAGE_KEY),
  month: getMonthKey(new Date()),
  filter: "all",
  showAllTransactions: false,
  type: "expense",
  goal: Number(localStorage.getItem(GOAL_KEY)) || 86500,
  balanceVisible: true,
  savingsVisible: true,
  summaryMode: "balance",
  categoryMode: "expense",
  categoryEditorType: "expense",
  editingTransactionId: null,
  pin: loadPin(),
  pinUnlocked: false,
  localAccount: loadLocalAccount()
};

const elements = {
  balance: document.querySelector("#balanceValue"),
  balanceWidget: document.querySelector("#balanceWidget"),
  balanceLabel: document.querySelector("#balanceLabel"),
  balancePill: document.querySelector("#balancePill"),
  balanceDescription: document.querySelector("#balanceDescription"),
  balanceCode: document.querySelector("#balanceCode"),
  balanceVisibility: document.querySelector("#balanceVisibility"),
  profileAvatar: document.querySelector("#profileAvatar"),
  sidebarProfileName: document.querySelector("#sidebarProfileName"),
  profilePage: document.querySelector("#profilePage"),
  profilePageAvatar: document.querySelector("#profilePageAvatar"),
  profilePageName: document.querySelector("#profilePageName"),
  openSavingsButton: document.querySelector("#openSavingsModal"),
  savingsWidgetList: document.querySelector("#savingsWidgetList"),
  income: document.querySelector("#incomeValue"),
  incomeExpected: document.querySelector("#incomeExpected"),
  expense: document.querySelector("#expenseValue"),
  incomeChange: document.querySelector("#incomeChange"),
  expenseChange: document.querySelector("#expenseChange"),
  appLoader: document.querySelector("#appLoader"),
  dailyExpense: document.querySelector("#dailyExpenseValue"),
  dailyExpensePeriod: document.querySelector("#dailyExpensePeriod"),
  barChart: document.querySelector("#barChart"),
  expenseScale: document.querySelector("#expenseScale"),
  expensePlanPanel: document.querySelector("#expensePlanPanel"),
  expensePlanExpected: document.querySelector("#expensePlanExpected"),
  expensePlanActual: document.querySelector("#expensePlanActual"),
  expensePlanDifference: document.querySelector("#expensePlanDifference"),
  expensePlanExpectedBar: document.querySelector("#expensePlanExpectedBar"),
  expensePlanActualBar: document.querySelector("#expensePlanActualBar"),
  expensePlanDifferenceBar: document.querySelector("#expensePlanDifferenceBar"),
  expensePlanRows: document.querySelector("#expensePlanRows"),
  expensePlanHint: document.querySelector("#expensePlanHint"),
  chartPeakDay: document.querySelector("#chartPeakDay"),
  donut: document.querySelector("#donutChart"),
  categoryTotal: document.querySelector("#categoryTotal"),
  categoryList: document.querySelector("#categoryList"),
  categoryBreakdownBackdrop: document.querySelector("#categoryBreakdownBackdrop"),
  categoryBreakdownList: document.querySelector("#categoryBreakdownList"),
  categoryBreakdownTotal: document.querySelector("#categoryBreakdownTotal"),
  categoryBreakdownPeriod: document.querySelector("#categoryBreakdownPeriod"),
  transactionList: document.querySelector("#transactionList"),
  categoryPanel: document.querySelector("#categoryPanel"),
  categoryIndex: document.querySelector("#categoryIndex"),
  categoryTitle: document.querySelector("#categoryTitle"),
  categoryHint: document.querySelector("#categoryHint"),
  categoryIncomeTotal: document.querySelector("#categoryIncomeTotal"),
  categoryIncomeList: document.querySelector("#categoryIncomeList"),
  showAllButton: document.querySelector("#showAllButton"),
  monthSelect: document.querySelector("#monthSelect"),
  selectedMonthLabel: document.querySelector("#selectedMonthLabel"),
  openMonthModalButton: document.querySelector("#openMonthModal"),
  monthBackdrop: document.querySelector("#monthModalBackdrop"),
  monthModalInput: document.querySelector("#monthModalInput"),
  openSettingsModalButton: document.querySelector("#openSettingsModal"),
  settingsBackdrop: document.querySelector("#settingsModalBackdrop"),
  settingsForm: document.querySelector("#settingsForm"),
  settingsStatus: document.querySelector("#settingsStatus"),
  currentPinField: document.querySelector("#currentPinField"),
  currentPin: document.querySelector("#currentPin"),
  newPin: document.querySelector("#newPin"),
  confirmPin: document.querySelector("#confirmPin"),
  settingsPinError: document.querySelector("#settingsPinError"),
  settingsPinSubmit: document.querySelector("#settingsPinSubmit"),
  disablePinButton: document.querySelector("#disablePinButton"),
  lockScreen: document.querySelector("#lockScreen"),
  lockForm: document.querySelector("#lockForm"),
  lockPin: document.querySelector("#lockPin"),
  lockPinError: document.querySelector("#lockPinError"),
  savingsBackdrop: document.querySelector("#savingsModalBackdrop"),
  savingsManagerList: document.querySelector("#savingsManagerList"),
  savingsForm: document.querySelector("#savingsForm"),
  savingsEditId: document.querySelector("#savingsEditId"),
  savingsName: document.querySelector("#savingsName"),
  savingsAmount: document.querySelector("#savingsAmount"),
  savingsFormHeading: document.querySelector("#savingsFormHeading"),
  savingsSubmit: document.querySelector("#savingsSubmit"),
  debtsBackdrop: document.querySelector("#debtsModalBackdrop"),
  debtsManagerList: document.querySelector("#debtsManagerList"),
  debtsForm: document.querySelector("#debtsForm"),
  debtsEditId: document.querySelector("#debtsEditId"),
  debtsName: document.querySelector("#debtsName"),
  debtsType: document.querySelector("#debtsType"),
  debtsAmount: document.querySelector("#debtsAmount"),
  debtsPayment: document.querySelector("#debtsPayment"),
  debtsTotal: document.querySelector("#debtsTotal"),
  debtsCount: document.querySelector("#debtsCount"),
  debtsLabel: document.querySelector("#debtsLabel"),
  debtsDetails: document.querySelector("#debtsDetails"),
  debtsWidget: document.querySelector("#debtsWidget"),
  debtsWidgetFace: document.querySelector("#debtsWidgetFace"),
  openModalButton: document.querySelector("#openModal"),
  backdrop: document.querySelector("#modalBackdrop"),
  modalTitle: document.querySelector("#modalTitle"),
  modalEyebrow: document.querySelector("#modalBackdrop .eyebrow"),
  form: document.querySelector("#transactionForm"),
  category: document.querySelector("#transactionCategory"),
  transactionName: document.querySelector("#transactionName"),
  transactionAmount: document.querySelector("#transactionAmount"),
  transactionDate: document.querySelector("#transactionDate"),
  transactionSubmit: document.querySelector("#transactionSubmit"),
  categoryBackdrop: document.querySelector("#categoryModalBackdrop"),
  categoryEditorList: document.querySelector("#categoryEditorList"),
  newCategoryName: document.querySelector("#newCategoryName"),
  goalProgress: document.querySelector("#goalProgress"),
  goalRemaining: document.querySelector("#goalRemaining"),
  goalCard: document.querySelector("#goals"),
  goalTitle: document.querySelector("#goalTitle"),
  goalCurrent: document.querySelector("#goalCurrent"),
  goalTarget: document.querySelector("#goalTarget"),
  addToGoal: document.querySelector("#addToGoal"),
  goalSummaryList: document.querySelector("#goalSummaryList"),
  goalBackdrop: document.querySelector("#goalModalBackdrop"),
  goalManagerList: document.querySelector("#goalManagerList"),
  goalForm: document.querySelector("#goalForm"),
  goalEditId: document.querySelector("#goalEditId"),
  goalName: document.querySelector("#goalName"),
  goalTargetInput: document.querySelector("#goalTargetInput"),
  goalSavedInput: document.querySelector("#goalSavedInput"),
  goalFormHeading: document.querySelector("#goalFormHeading"),
  goalSubmit: document.querySelector("#goalSubmit"),
  depositGoalBackdrop: document.querySelector("#depositGoalBackdrop"),
  depositGoalForm: document.querySelector("#depositGoalForm"),
  depositGoalCaption: document.querySelector("#depositGoalCaption"),
  depositGoalAmount: document.querySelector("#depositGoalAmount"),
  depositGoalAvailable: document.querySelector("#depositGoalAvailable"),
  toast: document.querySelector("#toast")
};

function loadTransactions() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.transactions));
  window.saldoPersistData?.("transactions", state.transactions).catch(console.error);
}

function loadCategories() {
  try {
    const stored = JSON.parse(localStorage.getItem(CATEGORY_STORAGE_KEY));
    if (stored && Array.isArray(stored.expense) && Array.isArray(stored.income)) {
      return {
        expense: normalizeCategoryList(stored.expense, DEFAULT_CATEGORIES.expense),
        income: normalizeCategoryList(stored.income, DEFAULT_CATEGORIES.income)
      };
    }
  } catch {
    // The default category lists are used when saved data is invalid.
  }
  return { expense: [...DEFAULT_CATEGORIES.expense], income: [...DEFAULT_CATEGORIES.income] };
}

function normalizeCategoryList(categories, fallback) {
  const unique = [];
  categories.forEach((category) => {
    const name = normalizeCategoryName(category);
    if (name && !unique.some((item) => item.toLocaleLowerCase("ru-RU") === name.toLocaleLowerCase("ru-RU"))) {
      unique.push(name);
    }
  });
  return unique.length ? unique : [...fallback];
}

function normalizeCategoryName(value) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 32);
}

function saveCategories() {
  localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(state.categories));
  window.saldoPersistData?.("categories", state.categories).catch(console.error);
}

function createSavingsId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeSaving(saving) {
  const name = String(saving?.name || "").trim().replace(/\s+/g, " ").slice(0, 48);
  const amount = Number(saving?.amount);
  if (!name || !Number.isFinite(amount) || amount < 0) return null;
  return { id: String(saving.id || createSavingsId()), name, amount: Math.round(amount) };
}

function loadSavings() {
  try {
    const stored = JSON.parse(localStorage.getItem(SAVINGS_STORAGE_KEY));
    if (Array.isArray(stored)) return stored.map(normalizeSaving).filter(Boolean);
  } catch {
    // An empty savings list is used when saved data is invalid.
  }
  return [];
}

function saveSavings() {
  localStorage.setItem(SAVINGS_STORAGE_KEY, JSON.stringify(state.savings));
  window.saldoPersistData?.("savings", state.savings).catch(console.error);
}

function loadExpensePlans() {
  try {
    const stored = JSON.parse(localStorage.getItem(EXPENSE_PLANS_STORAGE_KEY));
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) return {};
    const normalizePlan = (plan) => Object.fromEntries(Object.entries(plan || {})
      .map(([category, amount]) => [normalizeCategoryName(category), Math.round(Number(amount))])
      .filter(([category, amount]) => category && Number.isFinite(amount) && amount >= 0));

    const monthPlans = Object.fromEntries(Object.entries(stored)
      .filter(([month, plan]) => /^\d{4}-(0[1-9]|1[0-2])$/.test(month) && plan && typeof plan === "object" && !Array.isArray(plan))
      .map(([month, plan]) => [month, normalizePlan(plan)]));
    if (Object.keys(monthPlans).length) return monthPlans;

    const legacyPlan = normalizePlan(stored);
    if (Object.keys(legacyPlan).length) {
      expensePlansMigrated = true;
      return { [getMonthKey(new Date())]: legacyPlan };
    }
    return {};
  } catch {
    return {};
  }
}

function saveExpensePlans() {
  localStorage.setItem(EXPENSE_PLANS_STORAGE_KEY, JSON.stringify(state.expensePlans));
  window.saldoPersistData?.("expensePlans", state.expensePlans).catch(console.error);
}

function createDebtId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeDebt(debt) {
  const name = String(debt?.name || "").trim().replace(/\s+/g, " ").slice(0, 48);
  const amount = Number(debt?.amount);
  const payment = Number(debt?.payment || 0);
  const type = ["Кредит", "Займ", "Долг", "Другое"].includes(debt?.type) ? debt.type : "Другое";
  if (!name || !Number.isFinite(amount) || amount < 0 || !Number.isFinite(payment) || payment < 0) return null;
  return { id: String(debt.id || createDebtId()), name, type, amount: Math.round(amount), payment: Math.round(payment) };
}

function loadDebts() {
  try {
    const stored = JSON.parse(localStorage.getItem(DEBTS_STORAGE_KEY));
    if (Array.isArray(stored)) return stored.map(normalizeDebt).filter(Boolean);
  } catch {
    // An empty debts list is used when saved data is invalid.
  }
  return [];
}

function saveDebts() {
  localStorage.setItem(DEBTS_STORAGE_KEY, JSON.stringify(state.debts));
  window.saldoPersistData?.("debts", state.debts).catch(console.error);
}

async function savePin() {
  localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify({ pin: state.pin }));
  if (typeof window.saldoPersistData !== "function") throw new Error("Firebase Firestore не подключён.");
  await window.saldoPersistData("pin", state.pin);
}

function createGoalId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeGoal(goal) {
  const name = String(goal?.name || "").trim().replace(/\s+/g, " ").slice(0, 48);
  const target = Number(goal?.target);
  const saved = Number(goal?.saved);
  if (!name || !Number.isFinite(target) || target <= 0 || !Number.isFinite(saved) || saved < 0 || saved > target) return null;
  return { id: String(goal.id || createGoalId()), name, target: Math.round(target), saved: Math.round(saved) };
}

function loadGoals() {
  try {
    const stored = JSON.parse(localStorage.getItem(GOALS_STORAGE_KEY));
    if (Array.isArray(stored)) {
      const goals = stored.map(normalizeGoal).filter(Boolean);
      return goals;
    }
  } catch {
    // The legacy single goal is restored below when saved data is invalid.
  }

  return [];
}

function saveGoals() {
  localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(state.goals));
  if (state.activeGoalId) localStorage.setItem(ACTIVE_GOAL_STORAGE_KEY, state.activeGoalId);
  else localStorage.removeItem(ACTIVE_GOAL_STORAGE_KEY);
  window.saldoPersistData?.("goals", state.goals).catch(console.error);
  window.saldoPersistData?.("activeGoalId", state.activeGoalId).catch(console.error);
}

function getActiveGoal() {
  let goal = state.goals.find((item) => item.id === state.activeGoalId);
  if (!goal && state.goals.length) {
    [goal] = state.goals;
    state.activeGoalId = goal.id;
    saveGoals();
  }
  return goal || null;
}

function money(amount) {
  return `${formatter.format(Math.round(amount))} ₽`;
}

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getSelectedMonthTransactions() {
  return state.transactions.filter((item) => item.date?.slice(0, 7) === state.month);
}

function getTodayKey() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function getPostedTransactions(transactions) {
  const today = getTodayKey();
  return transactions.filter((item) => item.date && item.date <= today);
}

function getExpectedTransactions(transactions) {
  const today = getTodayKey();
  return transactions.filter((item) => item.date && item.date > today);
}

function getPreviousMonthKey(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return getMonthKey(new Date(year, month - 2, 1));
}

function formatChange(current, previous) {
  if (previous === 0) return current === 0 ? "0%" : "—";
  const change = ((current - previous) / Math.abs(previous)) * 100;
  const sign = change > 0 ? "+" : change < 0 ? "−" : "";
  return `${sign}${Math.abs(change).toLocaleString("ru-RU", { maximumFractionDigits: 1 })}%`;
}

function hasNegativeChange(current, previous) {
  return previous !== 0 && current < previous;
}

function formatMonth(monthValue) {
  const [year, month] = monthValue.split("-").map(Number);
  const label = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function applySelectedMonth(monthValue) {
  if (!monthValue) return;
  state.month = monthValue;
  elements.monthSelect.value = monthValue;
  elements.selectedMonthLabel.textContent = formatMonth(monthValue);
  renderSummary();
  renderBarChart();
  renderCategoryPanel();
  renderExpensePlan();
  renderTransactions();
}

function getSelectedMonthDayCount() {
  const [year, month] = state.month.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  return getMonthKey(today) === state.month ? Math.min(today.getDate(), daysInMonth) : daysInMonth;
}

function sumByType(type, transactions = state.transactions) {
  return transactions.filter((item) => item.type === type).reduce((sum, item) => sum + item.amount, 0);
}

function isGoalExpenseCategory(category) {
  return category === GOAL_EXPENSE_CATEGORY;
}

function withoutGoalExpenses(transactions) {
  return transactions.filter((item) => !isGoalExpenseCategory(item.category));
}

function getOperatingExpenseCategories() {
  return state.categories.expense.filter((category) => !isGoalExpenseCategory(category));
}

function getDateParts(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return { date, day: date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) };
}

function renderCurrentDate() {
  const date = new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  document.querySelector("#currentDate").textContent = date.charAt(0).toUpperCase() + date.slice(1);
}

function renderSummary() {
  const monthTransactions = getPostedTransactions(getSelectedMonthTransactions());
  const previousMonthTransactions = getPostedTransactions(state.transactions.filter((item) => item.date?.slice(0, 7) === getPreviousMonthKey(state.month)));
  const cumulativeTransactions = getPostedTransactions(state.transactions.filter((item) => item.date?.slice(0, 7) <= state.month));
  const previousCumulativeTransactions = getPostedTransactions(state.transactions.filter((item) => item.date?.slice(0, 7) <= getPreviousMonthKey(state.month)));
  const income = sumByType("income", monthTransactions);
  const expectedIncome = sumByType("income", getExpectedTransactions(getSelectedMonthTransactions()));
  const expense = sumByType("expense", withoutGoalExpenses(monthTransactions));
  const previousIncome = sumByType("income", previousMonthTransactions);
  const previousExpense = sumByType("expense", withoutGoalExpenses(previousMonthTransactions));
  const balance = sumByType("income", cumulativeTransactions) - sumByType("expense", cumulativeTransactions);
  const previousBalance = sumByType("income", previousCumulativeTransactions) - sumByType("expense", previousCumulativeTransactions);
  const daysInPeriod = getSelectedMonthDayCount();
  const financialsVisible = state.balanceVisible;
  elements.income.textContent = financialsVisible ? money(income) : "•••••• ₽";
  elements.incomeExpected.textContent = financialsVisible ? money(expectedIncome) : "•••••• ₽";
  elements.expense.textContent = financialsVisible ? money(expense) : "•••••• ₽";
  elements.incomeChange.textContent = financialsVisible ? formatChange(income, previousIncome) : "••••";
  elements.expenseChange.textContent = financialsVisible ? formatChange(expense, previousExpense) : "••••";
  elements.incomeChange.classList.toggle("negative-change", financialsVisible && hasNegativeChange(income, previousIncome));
  elements.expenseChange.classList.toggle("negative-change", financialsVisible && hasNegativeChange(expense, previousExpense));
  elements.dailyExpense.textContent = financialsVisible ? money(expense / daysInPeriod) : "•••••• ₽";
  elements.dailyExpensePeriod.textContent = `за ${daysInPeriod} ${pluralizeDays(daysInPeriod)}`;
  renderBalanceWidget(balance, previousBalance);
  renderDebtsSummary();
}

function renderDebtsSummary() {
  const total = state.debts.reduce((sum, debt) => sum + debt.amount, 0);
  const count = state.debts.length;
  const remainder = count % 100;
  const word = remainder >= 11 && remainder <= 14 ? "обязательств" : count % 10 === 1 ? "обязательство" : count % 10 >= 2 && count % 10 <= 4 ? "обязательства" : "обязательств";
  const debt = state.debts[state.debtViewIndex];
  const financialsVisible = state.balanceVisible;
  const hiddenAmount = "•••••• ₽";
  if (debt) {
    elements.debtsLabel.textContent = `${debt.type} · ${debt.name}`;
    elements.debtsTotal.textContent = financialsVisible ? money(debt.amount) : hiddenAmount;
    elements.debtsDetails.innerHTML = `<span>Платёж в месяц</span><b>${financialsVisible ? money(debt.payment) : hiddenAmount}</b>`;
    elements.debtsWidget.setAttribute("aria-label", financialsVisible ? `${debt.type} ${debt.name}, остаток ${money(debt.amount)}. Нажмите, чтобы перейти дальше` : `${debt.type} ${debt.name}. Финансовые данные скрыты. Нажмите, чтобы перейти дальше`);
  } else {
    elements.debtsLabel.textContent = "Общий долг";
    elements.debtsTotal.textContent = financialsVisible ? money(total) : hiddenAmount;
    elements.debtsDetails.innerHTML = `<b>${financialsVisible ? `${count} ${word}` : "данные скрыты"}</b>`;
    elements.debtsWidget.setAttribute("aria-label", financialsVisible ? `Общий долг ${money(total)}, ${count} ${word}. Нажмите, чтобы посмотреть обязательства` : "Данные по обязательствам скрыты. Нажмите, чтобы посмотреть обязательства");
  }
}

function toggleDebtsWidget() {
  if (!state.debts.length) return;
  elements.debtsWidgetFace.classList.remove("debt-card-flipping");
  void elements.debtsWidgetFace.offsetWidth;
  state.debtViewIndex = state.debtViewIndex >= state.debts.length - 1 ? -1 : state.debtViewIndex + 1;
  renderDebtsSummary();
  elements.debtsWidgetFace.classList.add("debt-card-flipping");
  window.setTimeout(() => elements.debtsWidgetFace.classList.remove("debt-card-flipping"), 520);
}

function renderBalanceWidget(balance, previousBalance) {
  const showingSavings = state.summaryMode === "savings";
  const summaryVisible = showingSavings ? state.savingsVisible : state.balanceVisible;
  const totalSavings = state.savings.reduce((sum, saving) => sum + saving.amount, 0);
  elements.balanceWidget.classList.toggle("showing-savings", showingSavings);
  elements.balance.classList.toggle("negative-balance", !showingSavings && balance < 0);
  elements.balanceWidget.setAttribute("aria-label", showingSavings ? "Показать свободный баланс" : "Показать сбережения");
  elements.balanceLabel.textContent = showingSavings ? "Сбережения" : "Свободный баланс";
  elements.balance.textContent = summaryVisible ? money(showingSavings ? totalSavings : balance) : "•••••• ₽";
  if (showingSavings) {
    elements.balancePill.textContent = `${state.savings.length} ${pluralizeSavings(state.savings.length)}`;
    elements.balanceDescription.textContent = state.savings.length ? "накоплено в копилках" : "добавьте первое сбережение";
    elements.balancePill.classList.remove("negative-change");
  } else {
    elements.balancePill.textContent = formatChange(balance, previousBalance);
    elements.balanceDescription.textContent = "к предыдущему месяцу";
    elements.balancePill.classList.toggle("negative-change", summaryVisible && hasNegativeChange(balance, previousBalance));
  }
  elements.balanceCode.textContent = showingSavings ? "SAVINGS / 02" : "BALANCE / 01";
  elements.balanceVisibility.setAttribute("aria-label", summaryVisible ? `Скрыть ${showingSavings ? "сбережения" : "баланс"}` : `Показать ${showingSavings ? "сбережения" : "баланс"}`);
  elements.openSavingsButton.hidden = !showingSavings;
  elements.savingsWidgetList.innerHTML = showingSavings
    ? state.savings.length
      ? state.savings.slice(0, 2).map((saving) => `<span class="savings-widget-item"><span>${escapeHtml(saving.name)}</span><strong>${summaryVisible ? money(saving.amount) : "•••••• ₽"}</strong></span>`).join("") + (state.savings.length > 2 ? `<span class="savings-widget-more">ещё ${state.savings.length - 2}</span>` : "")
      : '<span class="savings-widget-empty">Нажмите «Управлять», чтобы добавить копилку.</span>'
    : "";
}

function pluralizeSavings(count) {
  const remainder = count % 100;
  if (remainder >= 11 && remainder <= 14) return "копилок";
  switch (count % 10) {
    case 1: return "копилка";
    case 2:
    case 3:
    case 4: return "копилки";
    default: return "копилок";
  }
}

function pluralizeDays(days) {
  const remainder = days % 100;
  if (remainder >= 11 && remainder <= 14) return "дней";
  switch (days % 10) {
    case 1: return "день";
    case 2:
    case 3:
    case 4: return "дня";
    default: return "дней";
  }
}

function getPeriodDays() {
  const period = document.querySelector("#periodSelect").value;
  const [year, month] = state.month.split("-").map(Number);
  const lastDay = getSelectedMonthDayCount();
  const points = period === "week" ? Math.min(7, lastDay) : Math.min(12, lastDay);
  const firstDay = period === "week" ? Math.max(1, lastDay - points + 1) : 1;

  return Array.from({ length: points }, (_, index) => {
    const day = period === "week"
      ? firstDay + index
      : Math.round(1 + ((lastDay - 1) * index) / Math.max(1, points - 1));
    return new Date(year, month - 1, day, 12);
  });
}

function renderBarChart() {
  const days = getPeriodDays();
  const data = days.map((date) => {
    const key = date.toISOString().slice(0, 10);
    const entries = state.transactions.filter((item) => item.date === key);
    const expensesByCategory = entries
      .filter((item) => item.type === "expense")
      .reduce((groups, item) => {
        groups[item.category] = (groups[item.category] || 0) + item.amount;
        return groups;
      }, {});
    return {
      label: String(date.getDate()),
      income: entries.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0),
      expense: Object.values(expensesByCategory).reduce((sum, amount) => sum + amount, 0),
      expensesByCategory
    };
  });
  const maxValue = Math.max(...data.flatMap((item) => [item.income, item.expense]), 10000);
  elements.barChart.style.gridTemplateColumns = `repeat(${days.length}, 1fr)`;
  elements.barChart.innerHTML = data.map((item) => {
    const incomeHeight = item.income ? Math.max(5, Math.round((item.income / maxValue) * 100)) : 0;
    const expenseHeight = item.expense ? Math.max(5, Math.round((item.expense / maxValue) * 100)) : 0;
    const expenseSegments = Object.entries(item.expensesByCategory).map(([category, amount]) => {
      const color = palette[category] || palette["Другое"];
      return `<i class="expense-segment" style="flex:${amount};background:${color}" title="${escapeHtml(category)}: ${money(amount)}"></i>`;
    }).join("");
    const incomeBar = incomeHeight ? `<i class="bar income" style="height:${incomeHeight}%"></i>` : "";
    const expenseBar = expenseHeight ? `<span class="expense-stack" style="height:${expenseHeight}%">${expenseSegments}</span>` : "";
    return `<div class="bar-day" title="${item.label} число: доходы ${money(item.income)}, расходы ${money(item.expense)}">${incomeBar}${expenseBar}<span class="day-label">${item.label}</span></div>`;
  }).join("");

  const expenseCategories = [...new Set(data.flatMap((item) => Object.keys(item.expensesByCategory)))];
  elements.expenseScale.innerHTML = expenseCategories.length
    ? expenseCategories.map((category) => `<span><i style="background:${palette[category] || palette["Другое"]}"></i>${escapeHtml(category)}</span>`).join("")
    : '<span class="expense-scale-empty">Расходов за этот период нет</span>';

  const peakDay = data.reduce((peak, item) => item.expense > peak.expense ? item : peak, { expense: 0 });
  elements.chartPeakDay.textContent = peakDay.expense ? `${peakDay.label} · ${money(peakDay.expense)}` : "нет расходов";
}

function renderExpensePlan() {
  const expenses = withoutGoalExpenses(getPostedTransactions(getSelectedMonthTransactions()).filter((item) => item.type === "expense"));
  const actualByCategory = expenses.reduce((totals, item) => {
    totals[item.category] = (totals[item.category] || 0) + item.amount;
    return totals;
  }, {});
  const categories = getOperatingExpenseCategories();
  const monthPlans = state.expensePlans[state.month] || {};
  const expectedTotal = categories.reduce((sum, category) => sum + (monthPlans[category] || 0), 0);
  const actualTotal = Object.values(actualByCategory).reduce((sum, amount) => sum + amount, 0);
  const difference = expectedTotal - actualTotal;
  const scale = Math.max(expectedTotal, actualTotal, 1);

  elements.expensePlanHint.textContent = `План на ${formatMonth(state.month).toLocaleLowerCase("ru-RU")}`;
  elements.expensePlanExpected.textContent = money(expectedTotal);
  elements.expensePlanActual.textContent = money(actualTotal);
  elements.expensePlanDifference.textContent = `${difference < 0 ? "−" : ""}${money(Math.abs(difference))}`;
  elements.expensePlanDifference.classList.toggle("negative", difference < 0);
  elements.expensePlanExpectedBar.style.width = `${(expectedTotal / scale) * 100}%`;
  elements.expensePlanActualBar.style.width = `${(actualTotal / scale) * 100}%`;
  elements.expensePlanDifferenceBar.style.width = `${(Math.abs(difference) / scale) * 100}%`;
  elements.expensePlanDifferenceBar.parentElement.classList.toggle("negative", difference < 0);
  elements.expensePlanRows.innerHTML = categories.map((category) => {
    const expected = monthPlans[category] || 0;
    const actual = actualByCategory[category] || 0;
    const difference = expected - actual;
    return `<tr><th scope="row">${escapeHtml(category)}</th><td><input class="expense-plan-input" type="number" min="0" step="1" value="${expected}" data-expense-plan-category="${escapeHtml(category)}" aria-label="Предполагаемые расходы: ${escapeHtml(category)}" /></td><td>${money(actual)}</td><td class="expense-plan-difference ${difference < 0 ? "negative" : ""}">${difference < 0 ? "−" : ""}${money(Math.abs(difference))}</td></tr>`;
  }).join("") || '<tr><td colspan="4" class="expense-plan-empty">Добавьте категории расходов, чтобы составить план.</td></tr>';
}

function saveExpensePlan(event) {
  const input = event.target.closest(".expense-plan-input");
  if (!input) return;
  const category = input.dataset.expensePlanCategory;
  const amount = Number(input.value);
  if (!category || !Number.isFinite(amount) || amount < 0) return;
  state.expensePlans[state.month] ||= {};
  state.expensePlans[state.month][category] = Math.round(amount);
  saveExpensePlans();
  renderExpensePlan();
}

function renderCategories() {
  const expenses = getSelectedMonthTransactions().filter((item) => item.type === "expense");
  const grouped = expenses.reduce((groups, item) => {
    groups[item.category] = (groups[item.category] || 0) + item.amount;
    return groups;
  }, {});
  const sorted = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
  const total = expenses.reduce((sum, item) => sum + item.amount, 0);
  const items = sorted.slice(0, 3);
  const remaining = total - items.reduce((sum, [, amount]) => sum + amount, 0);
  if (remaining > 0) items.push(["Остальные", remaining]);
  const colors = items.map(([category]) => category === "Остальные" ? "#aab3c0" : palette[category] || palette["Другое"]);
  let progress = 0;
  const gradient = items.map(([category, value], index) => {
    const end = progress + (total ? (value / total) * 100 : 0);
    const segment = `${colors[index]} ${progress}% ${end}%`;
    progress = end;
    return segment;
  }).join(", ");
  elements.donut.style.background = total ? `conic-gradient(${gradient})` : "#edf0f4";
  elements.categoryTotal.textContent = money(total);
  elements.categoryList.innerHTML = items.length ? items.map(([category, value], index) => {
    const share = Math.round((value / total) * 100);
    return `<li><div class="category-list-heading"><i style="--category-color:${colors[index]}"></i><span>${escapeHtml(category)}</span><strong>${share}%</strong></div><div class="category-share-track"><b style="--category-color:${colors[index]};width:${share}%"></b></div></li>`;
  }).join("") : '<li class="category-list-empty">Нет расходов за месяц</li>';
}

function openCategoryBreakdown() {
  const totals = getSelectedMonthTransactions()
    .filter((item) => item.type === "expense")
    .reduce((groups, item) => {
      groups[item.category] = (groups[item.category] || 0) + item.amount;
      return groups;
    }, {});
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, amount]) => sum + amount, 0);

  elements.categoryBreakdownPeriod.textContent = formatMonth(state.month);
  elements.categoryBreakdownTotal.textContent = money(total);
  elements.categoryBreakdownList.innerHTML = entries.length
    ? entries.map(([category, amount]) => {
      const color = palette[category] || palette["Другое"];
      const share = total ? Math.round((amount / total) * 100) : 0;
      return `<li><span class="category-breakdown-swatch" style="--category-color:${color}"></span><span class="category-breakdown-name">${escapeHtml(category)}</span><span class="category-breakdown-share">${share}%</span><strong>${money(amount)}</strong></li>`;
    }).join("")
    : '<li class="category-breakdown-empty">За этот месяц расходов нет.</li>';
  elements.categoryBreakdownBackdrop.classList.add("visible");
  elements.categoryBreakdownBackdrop.setAttribute("aria-hidden", "false");
  document.querySelector("#closeCategoryBreakdown").focus();
}

function closeCategoryBreakdown() {
  elements.categoryBreakdownBackdrop.classList.remove("visible");
  elements.categoryBreakdownBackdrop.setAttribute("aria-hidden", "true");
  elements.donut.focus();
}

function renderIncomePanel() {
  const monthIncomeTransactions = getSelectedMonthTransactions().filter((item) => item.type === "income");
  const incomeTransactions = monthIncomeTransactions
    .sort((a, b) => new Date(`${b.date}T12:00`) - new Date(`${a.date}T12:00`))
    .slice(0, 4);

  elements.categoryIncomeTotal.textContent = money(sumByType("income", monthIncomeTransactions));
  elements.categoryIncomeList.innerHTML = incomeTransactions.length
    ? incomeTransactions.map((item) => `<li><span class="income-panel-icon">${icons[item.category] || "↗"}</span><span class="income-panel-info"><strong>${escapeHtml(item.name)}</strong><small>${item.category} · ${getDateParts(item.date).day}</small></span><strong class="income-panel-amount">+${money(item.amount)}</strong></li>`).join("")
    : '<li class="income-panel-empty">Поступлений пока нет.</li>';
}

function renderCategoryPanel() {
  const showingIncome = state.categoryMode === "income";
  elements.categoryPanel.classList.toggle("showing-income", showingIncome);
  elements.categoryPanel.setAttribute("aria-pressed", String(showingIncome));
  elements.categoryPanel.setAttribute("aria-label", showingIncome ? "Показать расходы" : "Показать поступления");
  elements.categoryIndex.textContent = showingIncome ? "02 / ПОСТУПЛЕНИЯ" : "02 / СРЕЗ";
  elements.categoryTitle.textContent = showingIncome ? "Последние поступления" : "Куда уходят деньги";
  elements.categoryHint.textContent = showingIncome ? "Показать расходы ↗" : "Показать доходы ↗";

  if (showingIncome) {
    renderIncomePanel();
  } else {
    renderCategories();
  }
}

function renderTransactions() {
  const matchingTransactions = getSelectedMonthTransactions()
    .filter((item) => state.filter === "all" || item.type === state.filter)
    .sort((a, b) => new Date(`${b.date}T12:00`) - new Date(`${a.date}T12:00`));
  const visible = state.showAllTransactions ? matchingTransactions : matchingTransactions.slice(0, 5);
  elements.showAllButton.textContent = state.showAllTransactions ? "Свернуть журнал" : "Открыть журнал ↗";
  if (!visible.length) {
    elements.transactionList.innerHTML = '<div class="empty-state">Операций за выбранный месяц пока нет</div>';
    return;
  }
  elements.transactionList.innerHTML = visible.map((item) => {
    const date = getDateParts(item.date).day;
    const color = palette[item.category] || "#aab3c0";
    const sign = item.type === "income" ? "+" : "−";
    return `<div class="transaction-row"><span class="transaction-icon" style="background:${color}20;color:${color}">${icons[item.category] || "•"}</span><span><span class="transaction-name">${escapeHtml(item.name)}</span><span class="transaction-category">${escapeHtml(item.category)}</span></span><span class="transaction-date">${date}</span><span class="transaction-amount ${item.type}">${sign}${money(item.amount)}</span><span class="transaction-row-actions"><button class="transaction-edit" type="button" data-transaction-id="${item.id}" aria-label="Редактировать операцию ${escapeHtml(item.name)}">✎</button><button class="transaction-delete" type="button" data-transaction-id="${item.id}" aria-label="Удалить операцию ${escapeHtml(item.name)}">×</button></span></div>`;
  }).join("");
}

function renderGoal() {
  const goal = getActiveGoal();
  const hasGoal = Boolean(goal);
  elements.goalCard.classList.toggle("no-active-goal", !hasGoal);
  elements.addToGoal.disabled = hasGoal && goal.saved >= goal.target;
  renderGoalSummaryList(goal);

  if (!goal) {
    elements.goalTitle.innerHTML = "Добавьте<br />новую цель";
    elements.goalCurrent.textContent = "—";
    elements.goalTarget.textContent = "—";
    elements.goalProgress.style.width = "0%";
    elements.goalRemaining.textContent = "выберите или добавьте цель";
    elements.addToGoal.textContent = "Добавить цель";
    return;
  }

  const capped = Math.min(goal.saved, goal.target);
  elements.goalTitle.textContent = goal.name;
  elements.goalCurrent.textContent = money(goal.saved);
  elements.goalTarget.textContent = money(goal.target);
  elements.goalProgress.style.width = `${(capped / goal.target) * 100}%`;
  elements.goalRemaining.textContent = money(Math.max(0, goal.target - goal.saved));
  elements.addToGoal.innerHTML = goal.saved >= goal.target ? "Цель достигнута ✓" : "Пополнить цель <span>+</span>";
}

function renderGoalSummaryList(activeGoal) {
  elements.goalSummaryList.innerHTML = state.goals.length
    ? state.goals.map((goal) => `<button class="goal-summary-item ${goal.id === activeGoal?.id ? "active" : ""}" type="button" data-goal-summary="${escapeHtml(goal.id)}"><span><strong>${escapeHtml(goal.name)}</strong><small>${money(goal.saved)} / ${money(goal.target)}</small></span><i>${Math.min(100, Math.round((goal.saved / goal.target) * 100))}%</i></button>`).join("")
    : '<p class="goal-summary-empty">Добавьте цель через кнопку «Управлять».</p>';
}

function render() {
  renderCurrentDate();
  renderSummary();
  renderBarChart();
  renderCategoryPanel();
  renderExpensePlan();
  renderTransactions();
  renderGoal();
}

function renderLocalAccount() {
  if (!state.localAccount) return;
  const displayName = state.localAccount.displayName.trim();
  const initial = Array.from(displayName)[0]?.toLocaleUpperCase("ru-RU") || "П";
  elements.profileAvatar.textContent = initial;
  elements.sidebarProfileName.textContent = displayName;
  elements.profilePageAvatar.textContent = initial;
  elements.profilePageName.textContent = displayName;
  document.querySelector("#workspaceLabel").textContent = `Привет, ${displayName}`;
}

function openProfilePage() {
  elements.profilePage.hidden = false;
  document.body.classList.add("profile-open");
}

function closeProfilePage() {
  elements.profilePage.hidden = true;
  document.body.classList.remove("profile-open");
}

function closeLogoutConfirmation() {
  const backdrop = document.querySelector("#logoutConfirmBackdrop");
  backdrop.classList.remove("visible");
  backdrop.setAttribute("aria-hidden", "true");
}

async function logoutFromProfile() {
  const confirmButton = document.querySelector("#confirmLogout");
  confirmButton.disabled = true;
  try {
    await window.saldoFirebaseAuth.logout();
    window.location.replace("register.html?mode=login");
  } catch (error) {
    console.error("Не удалось выйти из аккаунта", error);
    showToast("Не удалось выйти. Проверьте подключение и повторите попытку.");
    closeLogoutConfirmation();
  } finally {
    confirmButton.disabled = false;
  }
}

async function deleteAccount(event) {
  event.preventDefault();
  const form = document.querySelector("#deleteAccountForm");
  const password = document.querySelector("#deleteAccountPassword");
  const errorMessage = document.querySelector("#deleteAccountError");
  const submit = document.querySelector("#confirmDeleteAccount");
  errorMessage.textContent = "";
  submit.disabled = true;
  try {
    const user = window.saldoFirebaseAuth.currentUser;
    await window.saldoFirebaseAuth.deleteAccount(password.value);
    [STORAGE_KEY, GOAL_KEY, GOALS_STORAGE_KEY, ACTIVE_GOAL_STORAGE_KEY, CATEGORY_STORAGE_KEY, SAVINGS_STORAGE_KEY, DEBTS_STORAGE_KEY, PIN_STORAGE_KEY, LOCAL_ACCOUNTS_STORAGE_KEY, LOCAL_SESSION_STORAGE_KEY].forEach((key) => localStorage.removeItem(key));
    if (user) {
      [`saldo-user-cache-v1:${user.uid}`, `saldo-user-pending-v1:${user.uid}`, `saldo-user-profile-v1:${user.uid}`].forEach((key) => localStorage.removeItem(key));
    }
    window.location.replace("register.html");
  } catch (error) {
    if (["auth/invalid-credential", "auth/wrong-password", "auth/user-mismatch"].includes(error?.code)) {
      errorMessage.textContent = "Неверный пароль. Проверьте его и попробуйте снова.";
    } else if (error?.code === "auth/too-many-requests") {
      errorMessage.textContent = "Слишком много попыток. Попробуйте позже.";
    } else {
      errorMessage.textContent = "Не удалось удалить профиль. Проверьте подключение и повторите попытку.";
      console.error("Не удалось удалить профиль", error);
    }
  } finally {
    submit.disabled = false;
  }
}

function updateCategories() {
  const selectedCategory = elements.category.value;
  const categories = state.categories[state.type];
  elements.category.innerHTML = categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("");
  if (categories.includes(selectedCategory)) {
    elements.category.value = selectedCategory;
  }
}

function setTransactionType(type) {
  state.type = type;
  document.querySelectorAll(".type-option").forEach((button) => button.classList.toggle("active", button.dataset.type === type));
  updateCategories();
}

function openModal(transaction) {
  state.editingTransactionId = transaction?.id ?? null;
  setTransactionType(transaction?.type || "expense");
  elements.modalEyebrow.textContent = transaction ? "РЕДАКТИРОВАНИЕ" : "НОВАЯ ЗАПИСЬ";
  elements.modalTitle.textContent = transaction ? "Изменить операцию" : "Добавить операцию";
  elements.transactionSubmit.textContent = transaction ? "Сохранить изменения" : "Сохранить операцию";
  elements.transactionName.value = transaction?.name || "";
  elements.transactionAmount.value = transaction?.amount || "";
  elements.transactionDate.value = transaction?.date || `${state.month}-01`;
  if (transaction && state.categories[state.type].includes(transaction.category)) {
    elements.category.value = transaction.category;
  }
  elements.backdrop.classList.add("visible");
  elements.backdrop.setAttribute("aria-hidden", "false");
  setTimeout(() => elements.transactionName.focus(), 150);
}

function closeModal() {
  elements.backdrop.classList.remove("visible");
  elements.backdrop.setAttribute("aria-hidden", "true");
  state.editingTransactionId = null;
}

function openCategoryModal() {
  state.categoryEditorType = state.type;
  renderCategoryEditor();
  elements.categoryBackdrop.classList.add("visible");
  elements.categoryBackdrop.setAttribute("aria-hidden", "false");
}

function closeCategoryModal() {
  elements.categoryBackdrop.classList.remove("visible");
  elements.categoryBackdrop.setAttribute("aria-hidden", "true");
}

function renderCategoryEditor() {
  document.querySelectorAll(".category-type-option").forEach((button) => button.classList.toggle("active", button.dataset.categoryType === state.categoryEditorType));
  elements.categoryEditorList.innerHTML = state.categories[state.categoryEditorType].map((category, index) => `<div class="category-editor-row"><input data-category-input="${index}" value="${escapeHtml(category)}" maxlength="32" aria-label="Название категории ${escapeHtml(category)}" /><button class="category-save-button" type="button" data-category-index="${index}">Сохранить</button><button class="category-delete-button" type="button" data-category-delete-index="${index}" aria-label="Удалить категорию ${escapeHtml(category)}">×</button></div>`).join("");
  elements.newCategoryName.value = "";
}

function addCategory() {
  const category = normalizeCategoryName(elements.newCategoryName.value);
  const categories = state.categories[state.categoryEditorType];
  if (!category) {
    showToast("Введите название категории");
    return;
  }
  if (categories.some((item) => item.toLocaleLowerCase("ru-RU") === category.toLocaleLowerCase("ru-RU"))) {
    showToast("Такая категория уже есть");
    return;
  }
  categories.push(category);
  saveCategories();
  updateCategories();
  renderCategoryEditor();
  showToast("Категория добавлена");
}

function renameCategory(index) {
  const input = elements.categoryEditorList.querySelector(`[data-category-input="${index}"]`);
  const categories = state.categories[state.categoryEditorType];
  const previousName = categories[index];
  const category = normalizeCategoryName(input?.value);
  if (!category) {
    showToast("Введите название категории");
    return;
  }
  if (category !== previousName && categories.some((item, itemIndex) => itemIndex !== index && item.toLocaleLowerCase("ru-RU") === category.toLocaleLowerCase("ru-RU"))) {
    showToast("Такая категория уже есть");
    return;
  }
  if (category === previousName) return;
  categories[index] = category;
  if (state.categoryEditorType === "expense") {
    Object.values(state.expensePlans).forEach((monthPlans) => {
      if (!Object.hasOwn(monthPlans, previousName)) return;
      monthPlans[category] = monthPlans[previousName];
      delete monthPlans[previousName];
    });
    saveExpensePlans();
  }
  state.transactions.forEach((transaction) => {
    if (transaction.type === state.categoryEditorType && transaction.category === previousName) transaction.category = category;
  });
  saveCategories();
  saveTransactions();
  updateCategories();
  renderCategoryEditor();
  render();
  showToast("Категория обновлена");
}

function deleteCategory(index) {
  const categories = state.categories[state.categoryEditorType];
  const category = categories[index];
  if (!category) return;
  if (categories.length <= 1) {
    showToast("Нельзя удалить последнюю категорию этого типа");
    return;
  }
  const usedCount = state.transactions.filter((transaction) => transaction.type === state.categoryEditorType && transaction.category === category).length;
  const historyNotice = usedCount ? ` Уже записанные операции (${usedCount}) останутся в истории.` : "";
  if (!window.confirm(`Удалить категорию «${category}»?${historyNotice}`)) return;
  categories.splice(index, 1);
  if (state.categoryEditorType === "expense") {
    Object.values(state.expensePlans).forEach((monthPlans) => delete monthPlans[category]);
    saveExpensePlans();
  }
  saveCategories();
  updateCategories();
  renderCategoryEditor();
  render();
  showToast("Категория удалена");
}

function deleteTransaction(id) {
  const transaction = state.transactions.find((item) => item.id === id);
  if (!transaction) return;
  if (!window.confirm(`Удалить операцию «${transaction.name}» на сумму ${money(transaction.amount)}?`)) return;
  state.transactions = state.transactions.filter((item) => item.id !== id);
  saveTransactions();
  render();
  showToast(transaction.type === "income" ? "Доход удалён" : "Расход удалён");
}

function openGoalModal() {
  resetGoalForm();
  renderGoalManager();
  elements.goalBackdrop.classList.add("visible");
  elements.goalBackdrop.setAttribute("aria-hidden", "false");
}

function closeGoalModal() {
  elements.goalBackdrop.classList.remove("visible");
  elements.goalBackdrop.setAttribute("aria-hidden", "true");
}

function openDepositGoalModal() {
  const goal = getActiveGoal();
  if (!goal || goal.saved >= goal.target) return;
  const available = goal.target - goal.saved;
  elements.depositGoalCaption.textContent = goal.name;
  elements.depositGoalAvailable.textContent = money(available);
  elements.depositGoalAmount.value = "";
  elements.depositGoalAmount.max = String(available);
  elements.depositGoalBackdrop.classList.add("visible");
  elements.depositGoalBackdrop.setAttribute("aria-hidden", "false");
  setTimeout(() => elements.depositGoalAmount.focus(), 150);
}

function closeDepositGoalModal() {
  elements.depositGoalBackdrop.classList.remove("visible");
  elements.depositGoalBackdrop.setAttribute("aria-hidden", "true");
  elements.depositGoalForm.reset();
}

function openMonthModal() {
  elements.monthModalInput.value = state.month;
  elements.monthBackdrop.classList.add("visible");
  elements.monthBackdrop.setAttribute("aria-hidden", "false");
  window.setTimeout(() => elements.monthModalInput.focus(), 150);
}

function closeMonthModal() {
  elements.monthBackdrop.classList.remove("visible");
  elements.monthBackdrop.setAttribute("aria-hidden", "true");
}

function openSavingsModal() {
  resetSavingsForm();
  renderSavingsManager();
  elements.savingsBackdrop.classList.add("visible");
  elements.savingsBackdrop.setAttribute("aria-hidden", "false");
  window.setTimeout(() => elements.savingsName.focus(), 150);
}

function closeSavingsModal() {
  elements.savingsBackdrop.classList.remove("visible");
  elements.savingsBackdrop.setAttribute("aria-hidden", "true");
}

function openDebtsModal() {
  resetDebtsForm();
  renderDebtsManager();
  elements.debtsBackdrop.classList.add("visible");
  elements.debtsBackdrop.setAttribute("aria-hidden", "false");
  window.setTimeout(() => elements.debtsName.focus(), 150);
}

function closeDebtsModal() {
  elements.debtsBackdrop.classList.remove("visible");
  elements.debtsBackdrop.setAttribute("aria-hidden", "true");
}

function setSettingsPinError(message) {
  elements.settingsPinError.textContent = message;
}

function renderSettings() {
  const hasPin = Boolean(state.pin);
  elements.settingsStatus.textContent = hasPin
    ? "Защита включена. Для смены или отключения PIN-кода подтвердите текущий код."
    : "Установите PIN-код из четырёх цифр, чтобы закрыть доступ к финансовым данным.";
  elements.currentPinField.hidden = !hasPin;
  elements.currentPin.required = hasPin;
  elements.settingsPinSubmit.textContent = hasPin ? "Сменить PIN-код" : "Включить защиту";
  elements.disablePinButton.hidden = !hasPin;
  elements.settingsForm.reset();
  setSettingsPinError("");
}

function openSettingsModal() {
  renderSettings();
  elements.settingsBackdrop.classList.add("visible");
  elements.settingsBackdrop.setAttribute("aria-hidden", "false");
  window.setTimeout(() => (state.pin ? elements.currentPin : elements.newPin).focus(), 150);
}

function closeSettingsModal() {
  elements.settingsBackdrop.classList.remove("visible");
  elements.settingsBackdrop.setAttribute("aria-hidden", "true");
  elements.settingsForm.reset();
  setSettingsPinError("");
}

function setLockError(message) {
  elements.lockPinError.textContent = message;
  elements.lockPin.setAttribute("aria-invalid", message ? "true" : "false");
}

function lockApp() {
  elements.appLoader.hidden = true;
  state.pinUnlocked = false;
  document.body.classList.remove("app-ready");
  elements.lockScreen.hidden = false;
  elements.lockScreen.setAttribute("aria-hidden", "false");
  elements.lockForm.reset();
  setLockError("");
  window.setTimeout(() => elements.lockPin.focus(), 0);
}

function unlockApp() {
  elements.appLoader.hidden = true;
  state.pinUnlocked = true;
  elements.lockScreen.hidden = true;
  elements.lockScreen.setAttribute("aria-hidden", "true");
  document.body.classList.add("app-ready");
  elements.lockForm.reset();
  setLockError("");
  window.setTimeout(() => elements.openModalButton.focus(), 0);
}

function initializePinProtection() {
  if (state.pin) {
    lockApp();
    return;
  }
  unlockApp();
}

async function submitSettingsPin(event) {
  event.preventDefault();
  const currentPin = elements.currentPin.value;
  const newPin = elements.newPin.value;
  const confirmPin = elements.confirmPin.value;

  if (state.pin && currentPin !== state.pin) {
    setSettingsPinError("Введите текущий PIN-код верно.");
    elements.currentPin.focus();
    return;
  }
  if (!isValidPin(newPin)) {
    setSettingsPinError("PIN-код должен состоять из четырёх цифр.");
    elements.newPin.focus();
    return;
  }
  if (newPin !== confirmPin) {
    setSettingsPinError("PIN-коды не совпадают.");
    elements.confirmPin.focus();
    return;
  }

  const wasProtected = Boolean(state.pin);
  const previousPin = state.pin;
  state.pin = newPin;
  elements.settingsPinSubmit.disabled = true;
  try {
    await savePin();
  } catch (error) {
    state.pin = previousPin;
    if (previousPin) localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify({ pin: previousPin }));
    else localStorage.removeItem(PIN_STORAGE_KEY);
    setSettingsPinError("Не удалось сохранить PIN в облаке. Проверьте подключение и повторите попытку.");
    console.error("Не удалось сохранить PIN в Firestore", error);
    return;
  } finally {
    elements.settingsPinSubmit.disabled = false;
  }
  closeSettingsModal();
  if (wasProtected) {
    showToast("PIN-код изменён");
  } else {
    lockApp();
  }
}

async function disablePin() {
  if (!state.pin) return;
  if (elements.currentPin.value !== state.pin) {
    setSettingsPinError("Введите текущий PIN-код верно.");
    elements.currentPin.focus();
    return;
  }
  const previousPin = state.pin;
  state.pin = "";
  localStorage.removeItem(PIN_STORAGE_KEY);
  elements.disablePinButton.disabled = true;
  try {
    if (typeof window.saldoPersistData !== "function") throw new Error("Firebase Firestore не подключён.");
    await window.saldoPersistData("pin", "");
  } catch (error) {
    state.pin = previousPin;
    localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify({ pin: previousPin }));
    setSettingsPinError("Не удалось обновить PIN в облаке. Проверьте подключение и повторите попытку.");
    console.error("Не удалось удалить PIN из Firestore", error);
    return;
  } finally {
    elements.disablePinButton.disabled = false;
  }
  closeSettingsModal();
  showToast("PIN-защита отключена");
}

function submitLockPin(event) {
  event.preventDefault();
  if (elements.lockPin.value !== state.pin) {
    setLockError("Неверный PIN-код. Попробуйте ещё раз.");
    elements.lockPin.select();
    return;
  }
  unlockApp();
}

function restrictPinInput(event) {
  event.target.value = event.target.value.replace(/[^0-9]/g, "").slice(0, 4);
}

function checkLockPinOnComplete() {
  if (elements.lockPin.value.length < 4) {
    setLockError("");
    return;
  }
  elements.lockForm.requestSubmit();
}

function renderDebtsManager() {
  elements.debtsManagerList.innerHTML = state.debts.length
    ? state.debts.map((debt) => `<div class="debts-manager-row"><span><strong>${escapeHtml(debt.name)}</strong><small>${escapeHtml(debt.type)} · остаток ${money(debt.amount)} · платёж ${money(debt.payment)}/мес.</small></span><span class="debts-row-actions"><button class="debts-edit-button" type="button" data-debt-edit="${escapeHtml(debt.id)}" aria-label="Редактировать ${escapeHtml(debt.name)}">✎</button><button class="debts-delete-button" type="button" data-debt-delete="${escapeHtml(debt.id)}" aria-label="Удалить ${escapeHtml(debt.name)}">×</button></span></div>`).join("")
    : '<p class="debts-empty-state">Обязательств пока нет. Добавьте первое ниже.</p>';
}

function resetDebtsForm() {
  elements.debtsEditId.value = "";
  elements.debtsName.value = "";
  elements.debtsType.value = "Кредит";
  elements.debtsAmount.value = "";
  elements.debtsPayment.value = "0";
  document.querySelector("#debtsFormHeading").textContent = "Новое обязательство";
  document.querySelector("#debtsSubmit").textContent = "Добавить обязательство";
}

function saveDebt(event) {
  event.preventDefault();
  const id = elements.debtsEditId.value;
  const debt = normalizeDebt({ id: id || createDebtId(), name: elements.debtsName.value, type: elements.debtsType.value, amount: elements.debtsAmount.value, payment: elements.debtsPayment.value });
  if (!debt) {
    showToast("Проверьте название и суммы обязательства");
    return;
  }
  if (state.debts.some((item) => item.id !== id && item.name.toLocaleLowerCase("ru-RU") === debt.name.toLocaleLowerCase("ru-RU"))) {
    showToast("Обязательство с таким названием уже есть");
    return;
  }
  if (id) {
    const index = state.debts.findIndex((item) => item.id === id);
    if (index < 0) return;
    state.debts[index] = debt;
  } else state.debts.push(debt);
  saveDebts();
  resetDebtsForm();
  renderDebtsManager();
  renderDebtsSummary();
  showToast(id ? "Обязательство обновлено" : "Обязательство добавлено");
}

function handleDebtsManagerClick(event) {
  const editButton = event.target.closest(".debts-edit-button");
  if (editButton) {
    const debt = state.debts.find((item) => item.id === editButton.dataset.debtEdit);
    if (!debt) return;
    elements.debtsEditId.value = debt.id;
    elements.debtsName.value = debt.name;
    elements.debtsType.value = debt.type;
    elements.debtsAmount.value = debt.amount;
    elements.debtsPayment.value = debt.payment;
    document.querySelector("#debtsFormHeading").textContent = "Редактирование обязательства";
    document.querySelector("#debtsSubmit").textContent = "Сохранить изменения";
    elements.debtsName.focus();
    return;
  }
  const deleteButton = event.target.closest(".debts-delete-button");
  if (!deleteButton) return;
  const debt = state.debts.find((item) => item.id === deleteButton.dataset.debtDelete);
  if (!debt || !window.confirm(`Удалить обязательство «${debt.name}»?`)) return;
  state.debts = state.debts.filter((item) => item.id !== debt.id);
  saveDebts();
  renderDebtsManager();
  renderDebtsSummary();
  showToast("Обязательство удалено");
}

function renderSavingsManager() {
  elements.savingsManagerList.innerHTML = state.savings.length
    ? state.savings.map((saving) => `<div class="savings-manager-row"><span><strong>${escapeHtml(saving.name)}</strong><small>${money(saving.amount)}</small></span><span class="savings-row-actions"><button class="savings-edit-button" type="button" data-savings-edit="${escapeHtml(saving.id)}" aria-label="Редактировать сбережение ${escapeHtml(saving.name)}">✎</button><button class="savings-delete-button" type="button" data-savings-delete="${escapeHtml(saving.id)}" aria-label="Удалить сбережение ${escapeHtml(saving.name)}">×</button></span></div>`).join("")
    : '<p class="savings-empty-state">Сбережений пока нет. Добавьте первую копилку ниже.</p>';
}

function resetSavingsForm() {
  elements.savingsEditId.value = "";
  elements.savingsName.value = "";
  elements.savingsAmount.value = "";
  elements.savingsFormHeading.textContent = "Новое сбережение";
  elements.savingsSubmit.textContent = "Добавить сбережение";
}

function editSaving(id) {
  const saving = state.savings.find((item) => item.id === id);
  if (!saving) return;
  elements.savingsEditId.value = saving.id;
  elements.savingsName.value = saving.name;
  elements.savingsAmount.value = saving.amount;
  elements.savingsFormHeading.textContent = "Редактирование сбережения";
  elements.savingsSubmit.textContent = "Сохранить изменения";
  elements.savingsName.focus();
}

function deleteSaving(id) {
  const saving = state.savings.find((item) => item.id === id);
  if (!saving) return;
  if (!window.confirm(`Удалить сбережение «${saving.name}»?`)) return;
  state.savings = state.savings.filter((item) => item.id !== id);
  saveSavings();
  resetSavingsForm();
  renderSavingsManager();
  renderSummary();
  showToast("Сбережение удалено");
}

function saveSaving(event) {
  event.preventDefault();
  const id = elements.savingsEditId.value;
  const name = elements.savingsName.value.trim().replace(/\s+/g, " ").slice(0, 48);
  const amount = Number(elements.savingsAmount.value);
  if (!name || !Number.isFinite(amount) || amount < 0) {
    showToast("Проверьте название и сумму сбережения");
    return;
  }
  if (state.savings.some((saving) => saving.id !== id && saving.name.toLocaleLowerCase("ru-RU") === name.toLocaleLowerCase("ru-RU"))) {
    showToast("Сбережение с таким названием уже есть");
    return;
  }

  if (id) {
    const index = state.savings.findIndex((saving) => saving.id === id);
    if (index === -1) return;
    state.savings[index] = { id, name, amount: Math.round(amount) };
  } else {
    state.savings.push({ id: createSavingsId(), name, amount: Math.round(amount) });
  }
  saveSavings();
  resetSavingsForm();
  renderSavingsManager();
  renderSummary();
  showToast(id ? "Сбережение обновлено" : "Сбережение добавлено");
}

function selectRelativeMonth(offset) {
  const date = new Date();
  date.setMonth(date.getMonth() + offset);
  elements.monthModalInput.value = getMonthKey(date);
}

function depositGoal(event) {
  event.preventDefault();
  const goal = getActiveGoal();
  const amount = Number(elements.depositGoalAmount.value);
  const available = goal ? goal.target - goal.saved : 0;
  if (!goal || !Number.isFinite(amount) || amount <= 0 || amount > available) {
    showToast(`Введите сумму от 1 ₽ до ${money(available)}`);
    return;
  }
  goal.saved += Math.round(amount);
  saveGoals();
  closeDepositGoalModal();
  renderGoal();
  renderGoalManager();
  showToast(`Цель пополнена на ${money(amount)}`);
}

function renderGoalManager() {
  const activeGoal = getActiveGoal();
  elements.goalManagerList.innerHTML = state.goals.length
    ? state.goals.map((goal) => `<div class="goal-manager-row ${goal.id === activeGoal?.id ? "active" : ""}"><button class="goal-select-button" type="button" data-goal-select="${escapeHtml(goal.id)}"><span><strong>${escapeHtml(goal.name)}</strong><small>${money(goal.saved)} из ${money(goal.target)}</small></span><i>${goal.id === activeGoal?.id ? "Активна" : "Выбрать"}</i></button><span class="goal-row-actions"><button class="goal-edit-button" type="button" data-goal-edit="${escapeHtml(goal.id)}" aria-label="Редактировать цель ${escapeHtml(goal.name)}">✎</button><button class="goal-delete-button" type="button" data-goal-delete="${escapeHtml(goal.id)}" aria-label="Удалить цель ${escapeHtml(goal.name)}">×</button></span></div>`).join("")
    : '<p class="goal-empty-state">Целей пока нет. Создайте первую ниже.</p>';
}

function resetGoalForm() {
  elements.goalEditId.value = "";
  elements.goalName.value = "";
  elements.goalTargetInput.value = "";
  elements.goalSavedInput.value = "";
  elements.goalFormHeading.textContent = "Новая цель";
  elements.goalSubmit.textContent = "Добавить цель";
}

function editGoal(id) {
  const goal = state.goals.find((item) => item.id === id);
  if (!goal) return;
  elements.goalEditId.value = goal.id;
  elements.goalName.value = goal.name;
  elements.goalTargetInput.value = goal.target;
  elements.goalSavedInput.value = goal.saved;
  elements.goalFormHeading.textContent = "Редактирование цели";
  elements.goalSubmit.textContent = "Сохранить изменения";
  elements.goalName.focus();
}

function setActiveGoal(id) {
  if (!state.goals.some((goal) => goal.id === id)) return;
  state.activeGoalId = id;
  saveGoals();
  renderGoalManager();
  renderGoal();
  showToast("Активная цель изменена");
}

function deleteGoal(id) {
  const goal = state.goals.find((item) => item.id === id);
  if (!goal) return;
  if (!window.confirm(`Удалить цель «${goal.name}»?`)) return;
  state.goals = state.goals.filter((item) => item.id !== id);
  if (state.activeGoalId === id) state.activeGoalId = state.goals[0]?.id || null;
  saveGoals();
  resetGoalForm();
  renderGoalManager();
  renderGoal();
  showToast("Цель удалена");
}

function saveGoal(event) {
  event.preventDefault();
  const id = elements.goalEditId.value;
  const name = elements.goalName.value.trim().replace(/\s+/g, " ").slice(0, 48);
  const target = Number(elements.goalTargetInput.value);
  const saved = Number(elements.goalSavedInput.value);
  if (!name || !Number.isFinite(target) || target <= 0 || !Number.isFinite(saved) || saved < 0 || saved > target) {
    showToast("Проверьте название и суммы цели");
    return;
  }
  if (state.goals.some((goal) => goal.id !== id && goal.name.toLocaleLowerCase("ru-RU") === name.toLocaleLowerCase("ru-RU"))) {
    showToast("Цель с таким названием уже есть");
    return;
  }

  if (id) {
    const index = state.goals.findIndex((goal) => goal.id === id);
    if (index === -1) return;
    state.goals[index] = { id, name, target: Math.round(target), saved: Math.round(saved) };
  } else {
    const goal = { id: createGoalId(), name, target: Math.round(target), saved: Math.round(saved) };
    state.goals.push(goal);
    state.activeGoalId = goal.id;
  }
  saveGoals();
  resetGoalForm();
  renderGoalManager();
  renderGoal();
  showToast(id ? "Цель обновлена" : "Цель добавлена");
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => elements.toast.classList.remove("visible"), 2600);
}

function escapeHtml(value) {
  const box = document.createElement("div");
  box.textContent = value;
  return box.innerHTML;
}

elements.openModalButton.addEventListener("click", () => openModal());
document.querySelector("#lockButton").addEventListener("click", () => {
  if (!state.pin) {
    showToast("Сначала задайте PIN-код в настройках защиты.");
    return;
  }
  lockApp();
});
document.querySelector("#closeModal").addEventListener("click", closeModal);
elements.backdrop.addEventListener("click", (event) => { if (event.target === elements.backdrop) closeModal(); });
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!state.pinUnlocked) return;
  if (elements.settingsBackdrop.classList.contains("visible")) closeSettingsModal();
  else if (elements.categoryBreakdownBackdrop.classList.contains("visible")) closeCategoryBreakdown();
  else if (elements.debtsBackdrop.classList.contains("visible")) closeDebtsModal();
  else if (elements.savingsBackdrop.classList.contains("visible")) closeSavingsModal();
  else if (elements.monthBackdrop.classList.contains("visible")) closeMonthModal();
  else if (elements.depositGoalBackdrop.classList.contains("visible")) closeDepositGoalModal();
  else if (elements.goalBackdrop.classList.contains("visible")) closeGoalModal();
  else if (elements.categoryBackdrop.classList.contains("visible")) closeCategoryModal();
  else closeModal();
});

document.querySelectorAll(".type-option").forEach((button) => {
  button.addEventListener("click", () => {
    setTransactionType(button.dataset.type);
  });
});

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(elements.form);
  const transactionData = {
    name: formData.get("name").trim(),
    amount: Number(formData.get("amount")),
    category: formData.get("category"),
    date: formData.get("date"),
    type: state.type
  };
  if (!transactionData.name || !Number.isFinite(transactionData.amount) || transactionData.amount <= 0 || !transactionData.date) return;

  const editIndex = state.transactions.findIndex((item) => item.id === state.editingTransactionId);
  const isEditing = editIndex !== -1;
  if (isEditing) {
    state.transactions[editIndex] = { ...state.transactions[editIndex], ...transactionData };
  } else {
    state.transactions.push({ id: Date.now(), ...transactionData });
  }
  saveTransactions();
  elements.form.reset();
  closeModal();
  render();
  showToast(isEditing ? "Операция обновлена" : transactionData.type === "income" ? "Доход добавлен в учёт" : "Расход добавлен в учёт");
});

elements.transactionList.addEventListener("click", (event) => {
  const editButton = event.target.closest(".transaction-edit");
  if (editButton) {
    const transaction = state.transactions.find((item) => item.id === Number(editButton.dataset.transactionId));
    if (transaction) openModal(transaction);
    return;
  }
  const deleteButton = event.target.closest(".transaction-delete");
  if (deleteButton) deleteTransaction(Number(deleteButton.dataset.transactionId));
});
elements.expensePlanRows.addEventListener("change", saveExpensePlan);

document.querySelector("#openCategoryModal").addEventListener("click", openCategoryModal);
document.querySelector("#closeCategoryModal").addEventListener("click", closeCategoryModal);
elements.categoryBackdrop.addEventListener("click", (event) => { if (event.target === elements.categoryBackdrop) closeCategoryModal(); });
document.querySelectorAll(".category-type-option").forEach((button) => {
  button.addEventListener("click", () => {
    state.categoryEditorType = button.dataset.categoryType;
    renderCategoryEditor();
  });
});
document.querySelector("#addCategoryButton").addEventListener("click", addCategory);
elements.newCategoryName.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addCategory();
  }
});
elements.categoryEditorList.addEventListener("click", (event) => {
  const saveButton = event.target.closest(".category-save-button");
  if (saveButton) renameCategory(Number(saveButton.dataset.categoryIndex));
  const deleteButton = event.target.closest(".category-delete-button");
  if (deleteButton) deleteCategory(Number(deleteButton.dataset.categoryDeleteIndex));
});

document.querySelector("#openGoalModal").addEventListener("click", openGoalModal);
document.querySelector("#closeGoalModal").addEventListener("click", closeGoalModal);
elements.goalBackdrop.addEventListener("click", (event) => { if (event.target === elements.goalBackdrop) closeGoalModal(); });
elements.goalForm.addEventListener("submit", saveGoal);
document.querySelector("#resetGoalForm").addEventListener("click", resetGoalForm);
elements.goalManagerList.addEventListener("click", (event) => {
  const editButton = event.target.closest(".goal-edit-button");
  if (editButton) {
    editGoal(editButton.dataset.goalEdit);
    return;
  }
  const deleteButton = event.target.closest(".goal-delete-button");
  if (deleteButton) {
    deleteGoal(deleteButton.dataset.goalDelete);
    return;
  }
  const selectButton = event.target.closest(".goal-select-button");
  if (selectButton) setActiveGoal(selectButton.dataset.goalSelect);
});
elements.goalSummaryList.addEventListener("click", (event) => {
  const goalButton = event.target.closest(".goal-summary-item");
  if (goalButton) setActiveGoal(goalButton.dataset.goalSummary);
});

document.querySelector("#closeDepositGoalModal").addEventListener("click", closeDepositGoalModal);
elements.depositGoalBackdrop.addEventListener("click", (event) => { if (event.target === elements.depositGoalBackdrop) closeDepositGoalModal(); });
elements.depositGoalForm.addEventListener("submit", depositGoal);

elements.openMonthModalButton.addEventListener("click", openMonthModal);
document.querySelector("#closeMonthModal").addEventListener("click", closeMonthModal);
document.querySelector("#cancelMonthModal").addEventListener("click", closeMonthModal);
elements.monthBackdrop.addEventListener("click", (event) => { if (event.target === elements.monthBackdrop) closeMonthModal(); });
document.querySelector("#selectCurrentMonth").addEventListener("click", () => selectRelativeMonth(0));
document.querySelector("#selectPreviousMonth").addEventListener("click", () => selectRelativeMonth(-1));
document.querySelector("#applyMonthModal").addEventListener("click", () => {
  if (!elements.monthModalInput.value) return;
  applySelectedMonth(elements.monthModalInput.value);
  closeMonthModal();
});

elements.openSavingsButton.addEventListener("click", (event) => {
  event.stopPropagation();
  openSavingsModal();
});
document.querySelector("#closeSavingsModal").addEventListener("click", closeSavingsModal);
elements.savingsBackdrop.addEventListener("click", (event) => { if (event.target === elements.savingsBackdrop) closeSavingsModal(); });
elements.savingsForm.addEventListener("submit", saveSaving);
document.querySelector("#resetSavingsForm").addEventListener("click", resetSavingsForm);
elements.savingsManagerList.addEventListener("click", (event) => {
  const editButton = event.target.closest(".savings-edit-button");
  if (editButton) {
    editSaving(editButton.dataset.savingsEdit);
    return;
  }
  const deleteButton = event.target.closest(".savings-delete-button");
  if (deleteButton) deleteSaving(deleteButton.dataset.savingsDelete);
});
document.querySelector("#openDebtsModal").addEventListener("click", openDebtsModal);
elements.debtsWidget.addEventListener("click", (event) => {
  if (event.target.closest("button")) return;
  toggleDebtsWidget();
});
elements.debtsWidget.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  if (event.target.closest("button")) return;
  event.preventDefault();
  toggleDebtsWidget();
});
document.querySelector("#closeDebtsModal").addEventListener("click", closeDebtsModal);
document.querySelector("#resetDebtsForm").addEventListener("click", resetDebtsForm);
elements.debtsBackdrop.addEventListener("click", (event) => { if (event.target === elements.debtsBackdrop) closeDebtsModal(); });
elements.debtsForm.addEventListener("submit", saveDebt);
elements.debtsManagerList.addEventListener("click", handleDebtsManagerClick);

elements.openSettingsModalButton.addEventListener("click", openProfilePage);
document.querySelector("#mobileSettingsButton").addEventListener("click", openProfilePage);
document.querySelector("#mobileProfileButton").addEventListener("click", openProfilePage);
document.querySelector("#mobileAddOperation").addEventListener("click", () => openModal());
document.querySelector("#closeProfilePage").addEventListener("click", closeProfilePage);
document.querySelector("#profilePinButton").addEventListener("click", openSettingsModal);
const deleteAccountBackdrop = document.querySelector("#deleteAccountBackdrop");
const openDeleteAccountDialog = () => {
  document.querySelector("#deleteAccountForm").reset();
  document.querySelector("#deleteAccountError").textContent = "";
  deleteAccountBackdrop.classList.add("visible");
  deleteAccountBackdrop.setAttribute("aria-hidden", "false");
  document.querySelector("#deleteAccountPassword").focus();
};
const closeDeleteAccountDialog = () => {
  deleteAccountBackdrop.classList.remove("visible");
  deleteAccountBackdrop.setAttribute("aria-hidden", "true");
};
document.querySelector("#profileDeleteAccountButton").addEventListener("click", openDeleteAccountDialog);
document.querySelector("#closeDeleteAccount").addEventListener("click", closeDeleteAccountDialog);
document.querySelector("#cancelDeleteAccount").addEventListener("click", closeDeleteAccountDialog);
deleteAccountBackdrop.addEventListener("click", (event) => { if (event.target === deleteAccountBackdrop) closeDeleteAccountDialog(); });
document.querySelector("#deleteAccountForm").addEventListener("submit", deleteAccount);
document.querySelector("#profileInstallButton").addEventListener("click", () => {
  if (typeof window.saldoInstallApp === "function") window.saldoInstallApp();
  else showToast("Установка приложения сейчас недоступна в этом браузере.");
});
document.querySelector("#profileLogoutButton").addEventListener("click", () => {
  const backdrop = document.querySelector("#logoutConfirmBackdrop");
  backdrop.classList.add("visible");
  backdrop.setAttribute("aria-hidden", "false");
});
document.querySelector("#cancelLogout").addEventListener("click", closeLogoutConfirmation);
document.querySelector("#confirmLogout").addEventListener("click", logoutFromProfile);
document.querySelector("#logoutConfirmBackdrop").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) closeLogoutConfirmation();
});
document.querySelector("#closeSettingsModal").addEventListener("click", closeSettingsModal);
elements.settingsBackdrop.addEventListener("click", (event) => { if (event.target === elements.settingsBackdrop) closeSettingsModal(); });
elements.settingsForm.addEventListener("submit", submitSettingsPin);
elements.disablePinButton.addEventListener("click", disablePin);
[elements.currentPin, elements.newPin, elements.confirmPin, elements.lockPin].forEach((input) => input.addEventListener("input", restrictPinInput));
elements.lockPin.addEventListener("input", checkLockPinOnComplete);
elements.lockForm.addEventListener("submit", submitLockPin);

document.querySelectorAll(".filter-button").forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    document.querySelectorAll(".filter-button").forEach((item) => item.classList.toggle("active", item === button));
    renderTransactions();
  });
});

document.querySelector("#periodSelect").addEventListener("change", renderBarChart);
elements.monthSelect.addEventListener("change", () => {
  applySelectedMonth(elements.monthSelect.value);
});
elements.balanceVisibility.addEventListener("click", (event) => {
  event.stopPropagation();
  if (state.summaryMode === "savings") state.savingsVisible = !state.savingsVisible;
  else state.balanceVisible = !state.balanceVisible;
  renderSummary();
});
elements.balanceWidget.addEventListener("click", (event) => {
  if (event.target.closest?.("button")) return;
  state.summaryMode = state.summaryMode === "balance" ? "savings" : "balance";
  renderSummary();
});
elements.balanceWidget.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  if (event.target.closest?.("button")) return;
  event.preventDefault();
  state.summaryMode = state.summaryMode === "balance" ? "savings" : "balance";
  renderSummary();
});
elements.categoryPanel.addEventListener("click", toggleCategoryPanel);
elements.categoryPanel.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    toggleCategoryPanel();
  }
});
elements.donut.addEventListener("click", (event) => {
  event.stopPropagation();
  openCategoryBreakdown();
});
elements.donut.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  event.stopPropagation();
  openCategoryBreakdown();
});
document.querySelector("#closeCategoryBreakdown").addEventListener("click", closeCategoryBreakdown);
elements.categoryBreakdownBackdrop.addEventListener("click", (event) => {
  if (event.target === elements.categoryBreakdownBackdrop) closeCategoryBreakdown();
});
elements.addToGoal.addEventListener("click", () => {
  const goal = getActiveGoal();
  if (!goal) {
    openGoalModal();
    return;
  }
  if (goal.saved >= goal.target) {
    showToast("Эта цель уже достигнута");
    return;
  }
  openDepositGoalModal();
});
elements.showAllButton.addEventListener("click", () => {
  state.showAllTransactions = !state.showAllTransactions;
  renderTransactions();
  document.querySelector("#operations").scrollIntoView({ behavior: "smooth", block: "start" });
});
document.querySelectorAll(".nav-item").forEach((link) => link.addEventListener("click", () => { document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item === link)); }));

function toggleCategoryPanel() {
  state.categoryMode = state.categoryMode === "expense" ? "income" : "expense";
  renderCategoryPanel();
  showToast(state.categoryMode === "income" ? "Показаны последние поступления" : "Показана структура расходов");
}

if (!localStorage.getItem(CATEGORY_STORAGE_KEY)) saveCategories();
if (expensePlansMigrated) saveExpensePlans();
updateCategories();
elements.monthSelect.value = state.month;
elements.selectedMonthLabel.textContent = formatMonth(state.month);
render();
renderLocalAccount();
initializePinProtection();
