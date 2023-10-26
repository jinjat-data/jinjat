import React, {useEffect, useState} from "react";
import {
    useGo,
    useResource,
    useRouterType,
    useNavigation,
    useTranslate,
} from "@refinedev/core";
import Info from "@mui/icons-material/Info";
import Grid from "@mui/material/Grid";
import Tooltip from "@mui/material/Tooltip";
import ArrowLeftIcon from '@heroicons/react/24/solid/ArrowLeftIcon';
import {Box, Button, Container, SvgIcon, Typography} from '@mui/material';

export const ErrorComponent: React.FC = () => {
    const [errorMessage, setErrorMessage] = useState<string>();
    const {push} = useNavigation();
    const go = useGo();
    const routerType = useRouterType();

    const {resource, action} = useResource();

    const translate = useTranslate();

    useEffect(() => {
        if (resource && action) {
            setErrorMessage(
                translate(
                    "pages.error.info",
                    {
                        action,
                        resource: resource?.name,
                    },
                    `You may have forgotten to add the "${action}" component to "${resource?.name}" resource.`
                )
            );
        }
    }, [action, resource]);

    return (
        <Grid display="flex" justifyContent="center" alignItems="center" mt={20}>
            <Grid container direction="column" display="flex" alignItems="center">
                <Container maxWidth="md">
                    <Box
                        sx={{
                            alignItems: 'center',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <Box
                            sx={{
                                mb: 3,
                                textAlign: 'center'
                            }}
                        >
                            <img
                                alt="Under development"
                                src="/assets/errors/error-404.png"
                                style={{
                                    display: 'inline-block',
                                    maxWidth: '100%',
                                    width: 400
                                }}
                            />
                        </Box>
                        <Typography
                            align="center"
                            sx={{mb: 3}}
                            variant="h5"
                        >
                            404: {translate(
                                "pages.error.404",
                                "Sorry, the page you visited does not exist."
                            )}
                        </Typography>
                        <Typography
                            align="center"
                            color="text.secondary"
                            variant="body1"
                        >
                            {errorMessage && (
                                <Tooltip title={errorMessage}>
                                    <Info data-testid="error-component-tooltip"/>
                                </Tooltip>
                            )}
                        </Typography>

                    </Box>
                </Container>

                <Button
                    onClick={() => {
                        if (routerType === "legacy") {
                            push("/");
                        } else {
                            go({to: "/"});
                        }
                    }}
                    href="/"
                    startIcon={(
                        <SvgIcon fontSize="small">
                            <ArrowLeftIcon/>
                        </SvgIcon>
                    )}
                    sx={{mt: 3}}
                    variant="contained"
                >
                    {translate("pages.error.backHome", "Back Home")}
                </Button>
            </Grid>
        </Grid>
    );
};
