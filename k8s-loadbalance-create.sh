#!/usr/bin/env bash
# ********************************************************************************************************************************************************
#
# The Monitoring Shop & Chronosphere
#
# k8s-loadbalance-create.sh
#
#   Create a named loadbalance service with firewall rule to allow port 80 access on external IP of machine running the script
#
# Version History
#
# Version	Date		    Author		        Description
# 0.0.0	  03/10/2023	Mark Kelly-Smith  Started development
# 1.0.0	  04/10/2023	Mark Kelly-Smith  Initial release
# ********************************************************************************************************************************************************

WORKING=$(dirname $0)
echo $WORKING

# Find our IP and hostname
export myip="$(curl -s -4 icanhazip.com)\/32"
export hostname=$(hostname -s)

# Substitute the above vars into placeholders in the yaml file and pipe to kubectl create
envsubst <$WORKING/k8s-loadbalance-file.yaml | kubectl create -f -
