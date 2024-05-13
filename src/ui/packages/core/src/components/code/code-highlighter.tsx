import React, { useEffect, useRef } from "react";
import { useMonaco } from "@monaco-editor/react";
import { JinjatListProps } from "@components/refine/utils";

export interface CodeHighlighterParams {
    value: string;
    language: string;
    onChange: Function;
}

const CodeHighlighter: React.FC<CodeHighlighterParams> = ({
    value,
    language,
    onChange,
}) => {
    const monaco = useMonaco();
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current) {
            monaco?.editor
                .colorizeElement(ref.current, language)
                .then(() => {
                    console.log("Colorization complete");
                })
                .catch((err: Error) => {
                    console.error("Colorization error:", err);
                });
        }
    }, [value, language]);

    return <pre ref={ref}>{value}</pre>;
};

export default CodeHighlighter;
