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
        <title>תגביה</title>
        <DocumentHeadTags {...props} />
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
