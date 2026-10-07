const withPWAInit = require('@ducanh2912/next-pwa').default;

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV !== 'production',
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
    skipWaiting: true,
    clientsClaim: true,
    navigateFallback: '/',
    runtimeCaching: [
      {
        urlPattern: ({ request }) => request.mode === 'navigate',
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pages',
          networkTimeoutSeconds: 5,
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 60 * 60,
          },
        },
      },
      {
        urlPattern: /^https?.*\.(js|css|png|jpg|jpeg|svg|webp|woff2?)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'assets',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 7 * 24 * 60 * 60,
          },
        },
      },
    ],
  },
});

const nextConfig = {
  reactStrictMode: true,

  // ✅ Turbopack configuration - top-level `turbopack` key is the key this
  // Next.js version actually reads; the previous `experimental.turbo`
  // nesting was silently ignored (logged as an unrecognized key), so none
  // of this - including the Highcharts aliases - was taking effect.
  turbopack: {
    root: __dirname,
    // Previously a `rules` block here forced '*.js'/'*.mjs'/'*.cjs' through
    // swc-loader - harmless while this config was silently ignored (see
    // comment above), but applying it for real broke middleware's own
    // compilation (it couldn't parse Next's internal .js modules anymore).
    // Turbopack already compiles JS/TS with SWC by default, so this rule
    // was redundant even when working - dropped rather than scoped down.
    // ✅ Increase resolution cache for better performance
    resolveAlias: {
      // ✅ Ensure Highcharts modules resolve correctly
      'highcharts/modules/exporting': 'highcharts/modules/exporting',
      'highcharts/modules/export-data': 'highcharts/modules/export-data',
      'highcharts/modules/offline-exporting': 'highcharts/modules/offline-exporting',
      'highcharts/modules/treegraph': 'highcharts/modules/treegraph',
      'highcharts/modules/treemap': 'highcharts/modules/treemap',
      'highcharts/modules/gantt': 'highcharts/modules/gantt',
      // @react-pdf/renderer's PDFViewer pulls in pdfjs-dist, which tries to
      // resolve the native 'canvas' package for server-side rendering. It's
      // never actually used in the browser, but Turbopack (unlike webpack)
      // doesn't silently ignore unresolvable optional deps, so it must be
      // aliased to a stub.
      canvas: './empty_module.js',
    },
  },

  // ✅ Transpile Highcharts packages
  transpilePackages: [
    'highcharts',
    'highcharts-react-official',
    'highcharts/modules/exporting',
    'highcharts/modules/export-data',
    'highcharts/modules/offline-exporting',
    'highcharts/modules/treegraph',
    'highcharts/modules/treemap',
    'highcharts/modules/gantt',
  ],

  // ✅ Webpack fallback for server-side
  webpack: (config, { isServer, dev }) => {
    // Fix for Highcharts on server
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
      };
    }

    // ✅ Add source map support in development
    if (dev) {
      config.devtool = 'cheap-module-source-map';
    }

    // ✅ Optimize bundle size
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // ✅ Separate Highcharts into its own chunk
          highcharts: {
            test: /[\\/]node_modules[\\/](highcharts|highcharts-react-official)[\\/]/,
            name: 'highcharts',
            priority: 30,
            enforce: true,
          },
          // ✅ Separate MUI into its own chunk
          mui: {
            test: /[\\/]node_modules[\\/](@mui|@emotion)[\\/]/,
            name: 'mui',
            priority: 20,
            enforce: true,
          },
          // ✅ Separate vendors into their own chunk
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            priority: 10,
            chunks: 'all',
          },
        },
      },
    };

    return config;
  },

  env: {
    REACT_APP_IMAGES_PATH: '/assets/images',
  },

  async rewrites() {
    return [
      {
        source: '/manifest.json',
        destination: '/api/manifest?lang=en-US',
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  // ✅ Add headers for service worker and PWA
  async headers() {
    return [
      {
        source: '/firebase-messaging-sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
        ],
      },
    ];
  },

  // ✅ Add security headers
  poweredByHeader: false,
  compress: true,
  generateEtags: true,
};

module.exports = withPWA(nextConfig);