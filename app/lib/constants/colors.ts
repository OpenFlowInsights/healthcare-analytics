/**
 * OpenFlow Insights Brand Color Palette
 */
export const colors = {
  navy: {
    50: '#f0f4f8',
    100: '#d9e2ec',
    200: '#bcccdc',
    300: '#9fb3c8',
    400: '#829ab1',
    500: '#627d98',
    600: '#486581',
    700: '#334e68',
    800: '#243b53',
    900: '#102a43',
    950: '#0f1a2e',
  },
  blue: '#3b82f6', // Tailwind blue-500
  lightBlue: '#0ea5e9', // Tailwind sky-500
  orange: '#f59e0b', // Tailwind amber-500
  green: '#10b981', // Tailwind emerald-500
  purple: '#8b5cf6', // Tailwind violet-500
} as const;

export type ColorPalette = typeof colors;
