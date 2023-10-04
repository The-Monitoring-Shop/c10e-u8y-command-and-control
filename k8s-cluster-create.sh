#!/usr/bin/env bash

# GCP AutoPilot Cluster
# gcloud container clusters create-auto "c10e-u8y-labs-1" \
#   --region "europe-west2" \
#   --release-channel "regular"

# GCP Standard Cluster
gcloud container clusters create "c10e-u8y-labs-1" \
  --release-channel "regular" \
  --enable-autoprovisioning \
  --enable-autoprovisioning-autoupgrade \
  --enable-autoprovisioning-autorepair \
  --enable-autorepair \
  --enable-autoscaling \
  --enable-autoupgrade \
  --enable-vertical-pod-autoscaling \
  --enable-ip-alias \
  --enable-shielded-nodes \
  --enable-managed-prometheus \
  --enable-dataplane-v2 --no-enable-master-authorized-networks \
  --no-enable-basic-auth \
  --no-enable-intra-node-visibility \
  --metadata disable-legacy-endpoints=true \
  --addons HorizontalPodAutoscaling,HttpLoadBalancing,GcePersistentDiskCsiDriver \
  --max-pods-per-node 110 \
  --default-max-pods-per-node 110 \
  --logging=SYSTEM,WORKLOAD \
  --monitoring=SYSTEM,POD,DEPLOYMENT,DAEMONSET \
  --min-cpu 4 \
  --max-cpu 8 \
  --min-memory 8 \
  --max-memory 16 \
  --min-nodes 0 \
  --max-nodes 2 \
  --image-type "COS_CONTAINERD" \
  --disk-type "pd-balanced" \
  --disk-size "100" \
  --machine-type "e2-custom-4-8192" \
  --spot \
  --num-nodes 1

# Current Resources
# 1.6 CPU
# 3.8-5.2GB

# Type              Shared?   vCPU  RAM   Count $ph
# e2-custom-6-24576           6     24    1     $0.38
# e2-standard-2               2     8     2     $0.31
# e2-standard-4               4     16    1     $0.29
# e2-medium         Y         1-2   4     3     $0.28 (not enough CPU)
# e2-custom-4-8192            4     8     1     $0.26
# e2-custom-4-6144            4     6     1     $0.25
# e2-highmem-2                2     16    1     $0.23
# e2-custom-4-8192            4     8     1     $0.16 (spot)

sleep 2

# setup kubectl for this cluster
gcloud container clusters get-credentials c10e-u8y-labs-1

sleep 2

# Confirm
kubectl cluster-info
