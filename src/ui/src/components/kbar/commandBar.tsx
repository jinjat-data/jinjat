import React, {useEffect} from "react";
import {KBarPortal, KBarPositioner, KBarAnimator, KBarSearch, useRegisterActions} from "kbar";
import {RenderResults} from "@components/kbar/renderResults";
import {useQuery} from "@tanstack/react-query";
import {useJinjatProvider} from "@components/hooks/useSchemaProvider";
import {createActionsFromNodes} from "@components/kbar/index";
import {useJinjatProject} from "@components/hooks/useJinjatProject";


const searchStyle = {
    padding: "12px 16px",
    fontSize: "16px",
    width: "100%",
    boxSizing: "border-box" as React.CSSProperties["boxSizing"],
    outline: "none",
    border: "none",
    background: "rgb(252 252 252)",
    color: "black",
};

const animatorStyle = {
    maxWidth: "600px",
    width: "100%",
    background: "white",
    color: "black",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
};

const positionerStyle = {
    opacity: 1,
    transition: "background 0.35s cubic-bezier(0.4, 0, 0.2, 1) 0s",
    backdropFilter: "saturate(180%) blur(1px)",
    background: "rgba(0, 0, 0, 0.1)",
    zIndex: "9999",
};
export const CommandBar: React.FC = () => {
    const jinjatContext = useJinjatProvider();
    const {
        data: project,
        isLoading: isProjectLoading,
        error,
    } = useJinjatProject({schemaContext: jinjatContext});

    const {data: nodes, isLoading: isNodesLoading} = useQuery({
        queryKey: ["dbt-nodes"],
        queryFn: () => jinjatContext.getAllDbtNodes()
    })

    //TODO: fix
    useRegisterActions(createActionsFromNodes(project, nodes!!), [project, nodes])

    if (isProjectLoading || isNodesLoading) {
        return <div/>
    }

    return (
        <KBarPortal>
            <KBarPositioner style={positionerStyle}>
                <KBarAnimator style={animatorStyle}>
                    <KBarSearch style={searchStyle}/>
                    <RenderResults/>
                </KBarAnimator>
            </KBarPositioner>
        </KBarPortal>
    );
};