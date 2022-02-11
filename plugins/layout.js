const ejs = require('ejs');
const fs = require('fs')

function checkLinks(links, ctx) {
  return links.map((link) => {
    let compactPath = ctx.path.replace(/index.html/, '');
    let compactUrl = link.url.replace(/index.html/, '');
    link.current = false;
    link.active = false;
    if (link.url == compactPath || link.url == ctx.path) {
      link.current = true;
    }
    if (link.url != '/' && (compactPath.startsWith(link.url) || compactPath.startsWith(compactUrl))) {
      link.active = true;
    }
    if (link.links) {
      link.links = checkLinks(link.links, ctx)
    }
    return link;
  });
}

function Layout(options = {}) {
  let default_options = {
    dataFile: 'data.json',
    ejs: {
      views: ["src"],
    },
  };
  options = Object.assign(default_options, options);
  return {
    name: "layout",

    // Get Resolved config
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    transformIndexHtml: {
      enforce: "pre",
      transform(html, ctx) {
        try {
          let data = {}
          if (options.dataFile) {
            const dataRaw = fs.readFileSync(options.dataFile, 'utf8')
            if (dataRaw) data = JSON.parse(dataRaw);
          }
        
          if (data.linklists) {
            for (const key in data.linklists) {
              if (Object.hasOwnProperty.call(data.linklists, key)) {
                data.linklists[key] = checkLinks(data.linklists[key], ctx)
              }
            }
          }

          html = ejs.render(
            html,
            data,
            options.ejs
          );

          let re = new RegExp(
            `<!-- @(.*) -->((.|\n|\r)*?)<!-- @@(.*) -->`, 'g'
          );
          let temp = [];
          while ((match = re.exec(html)) != null) {
            let content = "";
            let start = "";
            let end = "";
            if (match && match.length == 5) {
              start = match[1];
              content = match[2];
              end = match[4];
            }
            if (start === end) {
              temp.push({
                location: start,
                content
              })
            }
          }
          html = html.replace(re, '');
          temp.forEach((item) => {
            html = html.replace(
              new RegExp(`{{\\s+${item.location}\\s+}}`, 'g'),
              item.content
            );
          })
          html = html.replace(
            /{{\s*\S+\s*}}/g,
            ''
          );
        } catch (e) {
          return e.message;
        }
        return html;
      },
    },
  };
}

exports.Layout = Layout;
