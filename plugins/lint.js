import * as path from 'path';
import colors from "picocolors";
import htmlhint from './utils/htmlhint';
import stylelint from 'stylelint';
import stylelintFormatter from 'stylelint-formatter-pretty';
import { ESLint } from 'eslint';
import eslintFormatter from 'eslint-formatter-pretty';


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
    eslint: {
      files: ['src/_public/assets/js/**/*.js'],
      options: {
        cache: true,
        cacheLocation: path.join('node_modules', '.vite', 'eslint'),
      }
    }
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
        .catch(error => {
          console.log(error)
        });
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
            results: formatStylelintResults(results)
          })
          sendToClient();
        })
        .catch(error => {
          console.log(error)
        });
    }

    if (options.eslint) {
      const eslint = new ESLint(options.eslint.options);
      eslint
        .lintFiles(options.eslint.files)
        .then((results) => {
          if (results.some(result => result.messages.length > 0)) {
            console.log(`\n  ${colors.magenta('[ESLint]')}`);
            console.log(eslintFormatter(results));
          }
          storage.push({
            id: 'eslint',
            results: formatESLintResults(results)
          })
          sendToClient();
        })
        .catch(error => {
          console.log(error)
        });
    }
  }

  function sendToClient() {
    if (!options.errorOverlay) return;
    ws.send('lint:results', storage);
  }

  function formatStylelintResults(results) {
    return results
			.sort((a, b) => a.warnings.length - b.warnings.length)
      .map(result => {
        result.relativeFilePath = path.relative('.', result.source);
        result.warnings
					.sort((a, b) => {
						if (a.severity === b.severity) {
							if (a.line === b.line) {
								return a.column < b.column ? -1 : 1;
							}

							return a.line < b.line ? -1 : 1;
						}

						if (a.severity === 2 && b.severity !== 2) {
							return 1;
						}

						return -1;
					})
        return result
      })
  }

  function formatESLintResults(results) {
    return results
      .sort((a, b) => {
        if (a.errorCount === b.errorCount) {
          return b.warningCount - a.warningCount;
        }

        if (a.errorCount === 0) {
          return -1;
        }

        if (b.errorCount === 0) {
          return 1;
        }

        return b.errorCount - a.errorCount;
      })
      .map(result => {
        result.relativeFilePath = path.relative('.', result.filePath);
        result.messages
          .sort((a, b) => {
            if (a.fatal === b.fatal && a.severity === b.severity) {
              if (a.line === b.line) {
                return a.column < b.column ? -1 : 1;
              }

              return a.line < b.line ? -1 : 1;
            }

            if ((a.fatal || a.severity === 2) && (!b.fatal || b.severity !== 2)) {
              return 1;
            }

            return -1;
          })
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
      server.watcher.on("add", handleLint);
      ws.on('client:ready', sendToClient);
    },

    transformIndexHtml: {
      enforce: "pre",
      transform() {
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