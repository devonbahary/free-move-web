const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

module.exports = {
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        compress: true,
    },
    devtool: 'source-map',
    entry: path.resolve(__dirname, './src', 'index.js'),
    mode: 'development',
    module: {
        rules: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
            },
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            {
                test: /\.js$/,
                loader: 'source-map-loader',
            },
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            },
        ],
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: 'main.js',
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'FreeMove',
            template: path.resolve(__dirname, './src', 'index.html'),
        }),
        new MiniCssExtractPlugin(),
    ],
    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js'],
    },
};
