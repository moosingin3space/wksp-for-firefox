const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    mode: process.env.NODE_ENV,
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
                test: /\.m?js$/,
                exclude: /node_modules/,
                use: 'swc-loader',
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
                },
                {
                    from: "./src/options/static",
                    to: __dirname + "/dist/options/static",
                }
            ]
        }),
    ],
};
