<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../services/api.js';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
const { t, locale } = useI18n();

const intlLocale = computed(() => (locale.value === 'tr' ? 'tr-TR' : 'en-US'));
function dateTime(iso) {
  if (!iso) return t('common.none');
  return new Intl.DateTimeFormat(intlLocale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

// Transaction details modal (kept in sync with the live list via id lookup)
const selectedTxId = ref(null);
const selectedTx = computed(() => transactions.value.find((x) => x.id === selectedTxId.value) || null);
function openTx(tx) { selectedTxId.value = tx.id; }
function closeTx() { selectedTxId.value = null; }

// Filters for the "all transactions" list
const filterText = ref('');
const filterType = ref('');
const filterCreator = ref('');
const filterFrom = ref('');
const filterTo = ref('');

// Local 'YYYY-MM-DD' for a transaction's creation date (matches what's displayed).
function dateKey(iso) {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function clearFilters() {
  filterText.value = '';
  filterType.value = '';
  filterCreator.value = '';
  filterFrom.value = '';
  filterTo.value = '';
}

const creators = computed(() => {
  const map = new Map();
  for (const tx of transactions.value) map.set(tx.created_by, tx.created_by_name);
  return [...map].map(([id, name]) => ({ id, name }));
});

const filteredTransactions = computed(() =>
  transactions.value.filter((tx) => {
    if (filterType.value && tx.type !== filterType.value) return false;
    if (filterCreator.value !== '' && tx.created_by !== filterCreator.value) return false;
    if (filterText.value && !tx.name.toLowerCase().includes(filterText.value.trim().toLowerCase())) return false;
    const day = dateKey(tx.created_at);
    if (filterFrom.value && day < filterFrom.value) return false;
    if (filterTo.value && day > filterTo.value) return false;
    return true;
  })
);
const myShares = ref([]);
const transactions = ref([]);
const users = ref([]);
const error = ref('');

// Create-transaction form
const form = ref({ name: '', description: '', type: 'payment', amount: '', due_date: '' });
const participants = ref([]); // [{ user_id, amount_due, include }]
const creating = ref(false);

function money(n) { return '₺' + Number(n).toFixed(2); }

async function load() {
  const [mine, txns, userList] = await Promise.all([
    api.get('/payments/my'),
    api.get('/payments/transactions'),
    api.get('/users'),
  ]);
  myShares.value = mine.data;
  transactions.value = txns.data;
  users.value = userList.data;
  participants.value = userList.data.map((u) => ({
    user_id: u.id, name: u.full_name, amount_due: '', include: false,
  }));
}

async function pay(shareId) {
  error.value = '';
  try {
    await api.post(`/payments/shares/${shareId}/pay`);
    await load();
  } catch (e) {
    error.value = e.response?.data?.error || t('payments.failedPay');
  }
}

// Split the total evenly across the included participants.
function splitEvenly() {
  const included = participants.value.filter((p) => p.include);
  const amt = Number(form.value.amount);
  if (!included.length || !amt) return;
  const each = (amt / included.length).toFixed(2);
  included.forEach((p) => { p.amount_due = each; });
}

async function createTransaction() {
  error.value = '';
  creating.value = true;
  try {
    const payload = {
      name: form.value.name,
      description: form.value.description || null,
      type: form.value.type,
      amount: Number(form.value.amount),
      due_date: form.value.due_date || null,
    };
    if (form.value.type === 'payment') {
      payload.participants = participants.value
        .filter((p) => p.include)
        .map((p) => ({ user_id: p.user_id, amount_due: Number(p.amount_due) }));
    }
    await api.post('/payments/transactions', payload);
    form.value = { name: '', description: '', type: 'payment', amount: '', due_date: '' };
    participants.value.forEach((p) => { p.include = false; p.amount_due = ''; });
    await load();
  } catch (e) {
    error.value = e.response?.data?.error || t('payments.failedCreate');
  } finally {
    creating.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="container">
    <h1>{{ t('payments.title') }}</h1>
    <p v-if="error" class="error">{{ error }}</p>

    <!-- The Payments tab: payment-type transactions others created that I owe -->
    <div class="card">
      <h2>{{ t('payments.myPayments') }}</h2>
      <p class="muted" v-if="!myShares.length">{{ t('payments.nothingToPay') }}</p>
      <div v-else class="pay-list">
        <div class="pay-item" v-for="s in myShares" :key="s.share_id">
          <div class="pay-head">
            <strong>{{ s.name }}</strong>
            <span class="badge" :class="s.status">{{ t('status.' + s.status) }}</span>
          </div>
          <div class="muted" v-if="s.description" style="font-size:0.85rem">{{ s.description }}</div>
          <div class="pay-meta">
            <span><span class="muted">{{ t('payments.from') }}:</span> {{ s.created_by_name }}</span>
            <span><span class="muted">{{ t('payments.due') }}:</span> {{ s.due_date ? s.due_date.slice(0, 10) : t('common.none') }}</span>
            <span class="pay-amount">{{ money(s.amount_due) }}</span>
          </div>
          <button v-if="s.status === 'pending'" class="pay-btn" @click="pay(s.share_id)">
            {{ t('payments.markPaid') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Create a new named transaction -->
    <div class="card">
      <h2>{{ t('payments.createTitle') }}</h2>
      <div class="row">
        <div>
          <label>{{ t('common.name') }}</label>
          <input v-model="form.name" :placeholder="t('payments.namePlaceholder')" />
        </div>
        <div>
          <label>{{ t('payments.type') }}</label>
          <select v-model="form.type">
            <option value="payment">{{ t('txTypes.payment') }}</option>
            <option value="expense">{{ t('txTypes.expense') }}</option>
            <option value="income">{{ t('txTypes.income') }}</option>
          </select>
        </div>
      </div>
      <div class="row">
        <div>
          <label>{{ t('payments.totalAmount') }}</label>
          <input v-model="form.amount" type="number" min="0" step="0.01" />
        </div>
        <div>
          <label>{{ t('payments.dueDate') }} ({{ t('common.optional') }})</label>
          <input v-model="form.due_date" type="date" />
        </div>
      </div>
      <label>{{ t('common.description') }} ({{ t('common.optional') }})</label>
      <input v-model="form.description" />

      <template v-if="form.type === 'payment'">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:1rem">
          <h2 style="margin:0">{{ t('payments.whoOwes') }}</h2>
          <button type="button" class="ghost small" @click="splitEvenly">{{ t('payments.splitEvenly') }}</button>
        </div>
        <table>
          <thead><tr><th></th><th>{{ t('payments.user') }}</th><th>{{ t('payments.amountDue') }}</th></tr></thead>
          <tbody>
            <tr v-for="p in participants" :key="p.user_id">
              <td style="width:2rem"><input type="checkbox" style="width:auto" v-model="p.include" /></td>
              <td>{{ p.name }}</td>
              <td style="max-width:140px">
                <input v-model="p.amount_due" type="number" min="0" step="0.01" :disabled="!p.include" />
              </td>
            </tr>
          </tbody>
        </table>
      </template>

      <button style="margin-top:1rem" :disabled="creating || !form.name || !form.amount" @click="createTransaction">
        {{ creating ? t('payments.creating') : t('payments.create') }}
      </button>
    </div>

    <!-- All transactions -->
    <div class="card">
      <h2>{{ t('payments.allTransactions') }}</h2>
      <p class="muted" style="margin:-0.25rem 0 0.75rem; font-size:0.82rem">{{ t('payments.detailsHint') }}</p>

      <div class="row" style="margin-bottom:0.75rem">
        <div><input v-model="filterText" :placeholder="t('payments.searchPlaceholder')" /></div>
        <div>
          <select v-model="filterType">
            <option value="">{{ t('payments.allTypes') }}</option>
            <option value="payment">{{ t('txTypes.payment') }}</option>
            <option value="expense">{{ t('txTypes.expense') }}</option>
            <option value="income">{{ t('txTypes.income') }}</option>
          </select>
        </div>
        <div>
          <select v-model="filterCreator">
            <option value="">{{ t('payments.allCreators') }}</option>
            <option v-for="c in creators" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div>
          <label style="margin-top:0">{{ t('payments.fromDate') }}</label>
          <input v-model="filterFrom" type="date" :max="filterTo || undefined" />
        </div>
        <div>
          <label style="margin-top:0">{{ t('payments.toDate') }}</label>
          <input v-model="filterTo" type="date" :min="filterFrom || undefined" />
        </div>
        <div style="display:flex; align-items:flex-end">
          <button class="ghost small" @click="clearFilters">{{ t('payments.clearFilters') }}</button>
        </div>
      </div>

      <table>
        <thead><tr><th>{{ t('common.name') }}</th><th>{{ t('payments.type') }}</th><th>{{ t('payments.amount') }}</th><th>{{ t('payments.createdBy') }}</th><th>{{ t('payments.createdAt') }}</th></tr></thead>
        <tbody>
          <tr v-for="tx in filteredTransactions" :key="tx.id" class="clickable" @click="openTx(tx)">
            <td><strong>{{ tx.name }}</strong></td>
            <td>{{ t('txTypes.' + tx.type) }}</td>
            <td>{{ money(tx.amount) }}</td>
            <td>{{ tx.created_by_name }}</td>
            <td class="muted">{{ dateTime(tx.created_at) }}</td>
          </tr>
          <tr v-if="!filteredTransactions.length">
            <td colspan="5" class="muted">{{ t('payments.noResults') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Transaction details modal -->
    <div v-if="selectedTx" class="modal-overlay" @click.self="closeTx">
      <div class="modal">
        <div class="modal-head">
          <h2 style="margin:0">{{ selectedTx.name }}</h2>
          <button class="ghost small" @click="closeTx">{{ t('common.close') }}</button>
        </div>

        <table class="kv">
          <tbody>
            <tr><th>{{ t('payments.type') }}</th><td>{{ t('txTypes.' + selectedTx.type) }}</td></tr>
            <tr><th>{{ t('payments.amount') }}</th><td>{{ money(selectedTx.amount) }}</td></tr>
            <tr><th>{{ t('payments.createdBy') }}</th><td>{{ selectedTx.created_by_name }}</td></tr>
            <tr><th>{{ t('payments.createdAt') }}</th><td>{{ dateTime(selectedTx.created_at) }}</td></tr>
            <tr v-if="selectedTx.due_date"><th>{{ t('payments.dueDate') }}</th><td>{{ selectedTx.due_date }}</td></tr>
            <tr v-if="selectedTx.description"><th>{{ t('common.description') }}</th><td>{{ selectedTx.description }}</td></tr>
          </tbody>
        </table>

        <h3 v-if="selectedTx.shares.length" style="font-size:0.95rem; margin:1.25rem 0 0.5rem">{{ t('payments.shares') }}</h3>
        <table v-if="selectedTx.shares.length">
          <thead><tr><th>{{ t('payments.user') }}</th><th>{{ t('payments.amount') }}</th><th>{{ t('common.status') }}</th><th>{{ t('payments.paidAt') }}</th></tr></thead>
          <tbody>
            <tr v-for="s in selectedTx.shares" :key="s.id">
              <td>{{ s.user_name }}</td>
              <td>{{ money(s.amount_due) }}</td>
              <td><span class="badge" :class="s.status">{{ t('status.' + s.status) }}</span></td>
              <td class="muted">{{ s.status === 'paid' ? dateTime(s.paid_at) : t('payments.notPaid') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
