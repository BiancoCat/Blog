---
title: PVE环境配置Intel核显SR-IOV
published: 2026-06-09
description: ''
image: './image/image1.png'
tags: [ProxmoxVE, 直通]
category: '折腾'
draft: false 
lang: ''
---
### 前言
> 本文将介绍如何在Proxmox VE（PVE）环境中配置Intel核显的SR-IOV功能，让单个物理核显能够被多台虚拟机调用使用，从而提高图形处理性能，本文用的设备是 N100 的 CPU。

```
理论支持所有12代以后的 Intel 带核显的处理器
常见支持列表:
N100 N150 N200 N350 N355 8505
I3 12XXX 13XXX 14XXX
I5 12XXX 13XXX 14XXX
I7 12XXX 13XXX 14XXX
I9 12XXX 13XXX 14XXX
U5 245 U7 265 U9 285
确认支持列表Meteor-lake确认支持:
https://github.com/strongtz/i915-sriov-dkms/issues/210#issuecomment-2701882332
https://www.intel.com/content/www/us/en/ark/products/codename/232598/products-formerly-alder-laken.html
https://www.intel.com/content/www/us/en/ark/products/codename/238004/products-formerly-twin-lake.html
https://www.intel.com/content/www/us/en/ark/products/codename/147470/products-formerly-alder-lake.html
https://www.intel.com/content/www/us/en/ark/products/codename/215599/products-formerly-raptor-lake.html
https://www.intel.com/content/www/us/en/ark/products/series/241071/intel-core-ultra-processors-series-2.html
https://www.intel.com/content/www/us/en/ark/products/codename/90353/products-formerly-meteor-lake.html
```
1. 替换默认PVE9源 PS:不带ceph源

```
wget http://share.geekxw.top/pve9yuan.sh -O pve9yuan.sh && chmod +x pve9yuan.sh && ./pve9yuan.sh

apt update
```
2. 配置GRUB参数
```
nano /etc/default/grub
在 GRUB_CMDLINE_LINUX_DEFAULT 中添加 "i915.enable_guc=3 i915.max_vfs=7 module_blacklist=xe"
update-grub
```
3. 安装必要的软件包
```
apt install -y build-essential git dkms sysfsutils proxmox-headers-$(uname -r) intel-gpu-tools
```
4. 配置SR-IOV(这里 7 指的是虚拟显卡的数量，可以根据需要调整)
```
echo "devices/pci0000:00/0000:00:02.0/sriov_numvfs = 7" >> /etc/sysfs.conf
```
5. 安装i915-sriov驱动
```
# 下载地址：https://github.com/strongtz/i915-sriov-dkms/releases
dpkg -i i915-sriov-dkms_*_amd64.deb
```
5. 重启系统使配置生效
```
reboot
```
6. 验证配置是否生效
```
lspci

# 会显示所有的虚拟核显
root@longtailpve:~# lspci
00:00.0 Host bridge: Intel Corporation Alder Lake-N Processor Host Bridge/DRAM Registers
00:02.0 VGA compatible controller: Intel Corporation Alder Lake-N [UHD Graphics]
00:02.1 VGA compatible controller: Intel Corporation Alder Lake-N [UHD Graphics]
00:02.2 VGA compatible controller: Intel Corporation Alder Lake-N [UHD Graphics]
00:02.3 VGA compatible controller: Intel Corporation Alder Lake-N [UHD Graphics]
00:02.4 VGA compatible controller: Intel Corporation Alder Lake-N [UHD Graphics]
00:02.5 VGA compatible controller: Intel Corporation Alder Lake-N [UHD Graphics]
00:02.6 VGA compatible controller: Intel Corporation Alder Lake-N [UHD Graphics]
00:02.7 VGA compatible controller: Intel Corporation Alder Lake-N [UHD Graphics]
```
7. PVE 查看显卡占用情况
```
intel_gpu_top -d sriov
```