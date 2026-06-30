<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../services/api.js';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
const { t } = useI18n();
const properties = ref([]);
const error = ref('');
const newProperty = ref({ name: '', address: '' });
const newUnit = ref({}); // keyed by property id

async function load() {
  const { data } = await api.get('/properties');
  properties.value = data;
}

async function addProperty() {
  error.value = '';
  try {
    await api.post('/properties', newProperty.value);
    newProperty.value = { name: '', address: '' };
    await load();
  } catch (e) { error.value = e.response?.data?.error || t('properties.failed'); }
}

async function addUnit(propertyId) {
  error.value = '';
  try {
    await api.post(`/properties/${propertyId}/units`, { label: newUnit.value[propertyId] });
    newUnit.value[propertyId] = '';
    await load();
  } catch (e) { error.value = e.response?.data?.error || t('properties.failed'); }
}

onMounted(load);
</script>

<template>
  <div class="container">
    <h1>{{ t('properties.title') }}</h1>
    <p v-if="error" class="error">{{ error }}</p>

    <div v-for="p in properties" :key="p.id" class="card">
      <h2>{{ p.name }}</h2>
      <p class="muted" v-if="p.address">{{ p.address }}</p>
      <table>
        <thead><tr><th>{{ t('properties.unit') }}</th><th>{{ t('properties.resident') }}</th></tr></thead>
        <tbody>
          <tr v-for="u in p.units" :key="u.id">
            <td>{{ u.label }}</td>
            <td>{{ u.resident_name || t('common.none') }}</td>
          </tr>
          <tr v-if="!p.units.length"><td colspan="2" class="muted">{{ t('properties.noUnits') }}</td></tr>
        </tbody>
      </table>
      <div v-if="auth.isAdmin" style="display:flex; gap:0.5rem; margin-top:0.75rem">
        <input v-model="newUnit[p.id]" :placeholder="t('properties.newUnitLabel')" />
        <button class="small" :disabled="!newUnit[p.id]" @click="addUnit(p.id)">{{ t('properties.addUnit') }}</button>
      </div>
    </div>

    <div v-if="auth.isAdmin" class="card">
      <h2>{{ t('properties.newProperty') }}</h2>
      <div class="row">
        <div><label>{{ t('properties.name') }}</label><input v-model="newProperty.name" /></div>
        <div><label>{{ t('properties.address') }}</label><input v-model="newProperty.address" /></div>
      </div>
      <button style="margin-top:1rem" :disabled="!newProperty.name" @click="addProperty">{{ t('properties.addProperty') }}</button>
    </div>
  </div>
</template>
