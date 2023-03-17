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

###### You may follow these quick steps:

##### 1. Clone your forked repository to your local machine:

```sql
git clone git@github.com:<your_username>/<repository_name>.git
```

##### 2. Add the original repository as a remote upstream:

```sql
git remote add upstream git@github.com:<original_username>/<repository_name>.git
```

##### 3. Fetch the latest changes from the upstream repository:

```sql
git fetch upstream
```

##### 4. Merge the changes from the upstream repository into your local repository:

###### You may need to resolve merge conflicts if any changes in your forked repository conflict with the changes in the upstream repository.

```sql
git merge upstream/main
```

##### 5. Push the updated code to your forked repository on GitHub:

```sql
git push origin main
```

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

[sapphire]: https://github.com/sapphiredev/framework
[sapphire-hmr]: https://www.npmjs.com/package/@sapphire/plugin-hmr
[discord-player]: https://github.com/Androz2091/discord-player/tree/develop
