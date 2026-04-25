import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  serverExternalPackages: ["iyzipay"],
  // iyzipay SDK loads its resource files via fs.readdirSync at runtime.
  // Next.js tracer can't statically detect these, so we force-include them
  // in the build output. Without this Hostinger reports:
  //   ENOENT: ... node_modules/iyzipay/lib/resources
  outputFileTracingIncludes: {
    "/api/**/*": [
      "./node_modules/iyzipay/lib/resources/**/*",
      "./node_modules/iyzipay/lib/requests/**/*",
    ],
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            // NOTE: unsafe-eval geri eklendi — @react-pdf/renderer WASM gerektiriyor
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.hcaptcha.com *.iyzipay.com *.iyzico.com",
            "style-src 'self' 'unsafe-inline' *.iyzipay.com *.iyzico.com",
            "img-src 'self' data: blob: *.iyzipay.com *.iyzico.com",
            "font-src 'self' *.iyzipay.com *.iyzico.com",
            "frame-src 'self' https://newassets.hcaptcha.com *.iyzipay.com *.iyzico.com",
            "connect-src 'self' https://hcaptcha.com https://sentry.hcaptcha.com https://vitals.vercel-insights.com https://va.vercel-scripts.com *.iyzipay.com *.iyzico.com",
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
