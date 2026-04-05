export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    // API auth route'ları, statik dosyalar, favicon, public sayfalar hariç her şeyi koru
    "/((?!api/auth|_next/static|_next/image|favicon.ico|logo\\.svg|logo\\.png|luden-logo-5\\.png|fonts|images|file\\.svg|globe\\.svg|next\\.svg|vercel\\.svg|window\\.svg).*)",
  ],
};
