#!/bin/env bash

gcloud container clusters create "cluster-1" \
  --default-max-pods-per-node 110 \
  --enable-autoprovisioning \
  --enable-autoscaling \
  --enable-ip-alias \
  --logging=SYSTEM,WORKLOAD \
  --max-cpu 20 \
  --max-memory 40 \
  --max-nodes 10 \
  --max-pods-per-node 110 \
  --min-cpu 1 \
  --min-memory 1 \
  --min-nodes 0 \
  --monitoring=SYSTEM \
  --no-enable-basic-auth \
  --num-nodes 3 \
  --release-channel "regular" \
  --machine-type "e2-custom-6-24576"

# gcloud compute machine-types list
# --machine-type "e2-custom-8-49152"
# --machine-type "e2-custom-6-24576"
# --machine-type "e2-medium"

# --logging=SYSTEM,WORKLOAD,API_SERVER,CONTROLLER_MANAGER,SCHEDULER,NONE \
# --monitoring=SYSTEM,WORKLOAD,NONE,API_SERVER,CONTROLLER_MANAGER,SCHEDULER,DAEMONSET,DEPLOYMENT,HPA,POD,STATEFULSET,STORAGE

sleep 2

# List clusters
# gcloud container clusters list

# setup kubectl for this cluster
gcloud container clusters get-credentials cluster-1

sleep 2

# Confirm
kubectl cluster-info
