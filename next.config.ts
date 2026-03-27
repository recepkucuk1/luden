import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {},
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            // NOTE: unsafe-eval geri eklendi — @react-pdf/renderer WASM gerektiriyor
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.hcaptcha.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "font-src 'self'",
            "frame-src 'self' https://newassets.hcaptcha.com",
            "connect-src 'self' https://hcaptcha.com https://sentry.hcaptcha.com https://vitals.vercel-insights.com https://va.vercel-scripts.com",
            "worker-src 'self' blob:",
          ].join("; "),
        },
        { key: "X-Frame-Options",           value: "DENY" },
        { key: "X-Content-Type-Options",     value: "nosniff" },
        { key: "Referrer-Policy",            value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy",         value: "camera=(), microphone=(), geolocation=()" },
        { key: "Strict-Transport-Security",  value: "max-age=31536000; includeSubDomains" },
      ],
    },
  ],
};

export default nextConfig;
