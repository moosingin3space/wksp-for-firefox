import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import copy from 'rollup-plugin-copy';
import buble from 'rollup-plugin-buble';

export default function(proj) {
    var files_to_copy = {};
    files_to_copy[`src/${proj}/static`] = `dist/${proj}/static`;
    files_to_copy[`src/${proj}/index.html`] = `dist/${proj}.html`;
    return {
        input: `src/${proj}/main.js`,
        output: {
            file: `dist/${proj}.bundle.js`,
            format: 'iife',
            sourcemap: true
        },
        plugins: [
            resolve(),
            commonjs(),
            svelte({
                include: `src/${proj}/svelte/**/*.html`,
                cascade: false,
                css: (css) => {
                    css.write(`dist/${proj}.bundle.css`);
                }
            }),
            buble(),
            copy(files_to_copy)
        ]
    };
}
