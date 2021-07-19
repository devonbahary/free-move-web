const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require('path');

module.exports = {
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        compress: true,
    },
    devtool: 'inline-source-map',
    entry: path.resolve(__dirname, './src', 'index.js'),
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: [ MiniCssExtractPlugin.loader, "css-loader" ],
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
};
