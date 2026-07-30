import type { ReactElement } from "react";
import { useRouter } from "next/router";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ChecklistIcon from "@mui/icons-material/Checklist";
import HomeIcon from "@mui/icons-material/Home";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import { canAccessAdmin } from "@/lib/admin";
import { canManageTasks } from "@/lib/roles";
import type { PublicUser } from "@/types/user";

export const APP_BOTTOM_BAR_HEIGHT = 56;

/** Space reserved above the bottom bar, including the iOS home indicator. */
export function appBottomOffset(extra = 0): string {
  return `calc(${APP_BOTTOM_BAR_HEIGHT + extra}px + env(safe-area-inset-bottom, 0px))`;
}

/** Viewport height minus the bottom bar and iOS safe area. */
export function appBottomViewportOffset(extra = 0): string {
  return `calc(100dvh - ${APP_BOTTOM_BAR_HEIGHT + extra}px - env(safe-area-inset-bottom, 0px))`;
}

interface AppBottomBarProps {
  user: PublicUser;
}

type NavItem = {
  label: string;
  href: string;
  icon: ReactElement;
  match: (pathname: string) => boolean;
};

export default function AppBottomBar({ user }: AppBottomBarProps) {
  const router = useRouter();
  const showMyTasks = canManageTasks(user.role);
  const showAdmin = canAccessAdmin(user);

  const navItems: NavItem[] = [
    {
      label: "תג\"בייה",
      href: "/allTasks",
      icon: <HomeIcon />,
      match: (pathname) =>
        pathname === "/allTasks" || pathname.startsWith("/tasks/"),
    },
    {
      label: "לוח שנה",
      href: "/calendar",
      icon: <CalendarMonthIcon />,
      match: (pathname) => pathname === "/calendar",
    },
    {
      label: "רשימה אישית",
      href: "/todo",
      icon: <ChecklistIcon />,
      match: (pathname) => pathname === "/todo",
    },
    ...(showMyTasks
      ? [
          {
            label: "ניהול מטלות",
            href: "/mytasks",
            icon: <AssignmentIcon />,
            match: (pathname: string) =>
              pathname === "/mytasks" || pathname.startsWith("/mytasks/"),
          },
        ]
      : []),
    ...(showAdmin
      ? [
          {
            label: "מפתחים",
            href: "/admin",
            icon: <AdminPanelSettingsIcon />,
            match: (pathname: string) =>
              pathname === "/admin" || pathname.startsWith("/admin/"),
          },
        ]
      : []),
  ];

  const activeIndex = navItems.findIndex((item) => item.match(router.pathname));

  return (
    <Paper
      elevation={3}
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        pb: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <BottomNavigation
        showLabels
        value={activeIndex === -1 ? false : activeIndex}
        onChange={(_, newValue) => {
          const item = navItems[newValue];
          if (item && router.pathname !== item.href) {
            void router.push(item.href);
          }
        }}
      >
        {navItems.map((item) => (
          <BottomNavigationAction
            key={item.href}
            label={item.label}
            icon={item.icon}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
