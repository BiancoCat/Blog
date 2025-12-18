---
title: Homebrew常用命令
published: 2025-03-27
description: '本文总结了Homebrew的常用命令，帮助用户更高效地管理macOS上的软件包。'
image: 'https://picsur.kbxx.cc/i/ab3679bb-cb31-4bcf-8a8f-d51c633871ec.webp'
tags: [macOS, Homebrew]
category: '笔记'
draft: false 
lang: ''
---

## 1.切换 x86 或 arm 版本

使用`x86`时需要设置`arch`，请注意`arm`版本的`Homebrew`不需要额外设置，终端打开后就是了。

想进入`x86`模式，请执行：

```shell
# 切换 x86_64
arch -x86_64 zsh

#查看 Homebrew 运行路径 “ opt 里的是 arm ｜ usr 里是 x86_64 ”
which brew
```

## 2.信息查询

```bash
# 查看 Homebrew 版本
➜  ~ brew -v

# 列出已安装的软件
➜  ~ brew list

# 使用浏览器打开 Homebrew 官网
➜  ~ brew home

# 查看包的详细信息
➜  ~ brew info 包名

# 检测系统中与Homebrew有关的潜在问题
➜  ~ brew doctor

# 查看包的所有版本
➜  ~ brew list --versions | grep 包名

# 以树形展示所有已安装包的依赖
➜  ~ brew deps --installed --tree
```

## 3.查找软件包

```bash
➜  ~ brew search git
➜  ~ brew search /^git$/
```

## 4.安装卸载安装包

```bash
➜  ~ brew install 包名
➜  ~ brew uninstall 包名
```

## 5.更新自身

```bash
➜  ~ brew update
```

## 6.更新包

```bash
# 查看哪些包有新版本可更新
➜  ~ brew outdated

# 更新所有包
➜  ~ brew upgrade

# 更新指定包
➜  ~ brew upgrade 包名
```

## 7.清理旧的升级包

⚠️ 注意：如果一个包当前有可更新的版本没有更新，执行清理时候只会提示一个警告，而不会执行清理操作。需要先升级到最新版本，值执行清理。

```bash
# 查看哪些包可清理
➜  ~ brew cleanup -n

# 清理所有
➜  ~ brew cleanup

# 清理指定包
➜  ~ brew cleanup 包名
```

## 8.锁定不想更新的包

```bash
# 锁定
➜  ~ brew pin 包名

# 解锁
➜  ~ brew unpin 包名
```

## 9.关联包

```bash
# 清理无效的关联，且清理与之相关的位于/Applications和~/Applications中的无用App链接
➜  ~ brew prune

# 将指定软件的安装文件symlink到Homebrew上
➜  ~ brew link 包名
```

