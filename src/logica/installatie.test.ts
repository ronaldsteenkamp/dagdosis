import { describe, expect, it } from 'vitest'
import { inAppBrowser, platformVan } from './installatie'

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'
const IPAD = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15'
const ANDROID = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36'
const WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'
const CHROME_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/142.0 Mobile/15E148 Safari/604.1'

describe('platformVan', () => {
  it.each([
    ['iPhone met Safari', IPHONE, 5, 'ios'],
    ['iPhone met Chrome', CHROME_IOS, 5, 'ios'],
    ['iPad, dat zich als Mac voordoet', IPAD, 5, 'ios'],
    ['een echte Mac', IPAD, 0, 'computer'],
    ['Android', ANDROID, 5, 'android'],
    ['Windows', WINDOWS, 0, 'computer'],
  ])('herkent %s', (_naam, ua, punten, platform) => {
    expect(platformVan(ua, punten)).toBe(platform)
  })
})

describe('inAppBrowser', () => {
  it('herkent Instagram en Facebook, niet Safari', () => {
    expect(inAppBrowser(`${IPHONE} Instagram 350.0`)).toBe(true)
    expect(inAppBrowser(`${IPHONE} [FBAN/FBIOS;FBAV/450.0]`)).toBe(true)
    expect(inAppBrowser(IPHONE)).toBe(false)
  })
})
