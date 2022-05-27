const template = /*html*/ `
<style>
:host {
  position: fixed;
  z-index: 99999;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  margin: 0;
  background: rgba(0, 0, 0, 0.66);
  --monospace: 'SFMono-Regular', Consolas,
              'Liberation Mono', Menlo, Courier, monospace;
  --red: #ff5555;
  --yellow: #e2aa53;
  --purple: #cfa4ff;
  --cyan: #2dd9da;
  --dim: #c9c9c9;
  --gray: #626262;
}

.window {
  font-family: var(--monospace);
  line-height: 1.5;
  width: 800px;
  color: #d8d8d8;
  margin: 30px auto;
  padding: 25px 40px;
  position: relative;
  background: #181818;
  border-radius: 6px 6px 8px 8px;
  box-shadow: 0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22);
  overflow: hidden;
  border-top: 8px solid var(--red);
  direction: ltr;
  text-align: left;
}

pre {
  font-family: var(--monospace);
  font-size: 16px;
  margin-top: 0;
  margin-bottom: 1em;
  overflow-x: scroll;
  scrollbar-width: none;
}

pre::-webkit-scrollbar {
  display: none;
}

.message {
  line-height: 1.3;
  font-weight: 600;
  white-space: pre-wrap;
}

.message-body {
  color: var(--red);
}

.plugin {
  color: var(--purple);
}

.lint:not(:last-child) .list {
  margin-bottom: 60px;
}

.list {
  border-spacing: 0;
  margin-bottom: 13px;
}

.list td {
  padding-bottom: 5px;
}

.file {
  color: var(--cyan);
  margin-bottom: 0;
  word-break: break-all;
}

.list tr:not(:first-child) .file {
  padding-top: 15px;
}

.row {
  margin-bottom: 15px;
}

.warning {
  color: var(--yellow);
}

.error {
  color: var(--red);
}

html-hint .message {
  white-space: pre-wrap;
  color: var(--red);
}

.line {
  padding-left: 15px;
  text-align: right;
}

.column {
  padding-right: 15px;
}

.rule {
  color: var(--gray);
  padding-left: 15px;
}

.evidence {
  display: inline;
  white-space: pre-wrap;
}

.tip {
  font-size: 13px;
  color: #999;
  border-top: 1px dotted #999;
  padding-top: 13px;
}

code {
  font-size: 13px;
  font-family: var(--monospace);
  color: var(--yellow);
}

.file-link {
  text-decoration: underline;
  cursor: pointer;
}

</style>
<div class="window">
  <div class="body">
    <div class="htmlhint lint"></div>
    <div class="stylelint lint"></div>
  </div>
  <div class="tip">
    Click outside or fix the code to dismiss.<br>
    You can also disable this overlay by setting
    <code>Lint({ errorOverlay: false })</code> in <code>vite.config.js.</code>
  </div>
</div>
`;
class LintErrorOverlay extends HTMLElement {
  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
    this.root.innerHTML = template;
    this.root.querySelector(".window").addEventListener("click", (e) => {
      e.stopPropagation();
    });
    this.addEventListener("click", () => {
      this.close();
    });
  }
  close() {
    var _a;
    (_a = this.parentNode) === null || _a === void 0
      ? void 0
      : _a.removeChild(this);
  }
}

class HTMLHint extends HTMLElement {
  constructor(data) {
    super();
    console.log(data)

    function escapeHtml(unsafe)
    {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    function repeatStr(n, str) {
        return new Array(n + 1).join(str || ' ');
    }

    if (!data) return;
    let errored = data.some(item => item.warnings.length > 0)
    if (errored) {
      this.innerHTML = `<pre class="message"><span class="plugin">[htmlhint]</span></pre>`;
      const list = document.createElement('div');
      list.classList = 'list';
      data.forEach(err => {
        if (!err.warnings.length) return;
        let link = document.createElement("a");
        link.textContent = err.relativeFilePath;
        link.className = "file-link";
        link.onclick = () => {
          fetch("/__open-in-editor?file=" + encodeURIComponent(err.filePath));
        };
        let file = document.createElement("pre");
        file.className = "file";
        file.appendChild(link);
        list.appendChild(file);

        err.warnings.forEach(hint => {
          const leftWindow = 35;
          const rightWindow = leftWindow + 20;
          let evidence = hint.evidence;
          const line = hint.line;
          const col = hint.col;
          const evidenceCount = evidence.length;
          let leftCol = col > leftWindow + 1 ? col - leftWindow : 1;
          let rightCol = Math.min(evidenceCount, col + rightWindow);
          if (col < leftWindow + 1) {
              rightCol += leftWindow - col + 1;
          }
          evidence = evidence.replace(/\t/g, ' ').substring(leftCol - 1, rightCol);
          if (leftCol > 1) {
              evidence = `...${evidence}`;
              leftCol -= 3;
          }
          if (rightCol < evidenceCount) {
              evidence += '...';
          }
          let pointCol = col - leftCol;
          const match = evidence.substring(0, pointCol).match(/[^\u0000-\u00ff]/g);
          if (match !== null) {
              pointCol += match.length;
          }

          let row = document.createElement("div");
          row.classList = 'row';

          row.innerHTML = `
            <div class="evidence">L${line} |${escapeHtml(evidence)}</div>
            <div class="message">${repeatStr(String(line).length + pointCol + 3)}^ ${hint.message} <span class="rule">(${hint.rule.id})</span></div>
          `;
          list.appendChild(row);
        })
      })
      this.appendChild(list);
    }
  }
}

class Stylelint extends HTMLElement {
  constructor(data) {
    super();
    if (!data) return;
    let errored = data.some(item => item.warnings.length > 0)
    if (errored) {
      this.innerHTML = `<pre class="message"><span class="plugin">[stylelint]</span></pre>`;
      const list = document.createElement("table");
      list.classList = 'list';
      data.forEach((err) => {
        if (!err.warnings.length) return;
        const link = document.createElement("a");
        link.textContent = err.relativeFilePath;
        link.className = "file-link";
        link.onclick = () => {
          fetch("/__open-in-editor?file=" + encodeURIComponent(err.source));
        };

        const td = document.createElement("td");
        td.setAttribute("colspan", "6");
        td.classList = "file";
        td.appendChild(link);

        const tr = document.createElement("tr");
        tr.appendChild(td);

        list.appendChild(tr);

        err.warnings.forEach((warning) => {
          const row = document.createElement("tr");
          row.innerHTML = `
                <tr>
                  <td class="severity ${
                    warning.severity === "warning" ? "warning" : "error"
                  }">${warning.severity === "warning" ? "⚠" : "✖"}</td>
                  <td class="line">${warning.line}</td>
                  <td>:</td>
                  <td class="column">${warning.column}</td>
                  <td class="text">${warning.text}</td>
                  <td class="rule">${warning.rule}</td>
                </tr>
              `;
          list.appendChild(row);
        });
      });

      this.appendChild(list);
    }
  }
}

const overlayId = "lint-error-overlay";
if (customElements && !customElements.get(overlayId)) {
  customElements.define(overlayId, LintErrorOverlay);
}

const htmlhintId = "html-hint";
if (customElements && !customElements.get(htmlhintId)) {
  customElements.define(htmlhintId, HTMLHint);
}

const stylelintId = "style-lint";
if (customElements && !customElements.get(stylelintId)) {
  customElements.define(stylelintId, Stylelint);
}

function createErrorOverlay(data) {
  let overlay = document.querySelector(overlayId);
  if (!overlay) {
    overlay = document.body.appendChild(new LintErrorOverlay());
  }

  let body = overlay.shadowRoot.querySelector('.body');
  body.innerHTML = "";

  data.forEach(lint => {
    if (lint.results.length) {
      switch (lint.id) {
        case "htmlhint":
          body.appendChild(new HTMLHint(lint.results))
          break;
        case "stylelint":
          body.appendChild(new Stylelint(lint.results))
          break;
      
        default:
          break;
      }
    }
  })

}
function clearErrorOverlay() {
  document.querySelectorAll(overlayId).forEach((n) => n.close());
}

if (import.meta.hot) {
  import.meta.hot.on("vite:error", () => {
    clearErrorOverlay();
  });
  import.meta.hot.send("client:ready");
  import.meta.hot.on("lint:results", (data) => {
    let errored = data.some(item => item.results.some(result => result.warnings.length > 0));
    if (errored) {
      createErrorOverlay(data);
    } else {
      clearErrorOverlay();
    }
  });
}
