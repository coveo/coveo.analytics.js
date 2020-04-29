import typescript from 'rollup-plugin-typescript2';
import { resolve } from 'path'
import { uglify } from 'rollup-plugin-uglify'
import { terser } from "rollup-plugin-terser";
import serve from 'rollup-plugin-serve'

const browser = {
    input: './src/coveoua/browser.ts',
    output: {
        file: resolve(__dirname, './dist/coveoua.js'),
        format: 'umd',
        name: 'coveoua',
        sourcemap: true,
    },
    plugins: [
        typescript({
            useTsconfigDeclarationDir: true
        }),
        process.env.SERVE ? serve({
            contentBase: ['dist', 'public'],
            port: 9001,
            open: true,
        }) : null
    ]
}

const libraryEsm = {
    input: './src/coveoua/library.ts',
    output: {
        file: resolve(__dirname, './dist/library.es.js'),
        format: 'es',
        sourcemap: true
    },
    plugins: [
        typescript({
            useTsconfigDeclarationDir: true
        }),
        terser()
    ]
}

const libraryUmd = {
    input: './src/coveoua/library.ts',
    output: {
        file: resolve(__dirname, './dist/library.js'),
        format: 'umd',
        name: 'coveoua',
        sourcemap: true,
    },
    plugins: [
        typescript({
            useTsconfigDeclarationDir: true
        }),
        uglify()
    ]
}

export default [browser, libraryEsm, libraryUmd];