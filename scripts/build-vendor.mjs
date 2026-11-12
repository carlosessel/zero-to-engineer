// Bundles React, ReactDOM and React Router into one file that the chapter
// previews load when a React example runs: public/vendor/react-runtime.js.
// Run automatically before `npm run dev` and `npm run build`. The output is not
// committed (see .gitignore); it is rebuilt from the versions in package-lock.json.
import { build } from 'esbuild';

await build({
  entryPoints: ['src/vendor/react-runtime.ts'],
  outfile: 'public/vendor/react-runtime.js',
  bundle: true,
  format: 'iife',
  target: 'es2020',
  minify: true,
  // Development builds, for their helpful warnings.
  define: { 'process.env.NODE_ENV': '"development"' },
  conditions: ['development'],
  legalComments: 'eof',
  logLevel: 'warning',
});
