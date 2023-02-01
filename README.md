# Karasu

This is a music bot created by using the [sapphire framework][sapphire] & [discord-player@dev][discord-player] with this project being written in TypeScript.

## Features

- Music system with slash commands
- Hot Module Reloading
- ESlint configuration
- Built-in cooldown system
- Easy to configure and use

### Prerequisite

```sh
yarn install
yarn build
```

You should also go to `src/.env.example` and put in your `TOKEN` & `OWNERS` IDs then rename the file to `.env`, it is also recommended to add `src/.env` to your `.gitignore`

### How can I generate a command?

```sh
sapphire generate command <name>
```

This will automatically generate a slash command in the `src/commands` folder from the template in the `templates` folder

### Hot Module Reloading

It is advised to firstly build the dist folder and then use `yarn dev`, this will enable [@sapphire/plugin-hmr][sapphire-hmr] and will actively reload modules when they are updated.

### Development

This project can be run with `tsc-watch` to watch the files and automatically restart your bot.

```sh
yarn run watch:start
yarn dev
```

## License

Dedicated to the public domain via the [Unlicense], courtesy of the Sapphire Community and its contributors - [this license is generated from the Sapphire CLI]

[sapphire]: https://github.com/sapphiredev/framework
[sapphire-hmr]: https://www.npmjs.com/package/@sapphire/plugin-hmr
[discord-player]: https://github.com/Androz2091/discord-player/tree/develop
[unlicense]: https://github.com/sapphiredev/examples/blob/main/LICENSE.md
