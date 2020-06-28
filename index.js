const { join, relative, resolve } = require("path");
const rcopy = require("recursive-copy");
const {
  readFileSync,
  writeFileSync,
  existsSync,
  lstatSync,
  chmodSync,
  mkdirSync,
  copyFile,
} = require("fs");
const { spawnSync, spawn } = require("child_process");
const Deferred = require("es6-deferred");
const nodeWatch = require("node-watch");
const untildify = require("untildify");
const minimatch = require("minimatch");
const { SIGINT } = require("constants");
const nativeGlobs = ["/ios/**", "/android/**"];
const watch = (filterFunc, allowDefault = true) => {
  //Look for noti and bbplugin directory
  const {
    liveLink: {
      liveLinks,
      bbPath = "~/Documents/bbplugins",
      watchPath = "./",
      ignoreMasks = [],
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
          try {
            const lstat = lstatSync(join(process.cwd(), f));
            if (lstat.isDirectory()) {
              return false;
            }
          } catch (e) {
            return false;
          }
          if (
            ignoreMasks.some((mask) => {
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
const getReverseMasks = () => {
  try {
    const { liveLink: { reverseMasks } = {} } = JSON.parse(
      readFileSync(join(process.cwd(), "package.json"), { encoding: "utf8" })
    );
    return reverseMasks || [];
  } catch (e) {
    return [];
  }
};
const setReverseMasks = (reverseMasks) => {
  const o = JSON.parse(
    readFileSync(join(process.cwd(), "package.json"), { encoding: "utf8" })
  );
  writeFileSync(
    join(process.cwd(), "package.json"),
    JSON.stringify(
      { ...o, liveLink: { ...(o.liveLink || {}), reverseMasks } },
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
const runLink = async (liveLinks, reverseNative = true, initialCopy = true) => {
  if (!liveLinks) liveLinks = getLiveLinks();
  if (initialCopy) await copyOnce(liveLinks, false);
  const copyLog = [];
  //Get links from package.json
  const reverseMasks = [...nativeGlobs, ...getReverseMasks()];
  const watchers = [];
  if (liveLinks && Object.entries(liveLinks).length) {
    Object.entries(liveLinks).forEach(([dependencyName, source]) => {
      const dependencyPath = join(
        process.cwd(),
        "node_modules",
        dependencyName
      );
      if (existsSync(source)) {
        console.log("Adding listener for ", source, "to", dependencyPath);
        watchers.push(
          nodeWatch(
            source,
            {
              recursive: true,
              delay: 1000,
              filter: (path) => {
                console.log(
                  "evaluating for nativewatch",
                  path,
                  resolve(path),
                  copyLog[resolve(path)]
                );
                const rpath = relative(source, path);
                if ([".git", "node_modules"].some((t) => rpath.includes(t))) {
                  return false;
                }
                if (
                  reverseNative &&
                  reverseMasks.some((mask) => {
                    const match = minimatch("/" + rpath, mask);
                    return match;
                  }) &&
                  copyLog[resolve(path)] &&
                  Date.now() - copyLog[resolve(path)] < 2000
                ) {
                  console.log(
                    "This is native and I just reveiced a copy",
                    path
                  );
                  return false;
                }
                return true;
              },
            },
            (event, path) => {
              const rpath = relative(source, path);
              const target = join(dependencyPath, rpath);
              copyLog[resolve(target)] = Date.now();
              console.log("Adding to copyLog", resolve(target));
              copyFile(path, target, () => {
                console.log(
                  new Date().toISOString(),
                  "Copied",
                  path,
                  "to",
                  target
                );
              });
            }
          )
        );
        if (reverseNative) {
          console.log("Pushing native watcher for ", dependencyPath);
          watchers.push(
            nodeWatch(
              dependencyPath,
              {
                recursive: true,
                delay: 1000,
                filter: (path) => {
                  console.log(
                    "evaluating for nativewatch",
                    path,
                    resolve(path),
                    copyLog[resolve(path)]
                  );
                  const rpath = relative(dependencyPath, path);
                  if ([".git", "node_modules"].some((t) => rpath.includes(t)))
                    return false;
                  if (
                    !reverseMasks.some((mask) => {
                      const match = minimatch("/" + rpath, mask);
                      return match;
                    })
                  )
                    return false;
                  if (
                    copyLog[resolve(path)] &&
                    Date.now() - copyLog[resolve(path)] < 2000
                  ) {
                    console.log(
                      "I just received this, preventing bounce",
                      path
                    );
                    return false;
                  }
                  return true;
                },
              },
              (eventType, path) => {
                //send it home
                const rpath = relative(dependencyPath, path);
                const sourcePath = join(source, rpath);
                copyFile(path, sourcePath, () => {
                  copyLog[resolve(sourcePath)] = Date.now();
                  console.log("Adding to copyLog", resolve(sourcePath));
                  console.log(
                    new Date().toISOString(),
                    "Native (reverse): Copied",
                    path,
                    "to",
                    sourcePath
                  );
                });
              }
            )
          );
        }
      } else {
        console.warn(
          "source for link does not exist, continuing with others: ",
          source
        );
      }
    });
    console.log("Watching for changes in ", Object.values(liveLinks).join(","));
    process.on(SIGINT, () => watchers.map((w) => w.close()));
  }
};
const copyOnce = async (liveLinks, reverseNative = false) => {
  if (!liveLinks) liveLinks = getLiveLinks();
  for (const [dependencyName, source] of Object.entries(liveLinks)) {
    if (existsSync(source)) {
      ``;
      let dest = join(process.cwd(), "node_modules", dependencyName);
      if (!existsSync(dest)) {
        try {
          mkdirSync(dest);
        } catch (e) {}
      }
      if (!existsSync(dest)) {
        console.warn("No such dependency path", dest);
        return;
      }
      console.log("Copying from", source, "to", dest);
      await rcopy(source, dest, {
        filter: (path) => {
          // console.log("Looking at ", path);
          if (path.startsWith("node_modules")) return false;
          if (path.startsWith(".git/")) return false;
          if (reverseNative && nativePaths.some(path.includes)) return false;
          return true;
        },
        overwrite: true,
        dot: true,
        junk: true,
      });
      if (reverseNative) {
        await Promise.all(
          nativePaths.map(async (nativePath) => {
            const fullNativePath = join(source, nativePath);
            if (existsSync(fullNativePath)) {
              //Move that back home
              await rcopy(fullNativePath, source);
            }
          })
        );
      }
      if (reverseNative)
        console.log(
          "Completed copy from",
          source,
          "to",
          dest,
          "except for native code, which went the other way"
        );
      else console.log("Completed copy from", source, "to", dest);
    }
  }
};
module.exports = {
  runLink,
  getLiveLinks,
  setLiveLinks,
  watch,
  getIgnoreMasks,
  setIgnoreMasks,
  copyOnce,
  getReverseMasks,
  setReverseMasks,
};
