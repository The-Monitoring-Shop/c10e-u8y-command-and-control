#!/usr/bin/env bash
# ********************************************************************************************************************************************************
#
# The Monitoring Shop & Chronosphere
#
# setupVMChild.sh
#
#   Continues setup of a new VM server for use as C&C
#
# Version History
#
# Version	  Date		    Author		        Description
# 1.0.0	    06/11/2023	Mark Kelly-Smith  MVP
# ********************************************************************************************************************************************************

echo "...now in child script"
echo "======================"
echo ""

echo "============================="
echo "Setting up folders and access"
echo "============================="

mount_point="/mnt/disks/google-university"
mount_check=$(mount | grep $mount_point | wc -l)

# If we havent already mounted
if [[ $mount_check == 0 ]]; then
  echo "..mounting data disk"
  echo "===================="
  sudo mkdir -p $mount_point
  sudo mount -o discard,defaults /dev/sdb $mount_point
fi

echo "..setting access"
echo "================"
sudo chown -R c10e:docker $mount_point/git/
sudo chown -R c10e:docker $mount_point/google-cloud-sdk/
sudo chown -R c10e:docker $mount_point/shared_config/

sudo chmod -R g+w $mount_point/git/
sudo chmod -R g+w $mount_point/google-cloud-sdk/
sudo chmod -R g+w $mount_point/shared_config/

echo "..symlinking folders"
echo "===================="
sudo ln -s $mount_point/git /opt/git
sudo ln -s $mount_point/google-cloud-sdk /opt/google-cloud-sdk
sudo ln -s $mount_point/shared_config /opt/shared_config

source /opt/shared_config/gcloudrc

echo "================================"
echo "Installing GCloud CLI components"
echo "================================"
sudo /mnt/disks/google-university/google-cloud-sdk/bin/gcloud components install gke-gcloud-auth-plugin
