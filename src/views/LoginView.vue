<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const email = ref('')
const referralCode = ref('')
const isRegistering = ref(false)
const showPassword = ref(false)

async function handleSubmit() {
  const success = await authStore.login(
    username.value,
    password.value,
    isRegistering.value ? referralCode.value : '',
    isRegistering.value ? email.value : '',
  )

  if (!success && authStore.error) {
    // Error is already set in store
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="brand">
        <img src="@/assets/logo.png" alt="Warfront" class="brand-logo" />
        <span class="brand-name">CELERITY</span>
      </div>

      <h1 class="mode-title">
        {{ isRegistering ? 'Criar conta' : 'Entrar' }}
      </h1>

      <div class="auth-tabs" role="tablist">
        <button
          role="tab"
          class="auth-tab"
          :class="{ active: !isRegistering }"
          :aria-selected="!isRegistering"
          @click="isRegistering = false"
        >
          Entrar
        </button>
        <button
          role="tab"
          class="auth-tab"
          :class="{ active: isRegistering }"
          :aria-selected="isRegistering"
          @click="isRegistering = true"
        >
          Criar conta
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form" novalidate>
        <div class="field">
          <label class="field-label" for="username">Usuário</label>
          <input
            id="username"
            v-model="username"
            type="text"
            class="form-input"
            placeholder="Identificação de soldado"
            autocomplete="username"
            required
          />
        </div>

        <div class="field">
          <label class="field-label" for="password">Senha</label>
          <div class="input-wrapper">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              placeholder="••••••••"
              autocomplete="current-password"
              required
            />
            <button
              type="button"
              class="toggle-pw"
              :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
              @click="showPassword = !showPassword"
            >
              <span v-if="showPassword">◐</span>
              <span v-else>◑</span>
            </button>
          </div>
        </div>

        <template v-if="isRegistering">
          <div class="field">
            <label class="field-label" for="email">
              E-mail
              <span class="optional-badge">opcional</span>
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              class="form-input"
              placeholder="contato@exemplo.com"
              autocomplete="email"
            />
          </div>

          <div class="field">
            <label class="field-label" for="referral">Código de Indicação</label>
            <input
              id="referral"
              v-model="referralCode"
              type="text"
              class="form-input mono"
              placeholder="INSIRA A KEY"
              spellcheck="false"
              required
            />
          </div>
        </template>

        <div v-if="authStore.error" class="alert-error" role="alert">
          <span class="alert-icon">!</span>
          <span>{{ authStore.error }}</span>
        </div>

        <button type="submit" class="btn-submit" :disabled="authStore.loading">
          <span class="spinner" v-if="authStore.loading" />
          <template v-else>
            {{ isRegistering ? 'Criar conta' : 'Autenticar' }}
          </template>
        </button>
      </form>

      <p class="auth-footer">
        <template v-if="!isRegistering">
          Sem conta?
          <a href="#" @click.prevent="isRegistering = true">Criar conta</a>
        </template>
        <template v-else>
          Já tem conta?
          <a href="#" @click.prevent="isRegistering = false">Fazer login</a>
        </template>
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  isolation: isolate;
  padding: var(--space-8);
  background:
    linear-gradient(180deg, rgba(12, 12, 12, 0.82), rgba(7, 7, 7, 0.92)),
    linear-gradient(130deg, rgba(255, 255, 255, 0.04), rgba(244, 218, 45, 0.05) 46%, transparent);
}

.login-page::before,
.login-page::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: -1;
}

.login-page::before {
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.85), transparent 88%);
}

.login-page::after {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.06), transparent 42%);
}

.login-card {
  width: 100%;
  max-width: 440px;
  background: var(--surface-glass-strong);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-lg);
  padding: var(--space-10) var(--space-8);
  box-shadow: var(--shadow-lg);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.brand-logo {
  height: 40px;
  width: auto;
  display: block;
}

.brand-name {
  font-family: var(--font-display);
  font-size: var(--text-base);
  font-weight: 600;
  letter-spacing: 0.2em;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.mode-title {
  font-family: var(--font-display);
  font-size: clamp(1.8rem, 2.5vw, 2.35rem);
  font-weight: 800;
  letter-spacing: 0.01em;
  color: var(--text-primary);
  margin-bottom: var(--space-6);
  line-height: 1.1;
}

.auth-tabs {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-8);
  padding: var(--space-1);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--surface-glass) 80%, #151515);
  border: 1px solid var(--wire);
}

.auth-tab {
  flex: 1;
  padding: 0.58rem 0.45rem;
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--text-muted);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: center;
}

.auth-tab:hover:not(.active) {
  color: var(--text-primary);
  border-color: rgba(175, 202, 255, 0.2);
}

.auth-tab.active {
  color: var(--text-primary);
  border-color: color-mix(in srgb, var(--accent-secondary) 52%, transparent);
  background: color-mix(in srgb, var(--accent-secondary) 13%, transparent);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.field-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.optional-badge {
  font-size: var(--text-xs);
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0.03em;
  color: var(--text-muted);
  padding: 0.1em 0.45em;
  border: 1px solid var(--wire);
  border-radius: 999px;
}

.input-wrapper {
  position: relative;
}

.input-wrapper .form-input {
  padding-right: 2.8rem;
}

.toggle-pw {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: var(--text-base);
  line-height: 1;
  padding: 0;
  transition: color var(--transition-fast);
}

.toggle-pw:hover {
  color: var(--text-secondary);
}

.btn-submit {
  width: 100%;
  margin-top: var(--space-2);
  padding: 0.88rem 1.5rem;
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--accent-primary) 95%, white),
    var(--accent-primary)
  );
  color: var(--text-on-accent);
  border: 1px solid color-mix(in srgb, var(--accent-primary) 68%, black);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: none;
}

.btn-submit:hover:not(:disabled) {
  filter: brightness(1.06);
}

.btn-submit:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.alert-error {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: color-mix(in srgb, var(--accent-danger) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-danger) 34%, transparent);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: #d9d9d9;
  line-height: 1.4;
}

.alert-icon {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 700;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid currentColor;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 0.05rem;
}

.auth-footer {
  margin-top: var(--space-6);
  text-align: center;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.auth-footer a {
  color: var(--accent-secondary);
  text-decoration: none;
  font-weight: 600;
  transition: color var(--transition-fast);
}

.auth-footer a:hover {
  color: #f4da2d;
  text-decoration: underline;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--wire-active);
  border-top-color: var(--text-on-accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 480px) {
  .login-page {
    padding: var(--space-5);
  }

  .login-card {
    padding: var(--space-8) var(--space-6);
    border-radius: var(--radius-md);
  }
}
</style>
