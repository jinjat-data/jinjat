import React, { useState, useMemo } from "react";
import * as runtime from "react/jsx-runtime";
import { evaluate } from "@mdx-js/mdx";
import { useMDXComponents, MDXProvider } from "@mdx-js/react";
import remarkGfm from "remark-gfm";

export function useMDX(code) {
    const [state, setState] = useState({ code, result: null, error: null });





    return [state, setConfig];
}

//Pipe in scopes
export const MDX = ({ state, setConfig, components = null }) => {

    return (
        <div>
            <MDXProvider components={components}>
                {" "}
                {state.result && state.result({ components })}
            </MDXProvider>

            {state.error && (
                <>
                    <h2>Error!</h2>
                    {JSON.stringify(state.error)}
                </>
            )}
        </div>
    );
};

export default MDX;
