---
layout: home

hero:
  name: "ErrPulse"
  text: "Error monitoring that runs with one command"
  tagline: Zero-config, local-first error tracking for Node.js and React applications
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/Meghshyams/ErrPulse

features:
  - icon: ⚡
    title: One Command
    details: Run npx errpulse and you have a full error monitoring server with a real-time dashboard. No accounts, no config files, no cloud.
  - icon: 🎯
    title: Catches Everything
    details: Uncaught exceptions, unhandled rejections, HTTP errors, React crashes, failed fetches, console.error, memory warnings — all captured automatically.
  - icon: 📊
    title: Real-Time Dashboard
    details: Health score, error timeline, filterable error list, plain-English explanations, stack trace viewer, and HTTP request log — all updating live via WebSocket.
  - icon: 🔧
    title: In-App DevTools
    details: A floating debug panel inside your app — see errors, console logs, and network requests with full payload inspection without leaving your app.
  - icon: 🔗
    title: Full-Stack Correlation
    details: Frontend injects a correlation ID into every request. Backend reads it. The dashboard shows the full chain from user click to server error.
  - icon: 🏗️
    title: Multi-Project Support
    details: Track errors from multiple apps in one place. Each SDK sends a projectId, and the dashboard filters all views per project.
---

<section class="ep-showcase">

<div class="ep-showcase-item">
  <div class="ep-showcase-text">
    <span class="ep-showcase-badge">Dashboard</span>
    <h2>Real-time error monitoring</h2>
    <p>Health scores, error timelines, filterable error lists, plain-English explanations, full stack traces, HTTP request logs, and console output — all updating live via WebSocket.</p>
    <a href="/ErrPulse/guide/getting-started" class="ep-showcase-link">Get started →</a>
  </div>
  <div class="ep-showcase-media">
    <img src="./assets/dashboard.gif" alt="ErrPulse Dashboard" />
  </div>
</div>

<div class="ep-showcase-item ep-showcase-reverse">
  <div class="ep-showcase-text">
    <span class="ep-showcase-badge">DevTools Widget</span>
    <h2>Debug without leaving your app</h2>
    <p>A floating in-app panel with Errors, Console, and Network tabs. Click to expand stack traces, inspect JSON payloads, and view API responses — all inside a Shadow DOM that won't touch your styles.</p>
    <a href="/ErrPulse/guide/devtools" class="ep-showcase-link">Learn more →</a>
  </div>
  <div class="ep-showcase-media">
    <img src="./assets/devtools.gif" alt="ErrPulse DevTools Widget" />
  </div>
</div>

</section>

<style>
.ep-showcase {
  max-width: 1152px;
  margin: 0 auto;
  padding: 64px 24px 80px;
}

.ep-showcase-item {
  display: flex;
  align-items: center;
  gap: 48px;
  margin-bottom: 80px;
  opacity: 0;
  transform: translateY(24px);
  animation: ep-fade-up 0.6s ease forwards;
}

.ep-showcase-item:nth-child(1) { animation-delay: 0.1s; }
.ep-showcase-item:nth-child(2) { animation-delay: 0.3s; }

.ep-showcase-reverse {
  flex-direction: row-reverse;
}

.ep-showcase-text {
  flex: 1;
  min-width: 280px;
}

.ep-showcase-badge {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #f43f5e;
  background: rgba(244, 63, 94, 0.1);
  border: 1px solid rgba(244, 63, 94, 0.2);
  padding: 3px 10px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.ep-showcase-text h2 {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
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
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.ep-showcase-media img:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
}

@keyframes ep-fade-up {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .ep-showcase-item,
  .ep-showcase-reverse {
    flex-direction: column;
    gap: 24px;
    margin-bottom: 56px;
  }

  .ep-showcase-text h2 {
    font-size: 22px;
  }

  .ep-showcase {
    padding: 40px 16px 56px;
  }
}
</style>
