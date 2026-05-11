// src/stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userRpc } from '@/api'
import { useAuthStore } from './auth'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface LicensePlan {
  days: number
  price: number
}

export interface Transaction {
  id: string
  amount: number | string
  label: string
  created_at: string
}

export interface AppConfig {
  executableUrl: string
  minVersion: string
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useUserStore = defineStore('user', () => {
  const authStore = useAuthStore()

  // ─── State ─────────────────────────────────────────────────────────────────

  const licensePlans = ref<LicensePlan[]>([])
  const transactions = ref<Transaction[]>([])
  const appConfig = ref<AppConfig | null>(null)
  const appConfigError = ref('')

  const loading = ref({
    licensePlans: false,
    transactions: false,
    appConfig: false,
  })

  // ─── Getters ───────────────────────────────────────────────────────────────

  const profile = computed(() => authStore.user)

  const daysLeft = computed(() => {
    if (!profile.value?.software_access_until) return 0
    return Math.max(
      0,
      Math.ceil(
        (new Date(profile.value.software_access_until).getTime() - Date.now()) / 86_400_000,
      ),
    )
  })

  const isExpired = computed(() => daysLeft.value === 0)

  // ─── Actions ───────────────────────────────────────────────────────────────

  async function loadLicensePlans(): Promise<void> {
    loading.value.licensePlans = true
    try {
      const result = await userRpc<{ status: string; plans: LicensePlan[] }>(
        'get_license_plans',
        {},
        false,
      )
      if (result.ok) licensePlans.value = result.data.plans ?? []
    } finally {
      loading.value.licensePlans = false
    }
  }

  async function loadTransactions(): Promise<void> {
    loading.value.transactions = true
    try {
      const result = await userRpc<{ status: string; transactions: Transaction[] }>(
        'get_user_transactions',
        {},
      )
      if (result.ok) transactions.value = result.data.transactions ?? []
    } finally {
      loading.value.transactions = false
    }
  }

  async function loadAppConfig(): Promise<void> {
    loading.value.appConfig = true
    appConfigError.value = ''
    try {
      const result = await userRpc<{ status: string; config: Record<string, string> }>(
        'get_app_config',
        {},
      )

      if (!result.ok) {
        appConfigError.value = result.error
        return
      }

      const config = result.data.config ?? {}
      const executableUrl = config['executable_url'] ?? ''
      const minVersion = config['min_version'] ?? ''

      if (!executableUrl) {
        appConfigError.value = 'URL de download não configurada.'
        return
      }

      appConfig.value = { executableUrl, minVersion }
    } finally {
      loading.value.appConfig = false
    }
  }

  return {
    licensePlans,
    transactions,
    appConfig,
    appConfigError,
    loading,
    profile,
    daysLeft,
    isExpired,
    loadLicensePlans,
    loadTransactions,
    loadAppConfig,
  }
})
