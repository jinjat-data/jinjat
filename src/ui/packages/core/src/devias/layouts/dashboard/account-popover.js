import {useCallback} from "react";
import {useRouter} from 'next/navigation';
import PropTypes from 'prop-types';
import {Box, Divider, MenuItem, MenuList, Popover, Typography} from '@mui/material';
import {useActiveAuthProvider, useIsExistAuthentication, useLogout, useWarnAboutChange} from "packages/nextjs";

export const AccountPopover = (props) => {
    const {anchorEl, onClose, open} = props;
    const router = useRouter();
    const authProvider = useActiveAuthProvider();
    const isExistAuthentication = useIsExistAuthentication();
    const {warnWhen, setWarnWhen} = useWarnAboutChange();
    const {mutate: mutateLogout} = useLogout();

    const handleSignOut = useCallback(
        () => {
            if (warnWhen) {
                const confirm = window.confirm(
                    t(
                        "warnWhenUnsavedChanges",
                        "Are you sure you want to leave? You have unsaved changes."
                    )
                );

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
