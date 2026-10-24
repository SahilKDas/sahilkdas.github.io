import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  modules: ['@nuxtjs/google-fonts', 'shadcn-nuxt'],
  css: ['~/assets/css/tailwind.css', '~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()]
  },
  shadcn: {
    prefix: '',
    componentDir: './app/components/ui'
  },
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
      title: 'Sahil K. Das — Research Engines, Open Protocols & Native Tools',
      meta: [
        { name: 'description', content: 'I’m Sahil K. Das. I build neural and handcrafted board-game engines, open protocol ecosystems, native tools, and reproducible experiments.' },
        { name: 'theme-color', content: '#071A12' },
        { property: 'og:title', content: 'Sahil K. Das — Research Engines, Open Protocols & Native Tools' },
        { property: 'og:description', content: 'I build neural and handcrafted board-game engines, open protocol ecosystems, native tools, and reproducible experiments.' },
        { property: 'og:type', content: 'website' }
      ]
    }
  }
})
