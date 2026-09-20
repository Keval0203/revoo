import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  outputFileTracingExcludes: {
    '*': ['C:/Users/Unknown/**', 'C:/Users/Unknown/Application Data/**'],
  },
  
  devIndicators: false,

  // Disable TypeScript and ESLint checks during build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    // Allow all remote image sources (wildcard pattern)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
      },
      {
        protocol: 'http',
        hostname: '*',
      },
    ],
  },

  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  },
  // Turbopack configuration (stable)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  webpack: (config, { dev, isServer }) => {
    config.resolve.symlinks = false;
    
    if (dev && !isServer) {
      config.watchOptions = {
        ignored: ['**/node_modules/**', '**/.next/**', '**/.git/**', '**/prisma/**'],
        aggregateTimeout: 200,
      };
    }
    
    // Exclude server-only modules from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        cluster: false,
        fs: false,
        net: false,
        tls: false,
        v8: false,
        crypto: false,
        stream: false,
        path: false,
        os: false,
        util: false,
        events: false,
        worker_threads: false,
        child_process: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;

