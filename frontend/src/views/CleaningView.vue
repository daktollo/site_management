<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api.js';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
const assignments = ref([]);
const tasks = ref([]);
const users = ref([]);
const error = ref('');

const newAssignment = ref({ task_id: '', assignee_id: '', scheduled_date: '' });
const newTask = ref({ name: '', description: '', frequency: 'daily' });

async function load() {
  const calls = [api.get('/cleaning/assignments'), api.get('/cleaning/tasks')];
  if (auth.isAdmin) calls.push(api.get('/users'));
  const [a, t, u] = await Promise.all(calls);
  assignments.value = a.data;
  tasks.value = t.data;
  if (u) users.value = u.data;
}

async function markDone(id) {
  error.value = '';
  try {
    await api.post(`/cleaning/assignments/${id}/done`);
    await load();
  } catch (e) {
    error.value = e.response?.data?.error || 'Failed to mark done';
  }
}

async function createTask() {
  error.value = '';
  try {
    await api.post('/cleaning/tasks', newTask.value);
    newTask.value = { name: '', description: '', frequency: 'daily' };
    await load();
  } catch (e) {
    error.value = e.response?.data?.error || 'Failed to create task';
  }
}

async function createAssignment() {
  error.value = '';
  try {
    await api.post('/cleaning/assignments', newAssignment.value);
    newAssignment.value = { task_id: '', assignee_id: '', scheduled_date: '' };
    await load();
  } catch (e) {
    error.value = e.response?.data?.error || 'Failed to assign';
  }
}

onMounted(load);
</script>

<template>
  <div class="container">
    <h1>Cleaning schedules</h1>
    <p v-if="error" class="error">{{ error }}</p>

    <div class="card">
      <h2>Assignments</h2>
      <table>
        <thead><tr><th>Task</th><th>Frequency</th><th>Assignee</th><th>Date</th><th>Status</th><th></th></tr></thead>
        <tbody>
          <tr v-for="a in assignments" :key="a.id">
            <td><strong>{{ a.task_name }}</strong></td>
            <td class="muted">{{ a.frequency }}</td>
            <td>{{ a.assignee_name }}</td>
            <td class="muted">{{ a.scheduled_date.slice(0, 10) }}</td>
            <td><span class="badge" :class="a.status">{{ a.status }}</span></td>
            <td>
              <button
                v-if="a.status === 'pending' && (a.assignee_id === auth.user.id || auth.isAdmin)"
                class="small" @click="markDone(a.id)">
                Mark done
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h2>Cleaning tasks</h2>
      <ul>
        <li v-for="t in tasks" :key="t.id">
          <strong>{{ t.name }}</strong> <span class="muted">({{ t.frequency }})</span>
          <span v-if="t.description"> — {{ t.description }}</span>
        </li>
      </ul>
    </div>

    <!-- Admin tools -->
    <template v-if="auth.isAdmin">
      <div class="card">
        <h2>New cleaning task</h2>
        <div class="row">
          <div><label>Name</label><input v-model="newTask.name" /></div>
          <div>
            <label>Frequency</label>
            <select v-model="newTask.frequency">
              <option value="daily">daily</option>
              <option value="weekly">weekly</option>
            </select>
          </div>
        </div>
        <label>Description (optional)</label>
        <input v-model="newTask.description" />
        <button style="margin-top:1rem" :disabled="!newTask.name" @click="createTask">Add task</button>
      </div>

      <div class="card">
        <h2>Assign a task</h2>
        <div class="row">
          <div>
            <label>Task</label>
            <select v-model="newAssignment.task_id">
              <option value="" disabled>Select task</option>
              <option v-for="t in tasks" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
          </div>
          <div>
            <label>Assignee</label>
            <select v-model="newAssignment.assignee_id">
              <option value="" disabled>Select person</option>
              <option v-for="u in users" :key="u.id" :value="u.id">{{ u.full_name }}</option>
            </select>
          </div>
          <div>
            <label>Date</label>
            <input v-model="newAssignment.scheduled_date" type="date" />
          </div>
        </div>
        <button style="margin-top:1rem"
          :disabled="!newAssignment.task_id || !newAssignment.assignee_id || !newAssignment.scheduled_date"
          @click="createAssignment">Assign</button>
      </div>
    </template>
  </div>
</template>
