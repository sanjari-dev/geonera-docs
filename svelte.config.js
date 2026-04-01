import adapter from '@sveltejs/adapter-static';
import { mdsvex } from 'mdsvex';
import remarkGfm from 'remark-gfm';
import remarkSmartypants from 'remark-smartypants';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { createHighlighter } from 'shiki';

let highlighter;

const mdsvexConfig = {
  extensions: ['.svx', '.md'],
  layout: {
    _: './src/lib/mdsvex/DefaultLayout.svelte',
  },
  remarkPlugins: [remarkGfm, remarkSmartypants],
  rehypePlugins: [
    rehypeSlug,
    [
      rehypeAutolinkHeadings,
      {
        behavior: 'wrap',
        test: ['h2', 'h3', 'h4'],
      },
    ],
  ],
  highlight: {
    highlighter: async (code, lang) => {
      if (!highlighter) {
        highlighter = await createHighlighter({
          themes: ['nord'],
          langs: ['javascript', 'typescript', 'bash', 'json', 'python', 'go', 'rust', 'csharp', 'java', 'sql'],
        });
      }
      const html = highlighter.codeToHtml(code, { lang: lang || 'text', theme: 'nord' });
      return `{@html \`${html}\`}`;
    },
  },
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: ['.svelte', ...mdsvexConfig.extensions],
  preprocess: [mdsvex(mdsvexConfig)],
  kit: {
    adapter: adapter({
      fallback: 'index.html',
    }),
    alias: {
      $lib: 'src/lib',
      $components: 'src/lib/components',
      $stores: 'src/lib/stores',
      $utils: 'src/lib/utils',
    },
    paths: {
      base: '',
    },
  },
};

export default config;
