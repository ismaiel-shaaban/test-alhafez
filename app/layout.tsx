import type { Metadata } from 'next'
import { Tajawal, Poppins } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { LocaleProvider } from '@/contexts/LocaleContext'

const tajawal = Tajawal({
  subsets: ['latin', 'arabic'],
  variable: '--font-tajawal',
  weight: ['300', '400', '500', '700', '800'],
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'أكاديمية الحافظ | Al-Hafez Academy',
  description: 'أكاديمية الحافظ لتأسيس وتحفيظ القرآن الكريم',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${tajawal.variable} ${poppins.variable} font-arabic antialiased`}>
        {/* Meta Pixel Code */}
        <Script
          id="facebook-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1485020642598169');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=1485020642598169&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {/* End Meta Pixel Code */}
        <LocaleProvider>
          {children}
        </LocaleProvider>
      </body>
    </html>
  )
}
