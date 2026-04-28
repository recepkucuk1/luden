import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  turbopack: {},
  // Self-contained server bundle at .next/standalone/server.js — required
  // for the iyzipay package to ship its full transitive dep tree alongside
  // outputFileTracingIncludes below.
  output: "standalone",
  serverExternalPackages: ["iyzipay"],
  // iyzipay SDK loads its resource files via fs.readdirSync at runtime.
  // Next.js tracer can't statically detect these, so we force-include them
  // in the build output. Without this Hostinger reports:
  //   ENOENT: ... node_modules/iyzipay/lib/resources
  outputFileTracingIncludes: {
    "/api/**/*": [
      // bluebird missed by npm ls (deduped) — added manually.
      "./node_modules/bluebird/**/*",
      // Earlier hand-pinned list:
      "./node_modules/iyzipay/**/*",
      "./node_modules/postman-request/**/*",
      "./node_modules/@postman/**/*",
      "./node_modules/agent-base/**/*",
      "./node_modules/asn1/**/*",
      "./node_modules/assert-plus/**/*",
      "./node_modules/asynckit/**/*",
      "./node_modules/aws-sign2/**/*",
      "./node_modules/aws4/**/*",
      "./node_modules/bcrypt-pbkdf/**/*",
      "./node_modules/call-bind-apply-helpers/**/*",
      "./node_modules/call-bound/**/*",
      "./node_modules/caseless/**/*",
      "./node_modules/combined-stream/**/*",
      "./node_modules/core-util-is/**/*",
      "./node_modules/dashdash/**/*",
      "./node_modules/debug/**/*",
      "./node_modules/delayed-stream/**/*",
      "./node_modules/dunder-proto/**/*",
      "./node_modules/ecc-jsbn/**/*",
      "./node_modules/es-define-property/**/*",
      "./node_modules/es-errors/**/*",
      "./node_modules/es-object-atoms/**/*",
      "./node_modules/extend/**/*",
      "./node_modules/extsprintf/**/*",
      "./node_modules/forever-agent/**/*",
      "./node_modules/function-bind/**/*",
      "./node_modules/get-intrinsic/**/*",
      "./node_modules/get-proto/**/*",
      "./node_modules/getpass/**/*",
      "./node_modules/gopd/**/*",
      "./node_modules/has-symbols/**/*",
      "./node_modules/hasown/**/*",
      "./node_modules/http-signature/**/*",
      "./node_modules/ip-address/**/*",
      "./node_modules/is-typedarray/**/*",
      "./node_modules/isstream/**/*",
      "./node_modules/jsbn/**/*",
      "./node_modules/json-schema/**/*",
      "./node_modules/json-stringify-safe/**/*",
      "./node_modules/jsprim/**/*",
      "./node_modules/math-intrinsics/**/*",
      "./node_modules/mime-db/**/*",
      "./node_modules/mime-types/**/*",
      "./node_modules/ms/**/*",
      "./node_modules/oauth-sign/**/*",
      "./node_modules/object-inspect/**/*",
      "./node_modules/psl/**/*",
      "./node_modules/punycode/**/*",
      "./node_modules/qs/**/*",
      "./node_modules/querystringify/**/*",
      "./node_modules/requires-port/**/*",
      "./node_modules/safe-buffer/**/*",
      "./node_modules/safer-buffer/**/*",
      "./node_modules/side-channel/**/*",
      "./node_modules/side-channel-list/**/*",
      "./node_modules/side-channel-map/**/*",
      "./node_modules/side-channel-weakmap/**/*",
      "./node_modules/smart-buffer/**/*",
      "./node_modules/socks/**/*",
      "./node_modules/socks-proxy-agent/**/*",
      "./node_modules/sshpk/**/*",
      "./node_modules/stream-length/**/*",
      "./node_modules/tweetnacl/**/*",
      "./node_modules/universalify/**/*",
      "./node_modules/url-parse/**/*",
      "./node_modules/uuid/**/*",
      "./node_modules/verror/**/*",
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
            "connect-src 'self' https://hcaptcha.com https://sentry.hcaptcha.com https://vitals.vercel-insights.com https://va.vercel-scripts.com *.iyzipay.com *.iyzico.com https://*.ingest.de.sentry.io https://*.ingest.sentry.io",
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

// Sentry build-time entegrasyonu — minimal. Sadece runtime error capture aktif.
// Source map upload, tunnelRoute, react annotation gibi gelişmiş özellikler
// kurulum doğrulandıktan sonra eklenecek.
export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  disableLogger: true,
});
