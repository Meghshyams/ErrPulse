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
    class="ep-hero-demos"
    :class="{ 'ep-visible': visible }"
  >
    <div class="ep-demo-card">
      <div class="ep-demo-label">Dashboard</div>
      <img src="/assets/dashboard.gif" alt="ErrPulse Dashboard" loading="eager" />
    </div>
    <div class="ep-demo-card">
      <div class="ep-demo-label">DevTools Widget</div>
      <img src="/assets/devtools.gif" alt="ErrPulse DevTools" loading="eager" />
    </div>
  </div>
</template>

<style scoped>
.ep-hero-demos {
  display: flex;
  gap: 16px;
  margin-top: 32px;
  opacity: 0;
  transform: translateY(16px);
  transition:
    opacity 0.8s ease,
    transform 0.8s ease;
}

.ep-visible {
  opacity: 1;
  transform: translateY(0);
}

.ep-demo-card {
  flex: 1;
  min-width: 0;
}

.ep-demo-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #f43f5e;
  margin-bottom: 8px;
}

.ep-demo-card img {
  width: 100%;
  border-radius: 10px;
  border: 1px solid var(--vp-c-border);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.ep-demo-card img:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
}

@media (max-width: 768px) {
  .ep-hero-demos {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
