import React from "react";
import { ThemedLayoutContextProvider } from "@refinedev/mui";
import { ThemedHeaderV2 as DefaultHeader } from "./header";
import { ThemedSiderV2 as DefaultSider } from "./sider";
import Box from "@mui/material/Box";
import type { RefineThemedLayoutV2Props } from "@refinedev/mui";
import {JinjatProject} from "@components/hooks/useJinjatProject";

export const ThemedLayoutV2: React.FC<RefineThemedLayoutV2Props & {project: JinjatProject}> = ({
  Sider,
  Header,
  Title,
  Footer,
  OffLayoutArea,
  children,
  initialSiderCollapsed,
  project,
}) => {
  const SiderToRender = Sider ?? DefaultSider;
  const HeaderToRender = Header ?? DefaultHeader;

  return (
    <ThemedLayoutContextProvider initialSiderCollapsed={initialSiderCollapsed}>
      <Box display="flex" flexDirection="row">
        <SiderToRender Title={Title} project={project} />
        <Box
          sx={[
            {
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minHeight: "100vh",
            },
            { overflow: "auto" },
            { overflow: "clip" },
          ]}
        >
          <HeaderToRender />
          <Box
            component="main"
            sx={{
              p: { xs: 1, md: 2, lg: 3 },
              flexGrow: 1,
              bgcolor: (theme) => theme.palette.background.default,
            }}
          >
            {children}
          </Box>
          {Footer && <Footer />}
        </Box>
        {OffLayoutArea && <OffLayoutArea />}
      </Box>
    </ThemedLayoutContextProvider>
  );
};
