import { fromRollup } from '@web/dev-server-rollup';
import rollupBabel from '@rollup/plugin-babel';

const babel = fromRollup(rollupBabel);

export default {
    port: 8001,
    mimeTypes: {
        '**/*.ts': 'js',
    },
    files: ['test/*'],
    nodeResolve: true,
    plugins: [
        babel({
            extensions: ['.ts'],
            babelHelpers: 'runtime',
            presets: [['@babel/preset-typescript']],
            plugins: [
                ['@babel/plugin-transform-runtime'],
                [
                    '@babel/plugin-transform-typescript',
                    {
                        allowDeclareFields: true,
                    },
                ],
                [
                    '@babel/plugin-proposal-decorators',
                    {
                        version: '2023-05',
                    },
                ],
            ],
        }),
    ],
};
