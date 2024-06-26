import { Plugin } from "esbuild";
import * as fs from "fs";
import path from "path";

import { getJinjatCoreVersion } from "./get-jinjat-core-version";

export const replaceCoreVersionPlugin: Plugin = {
    name: "replaceCoreVersion",
    setup: (build) => {
        build.onLoad({ filter: /\.ts$/ }, async (args) => {
            const contents = await fs.promises.readFile(args.path, "utf8");

            const extension = path.extname(args.path).replace(".", "");
            const loader = ["js", "cjs", "mjs"].includes(extension)
                ? "jsx"
                : (extension as any);

            const versionRegex = /const JINJAT_VERSION = "\d.\d.\d";/gm;
            const hasVersion = contents.match(versionRegex);

            if (!hasVersion) {
                return;
            }

            const version = await getJinjatCoreVersion();

            return {
                loader,
                contents: contents.replace(
                    versionRegex,
                    `const JINJAT_VERSION = "${version}";`,
                ),
            };
        });
    },
};
