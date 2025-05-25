//my-next-app/pages/_app.js

import { AppProvider } from "@shopify/polaris";

export default function MyApp({ Component, pageProps }) {
  return (
    <AppProvider i18n={{}}>
      <Component {...pageProps} />
    </AppProvider>
  );
}