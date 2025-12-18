---
title: 配置steam下载直连
published: 2025-06-12
description: '配置路由让steam客户端下载游戏时走直连，提升下载速度。'
image: 'https://picsur.kbxx.cc/i/99ced492-ccbe-4347-8674-41552aaed087.jpg'
tags: [Steam, Linux]
category: '随记'
draft: false 
lang: ''
---

# 路由配置里添加 steam 下载走直连
> 配置路由以下直连即可：
```
geosite:steam@cn
domain:steamserver.net
```
解释：

1. steam 客户端通过 `steamserver.net` 最终判断下载位置，该域名在 `geosite:steam` 中，且没有 `@cn` 标记。
2. 若 `steamserver.net` 经过代理，则 steam 会从 `steamcontent.com` 域名下载游戏（例如 `cache1-hkg1.steamcontent.com`）。
3. 若 `steamserver.net` 不经过代理，则 steam 会从 `xz.pphimalayanrt.com` 域名（阿里云）下载游戏，该域名在 `geosite:steam@cn` 中。
4. 该操作不影响 `steamcommunity.com` 等没有 `@cn` 标记的域名，这些域名依旧会被代理。