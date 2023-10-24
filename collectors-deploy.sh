#!/usr/bin/env bash
# ********************************************************************************************************************************************************
#
# The Monitoring Shop & Chronosphere
#
# collectors-deploy.sh
#
#   Deploy our collectors into a k8s cluster namespace
#
# Version History
#
# Version	  Date		    Author		        Description
# 0.1.0	    24/10/2023	Mark Kelly-Smith	MVP
# ********************************************************************************************************************************************************

# Check the collectors namespace exists
lab=$(kubectl get namespaces collectors 2>&1)
if [ $? == 0 ]; then
  echo "Error: The collectors namespace already exists"
  exit 1
fi

# Get our working directory
WORKING=$(dirname $0)
echo $WORKING

# Create k8s namespace for the collectors
kubectl create namespace collectors

# Deploy the chronocollector
kubectl apply -f $WORKING/c10e_col_conf/chronocollector.yaml --namespace collectors

# Install the prometheus-node-exporter
helm install prometheus-node-exporter $WORKING/helm_charts/lab-gen-initial-build/charts/prometheus \
  --values $WORKING/lab_gen_values/initial-values.yaml \
  --set prometheus-node-exporter.enabled=true \
  --set alertmanager.enabled=false \
  --set kube-state-metrics.enabled=false \
  --set prometheus-pushgateway.enabled=false \
  --namespace collectors
