"use strict";

const TXN_KEY = "moneymate_transactions_v1";
const BUDGET_KEY = "moneymate_budgets_v1";
const THEME_KEY = "moneymate_theme_v1";

const incomeCategories = ["Salary", "Freelance", "Business", "Gift", "Investment", "Other Income"];
const expenseCategories = ["Food", "Travel", "Shopping", "Rent", "Bills", "Education", "Health", "Entertainment", "Other Expense"];

const defaultTransactions = [
  {
    id: makeId(),
    type: "income",
    title: "Monthly Salary",
    amount: 25000,
    category: "Salary",
    date: todayISO(),
    method: "Bank Transfer",
    note: "Salary credited"
  },
  {
    id: makeId(),
    type: "expense",
    title: "Grocery Shopping",
    amount: 1800,
    category: "Food",
    date: todayISO(),
    method: "UPI",
    note: "Monthly grocery"
  },
  {
    id: makeId(),
    type: "expense",
    title: "Internet Bill",
    amount: 799,
    category: "Bills",
    date: todayISO(),
    method: "UPI",
    note: "Broadband bill"
  }
];

let transactions = loadTransactions();
let budgets = loadBudgets();
let editingId = null;
let modalType = "expense";

const pages = document.querySelectorAll(".page");
const navLinks = document.querySelectorAll("[data-page-link]");
const pageButtons = document.querySelectorAll("[data-page-button]");
const openModalButtons = document.querySelectorAll("[data-open-modal]");
const nav = document.getElementById("nav");
const menuBtn = document.getElementById("menuBtn");
const themeToggle = document.getElementById("themeToggle");
const toast = document.getElementById("toast");

const walletBalance = document.getElementById("walletBalance");
const walletIncome = document.getElementById("walletIncome");
const walletExpense = document.getElementById("walletExpense");
const totalIncome = document.getElementById("totalIncome");
const totalExpense = document.getElementById("totalExpense");
const balanceAmount = document.getElementById("balanceAmount");
const savingsRate = document.getElementById("savingsRate");

const recentList = document.getElementById("recentList");
const recentEmpty = document.getElementById("recentEmpty");
const transactionList = document.getElementById("transactionList");
const transactionEmpty = document.getElementById("transactionEmpty");

const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const categoryFilter = document.getElementById("categoryFilter");
const monthFilter = document.getElementById("monthFilter");
const reportMonthFilter = document.getElementById("reportMonthFilter");

const exportBtn = document.getElementById("exportBtn");
const printBtn = document.getElementById("printBtn");
const clearAllBtn = document.getElementById("clearAllBtn");

const transactionModal = document.getElementById("transactionModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const transactionForm = document.getElementById("transactionForm");
const transactionId = document.getElementById("transactionId");
const transactionType = document.getElementById("transactionType");
const modalEyebrow = document.getElementById("modalEyebrow");
const modalTitle = document.getElementById("modalTitle");
const titleInput = document.getElementById("titleInput");
const amountInput = document.getElementById("amountInput");
const categoryInput = document.getElementById("categoryInput");
const dateInput = document.getElementById("dateInput");
const methodInput = document.getElementById("methodInput");
const noteInput = document.getElementById("noteInput");
const saveTransactionBtn = document.getElementById("saveTransactionBtn");

const budgetForm = document.getElementById("budgetForm");
const budgetMonth = document.getElementById("budgetMonth");
const budgetAmount = document.getElementById("budgetAmount");
const budgetHistory = document.getElementById("budgetHistory");
const budgetEmpty = document.getElementById("budgetEmpty");
const budgetPercent = document.getElementById("budgetPercent");
const budgetMessage = document.getElementById("budgetMessage");
const budgetProgress = document.getElementById("budgetProgress");
const budgetSpent = document.getElementById("budgetSpent");
const budgetLimit = document.getElementById("budgetLimit");

function makeId() {
  return "id_" + Date.now() + "_" + Math.random().toString(16).slice(2);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonthISO() {
  return new Date().toISOString().slice(0, 7);
}

function loadTransactions() {
  const saved = localStorage.getItem(TXN_KEY);
  if (!saved) {
    localStorage.setItem(TXN_KEY, JSON.stringify(defaultTransactions));
    return [...defaultTransactions];
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [...defaultTransactions];
  } catch {
    return [...defaultTransactions];
  }
}

function loadBudgets() {
  try {
    return JSON.parse(localStorage.getItem(BUDGET_KEY)) || {};
  } catch {
    return {};
  }
}

function saveTransactions() {
  localStorage.setItem(TXN_KEY, JSON.stringify(transactions));
}

function saveBudgets() {
  localStorage.setItem(BUDGET_KEY, JSON.stringify(budgets));
}

function formatCurrency(amount) {
  return "₹" + Number(amount).toLocaleString("en-IN");
}

function formatDate(dateString) {
  return new Date(dateString + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

function setPage(pageId) {
  pages.forEach(page => page.classList.toggle("active", page.id === pageId));
  document.querySelectorAll(".nav a").forEach(link => {
    link.classList.toggle("active", link.dataset.pageLink === pageId);
  });

  window.location.hash = pageId;
  nav.classList.remove("open");

  if (pageId === "transactions") renderTransactions();
  if (pageId === "budget") renderBudgetPage();
  if (pageId === "reports") renderReports();
}

function getTotals(list = transactions) {
  const income = list
    .filter(txn => txn.type === "income")
    .reduce((sum, txn) => sum + Number(txn.amount), 0);

  const expense = list
    .filter(txn => txn.type === "expense")
    .reduce((sum, txn) => sum + Number(txn.amount), 0);

  const balance = income - expense;
  const savings = income > 0 ? Math.round((balance / income) * 100) : 0;

  return { income, expense, balance, savings };
}

function getMonthKey(dateString) {
  return dateString.slice(0, 7);
}

function getCurrentMonthTransactions() {
  const month = currentMonthISO();
  return transactions.filter(txn => getMonthKey(txn.date) === month);
}

function renderDashboard() {
  const totals = getTotals(transactions);

  walletBalance.textContent = formatCurrency(totals.balance);
  walletIncome.textContent = formatCurrency(totals.income);
  walletExpense.textContent = formatCurrency(totals.expense);

  totalIncome.textContent = formatCurrency(totals.income);
  totalExpense.textContent = formatCurrency(totals.expense);
  balanceAmount.textContent = formatCurrency(totals.balance);
  savingsRate.textContent = `${totals.savings}%`;

  const recent = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  recentEmpty.style.display = recent.length ? "none" : "block";
  recentList.innerHTML = recent.map(renderTransactionItem).join("");

  renderBudgetWidget();
  renderFilterOptions();
}

function renderBudgetWidget() {
  const month = currentMonthISO();
  const budget = Number(budgets[month] || 0);
  const spent = getCurrentMonthTransactions()
    .filter(txn => txn.type === "expense")
    .reduce((sum, txn) => sum + Number(txn.amount), 0);

  const percent = budget > 0 ? Math.min(999, Math.round((spent / budget) * 100)) : 0;
  const progress = Math.min(percent, 100);

  budgetPercent.textContent = `${percent}%`;
  budgetSpent.textContent = formatCurrency(spent);
  budgetLimit.textContent = formatCurrency(budget);
  budgetProgress.style.width = `${progress}%`;

  if (!budget) {
    budgetMessage.textContent = "Set your monthly budget to start tracking.";
  } else if (spent > budget) {
    budgetMessage.textContent = "You have crossed your monthly budget.";
  } else if (percent >= 80) {
    budgetMessage.textContent = "Careful! You are close to your budget limit.";
  } else {
    budgetMessage.textContent = "Good going! Your spending is under control.";
  }
}

function renderFilterOptions() {
  const allCategories = [...new Set(transactions.map(txn => txn.category))].sort();
  const allMonths = [...new Set(transactions.map(txn => getMonthKey(txn.date)))].sort().reverse();

  const categoryValue = categoryFilter.value;
  categoryFilter.innerHTML = `<option value="">All Categories</option>` +
    allCategories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("");
  categoryFilter.value = categoryValue;

  const monthValue = monthFilter.value;
  monthFilter.innerHTML = `<option value="">All Months</option>` +
    allMonths.map(month => `<option value="${month}">${month}</option>`).join("");
  monthFilter.value = monthValue;

  const reportMonthValue = reportMonthFilter.value;
  reportMonthFilter.innerHTML = `<option value="">All Months</option>` +
    allMonths.map(month => `<option value="${month}">${month}</option>`).join("");
  reportMonthFilter.value = reportMonthValue;
}

function getFilteredTransactions() {
  const query = searchInput.value.toLowerCase().trim();
  const type = typeFilter.value;
  const category = categoryFilter.value;
  const month = monthFilter.value;

  return transactions
    .filter(txn => {
      const matchesQuery =
        txn.title.toLowerCase().includes(query) ||
        txn.category.toLowerCase().includes(query) ||
        (txn.note || "").toLowerCase().includes(query);

      const matchesType = !type || txn.type === type;
      const matchesCategory = !category || txn.category === category;
      const matchesMonth = !month || getMonthKey(txn.date) === month;

      return matchesQuery && matchesType && matchesCategory && matchesMonth;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function renderTransactions() {
  renderFilterOptions();
  const filtered = getFilteredTransactions();

  transactionEmpty.style.display = filtered.length ? "none" : "block";
  transactionList.innerHTML = filtered.map(renderTransactionItem).join("");
}

function renderTransactionItem(txn) {
  const sign = txn.type === "income" ? "+" : "-";
  const icon = txn.type === "income" ? "💰" : "💸";

  return `
    <article class="transaction-item">
      <div class="txn-icon ${txn.type}">${icon}</div>
      <div>
        <h3>${escapeHtml(txn.title)}</h3>
        <p>${escapeHtml(txn.category)} • ${formatDate(txn.date)} • ${escapeHtml(txn.method)}</p>
        ${txn.note ? `<p>${escapeHtml(txn.note)}</p>` : ""}
      </div>
      <div>
        <div class="txn-amount ${txn.type}">${sign}${formatCurrency(txn.amount)}</div>
        <div class="txn-actions">
          <button class="small-btn edit" type="button" onclick="editTransaction('${txn.id}')">Edit</button>
          <button class="small-btn delete" type="button" onclick="deleteTransaction('${txn.id}')">Delete</button>
        </div>
      </div>
    </article>
  `;
}

function openModal(type, txn = null) {
  modalType = type;
  editingId = txn ? txn.id : null;

  transactionType.value = type;
  transactionId.value = txn ? txn.id : "";
  modalEyebrow.textContent = txn ? "Edit Transaction" : type === "income" ? "Add Income" : "Add Expense";
  modalTitle.textContent = txn ? "Update Transaction" : type === "income" ? "Add Income" : "Add Expense";
  saveTransactionBtn.textContent = txn ? "Update Transaction" : "Save Transaction";

  renderCategoryInput(type);

  titleInput.value = txn ? txn.title : "";
  amountInput.value = txn ? txn.amount : "";
  categoryInput.value = txn ? txn.category : "";
  dateInput.value = txn ? txn.date : todayISO();
  methodInput.value = txn ? txn.method : "UPI";
  noteInput.value = txn ? txn.note || "" : "";

  document.querySelectorAll(".error").forEach(el => el.textContent = "");
  transactionModal.classList.add("show");
  transactionModal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  transactionModal.classList.remove("show");
  transactionModal.setAttribute("aria-hidden", "true");
  transactionForm.reset();
  editingId = null;
}

function renderCategoryInput(type) {
  const categories = type === "income" ? incomeCategories : expenseCategories;
  categoryInput.innerHTML = `<option value="">Select Category</option>` +
    categories.map(category => `<option value="${category}">${category}</option>`).join("");
}

function validateTransactionForm() {
  document.querySelectorAll(".error").forEach(el => el.textContent = "");

  let valid = true;

  if (titleInput.value.trim().length < 2) {
    document.getElementById("titleError").textContent = "Title is required.";
    valid = false;
  }

  if (Number(amountInput.value) <= 0) {
    document.getElementById("amountError").textContent = "Amount must be greater than 0.";
    valid = false;
  }

  if (!categoryInput.value) {
    document.getElementById("categoryError").textContent = "Category is required.";
    valid = false;
  }

  if (!dateInput.value) {
    document.getElementById("dateError").textContent = "Date is required.";
    valid = false;
  }

  return valid;
}

function saveTransaction(event) {
  event.preventDefault();

  if (!validateTransactionForm()) {
    showToast("Please fix form errors.");
    return;
  }

  const data = {
    id: transactionId.value || makeId(),
    type: transactionType.value,
    title: titleInput.value.trim(),
    amount: Number(amountInput.value),
    category: categoryInput.value,
    date: dateInput.value,
    method: methodInput.value,
    note: noteInput.value.trim()
  };

  if (transactionId.value) {
    transactions = transactions.map(txn => txn.id === transactionId.value ? data : txn);
    showToast("Transaction updated.");
  } else {
    transactions.unshift(data);
    showToast("Transaction added.");
  }

  saveTransactions();
  closeModal();
  renderAll();
}

function editTransaction(id) {
  const txn = transactions.find(item => item.id === id);
  if (!txn) return;
  openModal(txn.type, txn);
}

function deleteTransaction(id) {
  const txn = transactions.find(item => item.id === id);
  if (!txn) return;

  if (!confirm(`Delete "${txn.title}"?`)) return;

  transactions = transactions.filter(item => item.id !== id);
  saveTransactions();
  renderAll();
  showToast("Transaction deleted.");
}

function renderBudgetPage() {
  budgetMonth.value = budgetMonth.value || currentMonthISO();
  budgetAmount.value = budgets[budgetMonth.value] || "";
  renderBudgetHistory();
}

function renderBudgetHistory() {
  const rows = Object.entries(budgets).sort((a, b) => b[0].localeCompare(a[0]));

  budgetEmpty.style.display = rows.length ? "none" : "block";

  budgetHistory.innerHTML = rows.map(([month, amount]) => {
    const spent = transactions
      .filter(txn => txn.type === "expense" && getMonthKey(txn.date) === month)
      .reduce((sum, txn) => sum + Number(txn.amount), 0);

    const percent = Number(amount) > 0 ? Math.round((spent / Number(amount)) * 100) : 0;

    return `
      <article class="budget-row">
        <div>
          <h3>${month}</h3>
          <p>Spent ${formatCurrency(spent)} of ${formatCurrency(amount)} • ${percent}% used</p>
        </div>
        <button class="small-btn delete" type="button" onclick="deleteBudget('${month}')">Delete</button>
      </article>
    `;
  }).join("");
}

function saveBudget(event) {
  event.preventDefault();

  const month = budgetMonth.value;
  const amount = Number(budgetAmount.value);

  if (!month || amount <= 0) {
    showToast("Enter a valid month and budget amount.");
    return;
  }

  budgets[month] = amount;
  saveBudgets();
  renderAll();
  renderBudgetPage();
  showToast("Budget saved.");
}

function deleteBudget(month) {
  if (!confirm(`Delete budget for ${month}?`)) return;

  delete budgets[month];
  saveBudgets();
  renderAll();
  renderBudgetPage();
  showToast("Budget deleted.");
}

function renderReports() {
  renderFilterOptions();

  const month = reportMonthFilter.value;
  const reportTxns = month ? transactions.filter(txn => getMonthKey(txn.date) === month) : transactions;
  const expenses = reportTxns.filter(txn => txn.type === "expense");
  const income = reportTxns.filter(txn => txn.type === "income");

  const highest = expenses.sort((a, b) => b.amount - a.amount)[0];
  document.getElementById("highestExpense").textContent = highest
    ? `${highest.title} - ${formatCurrency(highest.amount)}`
    : "No data";

  const categoryTotals = {};
  expenses.forEach(txn => {
    categoryTotals[txn.category] = (categoryTotals[txn.category] || 0) + Number(txn.amount);
  });

  const top = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  document.getElementById("topCategory").textContent = top
    ? `${top[0]} - ${formatCurrency(top[1])}`
    : "No data";

  document.getElementById("transactionCount").textContent = reportTxns.length;

  renderCategoryChart(categoryTotals);
  renderIncomeExpenseChart(income, expenses);
}

function renderCategoryChart(categoryTotals) {
  const chart = document.getElementById("categoryChart");
  const entries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  if (!entries.length) {
    chart.innerHTML = `<p class="empty-message" style="display:block;">No expense data available.</p>`;
    return;
  }

  const max = Math.max(...entries.map(item => item[1]));

  chart.innerHTML = entries.map(([category, amount]) => `
    <div class="bar-row">
      <strong>${escapeHtml(category)}</strong>
      <div class="bar-track">
        <div class="bar-fill" style="width:${(amount / max) * 100}%"></div>
      </div>
      <span>${formatCurrency(amount)}</span>
    </div>
  `).join("");
}

function renderIncomeExpenseChart(incomeTxns, expenseTxns) {
  const chart = document.getElementById("incomeExpenseChart");
  const income = incomeTxns.reduce((sum, txn) => sum + Number(txn.amount), 0);
  const expense = expenseTxns.reduce((sum, txn) => sum + Number(txn.amount), 0);
  const max = Math.max(income, expense, 1);

  chart.innerHTML = `
    <div class="bar-row">
      <strong>Income</strong>
      <div class="bar-track">
        <div class="bar-fill" style="width:${(income / max) * 100}%"></div>
      </div>
      <span>${formatCurrency(income)}</span>
    </div>
    <div class="bar-row">
      <strong>Expense</strong>
      <div class="bar-track">
        <div class="bar-fill" style="width:${(expense / max) * 100}%"></div>
      </div>
      <span>${formatCurrency(expense)}</span>
    </div>
  `;
}

function exportCSV() {
  if (!transactions.length) {
    showToast("No transactions to export.");
    return;
  }

  const headers = ["Type", "Title", "Amount", "Category", "Date", "Payment Method", "Note"];
  const rows = transactions.map(txn => [
    txn.type,
    txn.title,
    txn.amount,
    txn.category,
    txn.date,
    txn.method,
    txn.note || ""
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "expense-tracker-transactions.csv";
  link.click();
  URL.revokeObjectURL(link.href);

  showToast("CSV exported.");
}

function clearAllTransactions() {
  if (!transactions.length) return;
  if (!confirm("Delete all transactions?")) return;

  transactions = [];
  saveTransactions();
  renderAll();
  showToast("All transactions cleared.");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderAll() {
  renderDashboard();
  renderTransactions();
  renderBudgetWidget();
  renderReports();
}

navLinks.forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    setPage(link.dataset.pageLink);
  });
});

pageButtons.forEach(button => {
  button.addEventListener("click", () => setPage(button.dataset.pageButton));
});

openModalButtons.forEach(button => {
  button.addEventListener("click", () => openModal(button.dataset.openModal));
});

menuBtn.addEventListener("click", () => nav.classList.toggle("open"));

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem(THEME_KEY, next);
  themeToggle.textContent = next === "dark" ? "☀️ Light" : "🌙 Dark";
});

document.addEventListener("click", event => {
  if (window.innerWidth > 760) return;
  if (!nav.contains(event.target) && !menuBtn.contains(event.target)) {
    nav.classList.remove("open");
  }
});

closeModalBtn.addEventListener("click", closeModal);

transactionModal.addEventListener("click", event => {
  if (event.target === transactionModal) closeModal();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && transactionModal.classList.contains("show")) {
    closeModal();
  }
});

transactionForm.addEventListener("submit", saveTransaction);

[searchInput, typeFilter, categoryFilter, monthFilter].forEach(input => {
  input.addEventListener("input", renderTransactions);
  input.addEventListener("change", renderTransactions);
});

reportMonthFilter.addEventListener("change", renderReports);
budgetForm.addEventListener("submit", saveBudget);
budgetMonth.addEventListener("change", () => {
  budgetAmount.value = budgets[budgetMonth.value] || "";
});

exportBtn.addEventListener("click", exportCSV);
printBtn.addEventListener("click", () => window.print());
clearAllBtn.addEventListener("click", clearAllTransactions);

window.editTransaction = editTransaction;
window.deleteTransaction = deleteTransaction;
window.deleteBudget = deleteBudget;

const savedTheme = localStorage.getItem(THEME_KEY) || "light";
document.documentElement.setAttribute("data-theme", savedTheme);
themeToggle.textContent = savedTheme === "dark" ? "☀️ Light" : "🌙 Dark";

budgetMonth.value = currentMonthISO();
dateInput.value = todayISO();

renderAll();

const initialPage = window.location.hash.replace("#", "");
if (initialPage && document.getElementById(initialPage)) {
  setPage(initialPage);
}
