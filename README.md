# Argo

![Version](https://img.shields.io/badge/version-stable-blue)
![License](https://img.shields.io/badge/license-MIT-green)

Argo is a multipurpose Discord Bot

> [!IMPORTANT]
> This Bot is still under development, bugs may occur

## Features

- Website: A website with landing and commands page
- Commands: Some commands (see src/commands)

## Requirements

- Node.js v23+
- Discord Bot Token

## Running

A quick guide to setup Argo

### Clone

```
git clone https://github.com/zt3xdv/argo
cd argo
```

### Install

```
npm install
```

### Configure

```
cp .env.example .env
# edit .env file
```

### Deploy commands and start it up

```
ts-node src/deploy.ts
ts-node src/main.ts
```
