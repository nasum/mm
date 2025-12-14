# mm

An Electron-based desktop application for managing local image and video collections.

## Features

### 📂 Media Management
- **Library Management**: Automatically lists images (jpg, png, gif, webp, bmp) and videos (mp4, mov, webm, mkv, avi) in your specified library folder.
- **Drag & Drop**: Easily add files to your library by dropping them directly into the window.
- **Folder Organization**: Organize your files by creating and moving them into subfolders via the context menu.

### 🏷️ Tag Management
- **Tagging**: Create and attach custom tags to your media files.
- **Tag List**: View a list of all tags to manage them or see usage counts.
- **Filtering**: Click on tags to filter and display only the associated media.

### ⚙️ Settings & Customization
- **Library Path**: Change the location of your media library at any time.
- **Data Directory Management**: View or change the location where the database and settings are stored (includes data migration).
- **State Persistence**: Remembers window size, position, and sidebar state across restarts.

## Development Setup

### Recommended Environment
- Node.js v20 or higher
- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

### Installation
```bash
$ npm install
```

### Start Development Server
```bash
$ npm run dev
```

### Build
Create installers for your operating system.

```bash
# Windows
$ npm run build:win

# macOS
$ npm run build:mac

# Linux
$ npm run build:linux
```

## Release Workflow
Releases are automated using GitHub Actions.

1. Update the `version` in `package.json`.
2. Push (or merge) changes to the `main` branch.
3. A Git tag (e.g., `v1.0.0`) is automatically created, triggering a release build.
4. Once complete, installers are uploaded to GitHub Releases.

## Tech Stack
- **Framework**: Electron, Vite
- **Frontend**: React, TypeScript, React Router
- **Database**: SQLite (better-sqlite3)
- **Styling**: Vanilla CSS
- **Deployment**: electron-builder, GitHub Actions
