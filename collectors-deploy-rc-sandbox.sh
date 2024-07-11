#!/usr/bin/env bash
# ********************************************************************************************************************************************************
#
# The Monitoring Shop & Chronosphere
#
# collectors-rc-sandbox-deploy.sh
#
#   Deploy our collectors into a k8s cluster namespace
#
# Version History
#
# Version	  Date		    Author		        Description
# 0.1.0	    11/07/2024	Mark Kelly-Smith	MVP
# ********************************************************************************************************************************************************

# Check the collectors-rc-sandbox namespace exists
lab=$(kubectl get namespaces collectors-rc-sandbox 2>&1)
if [ $? == 0 ]; then
  echo "Error: The collectors-rc-sandbox namespace already exists"
  exit 1
fi

# Get our working directory
WORKING=$(dirname $0)
echo $WORKING

# Create k8s namespace for the collectors
kubectl create namespace collectors-rc-sandbox

# Deploy the chronocollector
kubectl apply -f $WORKING/c10e_col_conf/chronocollector-rc-sandbox.yaml --namespace collectors-rc-sandbox

# Install the prometheus-node-exporter
# helm install prometheus-node-exporter $WORKING/helm_charts/lab-gen-initial-build/charts/prometheus \
#   --values $WORKING/lab_gen_values/values-prometheus-node-exporter.yaml \
#   --namespace collectors-rc-sandbox
