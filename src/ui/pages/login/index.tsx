import {nonAuthCheck} from "src/authProvider";
import {AuthPage} from "@components/pages/auth";
import {AuthLayout} from "@components/pages/auth/layout";

export default function Login() {
    let nonAuth = nonAuthCheck();
    if (nonAuth) {
        return nonAuth
    }

    return (
        <AuthLayout>
            <AuthPage
                type="login"
                formProps={{
                    defaultValues: {email: "demo@refine.dev", password: "demodemo"},
                }}
            />
        </AuthLayout>
    );
}

Login.noLayout = true;