import {AuthPage} from "@refinedev/mui";

import {nonAuthCheck} from "src/authProvider";

export default function ForgotPassword() {
    let nonAuth = nonAuthCheck();
    if (nonAuth) {
        return nonAuth
    }

    return <AuthPage type="forgotPassword"/>;
}

ForgotPassword.noLayout = true;