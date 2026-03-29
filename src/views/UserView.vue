<!-- UserView.vue -->
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  PanelLeft,
  RefreshCw,
  CreditCard,
  ArrowLeftRight,
  Download,
  Users,
  ShieldCheck,
  Shield,
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'
import { useToastStore } from '@/stores/toast'

const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()
const toastStore = useToastStore()

// ── Online users counter (fake / demo) ──
const TOTAL_REGISTERED = 11
const onlineCount = ref(0)
const profileMenuOpen = ref(false)
const profileImageError = ref(false)
const profileMenuRef = ref<HTMLElement | null>(null)
let onlineInterval: ReturnType<typeof setInterval> | null = null

const profileAvatarUrl = computed(() => {
  const seed = encodeURIComponent(userStore.profile?.username || 'soldier')
  return `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${seed}&backgroundType=solid&backgroundColor=1a1a1a`
})

function toggleProfileMenu() {
  profileMenuOpen.value = !profileMenuOpen.value
}

function goAdmin() {
  profileMenuOpen.value = false
  router.push({ name: 'admin' })
}

function logoutFromMenu() {
  profileMenuOpen.value = false
  authStore.logout()
}

function handleGlobalPointerDown(event: Event) {
  const target = event.target as Node | null
  if (!profileMenuRef.value || !target) return
  if (!profileMenuRef.value.contains(target)) {
    profileMenuOpen.value = false
  }
}

function seededValue(seed: number, min: number, max: number): number {
  const h = ((seed * 2654435761) >>> 0) ^ (seed >>> 16)
  return min + (h % (max - min + 1))
}

function refreshOnline() {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60_000
  const br = new Date(utc - 3 * 60 * 60 * 1000)
  const hour = br.getHours()
  const seed = br.getFullYear() * 1000000 + (br.getMonth() + 1) * 10000 + br.getDate() * 100 + hour
  onlineCount.value = hour >= 12 && hour < 22 ? seededValue(seed, 1, 4) : 0
}

onMounted(async () => {
  document.addEventListener('pointerdown', handleGlobalPointerDown)
  refreshOnline()
  onlineInterval = setInterval(refreshOnline, 30_000)
  await Promise.all([
    userStore.loadKeys(),
    userStore.loadResalePlans(),
    userStore.loadLicensePlans(),
  ])
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', handleGlobalPointerDown)
  if (onlineInterval) clearInterval(onlineInterval)
})

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR')
}
</script>

<template>
  <div class="page-wrapper" v-if="userStore.profile">
    <header class="app-header">
      <div class="container header-content">
        <div class="logo">
          <img src="/src/assets/logo.png" class="logo-icon" />
          <span>Celerity</span>
        </div>
        <nav class="header-nav">
          <div class="header-pill">
            <span class="pill-label">Créditos</span>
            <span class="pill-value" style="color: var(--accent-primary)">{{
              userStore.profile.credits
            }}</span>
          </div>
          <div class="header-pill">
            <span class="pill-label">Licença</span>
            <span class="pill-value" style="color: var(--accent-primary)">
              {{ userStore.isExpired ? 'EXPIRADA' : `${userStore.daysLeft}d` }}
            </span>
          </div>
          <div class="header-pill">
            <span class="pill-label">Soldado</span>
            <span class="pill-value mono">{{ userStore.profile.username }}</span>
          </div>
          <div class="profile-menu" ref="profileMenuRef">
            <button
              class="profile-trigger"
              type="button"
              @click="toggleProfileMenu"
              aria-label="Abrir menu do perfil"
            >
              <img
                v-if="!profileImageError"
                class="profile-avatar"
                :src="profileAvatarUrl"
                alt="Avatar do perfil"
                @error="profileImageError = true"
              />
              <span v-else class="profile-avatar-fallback">
                <Shield :size="14" />
              </span>
            </button>

            <div v-if="profileMenuOpen" class="profile-dropdown">
              <button
                v-if="authStore.isAdmin"
                class="profile-action"
                type="button"
                @click="goAdmin"
              >
                Admin
              </button>
              <button class="profile-action danger" type="button" @click="logoutFromMenu">
                Desconectar
              </button>
            </div>
          </div>
        </nav>
      </div>
    </header>

    <main class="main-content container">
      <div class="stats-strip">
        <div class="stat-strip-item">
          <span class="stat-strip-label">Total de Keys</span>
          <span class="stat-strip-value">{{ userStore.keyStats.total }}</span>
        </div>
        <div class="stat-strip-divider"></div>
        <div class="stat-strip-item">
          <span class="stat-strip-label">Disponíveis</span>
          <span class="stat-strip-value" style="color: var(--accent-success)">{{
            userStore.keyStats.available
          }}</span>
        </div>
        <div class="stat-strip-divider"></div>
        <div class="stat-strip-item">
          <span class="stat-strip-label">Usadas</span>
          <span class="stat-strip-value" style="color: var(--accent-warning)">{{
            userStore.keyStats.used
          }}</span>
        </div>
        <div class="stat-strip-divider"></div>
        <div class="stat-strip-item">
          <span class="stat-strip-label">Revertidas</span>
          <span class="stat-strip-value" style="color: var(--text-muted)">{{
            userStore.keyStats.reverted
          }}</span>
        </div>
        <div class="stat-strip-spacer"></div>
        <div class="stat-strip-status">
          <span class="status-dot" :class="userStore.isExpired ? 'expired' : 'active'"></span>
          <span>{{ userStore.isExpired ? 'LICENÇA EXPIRADA' : 'LICENÇA ATIVA' }}</span>
        </div>
      </div>

      <div class="dash-layout">
        <aside class="dash-sidebar">
          <nav class="side-nav">
            <div class="side-nav-header">MÓDULOS</div>
            <RouterLink class="side-nav-item" :to="{ name: 'license' }" active-class="active">
              <PanelLeft class="side-nav-icon" />Minha Licença
            </RouterLink>
            <RouterLink class="side-nav-item" :to="{ name: 'resale' }" active-class="active">
              <RefreshCw class="side-nav-icon" />Revenda de Keys
            </RouterLink>
            <RouterLink class="side-nav-item" :to="{ name: 'credits' }" active-class="active">
              <CreditCard class="side-nav-icon" />Comprar Créditos
            </RouterLink>
            <RouterLink class="side-nav-item" :to="{ name: 'transactions' }" active-class="active">
              <ArrowLeftRight class="side-nav-icon" />Transações
            </RouterLink>
            <RouterLink
              v-if="!userStore.isExpired"
              class="side-nav-item"
              :to="{ name: 'download' }"
              active-class="active"
            >
              <Download class="side-nav-icon" />Download
            </RouterLink>
          </nav>

          <div class="side-license-card">
            <div class="slc-label"><ShieldCheck class="slc-icon" />LICENÇA</div>
            <div
              class="slc-value"
              :style="{
                color: userStore.isExpired ? 'var(--accent-danger)' : 'var(--accent-success)',
              }"
            >
              {{ userStore.isExpired ? 'EXPIRADA' : `${userStore.daysLeft} DIAS` }}
            </div>
            <div class="slc-date">
              Expira: {{ formatDate(userStore.profile?.software_access_until) }}
            </div>
          </div>

          <div class="side-online-card">
            <div class="soc-header">
              <span class="soc-label"><Users class="soc-icon" />USUÁRIOS</span>
              <span class="soc-pulse" :class="onlineCount > 0 ? 'live' : 'idle'"></span>
            </div>
            <div class="soc-row">
              <span class="soc-metric-label">Usando agora</span>
              <span class="soc-metric-value" :class="onlineCount > 0 ? 'online' : 'zero'">{{
                onlineCount
              }}</span>
            </div>
            <div class="soc-divider"></div>
            <div class="soc-row">
              <span class="soc-metric-label">Registrados</span>
              <span class="soc-metric-value total">{{ TOTAL_REGISTERED }}</span>
            </div>
          </div>
        </aside>

        <div class="dash-content">
          <RouterView />
        </div>
      </div>
    </main>

    <div class="toast-container">
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        :class="['toast', `toast-${toast.type}`]"
      >
        <span>{{ toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : '◎' }}</span>
        {{ toast.message }}
      </div>
    </div>
  </div>

  <div v-else class="loading-page">
    <div class="loading-content">
      <span class="spinner" style="width: 32px; height: 32px" />
      <p class="loading-label">INICIALIZANDO SISTEMA</p>
    </div>
  </div>
</template>

<style scoped>
.page-wrapper,
.loading-page {
  min-height: 100dvh;
  background: transparent;
  position: relative;
}

.page-wrapper::before,
.page-wrapper::after,
.loading-page::before,
.loading-page::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
}

.page-wrapper::before,
.loading-page::before {
  background:
    linear-gradient(180deg, rgba(12, 12, 12, 0.82), rgba(7, 7, 7, 0.9)),
    linear-gradient(120deg, rgba(255, 255, 255, 0.035), rgba(244, 218, 45, 0.05) 46%, transparent);
}

.page-wrapper::after,
.loading-page::after {
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px),
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.85), transparent 88%);
}

.loading-page {
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-content {
  width: 100%;
  padding-top: var(--space-6);
  padding-bottom: var(--space-8);
  flex: 1;
}

.dash-content {
  display: grid;
  gap: var(--space-6);
}

.stats-strip {
  display: flex;
  align-items: center;
  background: color-mix(in srgb, var(--surface-glass) 84%, #171717);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-6);
  margin-bottom: var(--space-6);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.stat-strip-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 var(--space-5);
}
.stat-strip-item:first-child {
  padding-left: 0;
}

.stat-strip-label {
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--text-muted);
}

.stat-strip-value {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-strip-divider {
  width: 1px;
  height: 36px;
  background: var(--wire);
  flex-shrink: 0;
}
.stat-strip-spacer {
  flex: 1;
}

.stat-strip-status {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--text-muted);
}

.dash-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: var(--space-6);
  align-items: start;
}

@media (max-width: 768px) {
  .dash-layout {
    grid-template-columns: 1fr;
  }
  .dash-sidebar {
    display: none;
  }
}

.dash-sidebar {
  position: sticky;
  top: 76px;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.side-nav {
  background: color-mix(in srgb, var(--surface-glass) 85%, #171717);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.side-nav-header {
  padding: var(--space-3) var(--space-4);
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--text-muted);
  background: color-mix(in srgb, var(--surface-glass) 76%, #141414);
  border-bottom: 1px solid var(--wire);
}

.side-nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  background: transparent;
  border: none;
  border-left: 2px solid transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: left;
  text-decoration: none;
}

.side-nav-item:hover {
  color: var(--text-secondary);
  background: color-mix(in srgb, var(--accent-secondary) 10%, transparent);
}
.side-nav-item.active {
  color: var(--accent-primary);
  border-left-color: var(--accent-primary);
  background: color-mix(in srgb, var(--accent-primary) 16%, transparent);
}
.side-nav-icon {
  opacity: 0.5;
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}
.side-nav-item.active .side-nav-icon {
  opacity: 1;
}

.slc-label {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}
.slc-icon {
  width: 12px;
  height: 12px;
  opacity: 0.7;
}

.soc-label {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}
.soc-icon {
  width: 12px;
  height: 12px;
  opacity: 0.7;
}

.side-license-card {
  background: color-mix(in srgb, var(--surface-glass) 86%, #171717);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-md);
  padding: var(--space-4) var(--space-5);
}

.slc-label {
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--text-muted);
  margin-bottom: var(--space-1);
}

.slc-value {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 700;
  letter-spacing: 0.04em;
  margin-bottom: var(--space-1);
}
.slc-date {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-muted);
  letter-spacing: 0.04em;
}

/* Online users card */
.side-online-card {
  background: color-mix(in srgb, var(--surface-glass) 86%, #171717);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-md);
  padding: var(--space-4) var(--space-5);
}

.soc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.soc-label {
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--text-muted);
}

.soc-pulse {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.soc-pulse.idle {
  background: var(--text-disabled);
}
.soc-pulse.live {
  background: var(--accent-success);
  animation: pulse-live 2s infinite;
}

@keyframes pulse-live {
  0% {
    opacity: 1;
  }
  70% {
    opacity: 0.55;
  }
  100% {
    opacity: 1;
  }
}

.soc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-1) 0;
}

.soc-metric-label {
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  color: var(--text-muted);
  letter-spacing: 0.04em;
}

.soc-metric-value {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 700;
  line-height: 1;
}
.soc-metric-value.online {
  color: var(--accent-success);
}
.soc-metric-value.zero {
  color: var(--text-disabled);
}
.soc-metric-value.total {
  color: var(--text-primary);
}

.profile-menu {
  position: relative;
  display: flex;
  align-items: center;
}

.profile-trigger {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--wire-active);
  background: color-mix(in srgb, var(--surface-glass) 90%, #181818);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  margin: 0;
  align-self: center;
  line-height: 0;
}

.profile-avatar,
.profile-avatar-fallback {
  width: 100%;
  height: 100%;
  border-radius: inherit;
}

.profile-avatar {
  display: block;
  object-fit: cover;
}

.profile-avatar-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-primary);
}

.profile-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 142px;
  background: color-mix(in srgb, var(--surface-glass-strong) 94%, #161616);
  border: 1px solid var(--wire-active);
  border-radius: var(--radius-md);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 80;
}

.profile-action {
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-primary);
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  text-align: left;
  padding: 0.48rem 0.6rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.profile-action:hover {
  background: color-mix(in srgb, var(--accent-secondary) 10%, transparent);
  border-color: var(--wire);
}

.profile-action.danger {
  color: var(--accent-danger-action);
}

.soc-divider {
  height: 1px;
  background: var(--wire);
  margin: var(--space-2) 0;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
}

.loading-label {
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--text-muted);
}
</style>
