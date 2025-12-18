---
title: OpenWrt系统打包
published: 2025-04-17
description: '今天终于把自己折腾炸了的旁路由修好了，但是为了防止自己手贱，完决定把部署好的 OpenWrt 打包成 img 镜像备份，下次炸了就可以一键还原。'
image: 'https://picsur.kbxx.cc/i/c7b2681d-3c38-4207-a30b-d34de3d02c50.webp'
tags: [OpenWrt, Linux]
category: '笔记'
draft: false 
lang: ''
---

## 前言
> 今天终于把自己折腾炸了的旁路由修好了，但是为了防止自己手贱，完决定把部署好的 OpenWrt 打包成 img 镜像备份，下次炸了就可以一键还原。
废话少说我们开始吧！

## OpenWrt 系统打包
1. 查看磁盘分区，使用 ```lsblk``` 命令，可以看到 sda 就是我们 OpenWrt 系统使用的磁盘了，而 sdb 是我们新挂载的磁盘，挂载在 /newssd 目录下。
```
[root@OpenWrt:02:11 AM ~] # lsblk

NAME   MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
loop0    7:0    0 956.6M  0 loop /overlay
sda      8:0    0     1G  0 disk 
├─sda1   8:1    0    16M  0 part /mnt/sda1
│                                /boot
│                                /boot
└─sda2   8:2    0  1004M  0 part /rom
sdb      8:16   0    10G  0 disk 
└─sdb1   8:17   0    10G  0 part /newssd
sr0     11:0    1  1024M  0 rom  
zram0  253:0    0   661M  0 disk [SWAP]
```
2. 使用 dd 命令把 sda 磁盘分区完整的打包并且放在 newssd 目录下
```
[root@OpenWrt:02:01 AM /newssd] # dd if=/dev/sda of=/newssd/openwrt.img count=4048 bs=1024k  conv=sync

1024+0 records in
1024+0 records out
```
等待dd命令运行完成后，就得到了RAW格式的openwrt.img镜像

dd命令参数的含义：

- if=文件名：输入文件名，缺省为标准输入。即指定源文件。< if=/dev/sdb >
- of=文件名：输出文件名，缺省为标准输出。即指定目的文件。< of=./backup/backup.img, 这里的.img是镜像的格式，转成.img格式的文件后方便后续使用etcher烧录镜像 >
- bs = bytes：同时设置读入/输出的块大小为bytes个字节，此处填的是1024k，表示1M大小。
- count = blocks：仅拷贝blocks个块，块大小等于ibs指定的字节数，此处设置的是2048， 表示2048个bs，也就是2g。
- conv= sync：将每个输入块填充到ibs个字节，不足部分用空（NUL）字符补齐。

## 注意
新磁盘的大小一定要大于 OpenWrt 系统磁盘的大小，不然会出错！
