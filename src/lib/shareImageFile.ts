export type ShareImageResult = "shared" | "downloaded";

export async function shareImageFile(
  blob: Blob,
  filename: string,
  title = "דוח מטלות",
  link?: string,
): Promise<ShareImageResult> {
  const file = new File([blob], filename, { type: "image/png" });

  if (typeof navigator.share === "function") {
    const shareCandidates: ShareData[] = link
      ? [
          { title, url: link, files: [file] },
          { title, text: link, files: [file] },
          { title, files: [file] },
        ]
      : [{ title, files: [file] }];

    for (const shareData of shareCandidates) {
      if (!navigator.canShare || navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return "shared";
      }
    }
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
  return "downloaded";
}
