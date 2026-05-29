import html from "@rollup/plugin-html";
import { makeHtmlAttributes } from "@rollup/plugin-html";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import postcss from "rollup-plugin-postcss";
import image from '@rollup/plugin-image';
import fs from "fs";
import { join } from "path";

export default {
  input: 'src/web/main.js',
  jsx: {
    mode: "classic",
    factory: "h",
    fragment: "Fragment",
    importSource: "preact"
  },
  output: {
    dir: 'dist/web',
    format: 'esm'
  },
  plugins: [
    postcss({
      extract: true, 
      minimize: true,
    }),
    html({
      template: ({ attributes, bundle, files, publicPath, title }) => {
        const scripts = (files.js || [])
          .map(({ fileName }) => `<script src="${publicPath}${fileName}"${makeHtmlAttributes(attributes.script)}></script>`)
          .join('\n');

        const links = (files.css || [])
          .map(({ fileName }) => `<link href="${publicPath}${fileName}" rel="stylesheet"${makeHtmlAttributes(attributes.link)}>`)
          .join('\n');

        const customTemplate = fs.readFileSync(join(import.meta.dirname, "src", "web", "templates", "index.html"), 'utf8');

        return customTemplate
          .replace('${title}', title)
          .replace('${scripts}', scripts)
          .replace('${links}', links);
      },
      title: "Nexa"
    }),
    nodeResolve({
      extensions: [".js", ".jsx"],
      browser: true
    }),
    image()
  ]
};
