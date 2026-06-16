import type { ReactElement } from "react";
import { useRouter } from "next/router";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import HomeIcon from "@mui/icons-material/Home";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import { isAdminUser } from "@/lib/admin";
import type { PublicUser } from "@/types/user";

export const APP_BOTTOM_BAR_HEIGHT = 56;

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
  const showMyTasks = user.role !== "peasant";
  const showAdmin = isAdminUser(user.id);

  const navItems: NavItem[] = [
    {
      label: "בית",
      href: "/home",
      icon: <HomeIcon />,
      match: (pathname) => pathname === "/home" || pathname.startsWith("/tasks/"),
    },
    {
      label: "לוח שנה",
      href: "/calendar",
      icon: <CalendarMonthIcon />,
      match: (pathname) => pathname === "/calendar",
    },
    ...(showMyTasks
      ? [
          {
            label: "מטלות שיצרתי",
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
            label: "ניהול",
            href: "/admin",
            icon: <AdminPanelSettingsIcon />,
            match: (pathname: string) => pathname === "/admin",
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
