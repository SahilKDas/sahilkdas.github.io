export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  modules: ['@nuxtjs/google-fonts'],
  css: ['~/assets/css/main.css'],
  googleFonts: {
    families: {
      Roboto: [400, 500, 700],
      'Roboto+Mono': [400, 500, 600, 700]
    },
    display: 'swap',
    download: true
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Sahil K. Das — Software Engineer & Systems Architect',
      meta: [
        { name: 'description', content: 'Portfolio of Sahil K. Das — systems engineer, language toolchain builder, and graphics architect.' },
        { name: 'theme-color', content: '#FFF0F3' },
        { property: 'og:title', content: 'Sahil K. Das — Software Engineer & Systems Architect' },
        { property: 'og:description', content: 'Low-level systems, language runtimes, rendering engines, and open-source infrastructure.' },
        { property: 'og:type', content: 'website' }
      ]
    }
  }
})
