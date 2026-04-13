<script setup>
import DefaultTheme from "vitepress/theme";
import HomeShowcase from "./HomeShowcase.vue";

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <template #nav-bar-title-after>
      <span class="nav-brand-title">Err<span class="pulse">Pulse</span></span>
    </template>
    <template #home-features-after>
      <HomeShowcase />
    </template>
  </Layout>
</template>

<style scoped>
.nav-brand-title {
  font-family: "DM Sans", sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  letter-spacing: -0.01em;
}

.pulse {
  color: #f43f5e;
}
</style>
