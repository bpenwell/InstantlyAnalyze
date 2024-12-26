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
      {
        test: /\.scss$/,
        use: [
          'style-loader', // Injects styles into DOM
          'css-loader',   // Translates CSS into CommonJS
          'sass-loader'   // Compiles Sass to CSS
        ],
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
      maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB
      clientsClaim: true,
      skipWaiting: true,
    }),
  ],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@bpenwell/instantlyanalyze-module': path.resolve(__dirname, 'node_modules/@bpenwell/instantlyanalyze-module'),
      '@bpenwell/instantlyanalyze-components': path.resolve(__dirname, 'node_modules/@bpenwell/instantlyanalyze-components'),
      '@bpenwell/instantlyanalyze-layouts': path.resolve(__dirname, 'node_modules/@bpenwell/instantlyanalyze-layouts'),
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'react-router-dom': path.resolve(__dirname, 'node_modules/react-router-dom'),
      '@auth0/auth0-react': path.resolve(__dirname, 'node_modules/@auth0/auth0-react'),
      '@mapbox/search-js-react': path.resolve(__dirname, 'node_modules/@mapbox/search-js-react'),
      '@cloudscape-design/components': path.resolve(__dirname, 'node_modules/@cloudscape-design/components'),
      '@cloudscape-design/chat-components': path.resolve(__dirname, 'node_modules/@cloudscape-design/chat-components'),
      '@cloudscape-design/design-tokens': path.resolve(__dirname, 'node_modules/@cloudscape-design/design-tokens'),
      '@cloudscape-design/collection-hooks': path.resolve(__dirname, 'node_modules/@cloudscape-design/collection-hooks'),
      '@cloudscape-design/board-components': path.resolve(__dirname, 'node_modules/@cloudscape-design/board-components'),
      '@cloudscape-design/global-styles': path.resolve(__dirname, 'node_modules/@cloudscape-design/global-styles'),
      '@mui/material': path.resolve(__dirname, 'node_modules/@mui/material'),
      '@mui/icons-material': path.resolve(__dirname, 'node_modules/@mui/icons-material'),
      '@emotion/react': path.resolve(__dirname, 'node_modules/@emotion/react'),
      '@emotion/styled': path.resolve(__dirname, 'node_modules/@emotion/styled'),
    }
  },
  devServer: {
    static: path.resolve(__dirname, 'dist'),
    compress: true,
    port: 3000,
    proxy: {
      // For example, any AJAX call to /create-checkout-session 
      // will get forwarded to http://localhost:4242
      '/create-checkout-session': {
        target: 'http://localhost:4242',
        secure: false
      }
    }
  },
};
