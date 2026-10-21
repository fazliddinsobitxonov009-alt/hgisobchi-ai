/**
 * HISOBCHI AI — CORE APP LOGIC & PREMIUM UI INTERACTIONS
 */

const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Mahsulot Sotuvi', type: 'income', icon: 'shopping-bag' },
  { id: 'cat-2', name: 'Xizmat Tushumi', type: 'income', icon: 'handshake' },
  { id: 'cat-3', name: 'Xodimlar Oyligi', type: 'expense', icon: 'user-check' },
  { id: 'cat-4', name: 'Ofis Ijarasi', type: 'expense', icon: 'building' },
  { id: 'cat-5', name: 'Kommunal To‘lovlar', type: 'expense', icon: 'zap' },
  { id: 'cat-6', name: 'Xom-ashyo Haridi', type: 'expense', icon: 'box' }
];

const INITIAL_TRANSACTIONS = [
  { id: 't-1', title: 'Savdo tushumi', amount: 5200000, type: 'income', categoryId: 'cat-1', date: getRecentDate(0), note: 'Naqd va karta' },
  { id: 't-2', title: 'Do‘kon ijarasi', amount: 1400000, type: 'expense', categoryId: 'cat-4', date: getRecentDate(1), note: 'Oylik ijara' },
  { id: 't-3', title: 'Oylik maoshlar', amount: 1800000, type: 'expense', categoryId: 'cat-3', date: getRecentDate(2), note: 'Xodimlar uchun' }
];

function getRecentDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

let categories = JSON.parse(localStorage.getItem('h_cats')) || DEFAULT_CATEGORIES;
let transactions = JSON.parse(localStorage.getItem('h_trans')) || INITIAL_TRANSACTIONS;
let activeTransType = 'income';

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initTheme();
  initModals();
  initFilters();
  initCategories();

  updateHeaderDate();
  renderDashboard();
  renderTransactionsTable();
  renderCategoryList();
  populateCategorySelects();
  
  if (typeof lucide !== 'undefined') lucide.createIcons();
});

function saveData() {
  localStorage.setItem('h_cats', JSON.stringify(categories));
  localStorage.setItem('h_trans', JSON.stringify(transactions));
}

function formatUZS(val) {
  return new Intl.NumberFormat('uz-UZ').format(val) + ' UZS';
}

function updateHeaderDate() {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const dateHeader = document.getElementById('currentDateHeader');
  if (dateHeader) {
    dateHeader.innerText = `Sana: ${new Date().toLocaleDateString('uz-UZ', options)}`;
  }
}

function initNav() {
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabViews = document.querySelectorAll('.tab-view');
  const pageTitle = document.getElementById('pageTitle');
  const sidebar = document.getElementById('sidebar');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      navBtns.forEach(b => b.classList.remove('active'));
      tabViews.forEach(v => v.classList.remove('active'));

      btn.classList.add('active');
      const targetView = document.getElementById(tab);
      if (targetView) targetView.classList.add('active');

      const titles = {
        'dashboard': 'Bosh sahifa (Dashboard)',
        'transactions': 'Operatsiyalar Daftari',
        'categories': 'Kategoriyalar'
      };
      if (pageTitle) pageTitle.innerText = titles[tab] || 'Hisobchi AI';

      if (window.innerWidth <= 768 && sidebar) sidebar.classList.remove('mobile-open');
      if (tab === 'dashboard') renderDashboard();
      if (typeof lucide !== 'undefined') lucide.createIcons();
    });
  });

  const mobileToggle = document.getElementById('mobileMenuToggle');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
    });
  }

  const viewAllBtn = document.getElementById('viewAllTransBtn');
  if (viewAllBtn) {
    viewAllBtn.addEventListener('click', () => {
      const transNavBtn = document.querySelector('[data-tab="transactions"]');
      if (transNavBtn) transNavBtn.click();
    });
  }
}

function initTheme() {
  const btn = document.getElementById('themeToggleBtn');
  if (!btn) return;
  const isDark = localStorage.getItem('h_theme') === 'dark';
  if (isDark) document.body.classList.add('dark-mode');

  btn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const darkActive = document.body.classList.contains('dark-mode');
    localStorage.setItem('h_theme', darkActive ? 'dark' : 'light');
    showToast(darkActive ? 'Tungi rejim yoqildi' : 'Kunduzgi rejim yoqildi');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });
}

function showToast(msg) {
  const stack = document.getElementById('toastStack');
  if (!stack) return;
  const item = document.createElement('div');
  item.className = 'toast';
  item.innerHTML = `<i data-lucide="check-circle" style="width:16px; height:16px; color:var(--yellow);"></i> <span>${msg}</span>`;
  stack.appendChild(item);
  if (typeof lucide !== 'undefined') lucide.createIcons();
  setTimeout(() => item.remove(), 3000);
}

function renderDashboard() {
  const curMonth = new Date().getMonth();
  const curYear = new Date().getFullYear();

  let monthInc = 0, monthExp = 0;

  transactions.forEach(t => {
    const d = new Date(t.date);
    if (d.getMonth() === curMonth && d.getFullYear() === curYear) {
      if (t.type === 'income') monthInc += Number(t.amount);
      else monthExp += Number(t.amount);
    }
  });

  const netBalance = monthInc - monthExp;
  const margin = monthInc > 0 ? ((netBalance / monthInc) * 100).toFixed(1) : 0;

  setElementText('heroNetBalance', formatUZS(netBalance));
  setElementText('heroProfitMargin', `Rentabellik: ${margin}%`);
  setElementText('monthIncomeVal', formatUZS(monthInc));
  setElementText('monthExpenseVal', formatUZS(monthExp));

  renderRecentTable();
}

function setElementText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}

function renderRecentTable() {
  const tbody = document.getElementById('recentTransactionsTable');
  if (!tbody) return;
  tbody.innerHTML = '';
  const sorted = [...transactions].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  if (sorted.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Operatsiyalar yo‘q</td></tr>`;
    return;
  }

  sorted.forEach(t => {
    const cat = categories.find(c => c.id === t.categoryId) || { name: 'Boshqa' };
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${t.date}</td>
      <td><strong>${t.title}</strong></td>
      <td>${cat.name}</td>
      <td><span class="badge-tag ${t.type === 'income' ? 'badge-income' : 'badge-expense'}">${t.type === 'income' ? 'Kirim' : 'Chiqim'}</span></td>
      <td style="text-align:right; font-weight:700;">${formatUZS(t.amount)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderTransactionsTable() {
  const tbody = document.getElementById('allTransactionsTable');
  const empty = document.getElementById('emptyState');
  if (!tbody) return;
  tbody.innerHTML = '';

  const q = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const type = document.getElementById('typeFilter')?.value || 'all';
  const cat = document.getElementById('categoryFilter')?.value || 'all';
  const start = document.getElementById('startDateFilter')?.value || '';
  const end = document.getElementById('endDateFilter')?.value || '';

  const filtered = transactions.filter(t => {
    const mQ = t.title.toLowerCase().includes(q) || (t.note && t.note.toLowerCase().includes(q));
    const mType = type === 'all' || t.type === type;
    const mCat = cat === 'all' || t.categoryId === cat;
    let mDate = true;
    if (start && t.date < start) mDate = false;
    if (end && t.date > end) mDate = false;
    return mQ && mType && mCat && mDate;
  }).sort((a,b) => new Date(b.date) - new Date(a.date));

  if (filtered.length === 0) {
    if (empty) empty.classList.remove('hidden');
    return;
  }
  if (empty) empty.classList.add('hidden');

  filtered.forEach(t => {
    const c = categories.find(item => item.id === t.categoryId) || { name: 'Boshqa' };
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${t.date}</td>
      <td><strong>${t.title}</strong>${t.note ? `<div style="font-size:11px; color:var(--text-muted);">${t.note}</div>` : ''}</td>
      <td>${c.name}</td>
      <td><span class="badge-tag ${t.type === 'income' ? 'badge-income' : 'badge-expense'}">${t.type === 'income' ? 'Kirim' : 'Chiqim'}</span></td>
      <td style="font-weight:700;">${formatUZS(t.amount)}</td>
      <td style="text-align: right;">
        <button class="btn btn-outline btn-sm" onclick="editTransaction('${t.id}')"><i data-lucide="edit-2" style="width:12px;height:12px;"></i></button>
        <button class="btn btn-outline btn-sm" style="color:var(--red);" onclick="deleteTransaction('${t.id}')"><i data-lucide="trash-2" style="width:12px;height:12px;"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function initFilters() {
  ['searchInput', 'typeFilter', 'categoryFilter', 'startDateFilter', 'endDateFilter'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', renderTransactionsTable);
  });

  const resetBtn = document.getElementById('resetFiltersBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      ['searchInput', 'startDateFilter', 'endDateFilter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      ['typeFilter', 'categoryFilter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = 'all';
      });
      renderTransactionsTable();
    });
  }

  const exportBtn = document.getElementById('exportCsvBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      if (transactions.length === 0) return;
      let csv = "ID,Sana,Nomi,Turi,Kategoriya,Summa,Izoh\n";
      transactions.forEach(t => {
        const c = categories.find(item => item.id === t.categoryId) || { name: '' };
        csv += `"${t.id}","${t.date}","${t.title}","${t.type}","${c.name}","${t.amount}","${t.note || ''}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `hisobchi_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      showToast('CSV eksport bajarildi');
    });
  }
}

function initModals() {
  const modal = document.getElementById('transactionModal');
  const quickAdd = document.getElementById('quickAddBtn');
  const closeBtn = document.getElementById('closeModalBtn');
  const cancelBtn = document.getElementById('cancelModalBtn');
  const form = document.getElementById('transactionForm');

  if (quickAdd && modal) quickAdd.addEventListener('click', () => openModal());
  if (closeBtn && modal) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  if (cancelBtn && modal) cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));

  const segIncome = document.getElementById('segIncome');
  const segExpense = document.getElementById('segExpense');

  if (segIncome && segExpense) {
    segIncome.addEventListener('click', () => {
      activeTransType = 'income';
      segIncome.classList.add('active');
      segExpense.classList.remove('active');
      populateCategorySelects();
    });

    segExpense.addEventListener('click', () => {
      activeTransType = 'expense';
      segExpense.classList.add('active');
      segIncome.classList.remove('active');
      populateCategorySelects();
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('transId').value;
      const title = document.getElementById('transTitle').value;
      const amount = parseFloat(document.getElementById('transAmount').value);
      const categoryId = document.getElementById('transCategory').value;
      const date = document.getElementById('transDate').value;
      const note = document.getElementById('transNote').value;

      if (id) {
        const idx = transactions.findIndex(t => t.id === id);
        if (idx !== -1) {
          transactions[idx] = { id, title, amount, type: activeTransType, categoryId, date, note };
          showToast('Tranzaksiya tahrirlandi');
        }
      } else {
        transactions.push({ id: 't-' + Date.now(), title, amount, type: activeTransType, categoryId, date, note });
        showToast('Yangi yozuv saqlandi');
      }

      saveData();
      if (modal) modal.classList.add('hidden');
      renderDashboard();
      renderTransactionsTable();
    });
  }
}

function openModal(trans = null) {
  const modal = document.getElementById('transactionModal');
  const form = document.getElementById('transactionForm');
  if (!modal || !form) return;
  form.reset();

  if (trans) {
    document.getElementById('modalTitle').innerText = 'Operatsiyani Tahrirlash';
    document.getElementById('transId').value = trans.id;
    document.getElementById('transTitle').value = trans.title;
    document.getElementById('transAmount').value = trans.amount;
    document.getElementById('transDate').value = trans.date;
    document.getElementById('transNote').value = trans.note || '';
    activeTransType = trans.type;
    populateCategorySelects();
    document.getElementById('transCategory').value = trans.categoryId;

    const segIncome = document.getElementById('segIncome');
    const segExpense = document.getElementById('segExpense');
    if (activeTransType === 'income' && segIncome) segIncome.click();
    else if (segExpense) segExpense.click();
  } else {
    document.getElementById('modalTitle').innerText = 'Yangi Operatsiya';
    document.getElementById('transId').value = '';
    const dateInput = document.getElementById('transDate');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    const segIncome = document.getElementById('segIncome');
    if (segIncome) segIncome.click();
  }
  modal.classList.remove('hidden');
}

window.editTransaction = function(id) {
  const t = transactions.find(item => item.id === id);
  if (t) openModal(t);
};

window.deleteTransaction = function(id) {
  if (confirm('O‘chirishni tasdiqlaysizmi?')) {
    transactions = transactions.filter(t => t.id !== id);
    saveData();
    renderDashboard();
    renderTransactionsTable();
    showToast('Yozuv o‘chirildi');
  }
};

function initCategories() {
  const catForm = document.getElementById('addCategoryForm');
  if (!catForm) return;

  catForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('catNameInput').value;
    const type = document.getElementById('catTypeInput').value;
    const icon = document.getElementById('catIconInput').value || 'tag';

    categories.push({ id: 'cat-' + Date.now(), name, type, icon });
    saveData();
    renderCategoryList();
    populateCategorySelects();
    e.target.reset();
    showToast('Kategoriya saqlandi');
  });
}

function renderCategoryList() {
  const container = document.getElementById('categoryListContainer');
  if (!container) return;
  container.innerHTML = '';
  categories.forEach(c => {
    const li = document.createElement('li');
    li.className = 'category-item';
    li.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px;">
        <i data-lucide="${c.icon}" style="width:16px; height:16px;"></i>
        <span><strong>${c.name}</strong></span>
      </div>
      <div>
        <span class="badge-tag ${c.type === 'income' ? 'badge-income' : 'badge-expense'}">${c.type === 'income' ? 'Kirim' : 'Chiqim'}</span>
        <button class="btn btn-outline btn-sm" style="margin-left:8px; color:var(--red);" onclick="deleteCategory('${c.id}')"><i data-lucide="trash-2" style="width:12px;height:12px;"></i></button>
      </div>
    `;
    container.appendChild(li);
  });
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * HISOBCHI AI — FRONTEND CHAT & FINANCIAL CONTEXT ENGINE
 */

let chatHistory = [];
let isAiLoading = false;

document.addEventListener('DOMContentLoaded', () => {
  const chatSendBtn = document.getElementById('chatSendBtn');
  const chatInput = document.getElementById('chatInput');

  if (chatSendBtn && chatInput) {
    chatSendBtn.addEventListener('click', sendAiMessage);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendAiMessage();
      }
    });
  }
});

// Moliyaviy ko'rsatkichlarni avtomatik hisoblash formulalari
function getFinancialContext() {
  let totalIncome = 0;
  let totalExpense = 0;

  if (typeof transactions !== 'undefined' && Array.isArray(transactions)) {
    transactions.forEach(t => {
      const amount = Number(t.amount);
      if (t.type === 'income') totalIncome += amount;
      else if (t.type === 'expense') totalExpense += amount;
    });
  }

  const netProfit = totalIncome - totalExpense;
  const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : 0;

  return {
    totalIncome,
    totalExpense,
    netProfit,
    profitMargin: Number(profitMargin)
  };
}

// AI Chat xabarini yuborish va qabul qilish
async function sendAiMessage() {
  if (isAiLoading) return;

  const input = document.getElementById('chatInput');
  const msgBox = document.getElementById('chatMessagesBox');
  const sendBtn = document.getElementById('chatSendBtn');

  if (!input || !msgBox) return;

  const text = input.value.trim();
  if (!text) return;

  // Foydalanuvchi xabarini ekranga chiqarish
  appendChatMessage(text, 'user');
  chatHistory.push({ role: 'user', content: text });
  input.value = '';

  isAiLoading = true;
  if (sendBtn) sendBtn.disabled = true;

  // Yuklanish indikatorini qo'shish
  const loadingId = 'loading-' + Date.now();
  appendLoadingIndicator(loadingId);

  const financialContext = getFinancialContext();

  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: chatHistory,
        financialContext: financialContext
      })
    });

    const data = await response.json();
    removeLoadingIndicator(loadingId);

    if (data.success && data.reply) {
      appendChatMessage(data.reply, 'ai');
      chatHistory.push({ role: 'assistant', content: data.reply });
    } else {
      appendChatMessage('Xatolik: ' + (data.error || 'Serverdan javob olinmadi.'), 'error');
    }
  } catch (err) {
    removeLoadingIndicator(loadingId);
    appendChatMessage('Tarmoq xatoligi: Serverga ulanib bo‘lmadi. Server ishlayotganini tekshiring.', 'error');
  } finally {
    isAiLoading = false;
    if (sendBtn) sendBtn.disabled = false;
    input.focus();
  }
}

function appendChatMessage(text, sender) {
  const msgBox = document.getElementById('chatMessagesBox');
  if (!msgBox) return;

  const div = document.createElement('div');
  div.className = `chat-message ${sender === 'user' ? 'user-msg' : sender === 'error' ? 'error-msg' : 'ai-msg'}`;
  
  if (sender === 'user') {
    div.style.cssText = "background: var(--black); color: var(--yellow); padding: 10px 14px; border-radius: var(--radius-sm); max-width: 80%; align-self: flex-end; font-size: 13px; font-weight: 600; margin-bottom: 8px;";
  } else if (sender === 'error') {
    div.style.cssText = "background: rgba(240,68,82,0.1); color: var(--red); padding: 10px 14px; border-radius: var(--radius-sm); max-width: 80%; align-self: center; font-size: 13px; margin-bottom: 8px;";
  } else {
    div.style.cssText = "background: var(--bg-card); color: var(--text-main); padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); max-width: 80%; align-self: flex-start; font-size: 13px; margin-bottom: 8px; line-height: 1.5;";
  }

  div.innerText = text;
  msgBox.appendChild(div);
  msgBox.scrollTop = msgBox.scrollHeight;
}

function appendLoadingIndicator(id) {
  const msgBox = document.getElementById('chatMessagesBox');
  if (!msgBox) return;

  const div = document.createElement('div');
  div.id = id;
  div.className = 'chat-message ai-msg';
  div.style.cssText = "background: var(--bg-card); color: var(--text-muted); padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); max-width: 80%; align-self: flex-start; font-size: 13px; margin-bottom: 8px;";
  div.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="color: var(--yellow); margin-right: 6px;"></i> Hisobchi AI tahlil qilmoqda...`;
  msgBox.appendChild(div);
  msgBox.scrollTop = msgBox.scrollHeight;
}

function removeLoadingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}
function populateCategorySelects() {
  const filterSel = document.getElementById('categoryFilter');
  const modalSel = document.getElementById('transCategory');

  if (filterSel) {
    filterSel.innerHTML = '<option value="all">Barcha kategoriyalar</option>';
    categories.forEach(c => {
      filterSel.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    });
  }

  if (modalSel) {
    modalSel.innerHTML = '';
    categories.forEach(c => {
      if (c.type === activeTransType) {
        modalSel.innerHTML += `<option value="${c.id}">${c.name}</option>`;
      }
    });
  }
}

window.deleteCategory = function(id) {
  if (confirm('Kategoriyani o‘chirasizmi?')) {
    categories = categories.filter(c => c.id !== id);
    saveData();
    renderCategoryList();
    populateCategorySelects();
    showToast('Kategoriya o‘chirildi');
  }
};