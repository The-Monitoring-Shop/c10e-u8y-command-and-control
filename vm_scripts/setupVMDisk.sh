#!/usr/bin/env bash
# ********************************************************************************************************************************************************
#
# The Monitoring Shop & Chronosphere
#
# setupVMDisk.sh
#
#   Setup a new data disk on a VM server for use as C&C
#
# Version History
#
# Version	  Date		    Author		        Description
# 1.0.0	    06/11/2023	Mark Kelly-Smith  MVP
# ********************************************************************************************************************************************************

echo "===================="
echo "Setting up data disk"
echo "===================="

mount_point="/mnt/disks/google-university"

if [[ -f $mount_point/setupVMDisk.done ]]; then
  echo "This script has already been run!"
  echo "If you wish to re-run it, please delete the file $mount_point/setupVMDisk.done"
  exit 1
fi

echo "..formatting data disk"
echo "======================"
sudo mkfs.ext4 -m 0 -E lazy_itable_init=0,lazy_journal_init=0,discard /dev/sdb

echo "..mounting data disk"
echo "===================="
sudo mkdir -p $mount_point
sudo mount -o discard,defaults /dev/sdb $mount_point

echo "..creating folders"
echo "===================="
sudo mkdir -p $mount_point/git
sudo mkdir -p $mount_point/shared_config

echo "..downloading scripts"
echo "====================="
sudo curl -fsSL https://raw.githubusercontent.com/The-Monitoring-Shop/c10e-u8y-command-and-control/main/vm_scripts/setupVMDisk.sh -o $mount_point/shared_config/setupVMDisk.sh
sudo curl -fsSL https://raw.githubusercontent.com/The-Monitoring-Shop/c10e-u8y-command-and-control/main/vm_scripts/setupVM.sh -o $mount_point/shared_config/setupVM.sh
sudo curl -fsSL https://raw.githubusercontent.com/The-Monitoring-Shop/c10e-u8y-command-and-control/main/vm_scripts/setupVMChild.sh -o $mount_point/shared_config/setupVMChild.sh
sudo curl -fsSL https://raw.githubusercontent.com/The-Monitoring-Shop/c10e-u8y-command-and-control/main/vm_scripts/setupUser.sh -o $mount_point/shared_config/setupUser.sh
sudo curl -fsSL https://raw.githubusercontent.com/The-Monitoring-Shop/c10e-u8y-command-and-control/main/vm_scripts/gcloudrc -o $mount_point/shared_config/gcloudrc
sudo chmod +x $mount_point/shared_config/*

echo "=========="
echo "GCloud CLI"
echo "=========="
echo "..removing GCloud CLI snap"
echo "=========================="
sudo snap remove google-cloud-cli

echo "..installing GCloud CLI"
echo "======================="
sudo curl -fsSL https://sdk.cloud.google.com -o $mount_point/shared_config/installGCloudCLI.sh
sudo bash $mount_point/shared_config/installGCloudCLI.sh --disable-prompts --install-dir=$mount_point

touch $mount_point/setupVMDisk.done
