/**
 * Color Constants
 * 
 * All colors are defined here for easy customization.
 * To change colors globally, update the values below.
 */

export const colors = {
  primary: {
    50: '#e6f7f9',
    100: '#b3e8ed',
    200: '#80d9e1',
    300: '#4dcad5',
    400: '#26bbc8',
    500: '#00acbb',
    600: '#009aa7',
    700: '#006873',
    800: '#004d55',
    900: '#003237',
    950: '#00191c',
  },
  accent: {
    green: '#059669',
    greenLight: '#10b981',
    greenDark: '#047857',
    gold: '#d97706',
    goldLight: '#f59e0b',
    amber: '#ea580c',
    blue: '#2563eb',
    purple: '#7c3aed',
  },
  semantic: {
    bg: {
      primary: '#e6f7f9',
      secondary: '#ffffff',
      card: '#ffffff',
      navbar: 'rgba(255, 255, 255, 0.98)',
      footer: '#b3e8ed',
    },
    text: {
      primary: '#006873',
      secondary: '#004d55',
      muted: '#64748b',
    },
    border: {
      primary: '#4dcad5',
      secondary: '#80d9e1',
    },
    button: {
      primary: '#006873',
      primaryHover: '#004d55',
      secondaryBg: 'rgba(255, 255, 255, 0.9)',
      secondaryBorder: '#00acbb',
    },
  },
} as const

/**
 * Helper function to get color value
 */
export function getColor(path: string): string {
  const keys = path.split('.')
  let value: any = colors
  
  for (const key of keys) {
    value = value?.[key]
    if (value === undefined) {
      console.warn(`Color not found: ${path}`)
      return '#000000'
    }
  }
  
  return value as string
}
