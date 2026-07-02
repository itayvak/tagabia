export type ShareImageResult = "shared" | "downloaded";

export async function shareImageFile(
  blob: Blob,
  filename: string,
): Promise<ShareImageResult> {
  const file = new File([blob], filename, { type: "image/png" });

  if (typeof navigator.share === "function") {
    const shareData: ShareData = {
      title: "דוח מטלות",
      files: [file],
    };

    if (!navigator.canShare || navigator.canShare(shareData)) {
      await navigator.share(shareData);
      return "shared";
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  return "downloaded";
}
