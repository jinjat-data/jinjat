import React from "react";
import {Grid, Button} from "@mui/material";
import {FileExplorer} from "@components/pages/playground/file-explorer";
import {EditorTabs} from "@components/pages/playground/editor-tabs";
import {EditorCode} from "@components/pages/playground/editor-code";
import { LoadingButton } from "@mui/lab";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

export default function PlaygroundPage() {
    const [allFiles, setAllFiles] = React.useState(['Applications/Calendar/events.txt', 'Documents/OSS/readme.md', 'Documents/MUI/index.js']);
    const [openFiles, setOpenFiles] = React.useState(allFiles.filter((_, i) => i < 2));
    const [activeFile, setActiveFile] = React.useState<string | null>(openFiles[0] || null);

    const handleTabClose = (tab: string) => {
        setOpenFiles(openFiles.filter((file) => file !== tab));
        if (activeFile === tab) {
            setActiveFile(openFiles[0] || null);
        }
      };
      
    return (
      <Grid container sx={{display: 'flex'}}>
        <Grid item xs={3}>
          <FileExplorer filePaths={['Applications/Calendar/events.txt', 'Documents/OSS/readme.md', 'Documents/MUI/index.js']} 
          onFileSelect={function (filePath: string): void {
              throw new Error("Function not implemented.");
          } } />
        </Grid>
        <Grid item xs={7} sx={{flexGrow: 1}}>
          <EditorTabs openFiles={openFiles} activeFile={""} handleTabChange={function (tab: string): void {
              throw new Error("Function not implemented.");
          } } handleTabClose={handleTabClose} 
          handleDoubleClick={function (tab: string): void {
              throw new Error("Function not implemented.");
          } }/>
          <Grid item style={{"maxHeight": '300px'}}>
            <EditorCode/>
          </Grid>
          <Grid item xs={12} sx={{display: 'flex'}}>
            <Grid item xs={12} sx={{flexGrow: 1}}>
              <LoadingButton
                  loading={false}
                  loadingPosition="start"
                  startIcon={<PlayArrowIcon />}
                  variant="outlined"
              >
                  Save
              </LoadingButton>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={2}>
        <EditorCode/>
        </Grid>
      </Grid>
    );
}