const { join, resolve } = require("path");
const {
  readFileSync,
  writeFileSync,
  existsSync,
  lstatSync,
  chmodSync,
} = require("fs");
const { spawnSync, spawn } = require("child_process");
const Deferred = require("es6-deferred");
const nodeWatch = require("node-watch");
const untildify = require("untildify");
const minimatch = require("minimatch");
const watch = (filterFunc, allowDefault = true) => {
  //Look for noti and bbplugin directory
  const {
    liveLink: {
      liveLinks,
      bbPath = "~/Documents/bbplugins",
      watchPath = "./",
      ignoremasks = [],
    } = {},
    name,
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
      chmodSync(bbFullpath, 0o777);
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
      console.log(
        "Aborting and scheduling rebuild because I am already building..."
      );
      return;
    }
    isBuilding = true;
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
        ).toFixed(0)}${lastDuration ? "/" + lastDuration : ""}s${
          ref.shouldBuild ? " +1" : " "
        }`
      );
    }, 500);
    await promise;
    clearInterval(i);
    isBuilding = false;
    lastDuration = ((Date.now() - startTime) / 1000).toFixed(0);
    durations.push(lastDuration);
    if (ref.shouldBuild) {
      console.log("Restarting build because I had one in the queue");
      ref.shouldBuild = false;
      doIt();
    } else if (onwatch) {
      //Send noti that this is done
      try {
        spawnSync("noti", ["-m", `${name}: Done (${lastDuration}s)`]);
      } catch (e) {
        console.warn(
          "Attempted to run noti, but it is missing from this environment. Continuing."
        );
      }
      //Update bitbar with finished status
      lastBuild = Date.now();
      console.log("Finished build", Date(lastBuild).toLocaleString());
      updatebb(`${firstInititial}: Done (${lastDuration}s)`);
    }
  };
  doIt();
  nodeWatch(
    watchPath,
    {
      recursive: true,
      filter: (f) => {
        const doRun = (() => {
          if (!existsSync(join(process.cwd(), f))) {
            return false;
          }
          const lstat = lstatSync(join(process.cwd(), f));
          if (lstat.isDirectory()) {
            return false;
          }
          if (
            ignoremasks.some((mask) => {
              const match = minimatch(f, mask);
              return match;
            })
          ) {
            return false;
          }
          if (allowDefault) {
            if (!/node_modules/.test(f)) {
              //Ignore my own dist, lib,build files
              const skipdirs = [
                "dist",
                "lib",
                "build",
                ".webpack",
                ".serverless",
              ];
              if (skipdirs.some((dir) => f.includes(dir + "/"))) return false;
              return true;
            }
            if (
              Object.entries(liveLinks).some(([dependency, _]) =>
                f.includes("node_modules/" + dependency)
              )
            )
              return true;
          }
          if (typeof filterFunc === "function") return filterFunc(f);
          return false;
        })();
        if (doRun)
          console.log("Launching onwatch/build because of changed file", f);
        return doRun;
      },
      delay: 1000,
    },
    doIt
  );
};
const getLiveLinks = () => {
  try {
    const { liveLink: { liveLinks } = {} } = JSON.parse(
      readFileSync(join(process.cwd(), "package.json"), { encoding: "utf8" })
    );
    return liveLinks || {};
  } catch (e) {
    return {};
  }
};
const getIgnoreMasks = () => {
  try {
    const { liveLink: { ignoreMasks } = {} } = JSON.parse(
      readFileSync(join(process.cwd(), "package.json"), { encoding: "utf8" })
    );
    return ignoreMasks || [];
  } catch (e) {
    return [];
  }
};
const setIgnoreMasks = (ignoreMasks) => {
  const o = JSON.parse(
    readFileSync(join(process.cwd(), "package.json"), { encoding: "utf8" })
  );
  writeFileSync(
    join(process.cwd(), "package.json"),
    JSON.stringify(
      { ...o, liveLink: { ...(o.liveLink || {}), ignoreMasks } },
      null,
      2
    )
  );
};
const setLiveLinks = (liveLinks) => {
  const o = JSON.parse(
    readFileSync(join(process.cwd(), "package.json"), { encoding: "utf8" })
  );
  writeFileSync(
    join(process.cwd(), "package.json"),
    JSON.stringify(
      { ...o, liveLink: { ...(o.liveLink || {}), liveLinks } },
      null,
      2
    )
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
module.exports = {
  runLink,
  getLiveLinks,
  setLiveLinks,
  watch,
  getIgnoreMasks,
  setIgnoreMasks,
};
