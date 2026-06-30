<script setup>
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../services/api.js';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
const { t } = useI18n();
const myShares = ref([]);
const myCleaning = ref([]);
const debts = ref([]);
const loading = ref(true);

const myOutstanding = computed(() =>
  myShares.value.filter((s) => s.status === 'pending')
    .reduce((sum, s) => sum + Number(s.amount_due), 0)
);
const myPendingTasks = computed(() => myCleaning.value.filter((a) => a.status === 'pending').length);

function money(n) { return '₺' + Number(n).toFixed(2); }

onMounted(async () => {
  const [shares, cleaning, debtList] = await Promise.all([
    api.get('/payments/my'),
    api.get('/cleaning/assignments', { params: { mine: 1 } }),
    api.get('/payments/debts'),
  ]);
  myShares.value = shares.data;
  myCleaning.value = cleaning.data;
  debts.value = debtList.data;
  loading.value = false;
});
</script>

<template>
  <div class="container">
    <h1>{{ t('dashboard.welcome', { name: auth.user?.full_name }) }}</h1>
    <div v-if="loading" class="muted">{{ t('common.loading') }}</div>
    <template v-else>
      <div class="row">
        <div class="card">
          <div class="muted">{{ t('dashboard.myDebt') }}</div>
          <div class="stat" :style="{ color: myOutstanding > 0 ? 'var(--red)' : 'var(--green)' }">
            {{ money(myOutstanding) }}
          </div>
        </div>
        <div class="card">
          <div class="muted">{{ t('dashboard.myPendingTasks') }}</div>
          <div class="stat">{{ myPendingTasks }}</div>
        </div>
      </div>

      <div class="card">
        <h2>{{ t('dashboard.everyoneDebt') }}</h2>
        <table>
          <thead><tr><th>{{ t('dashboard.resident') }}</th><th>{{ t('dashboard.outstanding') }}</th></tr></thead>
          <tbody>
            <tr v-for="d in debts" :key="d.id">
              <td>{{ d.full_name }}</td>
              <td :style="{ color: Number(d.outstanding) > 0 ? 'var(--red)' : 'var(--muted)' }">
                {{ money(d.outstanding) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
