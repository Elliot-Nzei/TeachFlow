
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  allowedDevOrigins: [
    "https://3000-firebase-studio-1759929584345.cluster-ikslh4rdsnbqsvu5nw3v4dqjj2.cloudworkstations.dev",
    "https://6000-firebase-studio-1759929584345.cluster-ikslh4rdsnbqsvu5nw3v4dqjj2.cloudworkstations.dev",
  ],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'clipboard-write=(self)',
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "drive.google.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "i.pinimg.com" },
      { protocol: "https", hostname: "source.unsplash.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "ui-avatars.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: 'https', hostname: 'images-cdn.ubuy.co.in' },
    ],
  },
};

export default nextConfig;
