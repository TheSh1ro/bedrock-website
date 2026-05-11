// src/stores/admin.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { adminRpc, adminFetch, supabase } from '@/api'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  username: string
  email: string | null
  is_active: boolean
  software_access_until: string | null
  active_token: string | null
  machine_id: string | null
  last_seen: string | null
  created_at: string
}

export interface LicensePlan {
  duration_days: number
  price: number
}

export interface ActivationKey {
  id: string
  key: string
  duration_days: number
  created_at: string
  used: boolean
  used_at: string | null
  used_by: string | null
}

type UserPatch = Partial<Omit<User, 'id' | 'created_at'>> & {
  password_hash?: string
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAdminStore = defineStore('admin', () => {
  // ─── State ─────────────────────────────────────────────────────────────────

  const users = ref<User[]>([])
  const licensePlans = ref<LicensePlan[]>([])
  const activationKeys = ref<ActivationKey[]>([])
  const searchQuery = ref('')
  const selectedUser = ref<User | null>(null)

  const loading = ref({
    users: false,
    licensePlans: false,
    activationKeys: false,
    saveLicensePlan: false,
    generateActivationKey: false,
    deleteActivationKey: null as string | null,
    saveUser: false,
    auth: false,
  })

  const error = ref('')

  // ─── Supabase Auth (painel interno) ────────────────────────────────────────

  const supabaseAuthed = ref(false)

  supabase.auth.getSession().then(({ data }) => {
    supabaseAuthed.value = !!data.session
  })

  supabase.auth.onAuthStateChange((_event, session) => {
    supabaseAuthed.value = !!session
  })

  async function login(email: string, password: string): Promise<boolean> {
    loading.value.auth = true
    error.value = ''

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        error.value = 'Credenciais inválidas.'
        return false
      }
      return true
    } finally {
      loading.value.auth = false
    }
  }

  async function logout(): Promise<void> {
    await supabase.auth.signOut()
  }

  // ─── Getters ───────────────────────────────────────────────────────────────

  const filteredUsers = computed(() => {
    const q = searchQuery.value.toLowerCase()
    if (!q) return users.value
    return users.value.filter(
      (u) => u.username.toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q),
    )
  })

  const stats = computed(() => ({
    total: users.value.length,
    active: users.value.filter((u) => u.is_active && isLicenseActive(u)).length,
    inactive: users.value.filter((u) => !u.is_active).length,
    expired: users.value.filter((u) => u.is_active && !isLicenseActive(u)).length,
  }))

  // ─── Helpers ───────────────────────────────────────────────────────────────

  function isLicenseActive(u: User): boolean {
    if (!u.software_access_until) return false
    return new Date(u.software_access_until) > new Date()
  }

  // ─── Actions ───────────────────────────────────────────────────────────────

  async function loadUsers(): Promise<void> {
    loading.value.users = true
    try {
      const data = await adminFetch('users?select=*&order=created_at.desc')
      users.value = data as User[]
    } finally {
      loading.value.users = false
    }
  }

  async function loadLicensePlans(): Promise<void> {
    loading.value.licensePlans = true
    try {
      const data = await adminFetch('plans?order=duration_days.asc')
      licensePlans.value = data as LicensePlan[]
    } finally {
      loading.value.licensePlans = false
    }
  }

  async function saveLicensePlan(
    days: number,
    price: number,
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    loading.value.saveLicensePlan = true
    try {
      const result = await adminRpc('admin_update_plan', {
        p_duration_days: days,
        p_price: price,
      })

      if (!result.ok) return result

      await loadLicensePlans()
      return { ok: true }
    } finally {
      loading.value.saveLicensePlan = false
    }
  }

  async function loadActivationKeys(): Promise<void> {
    loading.value.activationKeys = true
    try {
      const result = await adminRpc<{ status: string; keys: ActivationKey[] }>(
        'admin_get_activation_keys',
        {},
      )
      if (result.ok) activationKeys.value = result.data.keys ?? []
    } finally {
      loading.value.activationKeys = false
    }
  }

  async function updateUser(
    userId: string,
    patch: UserPatch,
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    loading.value.saveUser = true
    try {
      const result = await adminRpc('admin_update_user', {
        p_user_id: userId,
        p_is_active: patch.is_active ?? true,
        p_password_hash: patch.password_hash ?? null,
        p_software_access_until: patch.software_access_until ?? null,
      })
      if (!result.ok) return result

      await loadUsers()
      return { ok: true }
    } finally {
      loading.value.saveUser = false
    }
  }

  async function generateActivationKey(
    durationDays = 3,
  ): Promise<
    { ok: true; key: string; durationDays: number } | { ok: false; error: string }
  > {
    loading.value.generateActivationKey = true
    try {
      const result = await adminRpc<{ status: string; key: string; duration_days: number }>(
        'admin_generate_activation_key',
        {
          p_duration_days: durationDays,
        },
      )
      if (!result.ok) return result
      await loadActivationKeys()
      return {
        ok: true,
        key: result.data.key,
        durationDays: result.data.duration_days,
      }
    } finally {
      loading.value.generateActivationKey = false
    }
  }

  async function forceLogout(userId: string): Promise<void> {
    await adminFetch(`users?id=eq.${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ active_token: null, machine_id: null }),
    })
    await loadUsers()
  }

  async function deleteActivationKey(keyId: string): Promise<{ ok: true } | { ok: false; error: string }> {
    loading.value.deleteActivationKey = keyId
    try {
      const result = await adminRpc('admin_delete_activation_key', {
        p_key_id: keyId,
      })
      if (!result.ok) return result
      await loadActivationKeys()
      return { ok: true }
    } finally {
      loading.value.deleteActivationKey = null
    }
  }

  function selectUser(user: User): void {
    selectedUser.value = user
  }

  function closeUserPanel(): void {
    selectedUser.value = null
  }

  return {
    users,
    licensePlans,
    activationKeys,
    searchQuery,
    loading,
    error,
    selectedUser,
    supabaseAuthed,
    filteredUsers,
    stats,
    isLicenseActive,
    login,
    logout,
    loadUsers,
    loadLicensePlans,
    loadActivationKeys,
    saveLicensePlan,
    generateActivationKey,
    deleteActivationKey,
    updateUser,
    forceLogout,
    selectUser,
    closeUserPanel,
  }
})
