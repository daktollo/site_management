<script setup>
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from './stores/auth.js';
import { setLocale } from './i18n/index.js';

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
</script>

<template>
  <nav v-if="auth.isAuthenticated" class="navbar">
    <span class="brand">🏢 {{ t('brand') }}</span>
    <router-link to="/">{{ t('nav.dashboard') }}</router-link>
    <router-link to="/payments">{{ t('nav.payments') }}</router-link>
    <router-link to="/cleaning">{{ t('nav.cleaning') }}</router-link>
    <router-link to="/properties">{{ t('nav.properties') }}</router-link>
    <span class="spacer"></span>
    <span class="user">{{ auth.user?.full_name }} ({{ t('roles.' + auth.user?.role) }})</span>
    <button class="ghost small" @click="toggleLocale">{{ locale === 'tr' ? 'EN' : 'TR' }}</button>
    <button class="ghost small" @click="logout">{{ t('nav.logout') }}</button>
  </nav>

  <!-- Language toggle is also available before login -->
  <div v-else style="position:absolute; top:1rem; right:1.5rem">
    <button class="ghost small" @click="toggleLocale">{{ locale === 'tr' ? 'EN' : 'TR' }}</button>
  </div>

  <router-view />
</template>
