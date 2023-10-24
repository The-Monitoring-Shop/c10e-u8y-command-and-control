#!/usr/bin/env bash
# ********************************************************************************************************************************************************
#
# The Monitoring Shop & Chronosphere
#
# collectors-destroy.sh
#
#   Delete our collectors from a k8s cluster namespace
#
# Version History
#
# Version	  Date		    Author		        Description
# 0.1.0	    24/10/2023	Mark Kelly-Smith	MVP
# ********************************************************************************************************************************************************

# Check the collectors namespace exists
lab=$(kubectl get namespaces collectors)
if [ $? == 1 ]; then
  echo "Error: The collectors namespace doest exist"
  exit 1
fi

# Get our working directory
WORKING=$(dirname $0)
echo $WORKING

# Uninstall the prometheus-node-exporter
helm uninstall prometheus-node-exporter --namespace collectors

# Delete the chronocollector
kubectl delete -f $WORKING/c10e_col_conf/chronocollector.yaml --namespace collectors

# Delete k8s namespace for the collectors
kubectl delete namespace collectors
