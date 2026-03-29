<!-- components/TabCredits.vue -->
<template>
  <div class="tab-content space-y-6">
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Comprar Créditos</h2>
        <p class="card-subtitle">Adicione créditos à sua conta via Pix</p>
      </div>
      <div class="card-body">
        <div class="plan-grid">
          <div
            class="plan-card purchase-card"
            v-for="item in CREDIT_PLANS"
            :key="item.credits"
            role="button"
            tabindex="0"
            @click="openDiscordUser"
            @keydown.enter.prevent="openDiscordUser"
            @keydown.space.prevent="openDiscordUser"
          >
            <div class="plan-header">
              <h3 class="plan-name">{{ item.credits }} Créditos</h3>
            </div>
            <div class="plan-price">
              <span class="plan-price-value">R$&thinsp;{{ item.price }}</span>
            </div>
            <div class="purchase-card-action">COMPRAR</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const CREDIT_PLANS = [
  { credits: 10, price: 10 },
  { credits: 20, price: 20 },
  { credits: 30, price: 30 },
  { credits: 100, price: 100 },
]

const DISCORD_USER_URL = 'discord://-/users/650180750871756826'

function openDiscordUser() {
  window.location.href = DISCORD_USER_URL
}
</script>

<style scoped>
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
  color: var(--text-muted);
}
</style>
