#!/usr/bin/env node
const watch = require("node-watch");
const cwd = __dirname;
const { execSync } = require("child_process");
process.cwd(cwd);
try {
  execSync("yarn build", { stdio: "inherit" });
} catch (e) {}
watch(
  "./",
  {
    filter: (f) =>
      !/node_modules/.test(f) && (/.ts$/.test(f) || /\.js$/.test(f)),
  },
  () => {
    try {
      execSync("yarn onwatch", { stdio: "inherit" });
    } catch (e) {}
  }
);
