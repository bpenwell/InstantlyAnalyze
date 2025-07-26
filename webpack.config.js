const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { GenerateSW } = require('workbox-webpack-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

//https://www.npmjs.com/package/sitemap-webpack-plugin
const SitemapPlugin = require('sitemap-webpack-plugin').default;
const SITE_MAP = [
  { name: 'home', path: '/' },
  { name: 'profile', path: '/profile' },
  { name: 'subscribe', path: '/subscribe' },
  { name: 'dashboard', path: '/dashboard' },
  { name: 'rental-calculator-home', path: '/product/instantlyreport' },
  { name: 'rental-calculator-edit', path: '/product/instantlyreport/edit' },
  { name: 'rental-calculator-create', path: '/product/instantlyreport/createv3' },
  { name: 'rental-calculator-view', path: '/product/instantlyreport/view' },
  { name: 'market-reports', path: '/product/market-reports' },
  { name: 'ai-real-estate-agent', path: '/product/ai-real-estate-agent' },
  { name: 'privacy-policy-and-terms', path: '/privacy-policy-and-terms' },
  { name: 'mission', path: '/mission' },
  { name: 'contact-us', path: '/contact-us' },
  { name: '_404', path: '/404' },
];

module.exports = {
  entry: './src/index.tsx',
  output: {
    // Use hashed filenames for cache-busting in production, simple names in development
    filename: process.env.NODE_ENV === 'production' ? '[name].[contenthash].js' : '[name].js',
    chunkFilename: process.env.NODE_ENV === 'production' ? '[name].[contenthash].js' : '[name].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
  },
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',
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
        use: ['style-loader', 'css-loader', 'postcss-loader'],
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
      title: 'InstantlyAnalyze - AI Real Estate Investment Analysis',
      meta: {
        'description': 'Save time and money with AI-powered real estate investment analysis tools.',
        'og:title': 'InstantlyAnalyze - AI Real Estate Investment Analysis',
        'og:type': 'website',
        'og:url': 'https://instantlyanalyze.com',
        'og:image': 'https://instantlyanalyze.com/public/logo.png',
        'og:description': 'Save time and money with AI-powered real estate investment analysis tools.'
      }
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/robots.txt', to: 'robots.txt' },
        { from: 'public', to: 'public' },
        { from: 'public/manifest.json', to: 'manifest.json' },
      ],
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[name].css',
    }),
    new WebpackPwaManifest(),
    new GenerateSW({
      maximumFileSizeToCacheInBytes: 20 * 1024 * 1024, // 20 MB
      clientsClaim: true,
      skipWaiting: true,
    }),
    new SitemapPlugin({ base: 'https://instantlyanalyze.com', paths: SITE_MAP, options: {
      filename: '/public/sitemap.xml',
    }}),
    //new BundleAnalyzerPlugin(),
  ],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    modules: [path.resolve(__dirname, 'node_modules'), 'node_modules'],
    alias: {
      '@ben1000240/instantlyanalyze-module': path.resolve(__dirname, 'node_modules/@ben1000240/instantlyanalyze-module'),
      '@ben1000240/instantlyanalyze-components': path.resolve(__dirname, 'node_modules/@ben1000240/instantlyanalyze-components'),
      '@ben1000240/instantlyanalyze-layouts': path.resolve(__dirname, 'node_modules/@ben1000240/instantlyanalyze-layouts'),
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