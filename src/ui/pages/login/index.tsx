import {AuthPage} from "@refinedev/mui";

import {nonAuthCheck} from "src/authProvider";

export default function Login() {
    let nonAuth = nonAuthCheck();
    if (nonAuth) {
        return nonAuth
    }

    return (
        <AuthPage
            type="login"
            formProps={{
                defaultValues: {email: "demo@refine.dev", password: "demodemo"},
            }}
        />
    );
}

Login.noLayout = true;