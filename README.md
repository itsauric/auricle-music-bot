[![Sponsor itsauric](https://img.shields.io/badge/Sponsor-itsauric-pink?style=for-the-badge&logo=github)](https://github.com/sponsors/itsauric)

# 🎶 Auricle

This is a music bot created by using the [sapphire framework][sapphire] & [discord-player][discord-player] with this project being written in TypeScript.

## 🚀 Features
- **Slash Commands**: Intuitive commands for playing music, skipping tracks, and managing playlists
- **Hot Module Reloading**: Make changes in real-time without restarting the bot
- **Built-in Cooldown System**: Helps manage command usage and prevents spamming
- **Easy Setup**: Simple installation and configuration process for seamless integration

## 📦 Installation

### Prerequisites
- **Node.js** (v18 or higher)
- **Yarn package manager** (or a package manager of your choice)

### Installation steps
```bash
git clone https://github.com/itsauric/auricle-music-bot.git
cd auricle-music-bot
```
```bash
yarn install
yarn run build
```

### Getting Started
```bash
yarn run auricle
```

## ⚙️ Generating Commands

###### Before hand you should have the `sapphire` cli globally or installed in your `devDependencies`
```bash
sapphire generate command <name>
```
This will automatically generate a slash command in the `src/commands` folder from the template in the `templates` folder.

## 🔄 Keeping Up to Date

This is from the [GitHub Blog][github] and is a straightforward example for updating your forked repository.

## 🤝 Contribution

Anyone can contribute, please open a pull request on the [repository](repo)

## 💬 Feedback and Support

For any issues, questions, or suggestions, please open an issue on the [repository](repo

## 📄 Acknowledgements

Thanks to all contributors and supporters of this project.

## 📜 License

This project is under the **MIT** license. You can find the license details in the root of the repository as `LICENSE`.

[repo]: https://github.com/itsauric/auricle-music-bot
[github]: https://github.blog/changelog/2021-05-06-sync-an-out-of-date-branch-of-a-fork-from-the-web/
[sapphire]: https://github.com/sapphiredev/framework
[discord-player]: https://github.com/Androz2091/discord-player/tree/develop
