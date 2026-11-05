const STORAGE_KEY = 'cadet-uniform-tracker-v1';

const demoUsers = [
  { username: 'headlogistics', password: 'password123', role: 'head', name: 'Head of Logistics' },
  { username: 'officer', password: 'password123', role: 'officer', name: 'Officer' },
  { username: 'cadet', password: 'password123', role: 'cadet', name: 'Cadet' }
];

const defaultStock = [
  {
    itemCode: 'NAVY-SHIRT',
    size: 'M',
    description: 'Navy polo shirt',
    category: 'Uniform',
    received: 12,
    issued: 4,
    returned: 1,
    discarded: 0,
    adjustments: 0,
    reorderLevel: 5
  },
  {
    itemCode: 'NAVY-SHIRT',
    size: 'L',
    description: 'Navy polo shirt',
    category: 'Uniform',
    received: 10,
    issued: 6,
    returned: 1,
    discarded: 0,
    adjustments: 0,
    reorderLevel: 5
  },
  {
    itemCode: 'PANTS-01',
    size: '12',
    description: 'Service pants',
    category: 'Uniform',
    received: 9,
    issued: 2,
    returned: 0,
    discarded: 0,
    adjustments: 1,
    reorderLevel: 4
  },
  {
    itemCode: 'CAP-01',
    size: 'One Size',
    description: 'Service cap',
    category: 'Accessories',
    received: 8,
    issued: 5,
    returned: 0,
    discarded: 0,
    adjustments: 0,
    reorderLevel: 2
  }
];

const defaultCadetIssues = [
  { cadetName: 'Cadet Smith', itemCode: 'NAVY-SHIRT', size: 'M', quantity: 1, issuedAt: '2026-11-01' },
  { cadetName: 'Cadet Jones', itemCode: 'PANTS-01', size: '12', quantity: 1, issuedAt: '2026-11-02' },
  { cadetName: 'Cadet Smith', itemCode: 'CAP-01', size: 'One Size', quantity: 1, issuedAt: '2026-11-03' }
];

const state = {
  currentUser: null,
  users: [],
  stock: [],
  issues: []
};

const els = {
  loginScreen: document.getElementById('loginScreen'),
  dashboardScreen: document.getElementById('dashboardScreen'),
  loginForm: document.getElementById('loginForm'),
  loginError: document.getElementById('loginError'),
  logoutBtn: document.getElementById('logoutBtn'),
  welcomeLabel: document.getElementById('welcomeLabel'),
  statsArea: document.getElementById('statsArea'),
  inventoryTableBody: document.getElementById('inventoryTableBody'),
  cadetKitTableBody: document.getElementById('cadetKitTableBody'),
  inventorySearch: document.getElementById('inventorySearch'),
  statusFilter: document.getElementById('statusFilter'),
  stockForm: document.getElementById('stockForm'),
  movementForm: document.getElementById('movementForm'),
  issueForm: document.getElementById('issueForm'),
  returnForm: document.getElementById('returnForm'),
  headPanel: document.getElementById('headPanel'),
  officerPanel: document.getElementById('officerPanel'),
  cadetPanel: document.getElementById('cadetPanel'),
  exportBtn: document.getElementById('exportBtn'),
  refreshBtn: document.getElementById('refreshBtn'),
  toast: document.getElementById('toast')
};

function seedStorage() {
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  if (!existing) {
    const initial = {
      users: demoUsers,
      stock: defaultStock,
      issues: defaultCadetIssues
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  return existing;
}

function loadState() {
  const data = seedStorage();
  state.users = data.users || demoUsers;
  state.stock = data.stock || defaultStock;
  state.issues = data.issues || defaultCadetIssues;
  const current = JSON.parse(sessionStorage.getItem('cadetTrackerCurrentUser') || 'null');
  state.currentUser = current;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    users: state.users,
    stock: state.stock,
    issues: state.issues
  }));
}

function onHand(item) {
  return item.received - item.issued + item.returned + item.adjustments;
}

function statusFor(item) {
  const total = onHand(item);
  if (total < 0) return 'negative';
  if (total <= item.reorderLevel) return 'reorder';
  return 'ok';
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('visible');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    els.toast.classList.remove('visible');
  }, 2200);
}

function setScreen(isLoggedIn) {
  els.loginScreen.classList.toggle('active', !isLoggedIn);
  els.dashboardScreen.classList.toggle('hidden', !isLoggedIn);
  els.loginScreen.classList.toggle('hidden', isLoggedIn);
}

function renderStats() {
  const totalUnits = state.stock.reduce((sum, item) => sum + onHand(item), 0);
  const reorderItems = state.stock.filter((item) => statusFor(item) !== 'ok').length;
  const uniqueItems = new Set(state.stock.map((item) => `${item.itemCode}|${item.size}`)).size;

  const cards = [
    { label: 'Total on hand', value: totalUnits },
    { label: 'Items to reorder', value: reorderItems },
    { label: 'Tracked item sizes', value: uniqueItems }
  ];

  els.statsArea.innerHTML = cards.map((card) => `
    <article class="stat-card">
      <div class="label">${card.label}</div>
      <div class="value">${card.value}</div>
    </article>
  `).join('');
}

function renderInventoryTable() {
  const query = (els.inventorySearch.value || '').toLowerCase();
  const filter = els.statusFilter.value;

  const rows = state.stock.filter((item) => {
    const haystack = `${item.itemCode} ${item.size} ${item.description} ${item.category}`.toLowerCase();
    const matchesQuery = haystack.includes(query);
    const matchesFilter = filter === 'all' || statusFor(item) === filter;
    return matchesQuery && matchesFilter;
  });

  if (!rows.length) {
    els.inventoryTableBody.innerHTML = `
      <tr>
        <td colspan="11">No inventory matches the current search or filter.</td>
      </tr>
    `;
    return;
  }

  els.inventoryTableBody.innerHTML = rows.map((item) => {
    const total = onHand(item);
    const badgeClass = total < 0 ? 'negative' : total <= item.reorderLevel ? 'warning' : 'ok';
    const badgeLabel = total < 0 ? 'Negative stock' : total <= item.reorderLevel ? 'To reorder' : 'In stock';

    return `
      <tr>
        <td><strong>${item.description}</strong><br><small>${item.itemCode}</small></td>
        <td>${item.size}</td>
        <td>${item.category || 'Uniform'}</td>
        <td>${item.received}</td>
        <td>${item.issued}</td>
        <td>${item.returned}</td>
        <td>${item.discarded}</td>
        <td>${item.adjustments}</td>
        <td>${total}</td>
        <td>${item.reorderLevel}</td>
        <td><span class="badge ${badgeClass}">${badgeLabel}</span></td>
      </tr>
    `;
  }).join('');
}

function renderCadetKit() {
  if (!state.currentUser || state.currentUser.role !== 'cadet') {
    els.cadetKitTableBody.innerHTML = '';
    return;
  }

  const entries = state.issues.filter((issue) => issue.cadetName.toLowerCase() === state.currentUser.name.toLowerCase());

  if (!entries.length) {
    els.cadetKitTableBody.innerHTML = `
      <tr>
        <td colspan="5">No issued kit currently assigned.</td>
      </tr>
    `;
    return;
  }

  els.cadetKitTableBody.innerHTML = entries.map((entry) => `
    <tr>
      <td>${entry.cadetName}</td>
      <td>${entry.itemCode}</td>
      <td>${entry.size}</td>
      <td>${entry.quantity}</td>
      <td>${entry.issuedAt}</td>
    </tr>
  `).join('');
}

function renderRolePanels() {
  const role = state.currentUser?.role;

  els.headPanel.classList.toggle('hidden', role !== 'head');
  els.officerPanel.classList.toggle('hidden', role !== 'officer' && role !== 'head');
  els.cadetPanel.classList.toggle('hidden', role !== 'cadet');
}

function renderDashboard() {
  if (!state.currentUser) {
    setScreen(false);
    return;
  }

  setScreen(true);
  els.welcomeLabel.textContent = `${state.currentUser.name} dashboard`;
  renderStats();
  renderInventoryTable();
  renderCadetKit();
  renderRolePanels();
}

function handleLogin(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const username = String(formData.get('username') || '').trim();
  const password = String(formData.get('password') || '').trim();

  const user = state.users.find((entry) => entry.username === username && entry.password === password);
  if (!user) {
    els.loginError.textContent = 'Incorrect username or password.';
    els.loginError.classList.remove('hidden');
    return;
  }

  state.currentUser = user;
  sessionStorage.setItem('cadetTrackerCurrentUser', JSON.stringify(user));
  els.loginForm.reset();
  els.loginError.classList.add('hidden');
  renderDashboard();
}

function handleLogout() {
  state.currentUser = null;
  sessionStorage.removeItem('cadetTrackerCurrentUser');
  renderDashboard();
}

function findStockItem(itemCode, size) {
  return state.stock.find((item) => item.itemCode.toLowerCase() === itemCode.toLowerCase() && item.size.toLowerCase() === size.toLowerCase());
}

function updateStockForMovement(itemCode, size, movement, qty) {
  const item = findStockItem(itemCode, size);
  if (!item) {
    throw new Error('Item not found. Add it in the stock form first.');
  }

  if (movement === 'received') item.received += qty;
  if (movement === 'issued') item.issued += qty;
  if (movement === 'returned') item.returned += qty;
  if (movement === 'discarded') item.discarded += qty;
  if (movement === 'adjustment') item.adjustments += qty;
}

function handleStockForm(event) {
  event.preventDefault();
  if (!state.currentUser || state.currentUser.role !== 'head') return;

  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  const itemCode = String(data.itemCode || '').trim();
  const size = String(data.size || '').trim();
  const description = String(data.description || '').trim();
  const category = String(data.category || '').trim() || 'Uniform';
  const reorderLevel = Number(data.reorderLevel || 0);

  if (!itemCode || !size || !description) {
    showToast('Item code, size and description are required.');
    return;
  }

  const existing = findStockItem(itemCode, size);
  if (existing) {
    existing.description = description;
    existing.category = category;
    existing.reorderLevel = reorderLevel;
  } else {
    state.stock.push({
      itemCode,
      size,
      description,
      category,
      received: 0,
      issued: 0,
      returned: 0,
      discarded: 0,
      adjustments: 0,
      reorderLevel
    });
  }

  saveState();
  event.currentTarget.reset();
  renderDashboard();
  showToast('Stock item saved.');
}

function handleMovementForm(event) {
  event.preventDefault();
  if (!state.currentUser || (state.currentUser.role !== 'head' && state.currentUser.role !== 'officer')) return;

  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  const itemCode = String(data.itemCode || '').trim();
  const size = String(data.size || '').trim();
  const movement = data.movement || 'received';
  const quantity = Number(data.quantity || 0);

  if (!itemCode || !size || !Number.isFinite(quantity) || quantity === 0) {
    showToast('Please complete a valid item code, size and quantity.');
    return;
  }

  if (movement !== 'adjustment' && quantity < 0) {
    showToast('Only stocktake adjustments can be negative.');
    return;
  }

  try {
    updateStockForMovement(itemCode, size, movement, movement === 'adjustment' ? quantity : Math.abs(quantity));
    saveState();
    event.currentTarget.reset();
    renderDashboard();
    showToast('Movement recorded.');
  } catch (error) {
    showToast(error.message);
  }
}

function handleIssueForm(event) {
  event.preventDefault();
  if (!state.currentUser || (state.currentUser.role !== 'head' && state.currentUser.role !== 'officer')) return;

  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  const cadetName = String(data.cadetName || '').trim();
  const itemCode = String(data.itemCode || '').trim();
  const size = String(data.size || '').trim();
  const quantity = Number(data.quantity || 0);

  if (!cadetName || !itemCode || !size || !quantity || quantity <= 0) {
    showToast('Cadet name, item code, size and quantity are required.');
    return;
  }

  const item = findStockItem(itemCode, size);
  if (!item) {
    showToast('Item not found in stock.');
    return;
  }

  if (onHand(item) < quantity) {
    showToast('Not enough stock available for issue.');
    return;
  }

  item.issued += quantity;
  state.issues.push({
    cadetName,
    itemCode,
    size,
    quantity,
    issuedAt: new Date().toISOString().slice(0, 10)
  });

  saveState();
  event.currentTarget.reset();
  renderDashboard();
  showToast('Kit issued to cadet.');
}

function handleReturnForm(event) {
  event.preventDefault();
  if (!state.currentUser || (state.currentUser.role !== 'head' && state.currentUser.role !== 'officer')) return;

  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  const cadetName = String(data.cadetName || '').trim();
  const itemCode = String(data.itemCode || '').trim();
  const size = String(data.size || '').trim();
  const quantity = Number(data.quantity || 0);

  if (!cadetName || !itemCode || !size || !quantity || quantity <= 0) {
    showToast('Cadet name, item code, size and quantity are required.');
    return;
  }

  const item = findStockItem(itemCode, size);
  if (!item) {
    showToast('Item not found in stock.');
    return;
  }

  item.returned += quantity;
  state.issues = state.issues.filter((issue) => !(issue.cadetName.toLowerCase() === cadetName.toLowerCase() && issue.itemCode.toLowerCase() === itemCode.toLowerCase() && issue.size.toLowerCase() === size.toLowerCase() && issue.quantity >= quantity));
  saveState();
  event.currentTarget.reset();
  renderDashboard();
  showToast('Returned item recorded.');
}

function exportCsv() {
  const rows = [
    ['Item Code', 'Size', 'Description', 'Category', 'Received', 'Issued', 'Returned To Stock', 'Returned - Discarded', 'Adjustments', 'On Hand', 'Reorder Level', 'Status']
  ];

  for (const item of state.stock) {
    const total = onHand(item);
    const status = total < 0 ? 'Negative stock' : total <= item.reorderLevel ? 'To reorder' : 'In stock';
    rows.push([
      item.itemCode,
      item.size,
      item.description,
      item.category,
      item.received,
      item.issued,
      item.returned,
      item.discarded,
      item.adjustments,
      total,
      item.reorderLevel,
      status
    ]);
  }

  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const anchor = document.createElement('a');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  anchor.href = url;
  anchor.download = 'cadet-uniform-stock.csv';
  anchor.click();
  URL.revokeObjectURL(url);
  showToast('CSV exported.');
}

function bindEvents() {
  els.loginForm.addEventListener('submit', handleLogin);
  els.logoutBtn.addEventListener('click', handleLogout);
  els.stockForm.addEventListener('submit', handleStockForm);
  els.movementForm.addEventListener('submit', handleMovementForm);
  els.issueForm.addEventListener('submit', handleIssueForm);
  els.returnForm.addEventListener('submit', handleReturnForm);
  els.exportBtn.addEventListener('click', exportCsv);
  els.inventorySearch.addEventListener('input', renderInventoryTable);
  els.statusFilter.addEventListener('change', renderInventoryTable);
  els.refreshBtn.addEventListener('click', renderDashboard);
}

function init() {
  loadState();
  bindEvents();
  renderDashboard();
}

init();
























































































































