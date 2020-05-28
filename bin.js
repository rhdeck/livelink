#!/usr/bin/env node
const { join, dirname } = require("path");
const { lstatSync } = require("fs");
const { runLink, getLiveLinks, setLiveLinks, watch } = require("./");
const { spawnSync } = require("child_process");
const commander = require("commander");
commander
  .command("add <dependency> <source>")
  .description("Link <source> to update node_modules path for <dependency>")
  .action((dependency, source) => {
    const liveLinks = getLiveLinks();
    setLiveLinks({ ...liveLinks, [source]: dependency });
    console.log("Added link from ", source, "to", dependency);
  });
commander
  .command("clear")
  .description("Remove all livelinks")
  .action(() => {
    setLiveLinks({});
    runLink(null);
    console.log("Cleared all cached links");
  });
commander
  .command("start")
  .description("start running all links defined in 'livelink list'")
  .action(() => {
    console.log("Starting");
    runLink(getLiveLinks());
  });
commander
  .command("addlocal")
  .description(
    "Add all local dependencies and devDependencies (e.g. path starts with a .) as livelinks"
  )
  .action(() => {
    const { dependencies = {}, devDependencies = {} } = require(join(
      process.cwd(),
      "package.json"
    ));
    const locals = Object.entries({ ...dependencies, ...devDependencies })
      .filter(([dependency, path]) => path.startsWith("."))
      .map(([dependency, path]) => {
        lstat = lstatSync(path);
        if (lstat.isFile()) path = dirname(path);
        return [dependency, path];
      })
      .reduce((o, [dependency, path]) => ({ ...o, [dependency]: path }), {});
    const liveLinks = getLiveLinks() || {};
    setLiveLinks({ ...liveLinks, ...locals });
    console.log("updated liveLinks to:");
    console.log(JSON.stringify(getLiveLinks(), null, 2));
  });
commander
  .command("list")
  .description(
    "List livelinks that will be launched at start (all in package.json)"
  )
  .action(() => {
    console.log(JSON.stringify(getLiveLinks(), null, 2));
  });
commander
  .command("remove <dependency>")
  .description("Remove one livelink")
  .action((dependency) => {
    const links = getLiveLinks();
    delete links[dependency];
    setLiveLinks(links);
    console.log("Removed", dependency);
  });
commander
  .command("watch")
  .description(
    "Watch current dir and run onwatch yarn script when I see local files or livelinks change"
  )
  .action(watch);
commander
  .command("code")
  .description("Launch visual studio code for all linked dependencies")
  .action(() => {
    const liveLinks = getLiveLinks();
    Object.values(liveLinks).forEach((path) =>
      spawnSync("code", [path], { stdio: "inherit" })
    );
  });
commander.parse();
