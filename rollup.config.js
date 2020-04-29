import typescript from 'rollup-plugin-typescript2';
import { resolve } from 'path'
import { uglify } from 'rollup-plugin-uglify'
import { terser } from "rollup-plugin-terser";
import serve from 'rollup-plugin-serve'

const browser = {
    input: './src/coveoua/browser.ts',
    output: umdConfig(resolve(__dirname, './dist/coveoua.js')),
    plugins: [
        tsPlugin(),
        process.env.SERVE ? serve({
            contentBase: ['dist', 'public'],
            port: 9001,
            open: true,
        }) : null
    ]
}


const libraryUmd = {
    input: './src/coveoua/library.ts',
    output: umdConfig(resolve(__dirname, './dist/library.js')),
    plugins: [
        tsPlugin(),
        uglify()
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
        tsPlugin(),
        terser()
    ]
}

const tsPlugin = () => typescript({
    useTsconfigDeclarationDir: true
})

const umdConfig = (file) => ({
    file,
    format: 'umd',
    name: 'coveoua',
    sourcemap: true,
})

export default [browser, libraryUmd, libraryEsm];