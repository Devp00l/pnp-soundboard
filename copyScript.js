const fs = require("fs");
const cpPath = "js/example.customizations.json";
const path = "js/customizations.json";

if (!fs.existsSync(path)) {
  fs.copyFileSync(cpPath, path);
}
