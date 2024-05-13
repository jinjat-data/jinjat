import { useRouter } from "next/router";
import { ExposurePage } from "@components/pages/exposure";
import React from "react";

export function NextRoutes({ ...props }) {
    const router = useRouter();

    if (router.asPath.startsWith("/exposure")) {
        return <ExposurePage {...props} />;
    }
    if (router.asPath.startsWith("/exposure")) {
        return <ExposurePage {...props} />;
    }
    return <ExposurePage {...props} />;
}
