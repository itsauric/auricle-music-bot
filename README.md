# Karasu

This is a music bot created by using the [sapphire framework][sapphire] & [discord-player][discord-player] with this project being written in TypeScript.

## Prerequisites

Before you get started, you will need the following:

- Node.js (v18 or higher)
- Yarn package manager (or a package manager of your choice)

```sh
yarn install
yarn run build
```

## Features

- A music system built with **slash** commands
- Hot module reloading to **never** have to restart
- Built-in **cooldown** system
- Easy to **configure** and **use**


## Keeping your Forked Repository Up to Date

###### This is from a [GitHub Blog][github] and is a straightforward example for updating your forked repository

![update example](https://i0.wp.com/user-images.githubusercontent.com/7900087/117183982-10df5d80-ad8d-11eb-9570-0a95bc1bf6bb.gif?ssl=1)

## How can I generate a command?

###### Before hand you should have the `sapphire` cli globally or installed in your `devDependencies`

```sh
sapphire generate command <name>
```

##### This will automatically generate a slash command in the `src/commands` folder from the template in the `templates` folder

## Hot Module Reloading

It is advised to firstly build the dist folder using `yarn run build` and then use `yarn run karasu`, this will enable [@sapphire/plugin-hmr][sapphire-hmr] and will actively reload modules when they are updated.

# License

Dedicated to the public domain via the **Unlicense**
###### The license can be found in the root named as `LICENSE`

[github]: https://github.blog/changelog/2021-05-06-sync-an-out-of-date-branch-of-a-fork-from-the-web/
[sapphire]: https://github.com/sapphiredev/framework
[sapphire-hmr]: https://www.npmjs.com/package/@sapphire/plugin-hmr
[discord-player]: https://github.com/Androz2091/discord-player/tree/develop
