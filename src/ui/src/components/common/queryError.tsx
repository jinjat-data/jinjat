import React from "react";
import {Alert, AlertTitle, Box, Card, Typography} from "@mui/material";
import {EditorCode} from "@components/code/editor-code";


export type JinjatError = {
    error?: JinjatErrorItem
    message: string
    code: string}

export type JinjatErrorItem = {
    compiled_sql? : string,
    sql? : string,
}

export const QueryErrorComponent: React.FC<{message: string, errors: JinjatError[]}> = ({message, errors}) => {
    console.error(errors)

    return <Box>
        {errors.map(error => (
            <Alert severity="error">
                <AlertTitle>{message}: <br /> Code {error.code}: {error.message}</AlertTitle>
                {error.error.compiled_sql != null ? (
                    <Card>
                        <Typography variant={"subtitle2"}>Compiled SQL:</Typography>
                        <EditorCode value={error.error.compiled_sql} language={"sql"} />
                    </Card>) : <div/>}
                {error.error.sql != null ? (
                    <Card>
                        <Typography variant={"subtitle2"}>SQL:</Typography>
                        <EditorCode value={error.error.sql} language={"sql"} />
                    </Card>) : <div/>}

            </Alert>
        ))}
    </Box>
}