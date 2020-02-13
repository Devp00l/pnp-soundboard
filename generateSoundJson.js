const settings = require("./js/customizations.json");
const path = require("path");
const walk = require("fs-walk");
const fs = require("fs");

const sounds = {};
// Shows the written object
walk.walkSync(
  path.resolve(`./${settings.soundDirName}`),
  (dirPath, file, stats) => {
    if (stats.isDirectory()) {
      return;
    }
    const dir = path.basename(dirPath);
    if (sounds[dir]) {
      sounds[dir].push(file);
    } else {
      sounds[dir] = [file];
    }
  }
);

console.log(sounds);

fs.writeFileSync(`./${settings.soundDirName}.json`, JSON.stringify(sounds));
