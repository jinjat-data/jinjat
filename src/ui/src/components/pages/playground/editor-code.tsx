import Editor, {EditorProps, Monaco} from "@monaco-editor/react";
import {useRef} from "react";
import * as React from "react";
import {Box} from "@mui/material";
import {ControlProps} from "@jsonforms/core";
import {WithOptionLabel} from "@jsonforms/material-renderers/src/mui-controls/MuiAutocomplete";


export const EditorCode: React.FC<EditorProps & {}> = (props) => {
    const editorRef = useRef(null);

    function handleEditorDidMount(editor: any, monaco: Monaco) {
        editorRef.current = editor;
    }

    return (
        <Editor
            height="300px"
            onMount={handleEditorDidMount}
            {...props}
        />
    );
}