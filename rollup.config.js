import typescript from 'rollup-plugin-typescript2';

const browser = {
    input: './src/coveoua/browser.ts',
    output: {
        file: path.resolve(__dirname, './dist/coveoua.js')
    }
}

export default [{

}];

function tsPlugin() {
    return typescript({
        transformers: [
            (service) => ({
                before: [keysTransformer(service.getProgram())],
                after: [],
            }),
        ],
    });
}

function replacePlugin() {
    return replace({
        'process.env.NODE_ENV': JSON.stringify('production'),
        'process.env.REACT_VAPOR_VERSION': JSON.stringify(require('./package.json').version),
    });
}