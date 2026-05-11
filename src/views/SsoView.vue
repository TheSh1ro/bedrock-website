<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { publicRpc, type RpcResponse } from '@/api'
import { useAuthStore } from '@/stores/auth'

interface ConsumeSsoTokenResponse extends RpcResponse {
  web_token?: string
  username?: string
  software_access_until?: string | null
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

function redirectToLogin(error: string) {
  authStore.clearSession()
  router.replace({ name: 'login', query: { error } })
}

onMounted(async () => {
  const queryToken = route.query.token
  const ssoToken = Array.isArray(queryToken) ? queryToken[0] : queryToken

  if (!ssoToken) {
    redirectToLogin('missing_token')
    return
  }

  try {
    const result = await publicRpc<ConsumeSsoTokenResponse>('consume_sso_token', {
      p_sso_token: ssoToken,
    })

    if (result.status !== 'ok' || !result.web_token) {
      redirectToLogin(result.status || 'invalid_token')
      return
    }

    authStore.completeSsoLogin(result.web_token, result.software_access_until ?? null)
    router.replace({ name: 'license' })
  } catch {
    redirectToLogin('network_error')
  }
})
</script>

<template>
  <main class="sso-page" aria-live="polite">
    <div class="sso-panel">
      <div class="spinner" />
      <p>Autenticando acesso...</p>
    </div>
  </main>
</template>

<style scoped>
.sso-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: var(--space-8);
  background:
    linear-gradient(180deg, rgba(12, 13, 13, 0.84), rgba(8, 9, 10, 0.92)),
    linear-gradient(130deg, rgba(255, 255, 255, 0.035), rgba(184, 148, 95, 0.035) 46%, transparent);
}

.sso-panel {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  color: var(--text-secondary);
  font-family: var(--font-ui);
  font-size: var(--text-sm);
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--wire-active);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
