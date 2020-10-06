
<a name="__climd"></a>

# Usage
```bash
npx @raydeck/livelink [options] [command]
```
# Commands
## add \<`source`>
Link <source> to update node_modules path for the package name defined in package.json
### Usage
```bash
npx @raydeck/livelink add [options] <source>
```
## clear
Remove all livelinks
### Usage
```bash
npx @raydeck/livelink clear [options]
```
## start
start running all links defined in 'livelink list'
### Usage
```bash
npx @raydeck/livelink start [options]
```
## add-local
Add all local dependencies and devDependencies (e.g. path starts with a .) as livelinks
### Usage
```bash
npx @raydeck/livelink add-local [options]
```
## list
List livelinks that will be launched at start (all in package.json)
### Usage
```bash
npx @raydeck/livelink list [options]
```
## remove \<`dependency`>
Remove one livelink
### Usage
```bash
npx @raydeck/livelink remove [options] <dependency>
```
## ignore
Manage list of masks to ignore for watch
### Usage
```bash
npx @raydeck/livelink ignore [options]
```
## add \<`mask`>
Add glob of file(s) to ignore
### Usage
```bash
npx @raydeck/livelink add [options] <mask>
```
## remove \<`mask`>
Remove ignore glob
### Usage
```bash
npx @raydeck/livelink remove [options] <mask>
```
## list
List ignored globs
### Usage
```bash
npx @raydeck/livelink list [options]
```
## reverse
Manage reverse links
### Usage
```bash
npx @raydeck/livelink reverse [options] [command]
```
### Subcommands
#### add \<`mask`>
Add glob of file(s) to reverse-link (e.g. send from node_modules to the source
##### Usage
```bash
npx @raydeck/livelink reverse add [options] <mask>
```
#### remove \<`mask`>
Remove reverse glob
##### Usage
```bash
npx @raydeck/livelink reverse remove [options] <mask>
```
#### list
List reversed globs
##### Usage
```bash
npx @raydeck/livelink reverse list [options]
```
## watch
Watch current dir and run onwatch yarn script when I see local files or livelinks change
### Usage
```bash
npx @raydeck/livelink watch [options]
```
## code [`dependency`]
Launch visual studio code for a linked dependency (blank to open them all
### Usage
```bash
npx @raydeck/livelink code [options] [dependency]
```
## once [`dependency`]
Copy source to dependency path once (leave dependency blank to copy all)
### Usage
```bash
npx @raydeck/livelink once [options] [dependency]
```
### Options
* -r, --reverse-native Reverse native linking (e.g. send from dependency to source) 

<a name="_librarymd"></a>

**[@raydeck/livelink - v2.0.0](README.md)**

> Globals

# @raydeck/livelink - v2.0.0

## Index

### Variables

* [ignore](#ignore)
* [nativeGlobs](#nativeglobs)
* [reverse](#reverse)

### Functions

* [copyOnce](#copyonce)
* [getIgnoreMasks](#getignoremasks)
* [getLiveLinks](#getlivelinks)
* [getReverseMasks](#getreversemasks)
* [makeDeferred](#makedeferred)
* [runLink](#runlink)
* [setIgnoreMasks](#setignoremasks)
* [setLiveLinks](#setlivelinks)
* [setReverseMasks](#setreversemasks)
* [watch](#watch)

## Variables

### ignore

• `Const` **ignore**: CommanderStatic = commander.command( "ignore", "Manage list of masks to ignore for watch")

*Defined in bin.ts:93*

___

### nativeGlobs

• `Const` **nativeGlobs**: string[] = ["/ios/**", "/android/**"]

*Defined in index.ts:19*

___

### reverse

• `Const` **reverse**: Command = commander .command("reverse") .description("Manage reverse links")

*Defined in bin.ts:119*

## Functions

### copyOnce

▸ **copyOnce**(`liveLinks`: { [key:string]: string;  }, `reverseNative`: boolean): Promise\<void>

*Defined in index.ts:415*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`liveLinks` | { [key:string]: string;  } | {} |
`reverseNative` | boolean | false |

**Returns:** Promise\<void>

___

### getIgnoreMasks

▸ **getIgnoreMasks**(): string[]

*Defined in index.ts:208*

**Returns:** string[]

___

### getLiveLinks

▸ **getLiveLinks**(): object

*Defined in index.ts:196*

**Returns:** object

___

### getReverseMasks

▸ **getReverseMasks**(): string[]

*Defined in index.ts:233*

**Returns:** string[]

___

### makeDeferred

▸ **makeDeferred**\<ReturnType>(): object

*Defined in Deferred.ts:1*

#### Type parameters:

Name |
------ |
`ReturnType` |

**Returns:** object

Name | Type |
------ | ------ |
`promise` | Promise\<ReturnType> |
`reject?` | undefined \| (reason: string \| Error) => void |
`resolve?` | undefined \| (arg: ReturnType) => void |

___

### runLink

▸ **runLink**(`liveLinks?`: undefined \| { [key:string]: string;  }, `reverseNative`: boolean, `initialCopy`: boolean): Promise\<void>

*Defined in index.ts:275*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`liveLinks?` | undefined \| { [key:string]: string;  } | - |
`reverseNative` | boolean | true |
`initialCopy` | boolean | true |

**Returns:** Promise\<void>

___

### setIgnoreMasks

▸ **setIgnoreMasks**(`ignoreMasks`: string[]): void

*Defined in index.ts:220*

#### Parameters:

Name | Type |
------ | ------ |
`ignoreMasks` | string[] |

**Returns:** void

___

### setLiveLinks

▸ **setLiveLinks**(`liveLinks`: { [key:string]: string;  }): void

*Defined in index.ts:260*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`liveLinks` | { [key:string]: string;  } | {} |

**Returns:** void

___

### setReverseMasks

▸ **setReverseMasks**(`reverseMasks?`: string[]): void

*Defined in index.ts:245*

#### Parameters:

Name | Type |
------ | ------ |
`reverseMasks?` | string[] |

**Returns:** void

___

### watch

▸ **watch**(`filterFunc?`: undefined \| (filter: string) => boolean, `allowDefault`: boolean): void

*Defined in index.ts:20*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`filterFunc?` | undefined \| (filter: string) => boolean | - |
`allowDefault` | boolean | true |

**Returns:** void
