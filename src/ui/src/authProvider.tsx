import {AuthBindings} from "@refinedev/core";
import nookies from "nookies";
import {NextRouter, useRouter} from "next/router";
import {useQuery} from "@tanstack/react-query";
import React from "react";

const mockUsers = [
    {
        name: "John Doe",
        email: "johndoe@mail.com",
        roles: ["admin"],
    },
    {
        name: "Jane Doe",
        email: "janedoe@mail.com",
        roles: ["editor"],
    },
];

export const authProvider: AuthBindings = {
    login: async ({email, username, password, remember}) => {
        // Suppose we actually send a request to the back end here.
        const user = mockUsers[0];

        if (user) {
            nookies.set(null, "auth", JSON.stringify(user), {
                maxAge: 30 * 24 * 60 * 60,
                path: "/",
            });
            return {
                success: true,
                redirectTo: "/",
            };
        }

        return {
            success: false,
            error: {
                name: "LoginError",
                message: "Invalid username or password",
            },
        };
    },
    logout: async () => {
        let destroy = nookies.destroy(null, "auth", {
            path: '/'
        });
        return {
            success: true,
            redirectTo: "/login",
        };
    },
    check: async (ctx: any) => {
        const cookies = nookies.get(ctx);
        if (cookies["auth"]) {
            return {
                authenticated: true,
            };
        }

        return {
            authenticated: false,
            logout: true,
            redirectTo: "/login",
        };
    },
    getPermissions: async () => {
        const auth = nookies.get()["auth"];
        if (auth) {
            const parsedUser = JSON.parse(auth);
            return parsedUser.roles;
        }
        return null;
    },
    getIdentity: async () => {
        const auth = nookies.get()["auth"];
        if (auth) {
            const parsedUser = JSON.parse(auth);
            return parsedUser;
        }
        return null;
    },
    onError: async (error) => {
        console.error(error);
        return {error};
    },
};
export function nonAuthCheck(): JSX.Element | undefined {
    const { push } = useRouter();
    const { isLoading, error, data } = useQuery({
        queryKey: ['auth'],
        queryFn: authProvider.check,
    })

    if (isLoading) {
        return <div>Loading..</div>
    }

    if (error) {
        return <div>{JSON.stringify(error)}</div>
    }

    if (data?.authenticated) {
        push('/');
        return <div />
    }
}

export function authCheck(): JSX.Element | undefined {
    const router = useRouter()

    const {isLoading, error, data} = useQuery({
        queryKey: ['auth'],
        queryFn: authProvider.check,
    })

    if (isLoading) {
        return <div>Loading..</div>
    }

    if (error) {
        return <div>{JSON.stringify(error)}</div>
    }

    if (data?.authenticated == false) {
        // router.push(`${data.redirectTo}?to=${encodeURIComponent("/")}`);
        // return <div />
    }
}
