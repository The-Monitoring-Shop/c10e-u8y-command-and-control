#!/usr/bin/env bash
# ********************************************************************************************************************************************************
#
# The Monitoring Shop & Chronosphere
#
# lab-deploy.sh
#
#   Deploy a initial, clean install of the c10e-u8y-labs-gen application into a k8s cluster namespace
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
if [ $? == 0 ]; then
  echo "Error: That lab instance already exists"
  exit 1
fi

# Get our working directory
WORKING=$(dirname $0)
echo $WORKING

# Create k8s namespace for this lab
kubectl create namespace $1

# Install the lab instance
helm install $1 $WORKING/helm_charts/lab-gen-initial-build --values $WORKING/lab_gen_values/initial-values.yaml --namespace $1
