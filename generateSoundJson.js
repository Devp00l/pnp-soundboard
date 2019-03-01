const dtj = require("directory-to-json");
const dto = require("directory-to-object");
const path = require("path");

// Shows the written object
dto(path.resolve("./sounds"), (err, res) => console.log(res));
dtj(path.resolve("./sounds"), "./sounds.json", err => console.log(err));
