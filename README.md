# Karasu

This is a music bot created by using the [sapphire framework][sapphire] & [discord-player][discord-player] with this project being written in TypeScript.
It has also been tested with [bun](https://bun.sh/) which is a new JavaScript runtime, although it works in this project there may be some issues as it is still in beta, alternatively you may use `yarn`.

## Features

- Music system with slash commands
- Hot Module Reloading
- ESlint configuration
- Built-in cooldown system
- Easy to configure and use

## Forking

This repository may be frequently updated, so how can you keep up-to-date? You should either fork or clone this repository. In a terminal of your choice or any command line, whenever a new commit is made to this repo, you should run the `git pull` command in your forked/cloned version directory. This should automatically pull in any new changes made to `karasu` and this should then update your version.

### Prerequisite

```sh
bun install
bun run build
```

```sh
yarn install
yarn build
```

### How can I generate a command?

```sh
sapphire generate command <name>
```

This will automatically generate a slash command in the `src/commands` folder from the template in the `templates` folder

### Hot Module Reloading

It is advised to firstly build the dist folder using `bun run build` or `yarn run build` and then use `bun run karasu` or `yarn karasu`, this will enable [@sapphire/plugin-hmr][sapphire-hmr] and will actively reload modules when they are updated.

## License

Dedicated to the public domain via the [Unlicense], courtesy of the Sapphire Community and its contributors - [this license is generated from the Sapphire CLI]

[sapphire]: https://github.com/sapphiredev/framework
[sapphire-hmr]: https://www.npmjs.com/package/@sapphire/plugin-hmr
[discord-player]: https://github.com/Androz2091/discord-player/tree/develop
