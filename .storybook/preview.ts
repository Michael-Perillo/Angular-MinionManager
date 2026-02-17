import type { Preview } from '@storybook/angular'
import { setCompodocJson } from "@storybook/addon-docs/angular";
import { themes } from 'storybook/theming';
import docJson from "../documentation.json";
setCompodocJson(docJson);

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'evil-dark',
      values: [
        { name: 'evil-dark', value: '#0d0d0d' },
        { name: 'card-bg', value: '#16213e' },
      ],
    },
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    docs: {
      theme: themes.dark,
    },
  },
};

export default preview;