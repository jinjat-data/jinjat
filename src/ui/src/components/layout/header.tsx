import React from "react";
import {
  useGetIdentity,
  useActiveAuthProvider,
} from "@refinedev/core";
import { HamburgerMenu } from "./hamburgerMenu";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import type { RefineThemedLayoutV2HeaderProps } from "@refinedev/mui";
import {Badge, IconButton, SvgIcon, Tooltip, useMediaQuery} from "@mui/material";
import MagnifyingGlassIcon from "@heroicons/react/24/solid/MagnifyingGlassIcon";
import {alpha} from "@mui/material/styles";
import UsersIcon from "@heroicons/react/24/solid/UsersIcon";
import BellIcon from "@heroicons/react/24/solid/BellIcon";
import {useKBar} from "kbar";
import {AccountPopover} from "../../devias/layouts/dashboard/account-popover";
import {usePopover} from "../../devias/hooks/use-popover";

export const ThemedHeaderV2: React.FC<RefineThemedLayoutV2HeaderProps> = ({
  sticky,
}) => {
  const authProvider = useActiveAuthProvider();
  const { data: user } = useGetIdentity({
    v3LegacyAuthProviderCompatible: Boolean(authProvider?.isLegacy),
  });
  const { query } = useKBar();
  const accountPopover = usePopover();

  return (
    <AppBar position={sticky ? "sticky" : "relative"} color={'inherit'}
            sx={{
      boxShadow: 'none',
      backdropFilter: 'blur(6px)',
      backgroundColor: (theme) => alpha(theme.palette.background.default, 0.8),
    }}>
      <Toolbar>
        <HamburgerMenu />
        <Stack
            alignItems="center"
            direction="row"
            spacing={2}
        >
          <Tooltip title="Search">
            <IconButton onClick={query.toggle}>
              <SvgIcon fontSize="small">
                <MagnifyingGlassIcon />
              </SvgIcon>
            </IconButton>
          </Tooltip>
        </Stack>

        <Stack
            direction="row"
            width="100%"
            justifyContent="flex-end"
            alignItems="center"
        >
            <IconButton>
              <SvgIcon fontSize="small" onClick={accountPopover.handleOpen}
                       ref={accountPopover.anchorRef}
                       sx={{
                         cursor: 'pointer'
                       }}>
                <UsersIcon />
              </SvgIcon>
            </IconButton>
          <Tooltip title="Notifications">
            <IconButton>
              <Badge
                  badgeContent={4}
                  color="success"
                  variant="dot"
              >
                <SvgIcon fontSize="small">
                  <BellIcon />
                </SvgIcon>
              </Badge>
            </IconButton>
          </Tooltip>
          {user?.avatar && <Avatar src={user?.avatar} alt={user?.name} />}
        </Stack>
        <AccountPopover
            anchorEl={accountPopover.anchorRef.current}
            open={accountPopover.open}
            onClose={accountPopover.handleClose}
        />
      </Toolbar>
    </AppBar>
  );
};
