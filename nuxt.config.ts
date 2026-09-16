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
      title: 'Sahil K. Das — Systems, Engines & Tiny Brains',
      meta: [
        { name: 'description', content: 'I’m Sahil K. Das. I build chess engines, neural drivers, language tools, simulations, and whatever weird idea I can’t leave alone.' },
        { name: 'theme-color', content: '#071A12' },
        { property: 'og:title', content: 'Sahil K. Das — Systems, Engines & Tiny Brains' },
        { property: 'og:description', content: 'I build chess engines, neural drivers, language tools, simulations, and whatever weird idea I can’t leave alone.' },
        { property: 'og:type', content: 'website' }
      ]
    }
  }
})
