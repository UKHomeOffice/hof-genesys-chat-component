import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import esbuild from 'rollup-plugin-esbuild';

const external = (id) =>
  id === 'react' ||
  id === 'react-dom' ||
  id === 'react-router' || // only if you actually use it in your lib surface
  id.startsWith('react/jsx-runtime');

export default {
  input: 'src/index.js',
  external,
  plugins: [
    resolve({ extensions: ['.js', '.jsx'] }),
    commonjs(),
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    }),
    esbuild({
      loaders: {
        '.js': 'jsx',
        '.jsx': 'jsx',
      },
      jsx: 'automatic',
      target: 'es2019',
      sourceMap: true,
    }),
  ],
  output: [
    { file: 'dist/index.js', format: 'esm', sourcemap: true },
    { file: 'dist/index.cjs', format: 'cjs', sourcemap: true, exports: 'named' },
  ],
};
