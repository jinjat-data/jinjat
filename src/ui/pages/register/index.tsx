import { AuthPage } from "@refinedev/mui";

import {nonAuthCheck} from "src/authProvider";

export default function Register() {
  let nonAuth = nonAuthCheck();
  if (nonAuth) {
    return nonAuth
  }

  return <AuthPage type="register" />;
}

Register.noLayout = true;