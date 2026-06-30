<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
const router = useRouter();
const { t } = useI18n();

const name = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function submit() {
  error.value = '';
  loading.value = true;
  try {
    await auth.login(name.value, password.value);
    router.push({ name: 'dashboard' });
  } catch (e) {
    error.value = e.response?.data?.error || t('login.failed');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-wrap">
    <div class="card">
      <h1>{{ t('login.title') }}</h1>
      <form @submit.prevent="submit">
        <label>{{ t('login.name') }}</label>
        <input v-model="name" type="text" autocomplete="username" />
        <label>{{ t('login.password') }}</label>
        <input v-model="password" type="password" autocomplete="current-password" />
        <p v-if="error" class="error">{{ error }}</p>
        <button style="width:100%; margin-top:1rem" :disabled="loading">
          {{ loading ? t('login.signingIn') : t('login.signIn') }}
        </button>
      </form>
      <div class="hint">
        {{ t('login.demoAccounts') }}
      </div>
    </div>
  </div>
</template>
