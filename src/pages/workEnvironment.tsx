import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import DownloadIcon from "@mui/icons-material/Download";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Alert,
  Box,
  ButtonBase,
  CircularProgress,
  Collapse,
  Snackbar,
} from "@mui/material";
import AppLayout from "@/components/AppLayout";
import { APP_BOTTOM_BAR_HEIGHT } from "@/components/AppBottomBar";
import GoogleCalendarWidget from "@/components/GoogleCalendarWidget";
import { getSession } from "@/lib/authStorage";
import { fetchWorkEnvironmentFiles } from "@/lib/fetchWorkEnvironmentFiles";
import type { PublicUser } from "@/types/user";
import type {
  ListWorkEnvironmentFilesSuccessResponse,
  PublicWorkEnvironmentFile,
  WorkEnvironmentFileKey,
} from "@/types/workEnvironment";

const EXTERNAL_TILES = [
  { label: "דמות הקצין", image: "/toolbox/bhd-logo.png", href: "https://write.bahad1.com/" },
  {
    label: 'קה"ד 1',
    image: "/toolbox/graph.png",
    href: "https://kahad-ahat.base44.app/dashboard",
  },
  {
    label: "הקמפוס הדיגיטלי",
    image: "/toolbox/campus-logo.png",
    href: "https://login.microsoftonline.com/tikshuv.onmicrosoft.com/oauth2/authorize?response_type=code&client_id=3bb9df6e-3377-41c6-a153-e33d39b71d97&scope=openid%20profile%20email&nonce=N6a1fa3068fe2e&response_mode=form_post&state=N4wJAEEsrZXadch&redirect_uri=https%3A%2F%2Fcampus.digital.idf.il%2Fauth%2Foidc%2F&resource=https%3A%2F%2Fgraph.microsoft.com&sso_reload=true",
  },
  { label: "שדה תעופה", image: "/toolbox/plane.png", href: "https://bgn.bgn-ng.com/" },
] as const;

const TRAINING_FILE_KEYS: WorkEnvironmentFileKey[] = [
  "training1",
  "training2",
  "training3",
  "training4",
  "training5",
];

function openMediaUrl(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function ShuttleGlyph() {
  return (
    <Box component="svg" width="19" height="19" viewBox="0 0 24 24" fill="none" sx={{ flexShrink: 0 }}>
      <path d="M3 16V12L5 8H16L19 12H21V16" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
      <path d="M3 16H21" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <circle cx="7.5" cy="16.5" r="1.6" fill="#fff" />
      <circle cx="16.5" cy="16.5" r="1.6" fill="#fff" />
    </Box>
  );
}

function RosterGlyph() {
  return (
    <Box component="svg" width="17" height="17" viewBox="0 0 24 24" fill="none" sx={{ flexShrink: 0 }}>
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="#fff" strokeWidth="2" />
      <path d="M3 9H21" stroke="#fff" strokeWidth="2" />
      <path d="M12 12V16H16" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </Box>
  );
}

function PillChevron({ side }: { side: "right" | "left" }) {
  return (
    <Box
      component="svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      sx={{
        position: "absolute",
        [side]: "14px",
        top: "50%",
        transform: "translateY(-50%)",
      }}
    >
      <path
        d={side === "right" ? "M9 5L15 12L9 19" : "M15 5L9 12L15 19"}
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Box>
  );
}

/** Gradient pill that downloads the current file for its category. */
function FilePill({
  label,
  gradient,
  chevronSide,
  glyph,
  glyphFirst,
  file,
  isLoading,
  onUnavailable,
}: {
  label: string;
  gradient: string;
  chevronSide: "right" | "left";
  glyph: React.ReactNode;
  glyphFirst: boolean;
  file: PublicWorkEnvironmentFile | undefined;
  isLoading: boolean;
  onUnavailable: () => void;
}) {
  const media = file?.media ?? null;
  const disabled = isLoading || !media;

  return (
    <ButtonBase
      onClick={() => (media ? openMediaUrl(media.url) : onUnavailable())}
      sx={{
        position: "relative",
        background: gradient,
        borderRadius: "26px",
        padding: { xs: "12px 34px", md: "12px 20px" },
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        width: "100%",
        opacity: disabled ? 0.55 : 1,
        transition: "opacity 120ms ease",
      }}
    >
      <PillChevron side={chevronSide} />
      <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {glyphFirst && glyph}
        <Box
          component="span"
          sx={{ fontSize: 13, fontWeight: 600, textAlign: "center" }}
        >
          {isLoading ? "טוען..." : media ? label : `${label} - אין קובץ`}
        </Box>
        {!glyphFirst && glyph}
      </Box>
    </ButtonBase>
  );
}

export default function WorkEnvironmentPage() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [files, setFiles] = useState<PublicWorkEnvironmentFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFormatsOpen, setIsFormatsOpen] = useState(false);

  const loadFiles = useCallback(async () => {
    setIsLoadingFiles(true);

    try {
      const { response, data } = await fetchWorkEnvironmentFiles();

      if (!response.ok) {
        setErrorMessage("טעינת הקבצים נכשלה");
        return;
      }

      setFiles((data as ListWorkEnvironmentFilesSuccessResponse).files);
    } catch {
      setErrorMessage("טעינת הקבצים נכשלה");
    } finally {
      setIsLoadingFiles(false);
    }
  }, []);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      void router.replace("/");
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing client-only session from localStorage on mount, matches this app's convention
    setUser(session.user);
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, matches this app's data-loading convention
    void loadFiles();
  }, [loadFiles]);

  const getFile = (key: WorkEnvironmentFileKey) =>
    files.find((file) => file.key === key);

  if (!user) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const trainingFiles = TRAINING_FILE_KEYS.map((key) => getFile(key));

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <AppLayout user={user}>
        <Box
          sx={{
            flex: 1,
            background: "oklch(0.955 0.004 260)",
            display: "flex",
            justifyContent: "center",
            px: { xs: "14px", md: "40px" },
            pt: { xs: "14px", md: "40px" },
            pb: {
              xs: `${APP_BOTTOM_BAR_HEIGHT + 24}px`,
              md: `${APP_BOTTOM_BAR_HEIGHT + 40}px`,
            },
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: { xs: 600, md: 1240 },
              display: "flex",
              flexDirection: "column",
              gap: { xs: "12px", md: "24px" },
            }}
          >
            <Box
              component="h1"
              sx={{
                display: { xs: "none", md: "block" },
                m: 0,
                fontSize: 28,
                fontWeight: 700,
                color: "oklch(0.22 0.01 260)",
                textAlign: "right",
              }}
            >
              ארגז הכלים
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "360px 1fr" },
                gap: { xs: "12px", md: "24px" },
                alignItems: "start",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: { xs: "12px", md: "16px" },
                  minWidth: 0,
                }}
              >
                <GoogleCalendarWidget />

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <FilePill
              label="שאטלים"
              gradient="linear-gradient(135deg, oklch(0.5 0.16 255), oklch(0.4 0.17 260))"
              chevronSide="right"
              glyph={<ShuttleGlyph />}
              glyphFirst
              file={getFile("shuttles")}
              isLoading={isLoadingFiles}
              onUnavailable={() => setErrorMessage("אין קובץ שאטלים זמין")}
            />
            <FilePill
              label="תורניות ושמירות"
              gradient="linear-gradient(135deg, oklch(0.5 0.09 190), oklch(0.4 0.1 170))"
              chevronSide="left"
              glyph={<RosterGlyph />}
              glyphFirst={false}
              file={getFile("guardRosters")}
              isLoading={isLoadingFiles}
              onUnavailable={() =>
                setErrorMessage("אין קובץ תורניות ושמירות זמין")
              }
                  />
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: { xs: "12px", md: "16px" },
                  minWidth: 0,
                }}
              >
          <Box>
            <ButtonBase
              onClick={() => setIsFormatsOpen((open) => !open)}
              sx={{
                position: "relative",
                borderRadius: { xs: "14px", md: "18px" },
                overflow: "hidden",
                height: { xs: 100, md: 160 },
                width: "100%",
                display: "block",
              }}
            >
              <Box
                component="img"
                src="/toolbox/formats-bg.png"
                alt=""
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background: {
                    xs: "linear-gradient(to top, rgba(0,0,0,0.55), transparent 60%)",
                    md: "linear-gradient(to top, rgba(0,0,0,0.5), transparent 60%)",
                  },
                  pointerEvents: "none",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  pointerEvents: "none",
                }}
              >
                <Box
                  component="span"
                  sx={{
                    fontSize: { xs: 26, md: 34 },
                    fontWeight: 600,
                    color: "#000",
                  }}
                >
                  פורמטים
                </Box>
                <ExpandMoreIcon
                  sx={{
                    color: "#000",
                    transition: "transform 150ms ease",
                    transform: isFormatsOpen ? "rotate(180deg)" : "none",
                  }}
                />
              </Box>
            </ButtonBase>

            <Collapse in={isFormatsOpen}>
              <Box
                sx={{
                  background: "#fff",
                  borderRadius: "14px",
                  mt: "10px",
                  px: "16px",
                  boxShadow: "0 1px 3px rgba(20,20,43,0.06)",
                }}
              >
                {trainingFiles.map((file, index) => {
                  const media = file?.media ?? null;
                  const title = file?.title?.trim() || "טרם הוגדרה כותרת";

                  return (
                    <Box
                      key={TRAINING_FILE_KEYS[index]}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                        py: "12px",
                        borderBottom:
                          index < trainingFiles.length - 1
                            ? "1px solid oklch(0.95 0.003 260)"
                            : "none",
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          fontSize: 13.5,
                          fontWeight: 500,
                          color: media
                            ? "oklch(0.25 0.01 260)"
                            : "oklch(0.6 0.01 260)",
                          minWidth: 0,
                        }}
                      >
                        {title}
                      </Box>
                      <ButtonBase
                        disabled={!media}
                        onClick={() => media && openMediaUrl(media.url)}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          flexShrink: 0,
                          borderRadius: "8px",
                          px: "8px",
                          py: "4px",
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: media
                            ? "oklch(0.5 0.15 255)"
                            : "oklch(0.65 0.01 260)",
                        }}
                      >
                        <DownloadIcon sx={{ fontSize: 16 }} />
                        {media ? "הורדה" : "אין קובץ"}
                      </ButtonBase>
                    </Box>
                  );
                })}
              </Box>
            </Collapse>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: { xs: "10px", md: "16px" },
            }}
          >
            {EXTERNAL_TILES.map((tile) => (
              <ButtonBase
                key={tile.href}
                component="a"
                href={tile.href}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  position: "relative",
                  borderRadius: { xs: "14px", md: "16px" },
                  overflow: "hidden",
                  height: { xs: 64, md: "auto" },
                  aspectRatio: { xs: "auto", md: "2 / 1" },
                  display: "block",
                  width: "100%",
                }}
              >
                <Box
                  component="img"
                  src={tile.image}
                  alt=""
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background: {
                      xs: "rgba(0,0,0,0.45)",
                      md: "rgba(0,0,0,0.4)",
                    },
                  }}
                />
                <Box
                  component="span"
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: { xs: 18, md: 20 },
                    fontWeight: 600,
                    textAlign: "center",
                    px: "8px",
                  }}
                >
                  {tile.label}
                </Box>
              </ButtonBase>
            ))}
          </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </AppLayout>
      <Snackbar
        open={Boolean(errorMessage)}
        autoHideDuration={4000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="info" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
