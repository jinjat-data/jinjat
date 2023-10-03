import React, { useState } from "react";
import { ThemedHeader as DefaultHeader } from "./header";
import { ThemedSider as DefaultSider } from "./sider";
import { Box } from "@mui/material";
import type { RefineThemedLayoutProps } from "@refinedev/mui";
import {JinjatProject} from "@components/hooks/schema";
import {ThemedTitle} from "@components/themedLayout/title";

export type JinjatThemedLayoutProps = RefineThemedLayoutProps & {
    project : JinjatProject
};

export const ThemedLayout: React.FC<JinjatThemedLayoutProps> = ({
  Sider,
  Header,
  Title,
  Footer,
  OffLayoutArea,
  children,
  project
}) => {
  const [isSiderOpen, setIsSiderOpen] = useState(true);

  const SiderToRender = Sider ?? DefaultSider;
  const HeaderToRender = Header ?? DefaultHeader;
  const TitleToRender = Title ?? ((props) => <> <ThemedTitle {...props} text={project.package_name + ' ' + project.version} /> </>);

  return (
    <Box display="flex" flexDirection="row">
      <SiderToRender
        Title={TitleToRender}
        isSiderOpen={isSiderOpen}
        onToggleSiderClick={(isOpen) => setIsSiderOpen(Boolean(isOpen))}
      />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: "100vh",
        }}
      >
        <HeaderToRender
          isSiderOpen={isSiderOpen}
          onToggleSiderClick={() => setIsSiderOpen((prev) => !prev)}
        />
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
  );
};
