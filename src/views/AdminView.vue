<!-- AdminView.vue -->
<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAdminStore, type User, type LicensePlan } from '@/stores/admin'
import { useToastStore } from '@/stores/toast'

const adminStore = useAdminStore()
const toastStore = useToastStore()

const showPlanModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showLogoutModal = ref(false)
const showGeneratedKeyModal = ref(false)
const generatedActivationKey = ref('')
const generatedActivationDays = ref(3)
const activationKeyDuration = ref(3)

const loginEmail = ref('')
const loginPassword = ref('')

// ─── Plan modal ─────────────────────────────────────────────────────────────

const planModal = ref({
  duration_days: '' as '' | number,
  price: '' as '' | number,
  isNew: false,
})

function openLicensePlanModal(plan?: LicensePlan) {
  planModal.value = {
    duration_days: plan?.duration_days ?? '',
    price: plan?.price ?? '',
    isNew: !plan,
  }
  showPlanModal.value = true
}

async function savePlan() {
  const days = Number(planModal.value.duration_days)
  const price = Number(planModal.value.price)

  if (!days || days <= 0) {
    toastStore.error('Informe uma duração válida')
    return
  }
  if (!price || price <= 0) {
    toastStore.error('Informe um preço válido')
    return
  }

  const result = await adminStore.saveLicensePlan(days, price)
  if (result.ok) {
    toastStore.success('Plano de licença salvo!')
    showPlanModal.value = false
  } else toastStore.error(result.error)
}

// ─── Edit user modal ─────────────────────────────────────────────────────────

const editForm = ref({
  id: '',
  username: '',
  password: '',
  licenseDays: '' as '' | number | 'date',
  customDate: '',
  isActive: true,
})

// ─── Data loading ─────────────────────────────────────────────────────────────

watch(
  () => adminStore.supabaseAuthed,
  async (authed) => {
    if (!authed) return
    await Promise.all([
      adminStore.loadUsers(),
      adminStore.loadLicensePlans(),
      adminStore.loadActivationKeys(),
    ])
  },
  { immediate: true },
)

// ─── Handlers ────────────────────────────────────────────────────────────────

async function adminLogin() {
  if (!loginEmail.value || !loginPassword.value) {
    adminStore.error = 'Preencha e-mail e senha.'
    return
  }
  const ok = await adminStore.login(loginEmail.value, loginPassword.value)
  if (ok) {
    loginEmail.value = ''
    loginPassword.value = ''
  }
}

function openEditModal(user: User) {
  editForm.value = {
    id: user.id,
    username: user.username,
    password: '',
    licenseDays: '',
    customDate: '',
    isActive: user.is_active,
  }
  showEditModal.value = true
}

async function saveEdit() {
  type EditPatch = {
    is_active: boolean
    password_hash?: string
    software_access_until?: string
  }
  const patch: EditPatch = { is_active: editForm.value.isActive }

  if (editForm.value.password) patch.password_hash = editForm.value.password

  if (editForm.value.licenseDays === 'date' && editForm.value.customDate) {
    patch.software_access_until = new Date(editForm.value.customDate).toISOString()
  } else if (typeof editForm.value.licenseDays === 'number') {
    patch.software_access_until = new Date(
      Date.now() + editForm.value.licenseDays * 86400000,
    ).toISOString()
  }

  const result = await adminStore.updateUser(editForm.value.id, patch)
  if (result.ok) {
    toastStore.success('Usuário atualizado!')
    showEditModal.value = false
  }
}

function openDeleteModal(user: User) {
  adminStore.selectUser(user)
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!adminStore.selectedUser) return
  await adminStore.updateUser(adminStore.selectedUser.id, { is_active: false })
  toastStore.success('Usuário desativado')
  showDeleteModal.value = false
  adminStore.closeUserPanel()
}

function openLogoutModal(user: User) {
  adminStore.selectUser(user)
  showLogoutModal.value = true
}

async function confirmLogout() {
  if (!adminStore.selectedUser) return
  await adminStore.forceLogout(adminStore.selectedUser.id)
  toastStore.success('Usuário desconectado')
  showLogoutModal.value = false
}

async function generateActivationKey() {
  const result = await adminStore.generateActivationKey(activationKeyDuration.value)
  if (!result.ok) {
    toastStore.error(result.error)
    return
  }

  generatedActivationKey.value = result.key
  generatedActivationDays.value = result.durationDays
  showGeneratedKeyModal.value = true
  toastStore.success('Key de ativação gerada.')
}

async function copyGeneratedKey() {
  if (!generatedActivationKey.value) return
  await navigator.clipboard.writeText(generatedActivationKey.value)
  toastStore.success('Key copiada.')
}

async function deleteActivationKey(keyId: string) {
  const result = await adminStore.deleteActivationKey(keyId)
  if (!result.ok) {
    toastStore.error(result.error)
    return
  }
  toastStore.success('Key excluída.')
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

function lastSeenAgo(iso: string | null) {
  if (!iso) return '—'

  const now = new Date()
  const last = new Date(iso)

  const diffMs = now.getTime() - last.getTime()
  const diffMinutes = Math.floor(diffMs / 1000 / 60)
  const diffHours = Math.floor(diffMinutes / 60)

  if (diffMinutes < 1) return 'agora'

  if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minutos'}`
  }

  return `${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`
}

function daysLeft(iso: string | null) {
  if (!iso) return '—'
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
  return diff <= 0 ? 'expirado' : `${diff}d`
}
</script>

<template>
  <!-- ── ADMIN LOGIN ──────────────────────────────────────────── -->
  <div class="admin-login-page" v-if="!adminStore.supabaseAuthed">
    <div class="admin-login-wrap">
      <div class="admin-login-brand">
        <div class="admin-logo">◈</div>
        <div>
          <h1 class="admin-brand-title">Administração</h1>
          <p class="admin-brand-sub">PAINEL DE CONTROLE // ACESSO RESTRITO</p>
        </div>
      </div>

      <div class="admin-login-card">
        <div class="admin-login-card-head">Autenticação Administrativa</div>

        <div
          v-if="adminStore.error"
          class="alert alert-error"
          style="margin: var(--space-5); margin-bottom: 0"
        >
          <span>⚠</span> {{ adminStore.error }}
        </div>

        <form @submit.prevent="adminLogin" class="admin-login-form">
          <div class="form-group">
            <label class="form-label">E-mail</label>
            <input
              v-model="loginEmail"
              type="email"
              class="form-input"
              placeholder="admin@exemplo.com"
              required
            />
          </div>
          <div class="form-group">
            <label class="form-label">Senha</label>
            <input
              v-model="loginPassword"
              type="password"
              class="form-input"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            class="btn btn-primary btn-lg w-full"
            :disabled="adminStore.loading.auth"
          >
            <span class="spinner" v-if="adminStore.loading.auth" />
            <span v-else>▶ ACESSAR PAINEL</span>
          </button>
        </form>
      </div>
    </div>
  </div>

  <!-- ── ADMIN DASHBOARD ──────────────────────────────────────── -->
  <div class="admin-dashboard-page" v-else>
    <header class="app-header">
      <div class="container header-content">
        <div class="logo">
          <img src="/src/assets/logo.png" class="logo-icon" />
          <span>Painel administrativo</span>
          <span class="admin-badge">ADMIN</span>
        </div>
        <button class="btn btn-ghost" @click="adminStore.logout">Sair</button>
      </div>
    </header>

    <main class="container admin-main">
      <!-- ── Stats ── -->
      <div class="stats-grid" style="margin-bottom: var(--space-6)">
        <div class="stat-card">
          <div class="stat-label">Operadores</div>
          <div class="stat-value">{{ adminStore.stats.total }}</div>
        </div>
        <div class="stat-card success">
          <div class="stat-label">Licenças Ativas</div>
          <div class="stat-value" style="color: var(--accent-success)">
            {{ adminStore.stats.active }}
          </div>
        </div>
        <div class="stat-card warning">
          <div class="stat-label">Expirados</div>
          <div class="stat-value" style="color: var(--accent-warning)">
            {{ adminStore.stats.expired }}
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Desativados</div>
          <div class="stat-value" style="color: var(--text-muted)">
            {{ adminStore.stats.inactive }}
          </div>
        </div>
      </div>

      <!-- ── License Plans ── -->
      <div class="card" style="margin-bottom: var(--space-5)">
        <div class="card-header">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="section-card-title">Planos de Licença</h2>
              <p class="section-card-sub">Planos disponíveis para compra direta pelos usuários</p>
            </div>
            <button class="btn btn-secondary btn-sm" @click="openLicensePlanModal()">
              + Novo Plano
            </button>
          </div>
        </div>
        <div class="card-body" style="padding: 0">
          <div
            v-if="adminStore.loading.licensePlans"
            class="empty-state"
            style="padding: var(--space-6)"
          >
            <span class="spinner" />
            <p>Carregando...</p>
          </div>
          <div
            v-else-if="adminStore.licensePlans.length === 0"
            class="empty-state"
            style="padding: var(--space-6)"
          >
            <p>Nenhum plano de licença cadastrado.</p>
          </div>
          <table v-else>
            <thead>
              <tr>
                <th>Duração</th>
                <th>Preço (R$)</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="plan in adminStore.licensePlans" :key="plan.duration_days">
                <td class="mono" style="font-weight: 600">{{ plan.duration_days }} dias</td>
                <td class="mono" style="color: var(--accent-primary)">R$ {{ plan.price }}</td>
                <td>
                  <button class="btn btn-ghost btn-sm" @click="openLicensePlanModal(plan)">
                    Editar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card" style="margin-bottom: var(--space-5)">
        <div class="card-header">
          <h2 class="section-card-title">Histórico de Keys de Ativação</h2>
        </div>
        <div class="card-body" style="padding: 0">
          <div
            v-if="adminStore.loading.activationKeys"
            class="empty-state"
            style="padding: var(--space-6)"
          >
            <span class="spinner" />
            <p>Carregando keys...</p>
          </div>
          <div
            v-else-if="adminStore.activationKeys.length === 0"
            class="empty-state"
            style="padding: var(--space-6)"
          >
            <p>Nenhuma key de ativação gerada.</p>
          </div>
          <table v-else>
            <thead>
              <tr>
                <th>Key</th>
                <th>Duração</th>
                <th>Criada em</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="key in adminStore.activationKeys" :key="key.id">
                <td class="mono" style="font-size: var(--text-xs); color: var(--accent-primary)">
                  {{ key.key }}
                </td>
                <td class="mono">{{ key.duration_days }} dias</td>
                <td class="mono">{{ formatDate(key.created_at) }}</td>
                <td>
                  <span :class="['badge', key.used ? 'badge-warning' : 'badge-success']">
                    {{ key.used ? 'Usada' : 'Disponível' }}
                  </span>
                </td>
                <td>
                  <button
                    v-if="!key.used"
                    class="btn btn-danger btn-sm"
                    :disabled="adminStore.loading.deleteActivationKey === key.id"
                    @click="deleteActivationKey(key.id)"
                  >
                    <span
                      class="spinner"
                      v-if="adminStore.loading.deleteActivationKey === key.id"
                    />
                    <span v-else>Excluir</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── Ativação por Key ── -->
      <div class="card" style="margin-bottom: var(--space-5)">
        <div class="card-header">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="section-card-title">Keys de Ativação</h2>
              <p class="section-card-sub">Gera key para criação de conta com duração definida</p>
            </div>
            <div class="activation-key-actions">
              <select
                v-model.number="activationKeyDuration"
                class="form-input form-select activation-duration-select"
                :disabled="adminStore.loading.generateActivationKey"
                aria-label="Duração da key de ativação"
              >
                <option :value="3">3 dias</option>
                <option :value="7">7 dias</option>
                <option :value="15">15 dias</option>
                <option :value="30">30 dias</option>
              </select>
              <button
                class="btn btn-primary btn-sm"
                :disabled="adminStore.loading.generateActivationKey"
                @click="generateActivationKey"
              >
                <span class="spinner" v-if="adminStore.loading.generateActivationKey" />
                <span v-else>Gerar Key</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Users Table ── -->
      <div class="card">
        <div class="card-header">
          <div class="flex items-center justify-between" style="gap: var(--space-4)">
            <h2 class="section-card-title">Operadores Registrados</h2>
            <div class="flex gap-3">
              <input
                v-model="adminStore.searchQuery"
                type="text"
                class="form-input"
                placeholder="Buscar operador ou e-mail..."
                style="width: 260px"
              />
              <button
                class="btn btn-secondary btn-sm"
                @click="adminStore.loadUsers"
                :disabled="adminStore.loading.users"
              >
                <span class="spinner" v-if="adminStore.loading.users" />
                <span v-else>↻ Atualizar</span>
              </button>
            </div>
          </div>
        </div>

        <div class="card-body" style="padding: 0">
          <div v-if="adminStore.loading.users" class="empty-state">
            <span class="spinner" />
            <p>Carregando operadores...</p>
          </div>

          <table v-else>
            <thead>
              <tr>
                <th>Operador</th>
                <th>E-mail</th>
                <th>Status</th>
                <th>Licença</th>
                <th>Dias</th>
                <th>Last seen</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="adminStore.filteredUsers.length === 0">
                <td colspan="7" class="empty-state" style="padding: 3rem">
                  Nenhum operador encontrado.
                </td>
              </tr>

              <template v-for="user in adminStore.filteredUsers" :key="user.id">
                <tr class="user-row">
                  <td>
                    <span class="mono" style="font-weight: 600; color: var(--text-primary)">
                      {{ user.username }}
                    </span>
                  </td>
                  <td style="color: var(--text-muted)">{{ user.email || '—' }}</td>
                  <td>
                    <span v-if="!user.is_active" class="badge badge-danger">Inativo</span>
                    <span v-else-if="adminStore.isLicenseActive(user)" class="badge badge-success"
                      >Ativo</span
                    >
                    <span v-else class="badge badge-warning">Expirado</span>
                  </td>
                  <td class="mono" style="font-size: var(--text-xs)">
                    {{ formatDate(user.software_access_until) }}
                  </td>
                  <td class="mono" style="font-size: var(--text-xs)">
                    {{ daysLeft(user.software_access_until) }}
                  </td>
                  <td class="mono" style="font-size: var(--text-xs)">
                    {{ lastSeenAgo(user.last_seen) }}
                  </td>
                  <td>
                    <div class="flex gap-2" @click.stop>
                      <button class="btn btn-ghost btn-sm" @click="openEditModal(user)">
                        Editar
                      </button>
                      <button
                        class="btn btn-ghost btn-sm"
                        @click="openLogoutModal(user)"
                        :disabled="!user.active_token"
                      >
                        Logout
                      </button>
                      <button class="btn btn-danger btn-sm" @click="openDeleteModal(user)">
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <!-- ── MODAL: Plano de licença ── -->
    <div v-if="showPlanModal" class="modal-overlay" @click.self="showPlanModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">
            {{ planModal.isNew ? 'Novo Plano de Licença' : 'Editar Plano de Licença' }}
          </h3>
        </div>
        <div class="modal-body space-y-4">
          <div class="form-group">
            <label class="form-label">Duração (dias)</label>
            <input
              v-model="planModal.duration_days"
              type="number"
              class="form-input"
              min="1"
              step="1"
              placeholder="Ex: 30"
              :readonly="!planModal.isNew"
              :style="!planModal.isNew ? 'opacity: 0.6; cursor: not-allowed' : ''"
            />
            <p v-if="!planModal.isNew" class="form-hint">
              A duração é a chave primária e não pode ser alterada. Crie um novo plano se
              necessário.
            </p>
          </div>
          <div class="form-group">
            <label class="form-label">Preço (R$)</label>
            <input
              v-model="planModal.price"
              type="number"
              class="form-input"
              min="1"
              step="1"
              placeholder="Ex: 20"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showPlanModal = false">Cancelar</button>
          <button
            class="btn btn-primary"
            @click="savePlan"
            :disabled="adminStore.loading.saveLicensePlan"
          >
            <span class="spinner" v-if="adminStore.loading.saveLicensePlan" />
            <span v-else>Salvar</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ── MODAL: Editar Usuário ── -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Editar Operador</h3>
        </div>
        <div class="modal-body space-y-4">
          <div
            class="edit-user-tag mono"
            style="color: var(--accent-primary); margin-bottom: var(--space-2)"
          >
            {{ editForm.username }}
          </div>
          <div class="form-group">
            <label class="form-label">Nova Senha <span class="optional">opcional</span></label>
            <input
              v-model="editForm.password"
              type="password"
              class="form-input"
              placeholder="Deixe vazio para não alterar"
            />
          </div>
          <div class="form-group">
            <label class="form-label"
              >Estender Licença <span class="optional">opcional</span></label
            >
            <select v-model="editForm.licenseDays" class="form-input form-select">
              <option value="">Não alterar</option>
              <option :value="7">+ 7 dias</option>
              <option :value="15">+ 15 dias</option>
              <option :value="30">+ 30 dias</option>
              <option value="date">Data específica</option>
            </select>
          </div>
          <div class="form-group" v-if="editForm.licenseDays === 'date'">
            <label class="form-label">Data de Expiração</label>
            <input v-model="editForm.customDate" type="date" class="form-input" />
          </div>
          <div class="form-group">
            <label class="flex items-center gap-2" style="cursor: pointer">
              <input v-model="editForm.isActive" type="checkbox" class="form-checkbox" />
              <span style="font-size: var(--text-sm); color: var(--text-secondary)"
                >Conta ativa</span
              >
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showEditModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="saveEdit" :disabled="adminStore.loading.saveUser">
            <span class="spinner" v-if="adminStore.loading.saveUser" />
            <span v-else>Salvar</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ── MODAL: Confirmar Delete ── -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title" style="color: var(--accent-danger)">⚠ Desativar Operador</h3>
        </div>
        <div class="modal-body">
          <p style="color: var(--text-secondary)">
            Tem certeza que deseja desativar
            <strong class="mono" style="color: var(--accent-danger)">{{
              adminStore.selectedUser?.username
            }}</strong
            >?
          </p>
          <p class="form-hint" style="margin-top: var(--space-2)">
            O operador perderá acesso ao sistema. Esta ação pode ser revertida via edição da conta.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showDeleteModal = false">Cancelar</button>
          <button class="btn btn-danger" @click="confirmDelete">Desativar</button>
        </div>
      </div>
    </div>

    <!-- ── MODAL: Key Gerada ── -->
    <div
      v-if="showGeneratedKeyModal"
      class="modal-overlay"
      @click.self="showGeneratedKeyModal = false"
    >
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Key de Ativação Gerada</h3>
        </div>
        <div class="modal-body">
          <p style="color: var(--text-secondary); margin-bottom: var(--space-3)">
            Esta key cria uma conta com <strong>{{ generatedActivationDays }} dias</strong> de
            licença.
          </p>
          <div class="activation-key-box mono">
            {{ generatedActivationKey }}
          </div>
          <button
            class="btn btn-ghost btn-sm"
            style="margin-top: var(--space-3)"
            @click="copyGeneratedKey"
          >
            Copiar key
          </button>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="showGeneratedKeyModal = false">Fechar</button>
        </div>
      </div>
    </div>

    <!-- ── MODAL: Forçar Logout ── -->
    <div v-if="showLogoutModal" class="modal-overlay" @click.self="showLogoutModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Forçar Logout</h3>
        </div>
        <div class="modal-body">
          <p style="color: var(--text-secondary)">
            Desconectar
            <strong class="mono" style="color: var(--accent-primary)">{{
              adminStore.selectedUser?.username
            }}</strong
            >?
          </p>
          <p class="form-hint" style="margin-top: var(--space-2)">
            O usuário precisará fazer login novamente no aplicativo.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showLogoutModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="confirmLogout">Desconectar</button>
        </div>
      </div>
    </div>

    <!-- ── TOASTS ── -->
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
</template>

<style scoped>
/* ── Admin Login Page ── */
.admin-login-page,
.loading-page,
.admin-dashboard-page {
  background: transparent;
  min-height: 100vh;
  position: relative;
}

.admin-login-page::before,
.admin-login-page::after,
.admin-dashboard-page::before,
.admin-dashboard-page::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
}

.admin-login-page::before,
.admin-dashboard-page::before {
  background:
    linear-gradient(120deg, rgba(255, 255, 255, 0.032), transparent 38%),
    linear-gradient(180deg, rgba(12, 13, 13, 0.28), rgba(8, 9, 10, 0.62));
}

.admin-login-page::after,
.admin-dashboard-page::after {
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.022) 1px, transparent 1px),
    linear-gradient(rgba(255, 255, 255, 0.018) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.6), transparent 80%);
}

.admin-login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
}

.admin-login-wrap {
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.admin-login-brand {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.admin-logo {
  width: 48px;
  height: 48px;
  background: color-mix(in srgb, var(--accent-primary) 76%, #20251f);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-2xl);
  color: #0f1114;
  flex-shrink: 0;
}

.admin-brand-title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.admin-brand-sub {
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--text-muted);
}

.admin-login-card {
  background: color-mix(in srgb, var(--surface-glass-strong) 92%, #141414);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.admin-login-card-head {
  padding: 0.85rem 1.1rem;
  border-bottom: 1px solid var(--wire);
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-secondary);
  background: color-mix(in srgb, var(--surface-glass) 74%, #141414);
}

.admin-login-form {
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

/* ── Stats Grid ── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  background: color-mix(in srgb, var(--surface-glass-strong) 92%, #171717);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-md);
  padding: var(--space-4) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--wire-active);
}

.stat-card.success::before {
  background: var(--accent-success);
}
.stat-card.warning::before {
  background: var(--accent-warning);
}

.stat-label {
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--text-muted);
}

.stat-value {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.1;
}

/* ── Admin Dashboard ── */
.admin-badge {
  font-family: var(--font-ui);
  font-size: var(--text-base);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #0f1114;
  background: color-mix(in srgb, var(--accent-primary) 78%, #20251f);
  padding: 0.15rem 0.5rem;
  border-radius: 1px;
}

.admin-main {
  padding-top: var(--space-6);
  padding-bottom: var(--space-8);
}

/* Section card title */
.section-card-title {
  font-family: var(--font-display);
  font-size: var(--text-base);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.section-card-sub {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

/* User detail header */
.user-detail-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
}

.detail-sub {
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-muted);
}

/* Edit user tag */
.edit-user-tag {
  font-size: var(--text-lg);
  font-weight: 700;
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--wire);
}

.activation-key-box {
  background: var(--bg-void);
  border: 1px solid var(--wire-active);
  border-radius: var(--radius-sm);
  padding: var(--space-3) var(--space-4);
  color: var(--accent-secondary);
  font-size: var(--text-sm);
  word-break: break-all;
}

.activation-key-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.activation-duration-select {
  width: 120px;
  min-height: 34px;
  padding: 0.42rem var(--space-3);
  font-size: var(--text-sm);
}
</style>
