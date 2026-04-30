<!-- components/TabTransactions.vue -->
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

onMounted(() => {
  if (userStore.transactions.length === 0) {
    userStore.loadTransactions()
  }
})

function isIncoming(amount: number) {
  return amount > 0
}

const VISIBLE_TYPES = new Set([
  'days_purchase',
  'license_extension',
  'admin_license_add',
  'admin_license_edit',
  'admin_duration_edit',
  'admin_plan_update',
  'admin_user_update',
])

const transactionsView = computed(() =>
  userStore.transactions
    .filter((tx) => VISIBLE_TYPES.has(tx.type) || tx.type.startsWith('admin_'))
    .map((tx) => ({
      ...tx,
      label: mapLabel(tx.type, tx.reference_id, tx.label),
      category: tx.type.startsWith('admin_') ? 'Ação administrativa' : 'Compra',
    })),
)

function mapLabel(type: string, referenceId: string, fallback: string) {
  if (type === 'days_purchase') return `Compra de licença (${referenceId} dias)`
  if (type === 'license_extension') return `Extensão de licença (${referenceId} dias)`
  if (type === 'admin_license_add') return 'Licença adicionada pelo administrador'
  if (type === 'admin_license_edit') return 'Licença editada pelo administrador'
  if (type === 'admin_duration_edit') return 'Duração da licença ajustada pelo administrador'
  if (type === 'admin_plan_update') return 'Plano de licença atualizado pelo administrador'
  if (type === 'admin_user_update') return 'Dados do usuário editados pelo administrador'
  if (type.startsWith('admin_')) return 'Ajuste administrativo'
  return fallback || type
}

function formatDateTime(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="tab-content space-y-6">
    <div class="card">
      <div class="card-header">
        <div class="card-header-inner">
          <div>
            <h2 class="card-title">Histórico de Transações</h2>
            <p class="card-subtitle">Compras e ações administrativas de licença</p>
          </div>
          <button
            class="btn btn-ghost"
            :disabled="userStore.loading.transactions"
            style="margin-top: var(--space-4)"
            @click="userStore.loadTransactions()"
          >
            <span class="spinner" v-if="userStore.loading.transactions" />
            <span v-else>↺ Atualizar</span>
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="userStore.loading.transactions" class="empty-state">
        <span class="spinner" style="width: 22px; height: 22px" />
        <p style="margin-top: var(--space-3)">Carregando transações...</p>
      </div>

      <!-- Empty -->
      <div v-else-if="transactionsView.length === 0" class="empty-state">
        <div class="empty-state-icon">◈</div>
        <p>Nenhum histórico disponível</p>
        <p style="font-size: var(--text-sm); margin-top: var(--space-1)">
          As compras e ações administrativas aparecerão aqui
        </p>
      </div>

      <!-- Table -->
      <div v-else class="card-body" style="padding: 0">
        <table>
          <thead>
            <tr>
              <th style="width: 44px"></th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Data</th>
              <th style="text-align: right">Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tx in transactionsView" :key="tx.id">
              <td>
                <div
                  class="tx-icon"
                  :class="isIncoming(tx.amount) ? 'tx-icon--incoming' : 'tx-icon--outgoing'"
                >
                  {{ isIncoming(tx.amount) ? '↑' : '↓' }}
                </div>
              </td>
              <td>
                <div class="tx-label">{{ tx.label }}</div>
              </td>
              <td>
                <span class="tx-badge">{{ tx.category }}</span>
              </td>
              <td class="mono" style="font-size: var(--text-xs); color: var(--text-muted)">
                {{ formatDateTime(tx.created_at) }}
              </td>
              <td style="text-align: right">
                <span
                  class="tx-amount"
                  :class="isIncoming(tx.amount) ? 'tx-amount--incoming' : 'tx-amount--outgoing'"
                >
                  {{ tx.amount > 0 ? '+' : '' }}{{ tx.amount }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Legend -->
    <div class="tx-legend">
      <div class="tx-legend-item">
        <span
          class="tx-icon tx-icon--incoming"
          style="width: 22px; height: 22px; font-size: var(--text-xs)"
          >↑</span
        >
        <span>Entrada</span>
      </div>
      <div class="tx-legend-item">
        <span
          class="tx-icon tx-icon--outgoing"
          style="width: 22px; height: 22px; font-size: var(--text-xs)"
          >↓</span
        >
        <span>Saída</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tx-icon {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: var(--text-xs);
  font-weight: 700;
  flex-shrink: 0;
}

.tx-icon--incoming {
  background: color-mix(in srgb, var(--accent-success-action) 18%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-success-action) 40%, transparent);
  color: var(--accent-success-action);
}

.tx-icon--outgoing {
  background: color-mix(in srgb, var(--accent-danger-action) 18%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-danger-action) 40%, transparent);
  color: var(--accent-danger-action);
}

.tx-label {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.3;
}

.tx-amount {
  font-family: var(--font-display);
  font-size: var(--text-base);
  font-weight: 700;
  letter-spacing: 0.04em;
}

.tx-amount--incoming {
  color: var(--accent-success-action);
}
.tx-amount--outgoing {
  color: var(--accent-danger-action);
}

.tx-balance {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.tx-badge {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--wire);
  border-radius: var(--radius-sm);
  padding: 0.18rem 0.45rem;
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.tx-legend {
  display: flex;
  gap: var(--space-5);
  padding: var(--space-3) var(--space-4);
  background: color-mix(in srgb, var(--surface-glass) 82%, #171717);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-md);
}

.tx-legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--text-muted);
}
</style>
