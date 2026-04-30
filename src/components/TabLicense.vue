<!-- components/TabLicense.vue -->
<script setup lang="ts">
import { useUserStore } from '@/stores/user'

interface Plan {
  days: number
  price: number
}

const userStore = useUserStore()
const DISCORD_USER_URL = 'discord://-/users/650180750871756826'

function formatDate(date: string | null | undefined) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR')
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

function openDiscordUser() {
  window.location.href = DISCORD_USER_URL
}
</script>

<template>
  <div class="tab-content space-y-6">
    <!-- Status da licença -->
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Status da Licença</h2>
      </div>
      <div class="card-body">
        <div class="license-status-row">
          <div class="license-status-block">
            <div class="lsb-label">DIAS RESTANTES</div>
            <div class="lsb-value" :class="userStore.isExpired ? 'text-red' : 'text-green'">
              {{ userStore.daysLeft }}
            </div>
          </div>
          <div class="license-status-block">
            <div class="lsb-label">EXPIRA EM</div>
            <div class="lsb-date mono">
              {{ formatDate(userStore.profile?.software_access_until) }}
            </div>
          </div>
          <div class="license-status-block">
            <div class="lsb-label">STATUS</div>
            <span :class="['badge', userStore.isExpired ? 'badge-danger' : 'badge-success']">
              {{ userStore.isExpired ? 'Expirada' : 'Ativa' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Planos para estender -->
    <div class="card">
      <div class="card-header">
        <div class="card-header-inner">
          <div>
            <h2 class="card-title">Estender Licença</h2>
            <p class="card-subtitle">Escolha um plano e finalize a compra pelo Discord</p>
          </div>
        </div>
      </div>
      <div class="card-body">
        <div class="plan-grid">
          <div
            v-for="plan in userStore.licensePlans"
            :key="plan.days"
            class="plan-card"
            :class="{
              featured: plan.days === 30,
              'purchase-card': true,
            }"
            role="button"
            tabindex="0"
            @click="openDiscordUser"
            @keydown.enter.prevent="openDiscordUser"
            @keydown.space.prevent="openDiscordUser"
          >
            <div class="plan-header">
              <h3 class="plan-name">{{ plan.days }} Dias</h3>
              <p class="plan-description">Acesso completo</p>
            </div>
            <div class="plan-price">
              <span class="plan-price-value">{{ formatCurrency(plan.price) }}</span>
            </div>
            <div class="purchase-card-action">
              COMPRAR NO DISCORD
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.license-status-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}

@media (max-width: 600px) {
  .license-status-row {
    grid-template-columns: 1fr;
  }
}

.license-status-block {
  padding: var(--space-5);
  background: color-mix(in srgb, var(--surface-glass) 82%, #171717);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-md);
}

.lsb-label {
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--text-muted);
  margin-bottom: var(--space-2);
}

.lsb-value {
  font-family: var(--font-display);
  font-size: var(--text-4xl);
  font-weight: 700;
  line-height: 1;
}

.lsb-date {
  font-size: var(--text-base);
  color: var(--text-secondary);
}

.text-red {
  color: var(--accent-danger);
}
.text-green {
  color: var(--accent-success);
}

.purchase-card {
  cursor: pointer;
}

.purchase-card-action {
  margin-top: var(--space-3);
  border-top: 1px solid var(--wire);
  padding-top: var(--space-3);
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent-primary);
}
</style>
