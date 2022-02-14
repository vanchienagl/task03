const fs = require("fs");
const path = require('path')
var beautify_html = require('js-beautify').html;

function Controller() {
  return {
    name: "controller",
    apply: "build",

    configResolved(resolvedConfig) {
      config = resolvedConfig
    },

    transformIndexHtml(html) {
      html = html.replace(
        /<script type="module" crossorigin src="\/_scss\/style.js"><\/script>/,
        ``
      );
      html = html.replace(
        /<script type="module" crossorigin src="\/_virtual\/modulepreload-polyfill.js"><\/script>/,
        ``
      );
      html = beautify_html(html, { indent_size: 2, preserve_newlines: false, indent_inner_html: true });
      return html;
    },

    closeBundle() {
      fs.rm("dist/_virtual", { recursive: true }, (err) => {
        config.logger.info(`Remove _virtual folder`);
        if (err) {
          console.log(err);
        }
      });
      fs.rm("dist/_scss", { recursive: true }, (err) => {
        config.logger.info(`Remove scss folder`);
        if (err) {
          console.log(err);
        }
      });

    },
  };
}

exports.Controller = Controller;
