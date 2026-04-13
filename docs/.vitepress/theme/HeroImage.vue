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
    class="ep-hero-carousel"
    :class="{ 'ep-visible': visible }"
  >
    <div class="ep-carousel-track">
      <div class="ep-carousel-card">
        <div class="ep-card-label">Dashboard</div>
        <img src="/assets/dashboard.gif" alt="ErrPulse Dashboard" loading="eager" />
      </div>
      <div class="ep-carousel-card">
        <div class="ep-card-label">DevTools Widget</div>
        <img src="/assets/devtools.gif" alt="ErrPulse DevTools" loading="eager" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.ep-hero-carousel {
  margin-top: 24px;
  opacity: 0;
  transform: translateY(12px);
  transition:
    opacity 0.8s ease,
    transform 0.8s ease;
}

.ep-visible {
  opacity: 1;
  transform: translateY(0);
}

.ep-carousel-track {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 8px;
}

/* Hide scrollbar but keep scroll functionality */
.ep-carousel-track::-webkit-scrollbar {
  height: 0;
}
.ep-carousel-track {
  scrollbar-width: none;
}

.ep-carousel-card {
  flex: 0 0 min(560px, 80vw);
  scroll-snap-align: start;
}

.ep-card-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #f43f5e;
  margin-bottom: 8px;
}

.ep-carousel-card img {
  width: 100%;
  border-radius: 10px;
  border: 1px solid var(--vp-c-border);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  display: block;
}

.ep-carousel-card img:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
}
</style>
