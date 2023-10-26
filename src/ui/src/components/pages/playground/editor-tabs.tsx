import React from "react";
import {Box, Tab, Tabs, Tooltip} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';

interface EditorTabsProps {
  openFiles: string[];
  activeFile: string;
  handleTabChange: (tab: string) => void;
  handleTabClose: (tab: string) => void;
  handleDoubleClick: (tab: string) => void;
}

export const EditorTabs: React.FC<EditorTabsProps> = ({ openFiles, activeFile, handleTabChange, handleTabClose, handleDoubleClick }) => {
  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    handleTabChange(newValue);
  };

  const handleClose = (event: React.MouseEvent, tab: string) => {
    event.stopPropagation();
    handleTabClose(tab);
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs value={activeFile} onChange={handleChange} aria-label="editor tabs">
        {openFiles.map((tab) => (
          <Tooltip key={tab} title={tab} placement="top" sx={{ paddingTop: '-4px' }}>
            <Tab
              key={tab}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ flexGrow: 1 }}>{tab.split('/').pop()}</Box>
                  <CloseIcon sx={{ marginLeft: '5px', opacity: 0.5, fontSize: 'small' }} onClick={(event) => handleClose(event, tab)} />
                </Box>
              }
              value={tab}
              onDoubleClick={() => handleDoubleClick(tab)}
            />
          </Tooltip>
        ))}
      </Tabs>
    </Box>
  );
};