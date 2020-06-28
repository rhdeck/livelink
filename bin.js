#!/usr/bin/env node
const { join, dirname } = require("path");
const { lstatSync, existsSync, readFileSync } = require("fs");
const {
  runLink,
  getLiveLinks,
  setLiveLinks,
  watch,
  getIgnoreMasks,
  setIgnoreMasks,
  copyOnce,
  getReverseMasks,
  setReverseMasks,
} = require("./");
const { spawnSync } = require("child_process");
const commander = require("commander");
commander
  .command("add <source>")
  .description(
    "Link <source> to update node_modules path for the package name defined in package.json"
  )
  .action((source) => {
    //find source
    const packagePath = join(source, "package.json");
    if (existsSync(packagePath)) {
      const { name: dependency } = JSON.parse(
        readFileSync(packagePath, { encoding: "utf8" })
      );
      const liveLinks = getLiveLinks();
      setLiveLinks({ ...liveLinks, [dependency]: source });
      console.log("Added link from ", source, "to", dependency);
    } else {
      console.error("Could not find a valid package at path", source);
    }
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
  .command("ignore <mask>")
  .description("Add glob of file(s) to ignore")
  .action((mask) => {
    const ignores = getIgnoreMasks();
    ignores.push(mask);
    setIgnoreMasks(ignores);
  });
commander
  .command("remove-ignore <mask>")
  .description("Remove ignore glob")
  .action((mask) => {
    const ignores = getIgnoreMasks().filter((m) => m !== mask);
    setIgnoreMasks(ignores);
  });
commander
  .command("list-ignores")
  .description("List ignored globs")
  .action(() => {
    const ignores = getIgnoreMasks();
    console.log(JSON.stringify(ignores, null, 2));
  });
commander
  .command("reverse <mask>")
  .description(
    "Add glob of file(s) to reverse-link (e.g. send from node_modules to the source"
  )
  .action((mask) => {
    const ignores = getReverseMasks();
    ignores.push(mask);
    setReverseMasks(ignores);
  });
commander
  .command("remove-reverse <mask>")
  .description("Remove reverse glob")
  .action((mask) => {
    const ignores = getReverseMasks().filter((m) => m !== mask);
    setReverseMasks(ignores);
  });
commander
  .command("list-reverses")
  .description("List reversed globs")
  .action(() => {
    const ignores = getReverseMasks();
    console.log(JSON.stringify(ignores, null, 2));
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
commander
  .command("once [dependency]")
  .description(
    "Copy source to dependency path once (leave dependency blank to copy all)"
  )
  .option(
    "-r, --reverse-native",
    "Reverse native linking (e.g. send from dependency to source)"
  )
  .action(async (dependency) => {
    const liveLinks = getLiveLinks();
    if (dependency) await copyOnce({ [dependency]: liveLinks[dependency] });
    else await copyOnce(liveLinks, commander.reverseNative);
  });
commander.parse();
