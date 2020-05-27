const { join } = require("path");
const { readFileSync, writeFileSync, existsSync } = require("fs");
const { spawnSync } = require("child_process");

const getLiveLinks = () => {
  try {
    const { liveLinks } = JSON.parse(
      readFileSync(join(process.cwd(), "package.json"), { encoding: "utf8" })
    );
    return liveLinks || {};
  } catch (e) {
    return {};
  }
};
const setLiveLinks = (liveLinks) => {
  const o = JSON.parse(
    readFileSync(join(process.cwd(), "package.json"), { encoding: "utf8" })
  );
  writeFileSync(
    join(process.cwd(), "package.json"),
    JSON.stringify({ ...o, liveLinks }, null, 2)
  );
};
const runLink = (liveLinks) => {
  //Get links from package.json
  spawnSync("wml", ["rm", "all"], { stdio: "inherit" });
  if (liveLinks && Object.entries(liveLinks).length) {
    Object.entries(liveLinks).forEach(([dependencyName, source]) => {
      if (existsSync(source)) {
        spawnSync(
          "wml",
          ["add", source, join("node_modules", dependencyName)],
          {
            stdio: "inherit",
          }
        );
      } else {
        console.warn(
          "source for link does not exist, continuing with others: ",
          source
        );
      }
    });
    spawnSync("wml", ["start"], { stdio: "inherit" });
  }
};
module.exports = { runLink, getLiveLinks, setLiveLinks };
