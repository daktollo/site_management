<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api.js';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
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
    error.value = e.response?.data?.error || 'Failed to mark as paid';
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
    error.value = e.response?.data?.error || 'Failed to create transaction';
  } finally {
    creating.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="container">
    <h1>Payments</h1>
    <p v-if="error" class="error">{{ error }}</p>

    <!-- The Payments tab: payment-type transactions others created that I owe -->
    <div class="card">
      <h2>My payments</h2>
      <p class="muted" v-if="!myShares.length">Nothing to pay right now.</p>
      <table v-else>
        <thead><tr><th>Transaction</th><th>From</th><th>Due</th><th>Amount</th><th>Status</th><th></th></tr></thead>
        <tbody>
          <tr v-for="s in myShares" :key="s.share_id">
            <td>
              <strong>{{ s.name }}</strong>
              <div class="muted" v-if="s.description">{{ s.description }}</div>
            </td>
            <td>{{ s.created_by_name }}</td>
            <td class="muted">{{ s.due_date ? s.due_date.slice(0, 10) : '—' }}</td>
            <td>{{ money(s.amount_due) }}</td>
            <td><span class="badge" :class="s.status">{{ s.status }}</span></td>
            <td>
              <button v-if="s.status === 'pending'" class="small" @click="pay(s.share_id)">
                Mark as paid
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create a new named transaction -->
    <div class="card">
      <h2>Create a transaction</h2>
      <div class="row">
        <div>
          <label>Name</label>
          <input v-model="form.name" placeholder="e.g. July water bill" />
        </div>
        <div>
          <label>Type</label>
          <select v-model="form.type">
            <option value="payment">payment</option>
            <option value="expense">expense</option>
            <option value="income">income</option>
          </select>
        </div>
      </div>
      <div class="row">
        <div>
          <label>Total amount</label>
          <input v-model="form.amount" type="number" min="0" step="0.01" />
        </div>
        <div>
          <label>Due date (optional)</label>
          <input v-model="form.due_date" type="date" />
        </div>
      </div>
      <label>Description (optional)</label>
      <input v-model="form.description" />

      <template v-if="form.type === 'payment'">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:1rem">
          <h2 style="margin:0">Who owes a share?</h2>
          <button type="button" class="ghost small" @click="splitEvenly">Split evenly</button>
        </div>
        <table>
          <thead><tr><th></th><th>User</th><th>Amount due</th></tr></thead>
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
        {{ creating ? 'Creating…' : 'Create transaction' }}
      </button>
    </div>

    <!-- All transactions -->
    <div class="card">
      <h2>All transactions</h2>
      <table>
        <thead><tr><th>Name</th><th>Type</th><th>Amount</th><th>Created by</th><th>Shares</th></tr></thead>
        <tbody>
          <tr v-for="t in transactions" :key="t.id">
            <td><strong>{{ t.name }}</strong></td>
            <td>{{ t.type }}</td>
            <td>{{ money(t.amount) }}</td>
            <td>{{ t.created_by_name }}</td>
            <td>
              <span v-for="s in t.shares" :key="s.id" class="badge" :class="s.status" style="margin:0 0.25rem 0.25rem 0">
                {{ s.user_name }} {{ money(s.amount_due) }}
              </span>
              <span v-if="!t.shares.length" class="muted">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
