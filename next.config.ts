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
      // iyzipay SDK + its full transitive dep tree.
      // The constructor does fs.readdirSync on ./resources and the
      // resource files require sibling helpers — none of which the
      // Next.js tracer can follow because of the dynamic require.
      // postman-request and friends are pruned from the trace too
      // because iyzipay is externalized.
      "./node_modules/iyzipay/**/*",
      "./node_modules/postman-request/**/*",
      "./node_modules/@postman/**/*",
      "./node_modules/aws-sign2/**/*",
      "./node_modules/aws4/**/*",
      "./node_modules/caseless/**/*",
      "./node_modules/combined-stream/**/*",
      "./node_modules/extend/**/*",
      "./node_modules/forever-agent/**/*",
      "./node_modules/http-signature/**/*",
      "./node_modules/is-typedarray/**/*",
      "./node_modules/isstream/**/*",
      "./node_modules/json-stringify-safe/**/*",
      "./node_modules/mime-types/**/*",
      "./node_modules/mime-db/**/*",
      "./node_modules/oauth-sign/**/*",
      "./node_modules/qs/**/*",
      "./node_modules/safe-buffer/**/*",
      "./node_modules/socks-proxy-agent/**/*",
      "./node_modules/socks/**/*",
      "./node_modules/stream-length/**/*",
      "./node_modules/uuid/**/*",
      "./node_modules/asynckit/**/*",
      "./node_modules/delayed-stream/**/*",
      "./node_modules/agent-base/**/*",
      "./node_modules/debug/**/*",
      "./node_modules/ms/**/*",
      "./node_modules/ip-address/**/*",
      "./node_modules/smart-buffer/**/*",
      "./node_modules/sshpk/**/*",
      "./node_modules/jsprim/**/*",
      "./node_modules/assert-plus/**/*",
      "./node_modules/extsprintf/**/*",
      "./node_modules/json-schema/**/*",
      "./node_modules/verror/**/*",
      "./node_modules/asn1/**/*",
      "./node_modules/bcrypt-pbkdf/**/*",
      "./node_modules/dashdash/**/*",
      "./node_modules/ecc-jsbn/**/*",
      "./node_modules/getpass/**/*",
      "./node_modules/jsbn/**/*",
      "./node_modules/tweetnacl/**/*",
      "./node_modules/psl/**/*",
      "./node_modules/punycode/**/*",
      "./node_modules/tldts/**/*",
      "./node_modules/tldts-core/**/*",
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
