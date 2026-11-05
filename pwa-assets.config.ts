import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Maakt de PNG-iconen uit public/icon.svg: npm run iconen
const groen = '#0E5A4F'
const opGroen = { padding: 0, resizeOptions: { background: groen } }

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    transparent: { ...minimal2023Preset.transparent, ...opGroen },
    maskable: { ...minimal2023Preset.maskable, padding: 0.1, resizeOptions: { background: groen } },
    apple: { ...minimal2023Preset.apple, ...opGroen },
  },
  images: ['public/icon.svg'],
})
