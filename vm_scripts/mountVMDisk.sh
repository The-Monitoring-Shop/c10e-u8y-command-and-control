#!/usr/bin/env bash
# ********************************************************************************************************************************************************
#
# The Monitoring Shop & Chronosphere
#
# mountVMDisk.sh
#
#   Mount an already configured data disk on a VM server for use as C&C
#
# Version History
#
# Version	  Date		    Author		        Description
# 1.0.0	    06/11/2023	Mark Kelly-Smith  MVP
# ********************************************************************************************************************************************************

mount_point="/mnt/disks/google-university"
mount_check=$(mount | grep $mount_point | wc -l)

# If we havent already mounted
if [[ $mount_check == 0 ]]; then
  echo "=================="
  echo "Mounting data disk"
  echo "=================="
  sudo mkdir -p $mount_point
  sudo mount -o discard,defaults /dev/sdb $mount_point
fi
