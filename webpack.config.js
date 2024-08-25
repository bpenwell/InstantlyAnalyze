const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { GenerateSW } = require('workbox-webpack-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest');

module.exports = {
  entry: './src/index.tsx',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
  },
  mode: 'development',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        include: [
          path.resolve(__dirname, 'src'),
        ],
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          },
        },
      },
      {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/index.html', // path to your HTML template
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'public', to: 'public' }, // copy the entire 'public' folder
        { from: 'public/manifest.json', to: 'manifest.json' }, // copy the manifest file
      ],
    }),
    new MiniCssExtractPlugin(),
    new WebpackPwaManifest(),
    new GenerateSW({
      clientsClaim: true,
      skipWaiting: true,
    }),
  ],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
        'react': path.resolve('./node_modules/react'),
        'react-dom': path.resolve('./node_modules/react-dom'),
        'react-router-dom': path.resolve('./node_modules/react-router-dom'),
    }
  },
  devServer: {
    static: path.resolve(__dirname, 'dist'),
    compress: true,
    port: 3000,
  },
};
