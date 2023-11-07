#!/usr/bin/env bash
# ********************************************************************************************************************************************************
#
# The Monitoring Shop & Chronosphere
#
# setupUser.sh
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

  if [[ $USER == "c10e" ]]; then
    echo "c10e user detected, using restricted setup options"

    echo "k8s Setup"
    echo "---------"
    echo ""
    if [[ -f /opt/shared_config/kube-config-university ]]; then
      echo "Copying /opt/shared_config/kube-config-university to /home/$USER/.kube/config"
      mkdir -p /home/$USER/.kube
      cp /opt/shared_config/kube-config-university ~/.kube/config
      chmod 600 ~/.kube/config
    else
      echo "No kube config file found at /opt/shared_config/kube-config-university"
      echo "Run setupUser.sh from another user, with GCloud config correct, then run setup again for c10e user"
    fi

    echo "source /opt/shared_config/gcloudrc" >>~/.bashrc
    source ~/.bashrc

  else
    echo "Docker Setup"
    echo "------------"
    echo ""
    sudo usermod -aG docker $USER

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

    git config --global --add safe.directory '*'

    echo "GCloud CLI Setup"
    echo "----------------"
    echo ""
    echo "Next, select options for Service Account and chronosphere-university project"
    echo "If prompted select region and zone for us-central1 & us-central1-a"
    echo "Selections;"
    echo "  1"
    echo "  1"
    echo "source /opt/shared_config/gcloudrc" >>~/.bashrc
    source /opt/google-cloud-sdk/path.bash.inc
    gcloud init

    gcloud config set compute/region us-central1
    gcloud config set compute/zone us-central1-a

    echo ""
    echo "k8s Setup"
    echo "---------"
    echo ""
    gcloud container clusters get-credentials university --zone=us-central1
    # Copy kube config file to shared_config
    if [[ -f /home/$USER/.kube/config ]] && [[ ! -f /opt/shared_config/kube-config-university ]]; then
      echo "Copying /home/$USER/.kube/config to /opt/shared_config/kube-config-university"
      sudo cp /home/$USER/.kube/config /opt/shared_config/kube-config-university
      sudo chown c10e:docker /opt/shared_config/kube-config-university
      sudo chmod 770 /opt/shared_config/kube-config-university
    fi

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
  fi

else
  echo "Sorry, this script currently supports Ubuntu only."
fi
