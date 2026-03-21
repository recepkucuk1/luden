import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            // unsafe-eval: @react-pdf/renderer WASM/fontkit için gerekli
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.hcaptcha.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "font-src 'self'",
            "frame-src 'self' https://newassets.hcaptcha.com",
            "connect-src 'self' https://hcaptcha.com https://sentry.hcaptcha.com",
            "worker-src 'self' blob:",
          ].join("; "),
        },
      ],
    },
  ],
};

export default nextConfig;
