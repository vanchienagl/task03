import stylelintFormatter from 'stylelint-formatter-pretty';
import stylelint from 'stylelint';
import * as path from 'path';
import htmlhint from './utils/htmlhint';
import colors from "picocolors";


function Lint(options = {}) {
  let default_options = {
    errorOverlay: true,
    htmlhint: {
      files: ['src/**/*.{html,ejs}'],
    },
    stylelint: {
      files: ['src/**/*.{vue,css,scss,sass,less,styl,svelte}'],
      cache: true,
      cacheLocation: path.join('node_modules', '.vite', 'stylelint'),
    },
  };
  options = Object.assign(default_options, options);

  let ws;
  let storage = [];

  async function handleLint() {
    storage = [];

    if (options.htmlhint) {
      htmlhint(options.htmlhint)
        .then(({ errored, results, output }) => {
          if (errored) {
            console.log(`\n  ${colors.magenta('[HTMLHint]')}\n`);
            console.log(output);
          }
          storage.push({
            id: 'htmlhint',
            results
          })
          sendToClient();
        })
    }

    if (options.stylelint) {
      stylelint
        .lint(options.stylelint)
        .then(({ errored, results }) => {
          if (errored) {
            console.log(`\n  ${colors.magenta('[stylelint]')}`);
            console.log(stylelintFormatter(results));
          }
          storage.push({
            id: 'stylelint',
            results: formatResults(results)
          })
          sendToClient();
        })
        .catch(error => {
          this.warn('It looks like you configured bad stylelint options.');
          this.error(error);
        });
    }
  }

  function sendToClient() {
    if (!options.errorOverlay) return;
    ws.send('lint:results', storage);
  }

  function formatResults(results) {
    return results
			.sort((a, b) => a.warnings.length - b.warnings.length)
      .map(result => {
        result.relativeFilePath = path.relative('.', result.source);
        return result
      })
  }

  return {
    name: "lint",
    apply: 'serve',

    config: () => ({
      resolve: {
        alias: [
          {
            find: /^[\/]?@injects\/client/,
            replacement: path.resolve(__dirname, "./injects/client.js")
          }
        ]
      },
    }),

    configureServer(server) {
      ws = server.ws;
      server.watcher.on("ready", handleLint);
      server.watcher.on("change", handleLint);
      ws.on('client:ready', sendToClient);
    },

    transformIndexHtml: {
      enforce: "pre",
      transform(html, ctx) {
        if (!options.errorOverlay) return null;
        return [
          {
            tag: 'script',
            attrs: {
              type: 'module',
              src: '/@injects/client'
            },
            injectTo: 'head-prepend'
          }
        ];
      }
    }
  };
}// 

exports.Lint = Lint;