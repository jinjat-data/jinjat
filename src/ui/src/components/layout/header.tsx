import React, {useCallback, useRef, useState} from "react";
import {
  useGetIdentity,
  useActiveAuthProvider, useIsExistAuthentication, useWarnAboutChange, useLogout,
} from "@refinedev/core";
import { HamburgerMenu } from "./hamburgerMenu";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import type { RefineThemedLayoutV2HeaderProps } from "@refinedev/mui";
import {
  Badge,
  Box,
  Divider,
  IconButton, MenuItem,
  MenuList,
  Popover,
  SvgIcon,
  Tooltip,
  Typography,
} from "@mui/material";
import MagnifyingGlassIcon from "@heroicons/react/24/solid/MagnifyingGlassIcon";
import {alpha} from "@mui/material/styles";
import UsersIcon from "@heroicons/react/24/solid/UsersIcon";
import BellIcon from "@heroicons/react/24/solid/BellIcon";
import {useKBar} from "kbar";
import {useRouter} from "next/navigation";

const AccountPopover = (props) => {
  const {anchorEl, onClose, open} = props;
  const router = useRouter();
  const authProvider = useActiveAuthProvider();
  const isExistAuthentication = useIsExistAuthentication();
  const {warnWhen, setWarnWhen} = useWarnAboutChange();
  const {mutate: mutateLogout} = useLogout();

  const handleSignOut = useCallback(
      () => {
        if (warnWhen) {
          // const confirm = window.confirm(
          //     t(
          //         "warnWhenUnsavedChanges",
          //         "Are you sure you want to leave? You have unsaved changes."
          //     )
          // );
          const confirm = true;

          if (confirm) {
            setWarnWhen(false);
            mutateLogout();
          }
        } else {
          mutateLogout();
        }

        onClose?.();
      },
      [onClose, router]
  );

  return (
      <Popover
          anchorEl={anchorEl}
          anchorOrigin={{
            horizontal: 'left',
            vertical: 'bottom'
          }}
          onClose={onClose}
          open={open}
          PaperProps={{sx: {width: 200}}}
      >
        <Box
            sx={{
              py: 1.5,
              px: 2
            }}
        >
          <Typography variant="overline">
            Account
          </Typography>
          <Typography
              color="text.secondary"
              variant="body2"
          >
            username
          </Typography>
        </Box>
        <Divider/>
        <MenuList
            disablePadding
            dense
            sx={{
              p: '8px',
              '& > *': {
                borderRadius: 1
              }
            }}
        >
          <MenuItem onClick={handleSignOut}>
            Sign out
          </MenuItem>
        </MenuList>
      </Popover>
  );
};

export function usePopover() {
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleToggle = useCallback(() => {
    setOpen((prevState) => !prevState);
  }, []);

  return {
    anchorRef,
    handleClose,
    handleOpen,
    handleToggle,
    open
  };
}

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
