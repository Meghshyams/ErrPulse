<script setup>
import { useData } from "vitepress";
import { ref, onMounted } from "vue";

const { page } = useData();
const visible = ref(false);
const activeTab = ref("dashboard");

onMounted(() => {
  setTimeout(() => {
    visible.value = true;
  }, 200);
});
</script>

<template>
  <div
    v-if="page.relativePath === 'index.md'"
    class="ep-hero-preview"
    :class="{ 'ep-visible': visible }"
  >
    <div class="ep-preview-tabs">
      <button
        class="ep-preview-tab"
        :class="{ active: activeTab === 'dashboard' }"
        @click="activeTab = 'dashboard'"
      >
        Dashboard
      </button>
      <button
        class="ep-preview-tab"
        :class="{ active: activeTab === 'devtools' }"
        @click="activeTab = 'devtools'"
      >
        DevTools Widget
      </button>
    </div>
    <div class="ep-preview-window">
      <img
        v-show="activeTab === 'dashboard'"
        src="/assets/dashboard.gif"
        alt="ErrPulse Dashboard"
        loading="eager"
      />
      <img
        v-show="activeTab === 'devtools'"
        src="/assets/devtools.gif"
        alt="ErrPulse DevTools"
        loading="eager"
      />
    </div>
  </div>
</template>

<style scoped>
.ep-hero-preview {
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

.ep-preview-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
}

.ep-preview-tab {
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-border);
  background: transparent;
  color: var(--vp-c-text-3);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}

.ep-preview-tab:hover {
  color: var(--vp-c-text-2);
  border-color: var(--vp-c-text-3);
}

.ep-preview-tab.active {
  background: #f43f5e;
  border-color: #f43f5e;
  color: #fff;
}

.ep-preview-window {
  border-radius: 10px;
  border: 1px solid var(--vp-c-border);
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
}

.ep-preview-window img {
  width: 100%;
  display: block;
}
</style>
