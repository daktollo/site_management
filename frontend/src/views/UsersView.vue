<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../services/api.js';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
const { t } = useI18n();

const users = ref([]);
const error = ref('');
const creating = ref(false);
const form = ref({ full_name: '', email: '', password: '', role: 'resident' });

async function load() {
  const { data } = await api.get('/users');
  users.value = data;
}

async function createUser() {
  error.value = '';
  creating.value = true;
  try {
    await api.post('/users', {
      full_name: form.value.full_name,
      email: form.value.email || null,
      password: form.value.password,
      role: form.value.role,
    });
    form.value = { full_name: '', email: '', password: '', role: 'resident' };
    await load();
  } catch (e) {
    error.value = e.response?.data?.error || t('users.failed');
  } finally {
    creating.value = false;
  }
}

async function removeUser(u) {
  error.value = '';
  if (!confirm(t('users.confirmDelete', { name: u.full_name }))) return;
  try {
    await api.delete(`/users/${u.id}`);
    await load();
  } catch (e) {
    error.value = e.response?.data?.error || t('users.failed');
  }
}

onMounted(load);
</script>

<template>
  <div class="container">
    <h1>{{ t('users.title') }}</h1>
    <p v-if="error" class="error">{{ error }}</p>

    <div class="card">
      <h2>{{ t('users.add') }}</h2>
      <div class="row">
        <div>
          <label>{{ t('users.name') }}</label>
          <input v-model="form.full_name" type="text" autocomplete="off" />
        </div>
        <div>
          <label>{{ t('users.emailOptional') }}</label>
          <input v-model="form.email" type="email" autocomplete="off" />
        </div>
      </div>
      <div class="row">
        <div>
          <label>{{ t('users.password') }}</label>
          <input v-model="form.password" type="text" autocomplete="off" />
        </div>
        <div>
          <label>{{ t('users.role') }}</label>
          <select v-model="form.role">
            <option value="resident">{{ t('roles.resident') }}</option>
            <option value="staff">{{ t('roles.staff') }}</option>
            <option value="admin">{{ t('roles.admin') }}</option>
          </select>
        </div>
      </div>
      <button style="margin-top:1rem" :disabled="creating || !form.full_name || !form.password" @click="createUser">
        {{ creating ? t('users.creating') : t('users.create') }}
      </button>
    </div>

    <div class="card">
      <h2>{{ t('users.list') }}</h2>
      <table>
        <thead><tr><th>{{ t('users.name') }}</th><th>{{ t('users.emailOptional') }}</th><th>{{ t('users.role') }}</th><th></th></tr></thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td><strong>{{ u.full_name }}</strong></td>
            <td class="muted">{{ u.email || t('users.noEmail') }}</td>
            <td>{{ t('roles.' + u.role) }}</td>
            <td style="text-align:right">
              <button v-if="u.id !== auth.user.id" class="ghost small danger" @click="removeUser(u)">
                {{ t('users.delete') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
