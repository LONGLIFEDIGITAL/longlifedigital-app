import { Button, Container, Input, createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'brand',
  primaryShade: 6,
  colors: {
    brand: [
      '#faf5ff',
      '#f3e8ff',
      '#e9d5ff',
      '#d8b4fe',
      '#c084fc',
      '#a855f7',
      '#9333ea',
      '#7e22ce',
      '#6b21a8',
      '#581c87',
    ],
    gold: [
      '#fffbeb',
      '#fef3c7',
      '#fde68a',
      '#e8c97a',
      '#dbb45c',
      '#c9963f',
      '#b5802f',
      '#946324',
      '#785020',
      '#633f1b',
    ],
  },
  fontFamily: 'Inter, sans-serif',
  headings: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: '700' },
  defaultRadius: 'md',
  respectReducedMotion: true,
  components: {
    Input: Input.extend({
      defaultProps: { size: 'md' },
      styles: { input: { fontSize: 'max(16px, 1rem)', borderRadius: '0.5rem' } },
    }),
    Container: Container.extend({
      defaultProps: { size: 1280, px: { base: 16, sm: 24 } },
    }),
    Button: Button.extend({
      defaultProps: { size: 'md' },
      styles: {
        root: { height: 'auto', minHeight: 'max(44px, 2.75rem)', paddingBlock: '0.625rem' },
        label: { whiteSpace: 'normal', overflow: 'visible', lineHeight: 1.4 },
      },
    }),
  },
});
