import { Link, Typography, type TypographyProps } from "@mui/material";
import { linkifyText } from "@/lib/linkifyText";

interface LinkifiedTextProps extends TypographyProps {
  text: string;
}

export default function LinkifiedText({ text, sx, ...typographyProps }: LinkifiedTextProps) {
  const segments = linkifyText(text);

  return (
    <Typography
      variant="body1"
      sx={{ whiteSpace: "pre-wrap", ...sx }}
      {...typographyProps}
    >
      {segments.map((segment, index) =>
        segment.type === "text" ? (
          <span key={index}>{segment.value}</span>
        ) : (
          <Link
            key={index}
            href={segment.href}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ wordBreak: "break-all" }}
          >
            {segment.value}
          </Link>
        ),
      )}
    </Typography>
  );
}
