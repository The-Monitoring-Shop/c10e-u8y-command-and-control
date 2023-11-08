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

mount_dev="/dev/sdb"
mount_dev_name="${mount_dev#/dev/}"
mount_point="/mnt/disks/google-university"

mount_check=$(mount | grep $mount_point | wc -l)
# Is disk mounted
if [[ $mount_check == 0 ]]; then

  # Is disk formatted
  format_check=$(lsblk -f | grep $mount_dev_name | cut -d' ' -f6)
  if [[ ! $format_check == "ext4" ]]; then
    echo "..formatting data disk"
    echo "======================"
    sudo mkfs.ext4 -m 0 -E lazy_itable_init=0,lazy_journal_init=0,discard $mount_dev
  fi

  # Do we have entry in fstab
  fstab_check=$(grep $mount_point /etc/fstab | wc -l)
  if [[ $fstab_check == 0 ]]; then
    echo "..mounting data disk"
    echo "===================="
    sudo test -d $mount_point || mkdir -p $mount_point
    sudo test -f /etc/fstab.backup || cp /etc/fstab /etc/fstab.backup
    mount_uuid=$(sudo blkid --output value $mount_dev | head -1)
    echo "UUID=$mount_uuid $mount_point ext4 discard,defaults,nofail 0 2" | sudo tee --append /etc/fstab
  fi

  # Try and mount
  sudo mount -a

else
  # If we have already mounted
  if [[ -f $mount_point/setupVMDisk.done ]]; then
    echo "This script has already been run!"
    echo "If you wish to re-run it, please delete the file $mount_point/setupVMDisk.done"
    exit 1
  fi
fi

echo "..creating folders"
echo "===================="
sudo mkdir -p $mount_point/git
sudo mkdir -p $mount_point/shared_config

sudo chmod g+w /opt/
sudo chmod g+w $mount_point/

echo "..downloading scripts"
echo "====================="
sudo curl -fsSL https://raw.githubusercontent.com/The-Monitoring-Shop/c10e-u8y-command-and-control/main/vm_scripts/setupVMDisk.sh -o $mount_point/shared_config/setupVMDisk.sh
sudo curl -fsSL https://raw.githubusercontent.com/The-Monitoring-Shop/c10e-u8y-command-and-control/main/vm_scripts/setupVM.sh -o $mount_point/shared_config/setupVM.sh
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

echo "============"
echo "Setting MOTD"
echo "============"
sudo curl -fsSL https://raw.githubusercontent.com/The-Monitoring-Shop/c10e-u8y-command-and-control/main/vm_scripts/99-c10e -o /etc/update-motd.d/99-c10e
sudo chmod +x /etc/update-motd.d/99-c10e

sudo touch $mount_point/setupVMDisk.done
