#!/usr/bin/env bash
# ********************************************************************************************************************************************************
#
# The Monitoring Shop & Chronosphere
#
# k8s-loadbalance-delete.sh
#
#   Delete a named loadbalance service
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

# Substitute the above vars into placeholders in the yaml file and pipe to kubectl delete
envsubst <$WORKING/k8s-loadbalance-file.yaml | kubectl delete -f -
