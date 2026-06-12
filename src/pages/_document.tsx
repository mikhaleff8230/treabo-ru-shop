import { getDirection } from '@/lib/constants';
import Document, {
  DocumentContext,
  Head,
  Html,
  Main,
  NextScript,
} from 'next/document';

class CustomDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    return Document.getInitialProps(ctx);
  }
  render() {
    const { locale } = this.props.__NEXT_DATA__;
    const dir = getDirection(locale);
    const ymId = 81185602
    return (
      <Html dir={dir}>
        <Head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
            rel="stylesheet"
          />
        </Head>
        <body>
          {process.env.NODE_ENV === 'development' && (
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  document.body.style.display = 'block';
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations()
                      .then(function(registrations) {
                        registrations.forEach(function(registration) { registration.unregister(); });
                      })
                      .catch(function() {});
                  }
                  if ('caches' in window) {
                    caches.keys()
                      .then(function(keys) {
                        return Promise.all(keys.map(function(key) { return caches.delete(key); }));
                      })
                      .catch(function() {});
                  }
                `,
              }}
            />
          )}
          <Main />
          <NextScript />

          <script
                    dangerouslySetInnerHTML={{
                        __html: `
                        (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                        m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
                        (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

                        ym(${ymId}, "init", {
                          clickmap:true,
                          trackLinks:true,
                          accurateTrackBounce:true,
                          webvisor:true,
                          ecommerce:"dataLayer"
                        });
                        `,
                    }}
                />
                <noscript>
                    <div>
                        <img src={`https://mc.yandex.ru/watch/${ymId}`} style={{ position: 'absolute', left: '-9999px' }} alt="" />
                    </div>
                </noscript>
            
        </body>
      </Html>
    );
  }
}

export default CustomDocument;
