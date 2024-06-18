import { createServer } from "http";
import { parse } from "url";
import next from "next";
import path from "path";
import express from "express";
import { getDocumentFiles } from "./utils/early";
import fse from "fs-extra";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  const app = express();
  app.use(express.json());
  // send early hints
  app.get("*", (req, res) => {
    const pathname = req.path;
    const route = pathname === "/";
    const buildManifest = path.resolve(
      __dirname,
      ".next/build-manifest.json"
    );
    const buildManifestJson = fse.readJSONSync(buildManifest);

    if (route) {
      const files = getDocumentFiles(buildManifestJson, pathname, false);

      const allFiles = files.allFiles;

      const jsFiles = allFiles.filter((file) => file.endsWith(".js"));
      const cssFiles = allFiles.filter((file) => file.endsWith(".css"));

      // 为每种类型的文件创建预加载提示
      const jsHints = jsFiles.map(
        (file) => `<_next/${file}>; rel=preload; as=script`
      );
      const cssHints = cssFiles.map(
        (file) => `<_next/${file}>; rel=preload; as=style`
      );

      // 合并所有的预加载提示
      const earlyHintsLinks = [...jsHints, ...cssHints];

      res.set({
        "X-Accel-Buffering": "no",
        "Content-Type": "text/html; charset=UTF-8",
        Link: earlyHintsLinks.join(","),
      });

      // with this line, the nextjs server will not work!
      res.flushHeaders();
    }

    const parsedUrl = parse(req.url!, true);
    return handle(req, res, parsedUrl);
  });

  app.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
