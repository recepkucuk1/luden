import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "LudenLab <noreply@ludenlab.com>";
const BASE_URL = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "https://ludenlab.com";

function emailTemplate(opts: {
  title: string;
  heading: string;
  headingColor?: string;
  body: string;
  buttonText: string;
  url: string;
  footer: string;
}): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${opts.title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#023435;padding:28px 40px;text-align:center;">
              <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">LudenLab</span>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${opts.headingColor ?? "#0f172a"};">${opts.heading}</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6;">
                ${opts.body}
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="background:#FE703A;border-radius:10px;">
                    <a href="${opts.url}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
                      ${opts.buttonText}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
                Butona tıklanamıyorsa bu linki tarayıcınıza yapıştırın:<br/>
                <a href="${opts.url}" style="color:#FE703A;word-break:break-all;">${opts.url}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #f1f5f9;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                ${opts.footer}
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

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  const html = emailTemplate({
    title: "Şifre Sıfırlama",
    heading: "Şifrenizi Sıfırlayın",
    headingColor: "#023435",
    body: `Şifrenizi sıfırlamak için aşağıdaki butona tıklayın.
                Bu link <strong>1 saat</strong> geçerlidir.`,
    buttonText: "Şifremi Sıfırla",
    url: resetUrl,
    footer: "Bu talebi siz yapmadıysanız bu emaili dikkate almayın.",
  });

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Şifre Sıfırlama Talebi — LudenLab",
    html,
  });

  if (error) {
    console.error("[email] sendPasswordResetEmail error:", JSON.stringify(error));
    throw new Error(`Email gönderilemedi: ${error.message}`);
  }
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verifyUrl = `${BASE_URL}/verify-email?token=${token}`;

  const html = emailTemplate({
    title: "Email Doğrulama",
    heading: "Email adresinizi doğrulayın",
    body: `LudenLab hesabınızı aktifleştirmek için aşağıdaki butona tıklayın.
                Bu link <strong>1 saat</strong> süreyle geçerlidir.`,
    buttonText: "Email Adresimi Doğrula",
    url: verifyUrl,
    footer: "Bu emaili siz talep etmediyseniz görmezden gelebilirsiniz.",
  });

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "LudenLab — Email Adresinizi Doğrulayın",
    html,
  });

  if (error) {
    console.error("[email] Resend error:", JSON.stringify(error));
    throw new Error(`Email gönderilemedi: ${error.message}`);
  }
}
