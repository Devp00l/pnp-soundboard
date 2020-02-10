const fs = require("fs");
const cpPath = "js/example.customisations.json";
const path = "js/customisations.json";

if (!fs.existsSync(path)) {
  fs.copyFileSync(cpPath, path);
}
