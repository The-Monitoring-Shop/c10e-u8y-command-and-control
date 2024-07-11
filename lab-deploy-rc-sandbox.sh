#!/usr/bin/env bash
# ********************************************************************************************************************************************************
#
# The Monitoring Shop & Chronosphere
#
# lab-deploy-rc-sandbox.sh
#
#   Deploy a initial, clean install of the c10e-u8y-labs-gen application into a k8s cluster namespace
#
# Version History
#
# Version	  Date		    Author		        Description
# 0.1.0	    11/07/2024	Mark Kelly-Smith	MVP
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
helm install $1 $WORKING/helm_charts/lab-gen-initial-build --values $WORKING/lab_gen_values/initial-values-rc-sandbox.yaml --namespace $1
