import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "Luden <onboarding@resend.dev>";
const BASE_URL = process.env.NEXTAUTH_URL ?? "https://luden-8737.vercel.app";

function verificationEmailHtml(verifyUrl: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email Doğrulama</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#023435;padding:28px 40px;text-align:center;">
              <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Luden</span>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0f172a;">Email adresinizi doğrulayın</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6;">
                Luden hesabınızı aktifleştirmek için aşağıdaki butona tıklayın.
                Bu link <strong>1 saat</strong> süreyle geçerlidir.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="background:#FE703A;border-radius:10px;">
                    <a href="${verifyUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
                      Email Adresimi Doğrula
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
                Butona tıklanamıyorsa bu linki tarayıcınıza yapıştırın:<br/>
                <a href="${verifyUrl}" style="color:#FE703A;word-break:break-all;">${verifyUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #f1f5f9;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                Bu emaili siz talep etmediyseniz görmezden gelebilirsiniz.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verifyUrl = `${BASE_URL}/verify-email?token=${token}`;
  console.log("[email] sendVerificationEmail →", { to: email, verifyUrl });
  console.log("[email] RESEND_API_KEY set:", !!process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Luden - Email Adresinizi Doğrulayın",
    html: verificationEmailHtml(verifyUrl),
  });

  if (error) {
    console.error("[email] Resend error:", JSON.stringify(error));
    throw new Error(`Email gönderilemedi: ${error.message}`);
  }
  console.log("[email] Resend success, id:", data?.id);
}
