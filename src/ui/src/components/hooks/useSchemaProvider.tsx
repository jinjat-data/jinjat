import React, {ReactNode, useContext, useMemo} from "react";

import {IJinjatContextProvider, JinjatProject} from "./schema";

export const defaultSchemaProvider = () => {
    return {
        getResponseSchema: () => Promise.resolve({data: {type: "string"}}),
        getRequestSchema: () => Promise.resolve({data: {type: "string"}}),
        getProject: () => Promise.resolve({resources: [], version: 'LOADING'}),
        getApiUrl: () => "",
        getReadme: () => Promise.resolve({content: '', file_path: ''}),
    } as unknown as IJinjatContextProvider;
};


const JinjatServiceContext = React.createContext<IJinjatContextProvider>(defaultSchemaProvider());

export const JinjatServiceContextProvider: React.FC<(IJinjatContextProvider & {
    children: ReactNode;
})> = ({ children, ...rest }) => {
    return (
        <JinjatServiceContext.Provider value={rest}>
            {children}
        </JinjatServiceContext.Provider>
    );
};

export const useJinjatProvider = () => {
    return useContext<IJinjatContextProvider>(JinjatServiceContext);
};