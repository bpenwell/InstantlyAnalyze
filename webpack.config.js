const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { GenerateSW } = require('workbox-webpack-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  entry: './src/index.tsx',
  output: {
    // Use hashed filenames for cache-busting
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
  },
  mode: 'production', // Switch to 'production' when you're ready for optimized builds
  //devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        include: [path.resolve(__dirname, 'src')],
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
          'sass-loader',  // Compiles Sass to CSS
        ],
      },
    ],
  },
  optimization: {
    // Enable code splitting & separate runtime bundle
    splitChunks: {
      chunks: 'all',               // Split both dynamic and static imports
      maxSize: 10000000,           // ~10MB (to ensure individual chunks stay below your limit)
      maxAsyncRequests: 20,
      maxInitialRequests: 20,
      cacheGroups: {
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react-vendors',
          chunks: 'all',
          priority: 10,
        },
        mui: {
          test: /[\\/]node_modules[\\/]@mui[\\/]/,
          name: 'mui-vendors',
          chunks: 'all',
          priority: 9,
        },
        cloudscape: {
          test: /[\\/]node_modules[\\/]@cloudscape-design[\\/]/,
          name: 'cloudscape-design-vendors',
          chunks: 'all',
          priority: 9,
        },
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: -10,
        },
      },
    },
    runtimeChunk: 'single', // Create a separate bundle for Webpack runtime code
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/index.html',
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'public', to: 'public' },
        { from: 'public/manifest.json', to: 'manifest.json' },
      ],
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
      chunkFilename: '[name].[contenthash].css',
    }),
    new WebpackPwaManifest(),
    new GenerateSW({
      maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB
      clientsClaim: true,
      skipWaiting: true,
    }),
    //new BundleAnalyzerPlugin(),
  ],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@bpenwell/instantlyanalyze-module': path.resolve(__dirname, 'node_modules/@bpenwell/instantlyanalyze-module'),
      '@bpenwell/instantlyanalyze-components': path.resolve(__dirname, 'node_modules/@bpenwell/instantlyanalyze-components'),
      '@bpenwell/instantlyanalyze-layouts': path.resolve(__dirname, 'node_modules/@bpenwell/instantlyanalyze-layouts'),
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
    },
  },
  devServer: {
    static: path.resolve(__dirname, 'dist'),
    compress: true,
    port: 3000,
    proxy: {
      // Example proxy for an API endpoint
      '/create-checkout-session': {
        target: 'http://localhost:4242',
        secure: false,
      },
    },
  },
};