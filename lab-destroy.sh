#!/usr/bin/env bash
# ********************************************************************************************************************************************************
#
# The Monitoring Shop & Chronosphere
#
# lab-destroy.sh
#
#   Delete the c10e-u8y-labs-gen application from the k8s cluster namespace
#
# Version History
#
# Version	  Date		    Author		        Description
# 0.0.0	    09/09/2023	Bill Fox	        Started development
# 0.0.1	    22/09/2023	Bill Fox	        MVP
# 0.1.0	    24/10/2023	Mark Kelly-Smith	Updated for multi lab use
# ********************************************************************************************************************************************************
# Check we have a lab name to use
if [[ -z $1 ]]; then
  echo "Error: No variable passed."
  echo "Usage:"
  echo "$0 <lab name>"
  exit 1
fi

# Check the lab instance exists
lab=$(kubectl get namespaces $1 2>&1)
if [ $? == 1 ]; then
  echo "Error: That lab instance doesnt exist"
  exit 1
fi

# Get our working directory
WORKING=$(dirname $0)
echo $WORKING

# Uninstall the lab instance
helm uninstall $1 --namespace $1 2>&1

# Delete k8s namespace for this lab
kubectl delete namespace $1
