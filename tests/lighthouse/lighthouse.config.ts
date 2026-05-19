// Lighthouse runs are separate from Playwright E2E
// Uses lighthouse npm package directly

export const LIGHTHOUSE_CONFIG = {
  logLevel:   'info' as const,
  output:     ['html', 'json'] as const,
  onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  settings: {
    formFactor:       'desktop' as const,
    throttling: {
      rttMs:                  40,
      throughputKbps:         10240,
      cpuSlowdownMultiplier:  1,
    },
    screenEmulation: {
      mobile:             false,
      width:              1440,
      height:             900,
      deviceScaleFactor:  1,
      disabled:           false,
    },
  },
}

export const LIGHTHOUSE_THRESHOLDS = {
  performance:    90,
  accessibility:  95,
  'best-practices': 90,
  seo:            85,
}
