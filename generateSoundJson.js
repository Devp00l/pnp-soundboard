const path = require("path");
const walk = require("fs-walk");
const fs = require("fs");

const sounds = {};
// Shows the written object
walk.walkSync(path.resolve("./sounds"), (dirPath, file, stats) => {
  if (stats.isDirectory()) {
    return;
  }
  const dir = path.basename(dirPath);
  if (sounds[dir]) {
    sounds[dir].push(file);
  } else {
    sounds[dir] = [file];
  }
});

console.log(sounds);

fs.writeFileSync("sounds.json", JSON.stringify(sounds));
