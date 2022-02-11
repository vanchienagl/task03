const fs = require("fs");
const path = require('path')
var beautify_html = require('js-beautify').html;

function Controller(options = {}) {
  let config;
  let default_options = {
    styleDir: 'assets/css'
  };
  options = Object.assign(default_options, options);

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
      html = html.replace(
        /<link rel="stylesheet" href="\/style.css">/,
        `<link rel="stylesheet" href="\/${options.styleDir}\/style.css">`
      );
      html = html.replace(
        /<script(.*)src="\/(.*)"/g,
        `<script$1src="./$2"`
      );
      html = html.replace(
        /<link(.*)href="\/(.*)"/g,
        `<link$1href="./$2"`
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

      if (!fs.existsSync(path.join(config.build.outDir, options.styleDir))){
        fs.mkdirSync(path.join(config.build.outDir, options.styleDir));
      }
      fs.rename(path.join(config.build.outDir, 'style.css'), path.join(config.build.outDir, options.styleDir, 'style.css'), (err) => {
        config.logger.info(`Move style.css to ${options.styleDir}/style.css`);
        if (err) {
          console.log(err);
        }
      });
    },
  };
}

exports.Controller = Controller;
