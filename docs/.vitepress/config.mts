import { defineConfig } from "vitepress";

export default defineConfig({
  title: "ErrPulse",
  description: "The error monitoring tool that runs with one command",
  base: "/ErrPulse/",
  head: [
    [
      "link",
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/ErrPulse/logo.svg",
      },
    ],
    [
      "meta",
      {
        property: "og:image",
        content: "https://meghshyams.github.io/ErrPulse/social-card.png",
      },
    ],
    [
      "meta",
      {
        property: "og:image:width",
        content: "1200",
      },
    ],
    [
      "meta",
      {
        property: "og:image:height",
        content: "630",
      },
    ],
    [
      "meta",
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
    ],
    [
      "meta",
      {
        name: "twitter:image",
        content: "https://meghshyams.github.io/ErrPulse/social-card.png",
      },
    ],
    [
      "link",
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
    ],
    [
      "link",
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossorigin: "",
      },
    ],
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  ],

  themeConfig: {
    logo: "/logo.svg",
    siteTitle: false,

    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "SDKs", link: "/sdks/node" },
      { text: "API", link: "/api/reference" },
      { text: "CLI", link: "/cli/commands" },
    ],

    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Getting Started", link: "/guide/getting-started" },
          { text: "Why ErrPulse?", link: "/guide/why-errpulse" },
          { text: "How It Works", link: "/guide/how-it-works" },
        ],
      },
      {
        text: "SDKs",
        items: [
          { text: "Node.js", link: "/sdks/node" },
          { text: "React", link: "/sdks/react" },
          { text: "Multi-Project Setup", link: "/sdks/multi-project" },
        ],
      },
      {
        text: "Dashboard",
        items: [{ text: "Overview", link: "/dashboard/overview" }],
      },
      {
        text: "API Reference",
        items: [{ text: "REST & WebSocket", link: "/api/reference" }],
      },
      {
        text: "CLI",
        items: [{ text: "Commands", link: "/cli/commands" }],
      },
      {
        text: "Advanced",
        items: [
          { text: "Error Patterns", link: "/advanced/error-patterns" },
          { text: "Configuration", link: "/advanced/configuration" },
          { text: "Troubleshooting", link: "/advanced/troubleshooting" },
        ],
      },
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/Meghshyams/ErrPulse" }],

    search: {
      provider: "local",
    },

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2026 ErrPulse Contributors",
    },

    editLink: {
      pattern: "https://github.com/Meghshyams/ErrPulse/edit/main/docs/:path",
      text: "Edit this page on GitHub",
    },
  },

  appearance: "dark",

  ignoreDeadLinks: [/localhost/],
});
