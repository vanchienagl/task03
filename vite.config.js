import { resolve, join } from "path";
import fs from "fs";
import { defineConfig, loadEnv } from "vite";
import { Watcher } from "./plugins/watcher";
import { Layout } from "./plugins/layout";
import { Controller } from "./plugins/controller";
import { Imagemin } from "./plugins/imagemin";

let input = {};

function fromDir(startPath, filter) {
  if (!fs.existsSync(startPath)) {
    console.log("no dir ", startPath);
    return;
  }

  var files = fs.readdirSync(startPath);
  for (var i = 0; i < files.length; i++) {
    var filename = join(startPath, files[i]);
    var stat = fs.lstatSync(filename);
    if (stat.isDirectory()) {
      fromDir(filename, filter); //recurse
    } else if (filename.indexOf(filter) >= 0) {
      input[filename] = resolve(__dirname, filename);
    }
  }
}

fromDir("src", ".html");

module.exports = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const base = env.VITE_BASE_URL || '/';

  return {
    root: "src",
    publicDir: '_public',
    base,
    server: {
      open: "/index.html"
    },
    build: {
      outDir: "../dist",
      lib: {
        name: 'style',
        entry: resolve(__dirname, 'src/_scss/style.js'),
        formats: ['es'],
      },
      rollupOptions: {
        input: input,
        output: {
          preserveModules: true,
          entryFileNames: ({ name: fileName }) => {
            return `${fileName}.js`
          }
        },
      },
      minify: false,
    },

    plugins: [
      Watcher([
        '**/*.ejs',
        '_public/**',
        '_data/**'
      ]),
      Layout({
        dataFile: 'src/_data/data.json',
        ejs: {
          views: ["src"],
        },
      }),
      Controller(),
      Imagemin({
        gifsicle: {
          optimizationLevel: 7,
          interlaced: false,
        },
        optipng: {
          optimizationLevel: 7,
        },
        jpegTran: {
          progressive: true,
        },
        svgo: {
          plugins: [
            {
              name: 'removeViewBox',
            },
            {
              name: 'removeEmptyAttrs',
              active: false,
            },
          ],
        },
      }),
    ],
  }
});
