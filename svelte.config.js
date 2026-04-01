import adapter from '@sveltejs/adapter-static';
import { mdsvex } from 'mdsvex';
import remarkGfm from 'remark-gfm';
import remarkSmartypants from 'remark-smartypants';

const mdsvexConfig = {
  extensions: ['.svx', '.md'],
  remarkPlugins: [remarkGfm, remarkSmartypants],
  rehypePlugins: [],
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: ['.svelte', ...mdsvexConfig.extensions],
  preprocess: [mdsvex(mdsvexConfig)],
  kit: {
    adapter: adapter({
      fallback: 'index.html',
    }),
    paths: {
      base: '',
    },
  },
};

export default config;
