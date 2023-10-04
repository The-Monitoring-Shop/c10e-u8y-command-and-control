#!/usr/bin/env bash
# ********************************************************************************************************************************************************
#
# The Monitoring Shop & Chronosphere
#
# initial-build.sh
#
#   Deploy a initial, clean install of the c10e-u8y-labs-gen application into a k8s cluster
#
# Version History
#
# Version	Date		Author		Description
# 0.0.0	    09/09/2023	Bill Fox	Started development
# 0.0.1	    22/09/2023	Bill Fox	MVP
# ********************************************************************************************************************************************************

WORKING=$(dirname $0)
echo $WORKING

# Step 1: Deploy the C10e collector

kubectl create -f $WORKING/c10e_col_conf/chronocollector.yaml

# Step 2: Deploy the application, using helm charts based on the Open Telemetry demo.
#         These charts will pull the code from the c10e-u8y-labs-gen github repository.

helm install c10e-u8y-labs-gen $WORKING/helm_charts/lab-gen-initial-build --values $WORKING/lab_gen_values/initial-values.yaml
