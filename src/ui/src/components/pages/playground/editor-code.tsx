import Editor, { Monaco } from "@monaco-editor/react";
import {useRef} from "react";
import * as React from "react";
import {Box} from "@mui/material";


export const EditorCode: React.FC = () => {
    const editorRef = useRef(null);

    function handleEditorDidMount(editor: any, monaco: Monaco) {
        // here is the editor instance
        // you can store it in `useRef` for further usage
        console.log("hhh", editor, monaco);
        editorRef.current = editor;
    }

    return (
        <Box style={{border:'1px solid #ddd'}}>
            <Editor
                height="300px"
                defaultLanguage="sql"
                defaultValue="// select 1"
                onMount={handleEditorDidMount}
            />
        </Box>
    );
}