import React, { useState, useEffect } from "react";
// import { TreeView } from '@mui/x-tree-view/TreeView';
// import { TreeItem } from '@mui/x-tree-view/TreeItem';
import Box from '@mui/material/Box';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Input from '@mui/material/Input';
import { InputAdornment } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import DeleteIcon from '@mui/icons-material/Delete';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import {TreeItem, TreeView} from "@mui/lab";

interface FileExplorerProps {
  filePaths: string[];
  onFileSelect: (filePath: string) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ filePaths, onFileSelect }) => {
  const [treeData, setTreeData] = useState<Record<string, any>>({});
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [isCreateFileDialogOpen, setIsCreateFileDialogOpen] = useState<boolean>(false);
  const [newFileName, setNewFileName] = useState<string>('');
  const [isDeleteFileDialogOpen, setIsDeleteFileDialogOpen] = useState<boolean>(false);
  const [fileToDelete, setFileToDelete] = useState<string>('');
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number, y: number } | null>(null);
  const [contextMenuNode, setContextMenuNode] = useState<string>('');
  const [isContextMenuOpen, setIsContextMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const tree: Record<string, any> = {};

    const filteredPaths = filePaths.filter(path => {
      const parts = path.split('/');
      return parts.some(part => part.toLowerCase().includes(filter.toLowerCase()));
    });

    filteredPaths.forEach(path => {
      const parts = path.split('/');
      let currentNode = tree;

      parts.forEach(part => {
        if (!currentNode[part]) {
          currentNode[part] = {};
        }
        currentNode = currentNode[part];
      });
    });

    setTreeData(tree);

    // Get the directory paths that need to be expanded
    const expandedDirectories = new Set<string>();
    filteredPaths.forEach(path => {
      const parts = path.split('/');
      for (let i = 1; i < parts.length; i++) {
        const directoryPath = parts.slice(0, i).join('/');
        expandedDirectories.add(directoryPath);
      }
    });

    setExpandedIds(Array.from(expandedDirectories));
  }, [filePaths, filter]);

  const renderTreeItems = (nodes: Record<string, any>, pathSoFar = ''): React.ReactNode => {
    return Object.entries(nodes).map(([key, value]) => {
      const nodeId = pathSoFar ? `${pathSoFar}/${key}` : key;
      if (Object.keys(value).length === 0) {
        return (
          <TreeItem
            key={nodeId}
            nodeId={nodeId}
            label={
              <Box display="flex" alignItems="center" onContextMenu={(event) => {
                event.preventDefault();
                setContextMenuPosition({ x: event.clientX, y: event.clientY });
                setContextMenuNode(nodeId);
                setIsContextMenuOpen(true);
              }}>
                <Box flexGrow={1}>{key}</Box>
                <DeleteIcon
                  style={{ fontSize: 16, opacity: 0.5 }}
                  onClick={() => {
                    setFileToDelete(nodeId);
                    setIsDeleteFileDialogOpen(true);
                  }}
                />
              </Box>
            }
            onClick={() => onFileSelect(nodeId)}
          />
        );
      }
      return (
        <TreeItem key={nodeId} nodeId={nodeId} label={
          <Box display="flex" alignItems="center" onContextMenu={(event) => {
            event.preventDefault();
            setContextMenuPosition({ x: event.clientX, y: event.clientY });
            setContextMenuNode(nodeId);
            setIsContextMenuOpen(true);
          }}>
            <Box flexGrow={1}>{key}</Box>
          </Box>
        }>
          {renderTreeItems(value, nodeId)}
        </TreeItem>
      );
    });
  };

  const handleToggle = (event: React.ChangeEvent<{}>, nodeIds: string[]) => {
    setExpandedIds(nodeIds);
  };

  const handleCreateFile = () => {
    setIsCreateFileDialogOpen(true);
  };

  const handleCreateFileDialogClose = () => {
    setIsCreateFileDialogOpen(false);
    setNewFileName('');
  };

  const handleNewFileNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewFileName(event.target.value);
  };

  const handleCreateFileSubmit = () => {
    // Create the new file
    const newFilePath = `${expandedIds[0]}/${newFileName}`;
    const newFilePaths = [...filePaths, newFilePath];
    // Update the file paths and close the dialog
    // setFilePaths(newFilePaths);
    setIsCreateFileDialogOpen(false);
    setNewFileName('');
  };

  const handleDeleteFileDialogClose = () => {
    setIsDeleteFileDialogOpen(false);
    setFileToDelete('');
  };

  const handleDeleteFileSubmit = () => {
    // Delete the file
    const newFilePaths = filePaths.filter(path => path !== fileToDelete);
    // Update the file paths and close the dialog
    // setFilePaths(newFilePaths);
    setIsDeleteFileDialogOpen(false);
    setFileToDelete('');
  };

  const handleContextMenuClose = () => {
    setIsContextMenuOpen(false);
    setContextMenuPosition(null);
    setContextMenuNode('');
  };

  const handleContextMenuDelete = () => {
    setFileToDelete(contextMenuNode);
    setIsContextMenuOpen(false);
    setContextMenuPosition(null);
    setContextMenuNode('');
    setIsDeleteFileDialogOpen(true);
  };

  const contextMenuItems = [
    { label: 'Delete', onClick: handleContextMenuDelete },
  ];

  return (
    <Box>
      <Input
        placeholder="Search"
        value={filter}
        fullWidth
        onChange={(e) => setFilter(e.target.value)}
        startAdornment={
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        }
      />
      <Button variant="text" size="small" onClick={handleCreateFile}>Create File</Button>
      <TreeView
        aria-label="file system navigator"
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ChevronRightIcon />}
        expanded={expandedIds}
        onNodeToggle={handleToggle}
      >
        {renderTreeItems(treeData)}
      </TreeView>
      <Dialog open={isCreateFileDialogOpen} onClose={handleCreateFileDialogClose}>
        <DialogTitle>Create File</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="File Name"
            value={newFileName}
            onChange={handleNewFileNameChange}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateFileDialogClose}>Cancel</Button>
          <Button onClick={handleCreateFileSubmit}>Create</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={isDeleteFileDialogOpen} onClose={handleDeleteFileDialogClose}>
        <DialogTitle>Delete File</DialogTitle>
        <DialogContent>
          Are you sure you want to delete the file "{fileToDelete}"?
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteFileDialogClose}>Cancel</Button>
          <Button onClick={handleDeleteFileSubmit}>Delete</Button>
        </DialogActions>
      </Dialog>
      <Menu
        open={isContextMenuOpen}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        // anchorPosition={contextMenuPosition}
      >
        {contextMenuItems.map((item, index) => (
          <MenuItem key={index} onClick={item.onClick}>{item.label}</MenuItem>
        ))}
      </Menu>
    </Box>
  );
};