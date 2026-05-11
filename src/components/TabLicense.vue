<!-- components/TabLicense.vue -->
<script setup lang="ts">
import { CalendarDays, Clock3, ExternalLink, ShieldCheck } from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'

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
    <div class="license-overview">
      <div class="license-overview-copy">
        <span class="eyebrow">Gestão de acesso</span>
        <h1>Minha Licença</h1>
        <p>Consulte a validade atual e escolha uma extensão de acesso quando necessário.</p>
      </div>
      <div :class="['license-state-pill', userStore.isExpired ? 'is-expired' : 'is-active']">
        <ShieldCheck :size="16" />
        <span>{{ userStore.isExpired ? 'Licença expirada' : 'Licença ativa' }}</span>
      </div>
    </div>

    <div class="card license-status-card">
      <div class="card-header">
        <div>
          <h2 class="card-title">Status da Licença</h2>
          <p class="card-subtitle">Informações sincronizadas com sua conta</p>
        </div>
      </div>
      <div class="card-body">
        <div class="license-status-row">
          <div class="license-status-block">
            <Clock3 class="lsb-icon" :size="18" />
            <div class="lsb-label">Dias restantes</div>
            <div class="lsb-value" :class="userStore.isExpired ? 'text-red' : 'text-green'">
              {{ userStore.daysLeft }}
            </div>
          </div>
          <div class="license-status-block">
            <CalendarDays class="lsb-icon" :size="18" />
            <div class="lsb-label">Expira em</div>
            <div class="lsb-date mono">
              {{ formatDate(userStore.profile?.software_access_until) }}
            </div>
          </div>
          <div class="license-status-block">
            <ShieldCheck class="lsb-icon" :size="18" />
            <div class="lsb-label">Status</div>
            <span :class="['badge', userStore.isExpired ? 'badge-danger' : 'badge-success']">
              {{ userStore.isExpired ? 'Expirada' : 'Ativa' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-header-inner">
          <div>
            <h2 class="card-title">Estender Licença</h2>
            <p class="card-subtitle">Escolha um período e finalize a compra pelo Discord</p>
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
              <p class="plan-description">Acesso completo ao aplicativo</p>
            </div>
            <div class="plan-price">
              <span class="plan-price-value">{{ formatCurrency(plan.price) }}</span>
            </div>
            <div class="purchase-card-action">
              <span>Comprar no Discord</span>
              <ExternalLink :size="14" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.license-overview {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-6);
  padding: var(--space-2) 0 var(--space-1);
}

.license-overview-copy {
  max-width: 680px;
}

.eyebrow {
  display: inline-flex;
  margin-bottom: var(--space-2);
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--accent-secondary);
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.license-overview h1 {
  font-size: var(--text-3xl);
  margin-bottom: var(--space-2);
}

.license-overview p {
  color: var(--text-muted);
  font-size: var(--text-sm);
  line-height: 1.5;
}

.license-state-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
  min-height: 36px;
  padding: 0.45rem 0.75rem;
  border: 1px solid var(--wire-active);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  background: color-mix(in srgb, var(--surface-glass) 82%, #121212);
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.license-state-pill.is-active {
  color: color-mix(in srgb, var(--accent-success) 82%, white);
  border-color: color-mix(in srgb, var(--accent-success) 30%, transparent);
}

.license-state-pill.is-expired {
  color: color-mix(in srgb, var(--accent-danger) 84%, white);
  border-color: color-mix(in srgb, var(--accent-danger) 32%, transparent);
}

.license-status-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}

@media (max-width: 600px) {
  .license-status-row {
    grid-template-columns: 1fr;
  }

  .license-overview {
    align-items: flex-start;
    flex-direction: column;
    gap: var(--space-4);
  }
}

.license-status-block {
  min-height: 144px;
  padding: var(--space-5);
  background: color-mix(in srgb, var(--surface-glass) 74%, #151515);
  border: 1px solid var(--wire);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.lsb-icon {
  color: var(--accent-secondary);
  opacity: 0.82;
  margin-bottom: var(--space-5);
}

.lsb-label {
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
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
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--text-primary);
}

.text-red {
  color: var(--accent-danger);
}
.text-green {
  color: var(--accent-success);
}

.purchase-card {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  min-height: 208px;
}

.purchase-card-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-top: auto;
  border-top: 1px solid var(--wire);
  padding-top: var(--space-3);
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent-secondary);
}
</style>
