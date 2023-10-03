import React, {useContext} from "react";
import { useGetIdentity, useActiveAuthProvider } from "@refinedev/core";
import {DarkModeOutlined, LightModeOutlined, Menu} from "@mui/icons-material";
import {
  AppBar,
  Stack,
  Toolbar,
  Typography,
  IconButton,
} from "@mui/material";
import type { RefineThemedLayoutHeaderProps } from "@refinedev/mui";
import {ColorModeContext} from "@contexts";

export const ThemedHeader: React.FC<RefineThemedLayoutHeaderProps> = ({
  isSiderOpen,
  onToggleSiderClick,
  toggleSiderIcon: toggleSiderIconFromProps,
}) => {
  const authProvider = useActiveAuthProvider();
  const { data: user } = useGetIdentity({
    v3LegacyAuthProviderCompatible: Boolean(authProvider?.isLegacy),
  });
  const { mode, setMode } = useContext(ColorModeContext);

  const hasSidebarToggle = Boolean(onToggleSiderClick);

  return (
    <AppBar position="sticky">
      <Toolbar>
        {hasSidebarToggle && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={() => onToggleSiderClick?.()}
            edge="start"
            sx={{
              mr: 2,
              display: { xs: "none", md: "flex" },
              ...(isSiderOpen && { display: "none" }),
            }}
          >
            {toggleSiderIconFromProps?.(Boolean(isSiderOpen)) ?? <Menu />}
          </IconButton>
        )}
        <Stack
          direction="row"
          width="100%"
          justifyContent="flex-end"
          alignItems="center"
        >
          <IconButton
              color="inherit"
              onClick={() => {
                setMode();
              }}
          >
            {mode === "dark" ? <LightModeOutlined /> : <DarkModeOutlined />}
          </IconButton>
          <Stack
            direction="row"
            gap="16px"
            alignItems="center"
            justifyContent="center"
          >
            <Typography
              sx={{
                display: { xs: "none", md: "block" },
              }}
              variant="subtitle2"
            >
              {user?.name}
            </Typography>
          </Stack>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};
