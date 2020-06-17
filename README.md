# livelink

Easy-to-use linker for live sync of project dependencies

## Installation

```
yarn add livelink
```

## Usage

```
❯ yarn livelink --help
Usage: livelink [options] [command]

Options:
  -h, --help            display help for command

Commands:
  add <source>          Link <source> to update node_modules path for the package name defined in
                        package.json
  clear                 Remove all livelinks
  start                 start running all links defined in 'livelink list'
  addlocal              Add all local dependencies and devDependencies (e.g. path starts with a .) as
                        livelinks
  list                  List livelinks that will be launched at start (all in package.json)
  remove <dependency>   Remove one livelink
  ignore <mask>         Add glob of file(s) to ignore
  remove-ignore <mask>  Remove ignore glob
  list-ignores          List ignored globs
  watch                 Watch current dir and run onwatch yarn script when I see local files or
                        livelinks change
  code                  Launch visual studio code for all linked dependencies
  once                  Copy sources to dependencies once (does not use watchman)
  help [command]        display help for command
```

### add

### clear

### start

### addlocal

### list

### remove

### ignore

### remove-ignore

### list-ignores

### once

### watch

### code

```
yarn livelink code
```

Launches all livelinked dependencies in their own Visual Studio Code windows - handy for quickly building out a development environment.
