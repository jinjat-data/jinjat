import React, { useEffect, useRef } from 'react';
import { useMonaco } from "@monaco-editor/react";

const CodeHighlighter = ({ value , language, onChange }) => {
    const monaco = useMonaco();
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current) {
            monaco?.editor.colorizeElement(ref.current, language).then(() => {
                console.log('Colorization complete');
            }).catch(err => {
                console.error('Colorization error:', err);
            });
        }
    }, [value, language]);

    return <pre ref={ref}>{value}</pre>;
};

export default CodeHighlighter;