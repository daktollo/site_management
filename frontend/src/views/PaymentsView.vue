<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../services/api.js';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
const { t } = useI18n();
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
      <table v-else>
        <thead><tr><th>{{ t('payments.transaction') }}</th><th>{{ t('payments.from') }}</th><th>{{ t('payments.due') }}</th><th>{{ t('payments.amount') }}</th><th>{{ t('common.status') }}</th><th></th></tr></thead>
        <tbody>
          <tr v-for="s in myShares" :key="s.share_id">
            <td>
              <strong>{{ s.name }}</strong>
              <div class="muted" v-if="s.description">{{ s.description }}</div>
            </td>
            <td>{{ s.created_by_name }}</td>
            <td class="muted">{{ s.due_date ? s.due_date.slice(0, 10) : t('common.none') }}</td>
            <td>{{ money(s.amount_due) }}</td>
            <td><span class="badge" :class="s.status">{{ t('status.' + s.status) }}</span></td>
            <td>
              <button v-if="s.status === 'pending'" class="small" @click="pay(s.share_id)">
                {{ t('payments.markPaid') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
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
      <table>
        <thead><tr><th>{{ t('common.name') }}</th><th>{{ t('payments.type') }}</th><th>{{ t('payments.amount') }}</th><th>{{ t('payments.createdBy') }}</th><th>{{ t('payments.shares') }}</th></tr></thead>
        <tbody>
          <tr v-for="tx in transactions" :key="tx.id">
            <td><strong>{{ tx.name }}</strong></td>
            <td>{{ t('txTypes.' + tx.type) }}</td>
            <td>{{ money(tx.amount) }}</td>
            <td>{{ tx.created_by_name }}</td>
            <td>
              <span v-for="s in tx.shares" :key="s.id" class="badge" :class="s.status" style="margin:0 0.25rem 0.25rem 0">
                {{ s.user_name }} {{ money(s.amount_due) }}
              </span>
              <span v-if="!tx.shares.length" class="muted">{{ t('common.none') }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
