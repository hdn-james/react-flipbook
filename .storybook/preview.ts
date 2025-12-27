import type { Preview } from '@storybook/react-vite';

// Import the library styles
import '../src/styles/flipbook.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      options: {
        dark: {
          name: 'dark',
          value: '#1a1a1a',
        },

        light: {
          name: 'light',
          value: '#f5f5f5',
        },

        white: {
          name: 'white',
          value: '#ffffff',
        }
      }
    },
    layout: 'centered',
    docs: {
      toc: true,
    },
  },

  tags: ['autodocs'],

  initialGlobals: {
    backgrounds: {
      value: 'dark'
    }
  }
};

export default preview;
