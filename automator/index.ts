const fs = require("fs");
const mathjax = require("mathjax-node");
const { propagateUpdate } = require("../react-renderer/src/PropagateUpdate");

const args = process.argv.slice(2);

const st = fs.readFileSync("./state.json");

const state = JSON.parse(st).contents[0];

const allShapes = state.shapesr;

(async () => {
  const collected = await Promise.all(
    allShapes.map(async ([type, obj]) => {
      if (type === "Text" || type === "TextTransform") {
        const data = await mathjax.typeset({
          math: obj.string.contents,
          format: "TeX",
          svg: true,
          svgNode: true,
          useFontCache: false,
          useGlobalCache: false,
          ex: 12
        });
        if (data.errors) {
          console.error(
            `Could not render ${obj.string.contents}: `,
            data.errors
          );
          return;
        }
        const { width, height } = data;
        const obj2 = { ...obj };
        const SCALE_FACTOR = 7;
        // Take substring to omit `ex`
        obj2.w.updated = +width.substring(0, width.length - 2) * 7;
        obj2.h.updated = +height.substring(0, height.length - 2) * 7;
        // console.log(obj2.w.updated, obj2.h.updated);
        data.svgNode.setAttribute("width", obj2.w.updated);
        data.svgNode.setAttribute("height", obj2.h.updated);
        obj2.rendered.contents = data.svgNode.outerHTML;
      }
      return [type, obj];
    })
  );
  const updated = await propagateUpdate({ ...state, shapesr: collected });
})();
