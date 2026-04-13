<script setup>
import { useData } from "vitepress";
import { ref, onMounted } from "vue";

const { page } = useData();
const visible = ref(false);

onMounted(() => {
  // Trigger animations after mount
  requestAnimationFrame(() => {
    visible.value = true;
  });
});
</script>

<template>
  <section
    v-if="page.relativePath === 'index.md'"
    class="ep-showcase"
    :class="{ 'ep-visible': visible }"
  >
    <div class="ep-showcase-item">
      <div class="ep-showcase-text">
        <span class="ep-showcase-badge">Dashboard</span>
        <h2>Real-time error monitoring</h2>
        <p>
          Health scores, error timelines, filterable error lists, plain-English explanations, full
          stack traces, HTTP request logs, and console output — all updating live via WebSocket.
        </p>
        <a href="/ErrPulse/guide/getting-started" class="ep-showcase-link">Get started →</a>
      </div>
      <div class="ep-showcase-media">
        <img src="/assets/dashboard.gif" alt="ErrPulse Dashboard" loading="lazy" />
      </div>
    </div>

    <div class="ep-showcase-item ep-showcase-reverse">
      <div class="ep-showcase-text">
        <span class="ep-showcase-badge">DevTools Widget</span>
        <h2>Debug without leaving your app</h2>
        <p>
          A floating in-app panel with Errors, Console, and Network tabs. Click to expand stack
          traces, inspect JSON payloads, and view API responses — all inside a Shadow DOM that won't
          touch your styles.
        </p>
        <a href="/ErrPulse/guide/devtools" class="ep-showcase-link">Learn more →</a>
      </div>
      <div class="ep-showcase-media">
        <img src="/assets/devtools.gif" alt="ErrPulse DevTools Widget" loading="lazy" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.ep-showcase {
  max-width: 1152px;
  margin: 0 auto;
  padding: 48px 24px 80px;
}

.ep-showcase-item {
  display: flex;
  align-items: center;
  gap: 48px;
  margin-bottom: 72px;
  opacity: 0;
  transform: translateY(24px);
  transition:
    opacity 0.6s ease,
    transform 0.6s ease;
}

.ep-visible .ep-showcase-item:nth-child(1) {
  opacity: 1;
  transform: translateY(0);
  transition-delay: 0.1s;
}

.ep-visible .ep-showcase-item:nth-child(2) {
  opacity: 1;
  transform: translateY(0);
  transition-delay: 0.35s;
}

.ep-showcase-item:last-child {
  margin-bottom: 0;
}

.ep-showcase-reverse {
  flex-direction: row-reverse;
}

.ep-showcase-text {
  flex: 1;
  min-width: 260px;
}

.ep-showcase-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #f43f5e;
  background: rgba(244, 63, 94, 0.08);
  border: 1px solid rgba(244, 63, 94, 0.18);
  padding: 3px 10px;
  border-radius: 6px;
  margin-bottom: 14px;
}

.ep-showcase-text h2 {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.2;
  margin-bottom: 12px;
  color: var(--vp-c-text-1);
}

.ep-showcase-text p {
  font-size: 15px;
  line-height: 1.7;
  color: var(--vp-c-text-2);
  margin-bottom: 20px;
}

.ep-showcase-link {
  font-size: 14px;
  font-weight: 600;
  color: #f43f5e;
  text-decoration: none;
  transition: color 0.15s;
}

.ep-showcase-link:hover {
  color: #ff6b8a;
}

.ep-showcase-media {
  flex: 1.4;
  min-width: 0;
}

.ep-showcase-media img {
  width: 100%;
  border-radius: 12px;
  border: 1px solid var(--vp-c-border);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.ep-showcase-media img:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
}

@media (max-width: 768px) {
  .ep-showcase-item,
  .ep-showcase-reverse {
    flex-direction: column;
    gap: 24px;
    margin-bottom: 48px;
  }

  .ep-showcase-text h2 {
    font-size: 22px;
  }

  .ep-showcase {
    padding: 32px 16px 48px;
  }
}
</style>
