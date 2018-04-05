import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import buble from 'rollup-plugin-buble';

export default {
    input: 'src/background/main.js',
    output: {
        file: 'dist/background.js',
        format: 'iife'
    },
    plugins: [
        resolve(),
        commonjs(),
        buble()
    ]
}
