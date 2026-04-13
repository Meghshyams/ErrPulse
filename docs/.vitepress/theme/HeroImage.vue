<script setup>
import { useData } from "vitepress";
import { ref, onMounted } from "vue";

const { page } = useData();
const visible = ref(false);

onMounted(() => {
  setTimeout(() => {
    visible.value = true;
  }, 200);
});
</script>

<template>
  <div
    v-if="page.relativePath === 'index.md'"
    class="ep-hero-image"
    :class="{ 'ep-hero-visible': visible }"
  >
    <img src="/assets/dashboard.gif" alt="ErrPulse Dashboard" loading="eager" />
  </div>
</template>

<style scoped>
.ep-hero-image {
  margin-top: 32px;
  opacity: 0;
  transform: translateY(16px);
  transition:
    opacity 0.8s ease,
    transform 0.8s ease;
}

.ep-hero-visible {
  opacity: 1;
  transform: translateY(0);
}

.ep-hero-image img {
  width: 100%;
  max-width: 720px;
  border-radius: 12px;
  border: 1px solid var(--vp-c-border);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.04);
}
</style>
