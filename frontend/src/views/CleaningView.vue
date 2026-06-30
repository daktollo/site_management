<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../services/api.js';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
const { t } = useI18n();
const assignments = ref([]);
const tasks = ref([]);
const users = ref([]);
const error = ref('');

const newAssignment = ref({ task_id: '', assignee_id: '', scheduled_date: '' });
const newTask = ref({ name: '', description: '', frequency: 'daily' });

async function load() {
  const calls = [api.get('/cleaning/assignments'), api.get('/cleaning/tasks')];
  if (auth.isAdmin) calls.push(api.get('/users'));
  const [a, tk, u] = await Promise.all(calls);
  assignments.value = a.data;
  tasks.value = tk.data;
  if (u) users.value = u.data;
}

async function markDone(id) {
  error.value = '';
  try {
    await api.post(`/cleaning/assignments/${id}/done`);
    await load();
  } catch (e) {
    error.value = e.response?.data?.error || t('cleaning.failedDone');
  }
}

async function createTask() {
  error.value = '';
  try {
    await api.post('/cleaning/tasks', newTask.value);
    newTask.value = { name: '', description: '', frequency: 'daily' };
    await load();
  } catch (e) {
    error.value = e.response?.data?.error || t('cleaning.failedTask');
  }
}

async function createAssignment() {
  error.value = '';
  try {
    await api.post('/cleaning/assignments', newAssignment.value);
    newAssignment.value = { task_id: '', assignee_id: '', scheduled_date: '' };
    await load();
  } catch (e) {
    error.value = e.response?.data?.error || t('cleaning.failedAssign');
  }
}

onMounted(load);
</script>

<template>
  <div class="container">
    <h1>{{ t('cleaning.title') }}</h1>
    <p v-if="error" class="error">{{ error }}</p>

    <div class="card">
      <h2>{{ t('cleaning.assignments') }}</h2>
      <table>
        <thead><tr><th>{{ t('cleaning.task') }}</th><th>{{ t('cleaning.frequency') }}</th><th>{{ t('cleaning.assignee') }}</th><th>{{ t('common.date') }}</th><th>{{ t('common.status') }}</th><th></th></tr></thead>
        <tbody>
          <tr v-for="a in assignments" :key="a.id">
            <td><strong>{{ a.task_name }}</strong></td>
            <td class="muted">{{ t('frequencies.' + a.frequency) }}</td>
            <td>{{ a.assignee_name }}</td>
            <td class="muted">{{ a.scheduled_date.slice(0, 10) }}</td>
            <td><span class="badge" :class="a.status">{{ t('status.' + a.status) }}</span></td>
            <td>
              <button
                v-if="a.status === 'pending' && (a.assignee_id === auth.user.id || auth.isAdmin)"
                class="small" @click="markDone(a.id)">
                {{ t('cleaning.markDone') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h2>{{ t('cleaning.tasks') }}</h2>
      <ul>
        <li v-for="task in tasks" :key="task.id">
          <strong>{{ task.name }}</strong> <span class="muted">({{ t('frequencies.' + task.frequency) }})</span>
          <span v-if="task.description"> — {{ task.description }}</span>
        </li>
      </ul>
    </div>

    <!-- Admin tools -->
    <template v-if="auth.isAdmin">
      <div class="card">
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

      <div class="card">
        <h2>{{ t('cleaning.assignTask') }}</h2>
        <div class="row">
          <div>
            <label>{{ t('cleaning.task') }}</label>
            <select v-model="newAssignment.task_id">
              <option value="" disabled>{{ t('cleaning.selectTask') }}</option>
              <option v-for="task in tasks" :key="task.id" :value="task.id">{{ task.name }}</option>
            </select>
          </div>
          <div>
            <label>{{ t('cleaning.assignee') }}</label>
            <select v-model="newAssignment.assignee_id">
              <option value="" disabled>{{ t('cleaning.selectPerson') }}</option>
              <option v-for="u in users" :key="u.id" :value="u.id">{{ u.full_name }}</option>
            </select>
          </div>
          <div>
            <label>{{ t('common.date') }}</label>
            <input v-model="newAssignment.scheduled_date" type="date" />
          </div>
        </div>
        <button style="margin-top:1rem"
          :disabled="!newAssignment.task_id || !newAssignment.assignee_id || !newAssignment.scheduled_date"
          @click="createAssignment">{{ t('cleaning.assign') }}</button>
      </div>
    </template>
  </div>
</template>
