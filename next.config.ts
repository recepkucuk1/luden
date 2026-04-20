import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  serverExternalPackages: ["iyzipay"],
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            // @react-pdf/renderer WASM gerektiriyor -> wasm-unsafe-eval yeterli
            // (unsafe-eval genel eval'ı da açardı; daraltıldı).
            "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://js.hcaptcha.com *.iyzipay.com *.iyzico.com",
            "style-src 'self' 'unsafe-inline' *.iyzipay.com *.iyzico.com",
            "img-src 'self' data: blob: *.iyzipay.com *.iyzico.com",
            "font-src 'self' *.iyzipay.com *.iyzico.com",
            "frame-src 'self' https://newassets.hcaptcha.com *.iyzipay.com *.iyzico.com",
            "connect-src 'self' https://hcaptcha.com https://sentry.hcaptcha.com https://vitals.vercel-insights.com https://va.vercel-scripts.com *.iyzipay.com *.iyzico.com",
            "worker-src 'self' blob:",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self' *.iyzipay.com *.iyzico.com",
            "frame-ancestors 'none'",
          ].join("; "),
        },
        { key: "X-Frame-Options",           value: "DENY" },
        { key: "X-Content-Type-Options",     value: "nosniff" },
        { key: "Referrer-Policy",            value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy",         value: "camera=(), microphone=(), geolocation=()" },
        { key: "Strict-Transport-Security",  value: "max-age=31536000; includeSubDomains" },
      ],
    },
    {
      source: "/_next/static/:path*",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
    {
      source: "/fonts/:path*",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
  ],
};

export default nextConfig;
