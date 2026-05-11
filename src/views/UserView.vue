<!-- UserView.vue -->
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { PanelLeft, ArrowLeftRight, Download, Users, ShieldCheck, Shield } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'
import { useToastStore } from '@/stores/toast'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const userStore = useUserStore()
const toastStore = useToastStore()

const TOTAL_REGISTERED = 33
const profileMenuOpen = ref(false)
const profileImageError = ref(false)
const profileMenuRef = ref<HTMLElement | null>(null)
const showExpiredLicenseModal = ref(false)
const EXPIRED_LICENSE_MODAL_TTL_MS = 60 * 60 * 1000

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

function expiredLicenseModalStorageKey() {
  const userId = userStore.profile?.id ?? 'anonymous'
  return `celerity:expired-license-modal-seen:${userId}`
}

function hasRecentExpiredLicenseModalNotice() {
  const expiresAt = Number(localStorage.getItem(expiredLicenseModalStorageKey()) ?? 0)
  return Number.isFinite(expiresAt) && expiresAt > Date.now()
}

function markExpiredLicenseModalNoticeSeen() {
  const expiresAt = Date.now() + EXPIRED_LICENSE_MODAL_TTL_MS
  localStorage.setItem(expiredLicenseModalStorageKey(), String(expiresAt))
}

function syncExpiredLicenseModal() {
  if (!userStore.profile || route.name === 'license') {
    showExpiredLicenseModal.value = false
    return
  }

  const shouldShow = userStore.isExpired && !hasRecentExpiredLicenseModalNotice()
  showExpiredLicenseModal.value = shouldShow

  if (shouldShow) {
    markExpiredLicenseModalNoticeSeen()
  }
}

function closeExpiredLicenseModal() {
  showExpiredLicenseModal.value = false
}

function goToLicenseFromExpiredModal() {
  closeExpiredLicenseModal()
  router.push({ name: 'license' })
}

onMounted(async () => {
  document.addEventListener('pointerdown', handleGlobalPointerDown)
  await authStore.loadProfile()
  syncExpiredLicenseModal()
  await userStore.loadLicensePlans()
})

watch(
  () => [userStore.profile?.software_access_until, route.name],
  () => {
    syncExpiredLicenseModal()
  },
)

onUnmounted(() => {
  document.removeEventListener('pointerdown', handleGlobalPointerDown)
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
            <span class="pill-label">Licença</span>
            <span
              class="pill-value"
              :style="{
                color: userStore.isExpired ? 'var(--accent-danger)' : 'var(--accent-success)',
              }"
            >
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
      <div class="dash-layout">
        <aside class="dash-sidebar">
          <nav class="side-nav">
            <div class="side-nav-header">MÓDULOS</div>
            <RouterLink class="side-nav-item" :to="{ name: 'license' }" active-class="active">
              <PanelLeft class="side-nav-icon" />Minha Licença
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
            </div>
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

    <div
      v-if="showExpiredLicenseModal"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expired-license-title"
      @click.self="closeExpiredLicenseModal"
    >
      <div class="modal">
        <div class="modal-header">
          <h3 id="expired-license-title" class="modal-title">Licença expirada</h3>
        </div>
        <div class="modal-body">
          Sua licença está expirada. Para continuar usando todos os recursos, escolha uma opção:
        </div>
        <div class="modal-footer expired-license-actions">
          <button class="btn btn-primary" type="button" @click="goToLicenseFromExpiredModal">
            Ver planos
          </button>
          <button class="btn btn-ghost" type="button" @click="closeExpiredLicenseModal">OK</button>
        </div>
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
    linear-gradient(180deg, rgba(12, 13, 13, 0.84), rgba(8, 9, 10, 0.92)),
    linear-gradient(120deg, rgba(255, 255, 255, 0.028), rgba(184, 148, 95, 0.035) 46%, transparent);
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
  background: color-mix(in srgb, var(--accent-primary) 8%, transparent);
}
.side-nav-item.active {
  color: var(--text-primary);
  border-left-color: var(--accent-secondary);
  background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
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
  color: var(--accent-secondary);
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
  background: color-mix(in srgb, var(--accent-primary) 9%, transparent);
  border-color: var(--wire);
}

.profile-action.danger {
  color: var(--accent-danger-action);
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

.expired-license-actions {
  flex-wrap: wrap;
}
</style>
