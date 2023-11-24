import { useForm } from "@refinedev/react-hook-form";
import * as React from "react";
import { FormProvider } from "react-hook-form";
import {
  LoginPageProps,
  LoginFormTypes,
  useActiveAuthProvider,
  BaseRecord,
  HttpError,
  useLogin,
  useTranslate,
  useRouterContext,
  useRouterType,
  useLink,
} from "@refinedev/core";
import { FormPropsType } from "../index";
import { layoutStyles, titleStyles } from "./styles";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import MuiLink from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { BoxProps } from "@mui/material/Box";
import type { CardContentProps } from "@mui/material/CardContent";
import {Tab, Tabs} from "@mui/material";

type LoginProps = LoginPageProps<BoxProps, CardContentProps, FormPropsType>;

/**
 * login will be used as the default type of the <AuthPage> component. The login page will be used to log in to the system.
 * @see {@link https://refine.dev/docs/api-reference/mui/components/mui-auth-page/#login} for more details.
 */
export const LoginPage: React.FC<LoginProps> = ({
  providers,
  registerLink,
  forgotPasswordLink,
  rememberMe,
  contentProps,
  wrapperProps,
  renderContent,
  formProps,
  title,
}) => {
  const { onSubmit, ...useFormProps } = formProps || {};
  const methods = useForm<BaseRecord, HttpError, LoginFormTypes>({
    ...useFormProps,
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = methods;
  const authProvider = useActiveAuthProvider();
  const { mutate: login, isLoading } = useLogin<LoginFormTypes>({
    v3LegacyAuthProviderCompatible: Boolean(authProvider?.isLegacy),
  });
  const translate = useTranslate();
  const routerType = useRouterType();
  const Link = useLink();
  const { Link: LegacyLink } = useRouterContext();

  const ActiveLink = routerType === "legacy" ? LegacyLink : Link;

  const PageTitle =
    title === false ? null : (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "32px",
          fontSize: "20px",
        }}
      >
      </div>
    );

  const renderProviders = () => {
    if (providers && providers.length > 0) {
      return (
        <>
          <Stack spacing={1}>
            {providers.map((provider: any) => {
              return (
                <Button
                  key={provider.name}
                  variant="outlined"
                  fullWidth
                  sx={{
                    color: "primary.light",
                    borderColor: "primary.light",
                    textTransform: "none",
                  }}
                  onClick={() => login({ providerName: provider.name })}
                  startIcon={provider.icon}
                >
                  {provider.label}
                </Button>
              );
            })}
          </Stack>
          <Divider
            sx={{
              fontSize: "12px",
              marginY: "16px",
            }}
          >
            {translate("pages.login.divider", "or")}
          </Divider>
        </>
      );
    }
    return null;
  };

  console.log(forgotPasswordLink)
  const Content = (
        <Box
          component="form"
          onSubmit={handleSubmit((data) => {
            if (onSubmit) {
              return onSubmit(data);
            }

            return login(data);
          })}
        >
          {renderProviders()}
          <TextField
            {...register("email", {
              required: true,
            })}
            id="email"
            margin="normal"
            fullWidth
            label={translate("pages.login.fields.email", "Email")}
            error={!!errors.email}
            name="email"
            type="email"
            autoComplete="email"
            sx={{
              mt: 0,
            }}
          />
          <TextField
            {...register("password", {
              required: true,
            })}
            id="password"
            margin="normal"
            fullWidth
            name="password"
            label={translate("pages.login.fields.password", "Password")}
            helperText={errors?.password?.message}
            error={!!errors.password}
            type="password"
            placeholder="●●●●●●●●"
            autoComplete="current-password"
            sx={{
              mb: 0,
            }}
          />

          <Box
            component="div"
            sx={{
              mt: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {rememberMe ?? (
              <FormControlLabel
                sx={{
                  span: {
                    fontSize: "14px",
                    color: "text.secondary",
                  },
                }}
                color="secondary"
                control={
                  <Checkbox
                    size="small"
                    id="remember"
                    {...register("remember")}
                  />
                }
                label={translate(
                  "pages.login.buttons.rememberMe",
                  "Remember me"
                )}
              />
            )}
            {forgotPasswordLink ? (<MuiLink
                variant="body2"
                color="primary"
                fontSize="12px"
                component={ActiveLink}
                underline="none"
                to="/forgot-password"
              >
                {translate(
                  "pages.login.buttons.forgotPassword",
                  "Forgot password?"
                )}
              </MuiLink>) : <div/>}
          </Box>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isLoading}
            sx={{ mt: "24px" }}
          >
            {translate("pages.login.signin", "Sign in")}
          </Button>
          {registerLink ? (
            <Box
              sx={{
                mt: "24px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Typography
                textAlign="center"
                variant="body2"
                component="span"
                fontSize="12px"
              >
                {translate(
                  "pages.login.buttons.noAccount",
                  "Don’t have an account?"
                )}
              </Typography>
              <MuiLink
                ml="4px"
                fontSize="12px"
                variant="body2"
                color="primary"
                component={ActiveLink}
                underline="none"
                to="/register"
                fontWeight="bold"
              >
                {translate("pages.login.signup", "Sign up")}
              </MuiLink>
            </Box>
          ) : null}
        </Box>
  );

  return (
    <FormProvider {...methods}>
      <Box sx={{
          backgroundColor: 'background.paper',
          flex: '1 1 auto',
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'center'
      }}>
        <Box
            sx={{
                maxWidth: 550,
                px: 3,
                py: '100px',
                width: '100%'
            }}
        >
            <div>
                <Stack
                    spacing={1}
                    sx={{ mb: 3 }}
                >
                    <Typography variant="h4">
                        Login
                    </Typography>
                </Stack>
                <Tabs
                    sx={{ mb: 3 }}
                    value={'email'}
                >
                    <Tab
                        label="Email"
                        value="email"
                    />
                    <Tab
                        label="Phone Number"
                        value="phoneNumber"
                    />
                </Tabs>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              flexDirection: "column",
              alignItems: "left",
            }}
          >
            {renderContent ? (
              renderContent(Content, PageTitle)
            ) : (
              <>
                {PageTitle}
                {Content}
              </>
            )}
          </Box>
            </div>
        </Box>
      </Box>
    </FormProvider>
  );
};
