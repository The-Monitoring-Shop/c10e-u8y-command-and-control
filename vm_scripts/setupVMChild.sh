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

echo "Updating folders"
echo "================"
cd /opt

# Setting access/ownership
sudo chmod 775 .
sudo chown -R root:docker .

# Creating subfolders
mkdir -p /opt/git

# Copy setupUser.sh from GitHub
sudo curl -fsSL https://raw.githubusercontent.com/The-Monitoring-Shop/c10e-u8y-command-and-control/main/vm_scripts/setupUser.sh -o /opt/shared_config/setupUser.sh
chmod +x /opt/shared_config/setupUser.sh

echo "========================"
echo "Removing GCloud CLI snap"
echo "========================"
sudo snap remove google-cloud-cli

echo "Installing GCloud CLI"
echo "====================="
# curl -O https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-450.0.0-linux-x86_64.tar.gz
# tar -xf google-cloud-cli-450.0.0-linux-x86_64.tar.gz
# sudo ./google-cloud-sdk/install.sh

curl -fsSL https://sdk.cloud.google.com -o /opt/shared_config/installGCloudCLI.sh
sudo bash /opt/shared_config/installGCloudCLI.sh --disable-prompts --install-dir=/opt/shared_config

sudo curl -fsSL https://raw.githubusercontent.com/The-Monitoring-Shop/c10e-u8y-command-and-control/main/vm_scripts/gcloudrc -o /opt/shared_config/gcloudrc
# sudo chmod 775 /opt/shared_config/gcloudrc
source /opt/shared_config/gcloudrc

echo "..Installing components"
echo "======================="
sudo gcloud components install gke-gcloud-auth-plugin
