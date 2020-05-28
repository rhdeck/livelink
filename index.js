const { join, resolve } = require("path");
const { readFileSync, writeFileSync, existsSync } = require("fs");
const { spawnSync, spawn } = require("child_process");
const Deferred = require("es6-deferred");
const nodeWatch = require("node-watch");
const untildify = require("untildify");
const watch = (filterFunc, allowDefault = true) => {
  //Look for noti and bbplugin directory
  const {
    liveLinks,
    name,
    bbPath = "~/Documents/bbplugins",
    watchPath = "./",
    scripts: { onwatch, build } = {},
  } = require(join(process.cwd(), "package.json"));
  let isBuilding = false;
  let ref = { shouldBuild: false };
  let startTime = null;
  let lastBuild = 0;
  let bbFullpath = join(untildify(bbPath), name.split("/").pop() + ".1s.sh");
  let firstInititial = name[0];
  let lastDuration = "";
  let durations = [];
  const updatebb = (line) => {
    if (!onwatch) return;
    try {
      writeFileSync(
        bbFullpath,
        `#!/bin/sh
  echo "${line}"
  echo "${lastBuild ? new Date(lastBuild).toLocaleString() : "No builds yet"}"
  echo '${name} | bash="code ${process.cwd()}"'`
      );
    } catch (e) {
      console.log(
        "Tried to update bitbar plugin but could not at",
        bbPath,
        "Is it installed? Continuing"
      );
      console.log(e);
    }
  };
  const doIt = async () => {
    if (isBuilding) {
      ref.shouldBuild = true;
      return;
    }
    startTime = Date.now();
    const { promise, resolve } = new Deferred();
    console.log("Launching process", [onwatch ? "onwatch" : "build"]);
    const process = spawn("yarn", [onwatch ? "onwatch" : "build"], {
      stdio: "inherit",
    });
    process.on("close", resolve);
    let i = setInterval(() => {
      updatebb(
        `${firstInititial}: Building ${(
          (Date.now() - startTime) /
          1000
        ).toFixed(0)}/${lastDuration}s${ref.shouldBuild ? " +1" : " "}`
      );
    }, 500);
    await promise;
    clearInterval(i);
    isBuilding = false;
    lastDuration = ((Date.now() - startTime) / 1000).toFixed(0);
    durations.push(lastDuration);
    if (ref.shouldBuild) {
      doIt();
    } else if (onwatch) {
      //Send noti that this is done
      try {
        spawnSync("noti", ["-m", `${name}: Done (${lastDuration})`]);
      } catch (e) {
        console.warn(
          "Attempted to run noti, but it is missing from this environment. Continuing."
        );
      }
      //Update bitbar with finished status
      lastBuild = Date.now();
      updatebb(`${firstInititial}: Done (${lastDuration}s)`);
    }
  };
  doIt();
  nodeWatch(
    watchPath,
    {
      filter: (f) => {
        (allowDefault &&
          (!/node_modules/.test(f) ||
            Object.entries(liveLinks).some(([dependency, _]) =>
              f.contains("node_modules/" + dependency)
            ))) ||
          (filterFunc && filterFunc(f));
      },
      delay: 1000,
    },
    doIt
  );
  spawnSync("noti", ["-m", `${name} built`], { stdio: "inherit" });
};
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
module.exports = { runLink, getLiveLinks, setLiveLinks, watch };
