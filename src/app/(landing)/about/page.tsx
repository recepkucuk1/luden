import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hakkımızda — LudenLab",
  description: "LudenLab hakkında ve iletişim bilgileri.",
};

const DOT = <span className="mr-2 text-[#FE703A]">●</span>;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-bold text-[#023435] mb-6 pb-2 border-b border-[#023435]/10">{title}</h2>
      {children}
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-600 leading-relaxed mb-4">{children}</p>;
}

export default function AboutPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto py-16 px-4">

        {/* Başlık */}
        <div className="text-center mb-14">
          <div className="text-2xl font-bold mb-1">
            <span className="text-[#023435]">Luden</span>
            <span className="text-[#FE703A]">Lab</span>
          </div>
          <h1 className="text-2xl font-bold text-[#023435] mt-4">Hakkımızda</h1>
        </div>

        {/* Bölüm 1: Hakkımızda */}
        <Section title="Hakkımızda">
          <P>
            LudenLab, Luden Eğitim Danışmanlık Organizasyon ve Ticaret Limited Şirketi tarafından geliştirilen dijital
            eğitim platformudur. Dil, konuşma ve işitme alanlarında çalışan özel eğitim uzmanlarına yönelik yapay zeka
            destekli öğrenme materyali üretim hizmeti sunmaktadır.
          </P>
          <P>
            &ldquo;Oyunla keşfet, teknolojiyle geliştir.&rdquo; vizyonuyla yola çıkan LudenLab, MEB Talim Terbiye Kurulu müfredatına
            uygun, öğrenci profiline özel eğitim materyalleri üretilmesini sağlar. Platform, uzmanların materyal
            hazırlama süresini minimize ederek daha fazla zamanı doğrudan öğrenciyle çalışmaya ayırmasını hedeflemektedir.
          </P>

          {/* Neden LudenLab */}
          <h3 className="text-base font-bold text-[#023435] mt-6 mb-4">Neden LudenLab?</h3>
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {[
              {
                title: "Yapay Zeka Destekli Üretim",
                desc: "Claude AI teknolojisi ile saniyeler içinde kişiselleştirilmiş öğrenme materyalleri",
              },
              {
                title: "MEB Müfredatı Entegrasyonu",
                desc: "Talim Terbiye Kurulu destek eğitim programlarına tam uyum",
              },
              {
                title: "Öğrenci Odaklı Kişiselleştirme",
                desc: "Tanı türü, yaş grubu ve çalışma alanına göre özelleştirilmiş içerik",
              },
              {
                title: "Güvenli Altyapı",
                desc: "KVKK uyumlu veri koruma, şifreli iletişim ve güvenli ödeme altyapısı",
              },
              {
                title: "Kolay Kullanım",
                desc: "Sade ve modern arayüz ile hızlıca materyal üretme, düzenleme ve indirme",
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-[#023435]/[0.03] rounded-xl p-4">
                {DOT}
                <div>
                  <p className="font-semibold text-[#023435] text-sm mb-1">{item.title}</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Homo Ludens */}
          <h3 className="text-base font-bold text-[#023435] mb-4">Homo Ludens Felsefesi</h3>
          <div className="border-l-4 border-[#FE703A] pl-5 py-1">
            <P>
              LudenLab ismindeki &ldquo;Luden&rdquo;, Johan Huizinga&apos;nın &ldquo;Homo Ludens&rdquo; (Oynayan İnsan) kavramından
              esinlenmektedir. Öğrenmenin oyun ve keşif yoluyla gerçekleştiğine inanan bu felsefeyi dijital eğitim
              araçlarına taşımak, platformun temel amacıdır.
            </P>
          </div>
        </Section>

        {/* Bölüm 2: Şirket Bilgileri */}
        <Section title="Şirket Bilgileri">
          <div className="bg-[#023435]/5 rounded-2xl p-6 space-y-3 text-sm text-gray-600">
            {[
              ["Ticaret Unvanı", "Luden Eğitim Danışmanlık Organizasyon ve Ticaret Limited Şirketi"],
              ["MERSİS No", "0609120901300001"],
              ["Ticaret Sicil No", "237834"],
              ["Adres", "Aydınlıkevler Mahallesi 6782/5 Sk. No:15 Çiğli / İzmir"],
              ["Meslek Grubu", "35 Eğitim Grubu"],
            ].map(([label, value], i) => (
              <p key={i} className="flex items-start gap-2">
                <span className="font-medium text-[#023435] shrink-0 min-w-[130px]">{label}:</span>
                <span>{value}</span>
              </p>
            ))}
          </div>
        </Section>

        {/* Bölüm 3: İletişim */}
        <Section title="İletişim">
          <P>
            LudenLab hakkında soru, öneri ve iş birliği talepleriniz için bizimle iletişime geçebilirsiniz.
          </P>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                icon: (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                ),
                label: "E-posta",
                value: "info@ludenlab.com",
                href: "mailto:info@ludenlab.com",
              },
              {
                icon: (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                ),
                label: "Telefon",
                value: "0530 886 67 82",
                href: "tel:+905308866782",
              },
              {
                icon: (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                ),
                label: "Adres",
                value: "Aydınlıkevler Mah. 6782/5 Sk. No:15 Çiğli / İzmir",
                href: null,
              },
              {
                icon: (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                ),
                label: "Web",
                value: "ludenlab.com",
                href: "https://ludenlab.com",
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 bg-[#023435]/[0.03] rounded-xl p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#023435]/10 text-[#023435]">
                  {item.icon}
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#023435]/60 uppercase tracking-wide mb-1">{item.label}</p>
                  {item.href ? (
                    <a href={item.href} className="text-sm text-gray-700 hover:text-[#FE703A] transition-colors">
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-700">{item.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>

      </div>
    </div>
  );
}
