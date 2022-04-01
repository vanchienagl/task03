import { existsSync, rm } from "fs";
import { relative } from "path";
import { html as beautify_html } from "js-beautify";

function Controller() {
  let config;
  return {
    name: "controller",
    apply: "build",

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    transformIndexHtml: {
      enforce: "post",
      transform(html, ctx) {
        let { base, root } = config;
        let { filename } = ctx;
        html = html.replace(
          new RegExp(
            `<script type="module" crossorigin src="${base}_scss/style.js"></script>`
          ),
          ``
        );
        html = html.replace(
          new RegExp(
            `<script type="module" crossorigin src="${base}_virtual/modulepreload-polyfill.js"></script>`
          ),
          ``
        );
        if (base.startsWith('./')) {
          let relativePath = relative(filename, root).slice(0, -2).replace(/\\/g, '/');
          html = html.replace(/\.\//g, relativePath);
        }
        html = beautify_html(html, {
          indent_size: 2,
          preserve_newlines: false,
          indent_inner_html: true,
        });
        return html;
      }
    },

    closeBundle() {
      if (existsSync("dist/_virtual")) {
        rm("dist/_virtual", { recursive: true }, (err) => {
          config.logger.info(`Remove _virtual folder`);
          if (err) {
            console.log(err);
          }
        });
      }
      if (existsSync("dist/_scss")) {
        rm("dist/_scss", { recursive: true }, (err) => {
          config.logger.info(`Remove scss folder`);
          if (err) {
            console.log(err);
          }
        });
      }
    },
  };
}

const _Controller = Controller;
export { _Controller as Controller };
