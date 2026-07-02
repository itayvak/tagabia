import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import MovieIcon from "@mui/icons-material/Movie";
import {
  Box,
  Card,
  CardActionArea,
  CardMedia,
  Typography,
} from "@mui/material";
import type { TaskMedia } from "@/types/task";

interface TaskMediaAttachmentsProps {
  media: TaskMedia[];
}

function openMediaUrl(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function isImageMedia(media: TaskMedia): boolean {
  return media.contentType.startsWith("image/");
}

function isVideoMedia(media: TaskMedia): boolean {
  return media.contentType.startsWith("video/");
}

function MediaTile({ media }: { media: TaskMedia }) {
  if (isImageMedia(media)) {
    return (
      <Card sx={{ height: "100%" }}>
        <CardActionArea onClick={() => openMediaUrl(media.url)}>
          <CardMedia
            component="img"
            image={media.url}
            alt={media.name}
            sx={{
              height: 160,
              objectFit: "cover",
            }}
          />
          <Box sx={{ px: 1.5, py: 1 }}>
            <Typography variant="body2" noWrap>
              {media.name}
            </Typography>
          </Box>
        </CardActionArea>
      </Card>
    );
  }

  const Icon = isVideoMedia(media) ? MovieIcon : InsertDriveFileIcon;

  return (
    <Card sx={{ height: "100%" }}>
      <CardActionArea
        onClick={() => openMediaUrl(media.url)}
        sx={{
          height: "100%",
          minHeight: 120,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          p: 2,
        }}
      >
        <Icon sx={{ fontSize: 40, color: "text.secondary" }} />
        <Typography variant="body2" align="center">
          {media.name}
        </Typography>
      </CardActionArea>
    </Card>
  );
}

export default function TaskMediaAttachments({
  media,
}: TaskMediaAttachmentsProps) {
  if (media.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        קבצים מצורפים
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
          },
          gap: 2,
        }}
      >
        {media.map((mediaItem) => (
          <MediaTile key={mediaItem.id} media={mediaItem} />
        ))}
      </Box>
    </Box>
  );
}
