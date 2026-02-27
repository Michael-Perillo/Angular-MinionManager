import type { StorybookConfig } from '@storybook/angular';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-coverage',
  ],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
  webpackFinal: async (config) => {
    config.module!.rules!.push({
      test: /\.(js|ts)$/,
      loader: '@jsdevtools/coverage-istanbul-loader',
      options: { esModules: true },
      enforce: 'post',
      include: resolve(__dirname, '../src'),
      exclude: [/\.(e2e|spec|stories)\.ts$/, /node_modules/, /(ngfactory|ngstyle)\.js/],
    });
    return config;
  },
};
export default config;
