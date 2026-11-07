import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://sahilkdas.github.io',
  output: 'static',
  build: { format: 'directory' }
})
