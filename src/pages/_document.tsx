import {
  DocumentHeadTags,
  documentGetInitialProps,
  type DocumentHeadTagsProps,
} from "@mui/material-nextjs/v16-pagesRouter";
import { Html, Head, Main, NextScript } from "next/document";
import type { DocumentContext, DocumentProps } from "next/document";
import { rtlCache } from "@/lib/rtlCache";

export default function Document(
  props: DocumentProps & DocumentHeadTagsProps,
) {
  return (
    <Html lang="he" dir="rtl">
      <Head>
        <DocumentHeadTags {...props} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1976d2" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="All In One" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

Document.getInitialProps = async (ctx: DocumentContext) => {
  return documentGetInitialProps(ctx, { emotionCache: rtlCache });
};
