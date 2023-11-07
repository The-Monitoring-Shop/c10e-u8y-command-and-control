#!/usr/bin/env bash
# ********************************************************************************************************************************************************
#
# The Monitoring Shop & Chronosphere
#
# setupVM.sh
#
#   Setup a new VM server for use as C&C
#
# Version History
#
# Version	  Date		    Author		        Description
# 1.0.0	    06/11/2023	Mark Kelly-Smith  MVP
# ********************************************************************************************************************************************************

if [[ $(uname -v) =~ "Ubuntu" ]]; then
  echo "Ubuntu detected, continuing..."
  echo "=============================="

  mount_point="/mnt/disks/google-university"

  if [[ -f $mount_point/setupVM.done ]]; then
    echo "This script has already been run!"
    echo "If you wish to re-run it, please delete the file $mount_point/setupVM.done"
    exit 1
  fi

  echo "Running apt update and base installs"
  echo "===================================="
  sudo apt-get update
  sudo apt-get install -y apt-transport-https ca-certificates curl gnupg

  echo "Starting setup for C&C"
  echo "======================"
  sudo install -m 0755 -d /etc/apt/keyrings

  echo "..kubectl"
  echo "========="
  curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.28/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
  echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.28/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list
  sudo apt-get update
  sudo apt-get install -y kubectl

  echo "..Helm"
  echo "======"
  curl https://baltocdn.com/helm/signing.asc | gpg --dearmor | sudo tee /usr/share/keyrings/helm.gpg >/dev/null
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/helm.gpg] https://baltocdn.com/helm/stable/debian/ all main" | sudo tee /etc/apt/sources.list.d/helm-stable-debian.list
  sudo apt-get update
  sudo apt-get install -y helm

  echo "==============================="
  echo "Starting setup for Lab Building"
  echo "==============================="

  echo "..Docker"
  echo "========"
  for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do sudo apt-get remove $pkg; done
  # sudo ls -l /var/lib/docker/
  # curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  # sudo chmod a+r /etc/apt/keyrings/docker.gpg
  # echo \
  #   "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  # "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" |
  #   sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
  # sudo apt-get update
  # sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

  curl -fsSL https://get.docker.com | bash

  echo "..GH"
  echo "===="
  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
  sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list >/dev/null
  sudo apt-get update
  sudo apt-get install -y gh

  echo "..Node"
  echo "======"
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
  NODE_MAJOR=20
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
  sudo apt-get update
  sudo apt-get install -y nodejs

  echo "..Go"
  echo "===="
  sudo apt-get install -y golang-go

  echo "..Make"
  echo "======"
  sudo apt-get install -y make

  echo "============================="
  echo "Creating default users/groups"
  echo "============================="

  # Create docker groups
  sudo groupadd docker -g 999
  # Create c10e user, with docker as main group
  sudo useradd -m -s /usr/bin/bash -g 999 c10e
  # Add c10e user to sudoers
  echo "c10e  ALL=(ALL) NOPASSWD:ALL" | sudo tee --append /etc/sudoers.d/c10e

  echo "Branching to child script..."
  echo "============================"
  sudo su - c10e -c "bash $mount_point/shared_config/setupVMChild.sh"

  sudo touch $mount_point/setupVM.done

else
  echo "Sorry, this script currently supports Ubuntu only."
fi
