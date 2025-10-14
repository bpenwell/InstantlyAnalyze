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
  { name: 'rental-calculator-home', path: '/analyze/properties' },
  { name: 'rental-calculator-edit', path: '/analyze/properties/edit' },
  { name: 'rental-calculator-create', path: '/analyze/properties/createv3' },
  { name: 'rental-calculator-view', path: '/analyze/properties/view' },
  { name: 'market-reports', path: '/analyze/markets' },
  { name: 'ai-real-estate-agent', path: '/analyze/ai-real-estate-agent' },
  { name: 'privacy-policy-and-terms', path: '/privacy-policy-and-terms' },
  { name: 'mission', path: '/mission' },
  { name: 'contact-us', path: '/contact-us' },
  { name: 'blog', path: '/blog' },
  { name: 'blog-1-percent-rule', path: '/blog/1-percent-rule' },
  { name: 'blog-cash-on-cash-return', path: '/blog/cash-on-cash-return' },
  { name: 'blog-capitalization-rate', path: '/blog/capitalization-rate' },
  { name: 'blog-50-percent-rule', path: '/blog/50-percent-rule' },
  { name: '_404', path: '/404' },
];

module.exports = (env, argv) => ({
  entry: './src/index.tsx',
  output: {
    // Use hashed filenames for cache-busting in production, simple names in development
    filename: argv.mode === 'production' ? '[name].[contenthash].js' : '[name].js',
    chunkFilename: argv.mode === 'production' ? '[name].[contenthash].js' : '[name].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
  },
  mode: argv.mode || 'development',
  devtool: argv.mode === 'production' ? false : 'source-map',
  optimization: {
    minimize: argv.mode === 'production',
    minimizer: argv.mode === 'production' ? [
      '...', // This extends the default minimizers
    ] : [],
  },
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
          {
            loader: 'sass-loader',  // Compiles Sass to CSS
            options: {
              api: 'modern' // Use modern Sass API
            }
          }
        ],
      },
    ],
  },
  optimization: {
    // Disable minification for debugging
    minimize: false,
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
      title: 'Property Analyzer & Real Estate Analyzer | Free Rental Properties Analysis Tool',
      meta: {
        'description': 'Free property analyzer and real estate analyzer tool. Analyze rental properties with comprehensive ROI, cash flow, and cap rate calculations. Start your free analysis now!',
        'og:title': 'Property Analyzer & Real Estate Analyzer | Free Rental Properties Analysis Tool',
        'og:type': 'website',
        'og:url': 'https://instantlyanalyze.com',
        'og:image': 'https://instantlyanalyze.com/public/logo.png',
        'og:description': 'Free property analyzer and real estate analyzer tool. Analyze rental properties with comprehensive ROI, cash flow, and cap rate calculations.'
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
    mainFields: ['browser', 'module', 'main'],
    modules: [path.resolve(__dirname, 'node_modules'), 'node_modules'],
    alias: {
      '@bpenwell/instantlyanalyze-module': path.resolve(__dirname, '../InstantlyAnalyze-Module/dist'),
      '@bpenwell/instantlyanalyze-components': path.resolve(__dirname, '../InstantlyAnalyze-Components/dist'),
      '@bpenwell/instantlyanalyze-layouts': path.resolve(__dirname, '../InstantlyAnalyze-Layouts/dist'),
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
      // Fix multiple instances warnings
      'styled-components': path.resolve(__dirname, 'node_modules/styled-components'),
      '@emotion/react': path.resolve(__dirname, 'node_modules/@emotion/react'),
      '@emotion/styled': path.resolve(__dirname, 'node_modules/@emotion/styled'),
      '@emotion/core': path.resolve(__dirname, 'node_modules/@emotion/core'),
      '@emotion/css': path.resolve(__dirname, 'node_modules/@emotion/css'),
      '@emotion/utils': path.resolve(__dirname, 'node_modules/@emotion/utils'),
      '@emotion/cache': path.resolve(__dirname, 'node_modules/@emotion/cache'),
      '@emotion/serialize': path.resolve(__dirname, 'node_modules/@emotion/serialize'),
      '@emotion/weak-memoize': path.resolve(__dirname, 'node_modules/@emotion/weak-memoize'),
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
});
