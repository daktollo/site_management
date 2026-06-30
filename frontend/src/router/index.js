import { createRouter, createWebHashHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import PaymentsView from '../views/PaymentsView.vue';
import CleaningView from '../views/CleaningView.vue';
import PropertiesView from '../views/PropertiesView.vue';
import UsersView from '../views/UsersView.vue';

const routes = [
  { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
  { path: '/', name: 'dashboard', component: DashboardView },
  { path: '/payments', name: 'payments', component: PaymentsView },
  { path: '/cleaning', name: 'cleaning', component: CleaningView },
  { path: '/properties', name: 'properties', component: PropertiesView },
  { path: '/users', name: 'users', component: UsersView, meta: { admin: true } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({ history: createWebHashHistory(), routes });

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (!to.meta.public && !auth.isAuthenticated) return { name: 'login' };
  if (to.name === 'login' && auth.isAuthenticated) return { name: 'dashboard' };
  if (to.meta.admin && !auth.isAdmin) return { name: 'dashboard' };
});

export default router;
