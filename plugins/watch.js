import { posix } from "path";
import anymatch from "anymatch";

function getShortName(file, root) {
  return file.startsWith(root + "/") ? posix.relative(root, file) : file;
}

function Watch(input = '') {
  return {
    name: "watch",
    apply: 'serve',

    handleHotUpdate({ file, server }) {
      if (!input) return;
      const { ws, config } = server;
      const shortFile = getShortName(file, config.root);
      if (anymatch(input, shortFile)) {
        ws.send({
          type: "full-reload",
          path: "*",
        });
      }
    },
  };
}

exports.Watch = Watch;
