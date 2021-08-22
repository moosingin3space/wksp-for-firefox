const CopyPlugin = require("copy-webpack-plugin");

const mode = process.env.NODE_ENV || 'development';

module.exports = {
    mode,
    entry: {
        background: './src/background/main.js',
        palette: './src/palette/main.js',
        options: './src/options/main.js',
    },
    output: {
        filename: '[name].bundle.js',
        path: __dirname + '/dist',
    },
    module: {
        rules: [
            {
                test: /\.(html|svelte)$/,
                exclude: /node_modules/,
                use: 'svelte-loader',
            },
            {
                test: /\.m?jsx?$/,
                exclude: /node_modules/,
                use: 'swc-loader',
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1,
                            modules: true
                        }
                    },
                ]
            },
            {
                test: /\.svg$/,
                type: 'asset/resource',
                use: 'svgo-loader',
            }
        ],
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: "./src/palette/index.html",
                    to: __dirname + "/dist/palette.html",
                },
                {
                    from: "./src/palette/static",
                    to: __dirname + "/dist/palette/static",
                },
                {
                    from: "./src/options/index.html",
                    to: __dirname + "/dist/options.html",
                }
            ]
        }),
    ],
    optimization: {
        splitChunks: {
            cacheGroups: {
                commons: {
                    name: 'commons',
                    chunks: 'initial',
                    minChunks: 2,
                },
            },
        },
    },
    devtool: mode === 'production' ? undefined : 'inline-source-map'
};
