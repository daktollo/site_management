<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from './stores/auth.js';
import { setLocale } from './i18n/index.js';
import api from './services/api.js';

const auth = useAuthStore();
const router = useRouter();
const { t, locale } = useI18n();

function logout() {
  auth.logout();
  router.push({ name: 'login' });
}

function toggleLocale() {
  setLocale(locale.value === 'tr' ? 'en' : 'tr');
}

// --- profile / change password ---
const profileOpen = ref(false);
const pw = ref({ current: '', next: '', confirm: '' });
const pwError = ref('');
const pwOk = ref('');
const pwSaving = ref(false);

function openProfile() {
  profileOpen.value = true;
  pw.value = { current: '', next: '', confirm: '' };
  pwError.value = '';
  pwOk.value = '';
}
function closeProfile() {
  profileOpen.value = false;
}

async function changePassword() {
  pwError.value = '';
  pwOk.value = '';
  if (pw.value.next.length < 6) { pwError.value = t('profile.tooShort'); return; }
  if (pw.value.next !== pw.value.confirm) { pwError.value = t('profile.mismatch'); return; }
  pwSaving.value = true;
  try {
    await api.post('/auth/change-password', {
      current_password: pw.value.current,
      new_password: pw.value.next,
    });
    pwOk.value = t('profile.passwordChanged');
    pw.value = { current: '', next: '', confirm: '' };
  } catch (e) {
    pwError.value = e.response?.data?.error || t('profile.failed');
  } finally {
    pwSaving.value = false;
  }
}
</script>

<template>
  <nav v-if="auth.isAuthenticated" class="navbar">
    <span class="brand">🏢 {{ t('brand') }}</span>
    <router-link to="/">{{ t('nav.dashboard') }}</router-link>
    <router-link to="/payments">{{ t('nav.payments') }}</router-link>
    <router-link to="/cleaning">{{ t('nav.cleaning') }}</router-link>
    <router-link to="/properties">{{ t('nav.properties') }}</router-link>
    <span class="spacer"></span>
    <button class="user-link" @click="openProfile">
      {{ auth.user?.full_name }} ({{ t('roles.' + auth.user?.role) }})
    </button>
    <button class="ghost small" @click="toggleLocale">{{ locale === 'tr' ? 'EN' : 'TR' }}</button>
    <button class="ghost small" @click="logout">{{ t('nav.logout') }}</button>
  </nav>

  <!-- Language toggle is also available before login -->
  <div v-else style="position:absolute; top:1rem; right:1.5rem">
    <button class="ghost small" @click="toggleLocale">{{ locale === 'tr' ? 'EN' : 'TR' }}</button>
  </div>

  <!-- Profile / change password modal -->
  <div v-if="profileOpen" class="modal-overlay" @click.self="closeProfile">
    <div class="modal">
      <div class="modal-head">
        <h2 style="margin:0">{{ t('profile.title') }}</h2>
        <button class="ghost small" @click="closeProfile">{{ t('common.close') }}</button>
      </div>

      <table class="kv">
        <tbody>
          <tr><th>{{ t('common.name') }}</th><td>{{ auth.user?.full_name }}</td></tr>
          <tr><th>{{ t('login.email') }}</th><td>{{ auth.user?.email }}</td></tr>
          <tr><th>{{ t('profile.role') }}</th><td>{{ t('roles.' + auth.user?.role) }}</td></tr>
        </tbody>
      </table>

      <h3 style="font-size:0.95rem; margin:1.25rem 0 0.5rem">{{ t('profile.changePassword') }}</h3>
      <label>{{ t('profile.currentPassword') }}</label>
      <input v-model="pw.current" type="password" autocomplete="current-password" />
      <label>{{ t('profile.newPassword') }}</label>
      <input v-model="pw.next" type="password" autocomplete="new-password" />
      <label>{{ t('profile.confirmPassword') }}</label>
      <input v-model="pw.confirm" type="password" autocomplete="new-password" />
      <p v-if="pwError" class="error">{{ pwError }}</p>
      <p v-if="pwOk" style="color:var(--green); font-size:0.88rem; margin-top:0.5rem">{{ pwOk }}</p>
      <button style="margin-top:1rem" :disabled="pwSaving || !pw.current || !pw.next || !pw.confirm"
              @click="changePassword">
        {{ pwSaving ? t('profile.saving') : t('profile.save') }}
      </button>
    </div>
  </div>

  <router-view />
</template>
