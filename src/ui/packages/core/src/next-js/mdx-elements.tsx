import NextHead from "next/head";
import NextScript from "next/script";

export const Head = {
    render: NextHead,
    description: "Renders a Next.js head tag",
    attributes: {},
};

export const Script = {
    render: NextScript,
    description: "Renders a Next.js script tag",
    attributes: {
        src: {
            type: "string",
            required: true,
        },
        strategy: {
            type: String,
            enum: ["beforeInteractive", "afterInteractive", "lazyOnload"],
        },
    },
};
