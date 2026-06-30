<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from './stores/auth.js';

const auth = useAuthStore();
const router = useRouter();

function logout() {
  auth.logout();
  router.push({ name: 'login' });
}
</script>

<template>
  <nav v-if="auth.isAuthenticated" class="navbar">
    <span class="brand">🏢 Site Management</span>
    <router-link to="/">Dashboard</router-link>
    <router-link to="/payments">Payments</router-link>
    <router-link to="/cleaning">Cleaning</router-link>
    <router-link to="/properties">Properties</router-link>
    <span class="spacer"></span>
    <span class="user">{{ auth.user?.full_name }} ({{ auth.user?.role }})</span>
    <button class="ghost small" @click="logout">Log out</button>
  </nav>

  <router-view />
</template>
