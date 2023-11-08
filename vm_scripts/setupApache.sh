#!/usr/bin/env bash
# ********************************************************************************************************************************************************
#
# The Monitoring Shop & Chronosphere
#
# setupApache.sh
#
#   Setup Apache on a new VM server for use as C&C
#
# Version History
#
# Version	  Date		    Author		        Description
# 0.0.1	    08/11/2023	Bill Fox          In Development
# ********************************************************************************************************************************************************

if [[ $(uname -v) =~ "Ubuntu" ]]
then

  echo "Ubuntu detected, continuing..."
  echo "=============================="
  echo

  already_set=`cat /etc/apache2/apache2.conf 2> /dev/null | grep action_login | wc -l`

  if [ $already_set == 0 ]
  then

    echo "Apache config not detected, continuing..."
    echo "========================================="
    echo


    echo "Running apt update and base installs"
    echo "===================================="
    echo

    sudo apt-get update
    sudo apt-get install -y apache2

    echo "Enabling modproxy"
    echo "================="
    echo

    sudo a2enmod proxy proxy_http proxy_balancer lbmethod_byrequests

    echo "Configurting Apache"
    echo "==================="
    echo
      
    sudo sh -c  'curl -fsSL https://raw.githubusercontent.com/The-Monitoring-Shop/c10e-u8y-command-and-control/main/vm_scripts/proxy_snipit >> /etc/apache2/apache2.conf'
    sudo sh -c  'curl -fsSL https://raw.githubusercontent.com/The-Monitoring-Shop/c10e-u8y-command-and-control/main/html/index.html > /var/www/html/index.html'
    sudo systemctl restart apache2

  else
    echo "Apache is already deployed and configured. No need to continue"
  fi
else
  echo "Sorry, this script currently supports Ubuntu only."
fi
