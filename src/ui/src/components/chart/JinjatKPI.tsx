import React from "react";
import {JinjatEChartsProps} from "@components/crud/utils";
import {Box} from '@mui/material';

export const JinjatKPI: React.FC<JinjatEChartsProps> = ({
                                                            dataset,
                                                            options,
                                                            theme,
                                                        }) => {
    return <Box
        sx={{
            bgcolor: 'background.paper',
            boxShadow: 1,
            borderRadius: 2,
            p: 2,
            minWidth: 300,
        }}
    >
        <Box sx={{color: 'text.secondary'}}>Sessions</Box>
        <Box sx={{color: 'text.primary', fontSize: 34, fontWeight: 'medium'}}>
            98.3 K
        </Box>
        <Box
            sx={{
                color: 'success.dark',
                display: 'inline',
                fontWeight: 'bold',
                mx: 0.5,
                fontSize: 14,
            }}
        >
            +18.77%
        </Box>
        <Box sx={{color: 'text.secondary', display: 'inline', fontSize: 14}}>
            vs. last week
        </Box>
    </Box>
}