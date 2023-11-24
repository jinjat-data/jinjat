import Editor, {EditorProps, Monaco} from "@monaco-editor/react";
import {useRef} from "react";
import * as React from "react";


export const EditorCode: React.FC<EditorProps & {}> = (props) => {
    const editorRef = useRef(null);

    function handleEditorDidMount(editor: any, monaco: Monaco) {
        editorRef.current = editor;
    }

    return (
        <Editor
            height="300px"
            onMount={handleEditorDidMount}
            options={{
                minimap: {
                    enabled: false
                }, ...(props.options || {})
            }}
            {...props}
        />
    );
}