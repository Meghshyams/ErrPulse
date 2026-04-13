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

<div style="margin-top: 2rem;">

## Dashboard

Real-time error monitoring with plain-English explanations, stack traces, HTTP request logs, and console output.

<p align="center">
  <img src="/ErrPulse/dashboard.gif" alt="ErrPulse Dashboard" style="max-width: 800px; width: 100%; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);" />
</p>

## DevTools Widget

A floating in-app debug panel — see errors, console logs, and API responses without leaving your app.

<p align="center">
  <img src="/ErrPulse/devtools.gif" alt="ErrPulse DevTools Widget" style="max-width: 600px; width: 100%; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);" />
</p>

</div>
