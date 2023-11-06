#!/usr/bin/env bash
# ********************************************************************************************************************************************************
#
# The Monitoring Shop & Chronosphere
#
# vm-setup.sh
#
#   Setup a new user on a C&C VM server
#
# Version History
#
# Version	  Date		    Author		        Description
# 1.0.0	    06/11/2023	Mark Kelly-Smith  MVP
# ********************************************************************************************************************************************************

if [[ $(uname -v) =~ "Ubuntu" ]]; then
  echo "Ubuntu detected, continuing..."

  echo "Docker Setup"
  echo "------------"
  echo ""
  sudo usermod -aG docker $USER

  echo "k8s Setup"
  echo "---------"
  echo ""
  mkdir -p /home/$USER/.kube
  cp /opt/shared_config/kube-config-university ~/.kube/config
  chmod 600 ~/.kube/config

  echo "GitHub Setup"
  echo "------------"
  echo ""
  echo "Next, select options for GitHub authentication"
  echo "You will need to open browser manually to"
  echo "  https://github.com/login/device"
  echo "  login into Github and paste the 8 digit key provided"
  echo "Selections;"
  echo "  GitHub.com"
  echo "  SSH"
  echo "  Y"
  echo "  blank"
  echo "  c10e-university-vm"
  echo "  Login with web browser"
  gh auth login

  git config --global --add safe.directory /opt/git/c10e-u8y-command-and-control
  git config --global --add safe.directory /opt/git/c10e-u8y-labs-gen

  echo "GCloud CLI Setup"
  echo "----------------"
  echo ""
  echo "Next, select options for Service Account and chronosphere-university project"
  echo "If prompted select region and zone for us-central1 & us-central1-a"
  echo "Selections;"
  echo "  1"
  echo "  1"
  gcloud init
  echo "source /opt/shared_config/gcloudrc" >>~/.bashrc
  source ~/.bashrc

  gcloud config set compute/region us-central1
  gcloud config set compute/zone us-central1-a

  echo ""
  echo ""
  echo "GitHub PAT Setup"
  echo "----------------"
  echo ""
  echo "************************************************************"
  echo "This is only required if you wish to build and push packages"
  echo "************************************************************"
  echo ""
  echo "Goto: https://github.com/settings/tokens"
  echo "Create a 'classic' token with privs for;"
  echo "  write:packages"
  echo "  delete:packages"
  echo ""
  echo "MAKE SURE TO COPY THE TOKEN VALUE"
  echo ""
  echo "Run following;"
  echo "  export CR_PAT=<Token Value>"
  echo "  export GH_User=<GitHub Username>"
  echo "  echo \$CR_PAT | docker login ghcr.io -u \$GH_User --password-stdin"
  echo ""

  newgrp docker

else
  echo "Sorry, this script currently supports Ubuntu only."
fi
