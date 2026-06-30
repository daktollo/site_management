<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../services/api.js';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
const { t, locale } = useI18n();

const assignments = ref([]);
const tasks = ref([]);
const users = ref([]);
const error = ref('');

const newTask = ref({ name: '', description: '', frequency: 'daily' });

// --- date helpers (local, no UTC shifting) ---
function ymd(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
const todayKey = ymd(new Date());

// --- month being viewed ---
const viewYear = ref(new Date().getFullYear());
const viewMonth = ref(new Date().getMonth()); // 0-based

const intlLocale = computed(() => (locale.value === 'tr' ? 'tr-TR' : 'en-US'));
const monthLabel = computed(() =>
  new Intl.DateTimeFormat(intlLocale.value, { month: 'long', year: 'numeric' })
    .format(new Date(viewYear.value, viewMonth.value, 1))
);
const weekdayNames = computed(() => {
  const fmt = new Intl.DateTimeFormat(intlLocale.value, { weekday: 'short' });
  // 2024-01-01 is a Monday → render a Monday-first week
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, 1 + i)));
});

function longDate(key) {
  if (!key) return '';
  const [y, m, d] = key.split('-').map(Number);
  return new Intl.DateTimeFormat(intlLocale.value, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(y, m - 1, d));
}

// assignments grouped by 'YYYY-MM-DD'
const byDate = computed(() => {
  const map = {};
  for (const a of assignments.value) (map[a.scheduled_date] ||= []).push(a);
  return map;
});

// 6 weeks × 7 days grid (Monday-first), including adjacent-month padding days
const weeks = computed(() => {
  const first = new Date(viewYear.value, viewMonth.value, 1);
  const offset = (first.getDay() + 6) % 7; // days before the 1st
  const start = new Date(viewYear.value, viewMonth.value, 1 - offset);
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const key = ymd(d);
    cells.push({
      key,
      day: d.getDate(),
      inMonth: d.getMonth() === viewMonth.value,
      isToday: key === todayKey,
      items: byDate.value[key] || [],
    });
  }
  const out = [];
  for (let i = 0; i < 42; i += 7) out.push(cells.slice(i, i + 7));
  return out;
});

const todayItems = computed(() => byDate.value[todayKey] || []);

function prevMonth() {
  if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value--; } else viewMonth.value--;
}
function nextMonth() {
  if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++; } else viewMonth.value++;
}
function goToday() {
  const n = new Date();
  viewYear.value = n.getFullYear();
  viewMonth.value = n.getMonth();
}

function canComplete(a) {
  return a.status === 'pending' && (a.assignee_id === auth.user.id || auth.isAdmin);
}
function canCancel(a) {
  return a.assignee_id === auth.user.id || auth.isAdmin;
}

// --- day detail panel ---
const selectedDay = ref(null);
const panelAssign = ref({ task_id: '', assignee_id: '' });
const selectedDayItems = computed(() =>
  selectedDay.value ? byDate.value[selectedDay.value] || [] : []
);

function openDay(key) {
  selectedDay.value = key;
  panelAssign.value = { task_id: '', assignee_id: '' };
  error.value = '';
}
function closeDay() {
  selectedDay.value = null;
}

async function load() {
  const [a, tk, u] = await Promise.all([
    api.get('/cleaning/assignments'),
    api.get('/cleaning/tasks'),
    api.get('/users'),
  ]);
  assignments.value = a.data;
  tasks.value = tk.data;
  users.value = u.data;
}

async function markDone(id) {
  error.value = '';
  try {
    await api.post(`/cleaning/assignments/${id}/done`);
    await load();
  } catch (e) { error.value = e.response?.data?.error || t('cleaning.failedDone'); }
}

async function cancelAssignment(id) {
  error.value = '';
  try {
    await api.delete(`/cleaning/assignments/${id}`);
    await load();
  } catch (e) { error.value = e.response?.data?.error || t('cleaning.failedCancel'); }
}

async function assignForDay() {
  error.value = '';
  try {
    await api.post('/cleaning/assignments', {
      task_id: panelAssign.value.task_id,
      assignee_id: panelAssign.value.assignee_id,
      scheduled_date: selectedDay.value,
    });
    panelAssign.value = { task_id: '', assignee_id: '' };
    await load();
  } catch (e) { error.value = e.response?.data?.error || t('cleaning.failedAssign'); }
}

async function createTask() {
  error.value = '';
  try {
    await api.post('/cleaning/tasks', newTask.value);
    newTask.value = { name: '', description: '', frequency: 'daily' };
    await load();
  } catch (e) { error.value = e.response?.data?.error || t('cleaning.failedTask'); }
}

onMounted(load);
</script>

<template>
  <div class="container">
    <h1>{{ t('cleaning.title') }}</h1>
    <p v-if="error" class="error">{{ error }}</p>

    <!-- Calendar -->
    <div class="card">
      <div class="cal-header">
        <button class="ghost small" @click="prevMonth" aria-label="prev">‹</button>
        <h2 style="margin:0; text-transform:capitalize">{{ monthLabel }}</h2>
        <button class="ghost small" @click="nextMonth" aria-label="next">›</button>
        <span class="spacer"></span>
        <span class="cal-legend">
          <span class="badge pending">{{ t('status.pending') }}</span>
          <span class="badge done">{{ t('status.done') }}</span>
        </span>
        <button class="ghost small" @click="goToday">{{ t('cleaning.today') }}</button>
      </div>
      <p class="muted" style="margin:-0.25rem 0 0.75rem; font-size:0.82rem">{{ t('cleaning.clickHint') }}</p>

      <div class="calendar">
        <div class="cal-weekday" v-for="w in weekdayNames" :key="w">{{ w }}</div>
        <template v-for="(week, wi) in weeks" :key="wi">
          <div v-for="cell in week" :key="cell.key"
               class="cal-day" :class="{ other: !cell.inMonth, today: cell.isToday }"
               @click="openDay(cell.key)">
            <div class="cal-daynum">{{ cell.day }}</div>
            <div v-for="a in cell.items" :key="a.id" class="cal-chip" :class="a.status"
                 :title="a.task_name + ' — ' + a.assignee_name">
              <div class="cal-chip-task">{{ a.task_name }}</div>
              <div class="cal-chip-row">
                <span class="cal-chip-person">{{ a.assignee_name }}</span>
                <span v-if="a.status === 'done'" class="cal-check" :title="t('status.done')">✓</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Tasks -->
    <div class="card">
      <h2>{{ t('cleaning.tasks') }}</h2>
      <ul>
        <li v-for="task in tasks" :key="task.id">
          <strong>{{ task.name }}</strong> <span class="muted">({{ t('frequencies.' + task.frequency) }})</span>
          <span v-if="task.description"> — {{ task.description }}</span>
        </li>
      </ul>
    </div>

    <!-- Admin: define a new task -->
    <div v-if="auth.isAdmin" class="card">
      <h2>{{ t('cleaning.newTask') }}</h2>
      <div class="row">
        <div><label>{{ t('common.name') }}</label><input v-model="newTask.name" /></div>
        <div>
          <label>{{ t('cleaning.frequency') }}</label>
          <select v-model="newTask.frequency">
            <option value="daily">{{ t('frequencies.daily') }}</option>
            <option value="weekly">{{ t('frequencies.weekly') }}</option>
          </select>
        </div>
      </div>
      <label>{{ t('common.description') }} ({{ t('common.optional') }})</label>
      <input v-model="newTask.description" />
      <button style="margin-top:1rem" :disabled="!newTask.name" @click="createTask">{{ t('cleaning.addTask') }}</button>
    </div>

    <!-- Day detail panel -->
    <div v-if="selectedDay" class="modal-overlay" @click.self="closeDay">
      <div class="modal">
        <div class="modal-head">
          <h2 style="margin:0; text-transform:capitalize">{{ longDate(selectedDay) }}</h2>
          <button class="ghost small" @click="closeDay">{{ t('cleaning.close') }}</button>
        </div>
        <p v-if="error" class="error">{{ error }}</p>

        <h3 style="font-size:0.95rem; margin:0 0 0.5rem">{{ t('cleaning.dayTasks') }}</h3>
        <p class="muted" v-if="!selectedDayItems.length">{{ t('cleaning.noTasksDay') }}</p>
        <table v-else>
          <tbody>
            <tr v-for="a in selectedDayItems" :key="a.id">
              <td>
                <strong>{{ a.task_name }}</strong>
                <div class="muted" style="font-size:0.82rem">{{ a.assignee_name }}</div>
              </td>
              <td><span class="badge" :class="a.status">{{ t('status.' + a.status) }}</span></td>
              <td style="text-align:right; white-space:nowrap">
                <button v-if="canComplete(a)" class="small" @click="markDone(a.id)">{{ t('cleaning.complete') }}</button>
                <button v-if="canCancel(a)" class="ghost small danger" style="margin-left:0.35rem" @click="cancelAssignment(a.id)">{{ t('cleaning.cancel') }}</button>
              </td>
            </tr>
          </tbody>
        </table>

        <h3 style="font-size:0.95rem; margin:1.25rem 0 0.5rem">{{ t('cleaning.assignForDay') }}</h3>
        <div class="row">
          <div>
            <label>{{ t('cleaning.task') }}</label>
            <select v-model="panelAssign.task_id">
              <option value="" disabled>{{ t('cleaning.selectTask') }}</option>
              <option v-for="task in tasks" :key="task.id" :value="task.id">{{ task.name }}</option>
            </select>
          </div>
          <div>
            <label>{{ t('cleaning.assignee') }}</label>
            <select v-model="panelAssign.assignee_id">
              <option value="" disabled>{{ t('cleaning.selectPerson') }}</option>
              <option v-for="u in users" :key="u.id" :value="u.id">{{ u.full_name }}</option>
            </select>
          </div>
        </div>
        <button style="margin-top:1rem" :disabled="!panelAssign.task_id || !panelAssign.assignee_id" @click="assignForDay">
          {{ t('cleaning.assign') }}
        </button>
      </div>
    </div>
  </div>
</template>
