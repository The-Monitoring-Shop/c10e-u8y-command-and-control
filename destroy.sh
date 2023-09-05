#!/bin/bash
# ********************************************************************************************************************************************************
#
# The Monitoring Shop & Chronosphere
#
# destroy.sh
#
#   Delete the c10e-u8y-labs-gen application from the k8s cluster
#
# Version History
#
# Version	Date		Author		Description
# 0.0.0	    09/05/2023	Bill Fox	Started development
# ********************************************************************************************************************************************************

WORKING=`dirname $0`
echo $WORKING

# Step 1: Uninstall the application, using helm charts based on the Open Telemetry demo. 
#         These charts will pull the code from the c10e-u8y-labs-gen github repository.

helm uninstall c10e-u8y-labs-gen

# Step 2: Remove the C10e collector

kubectl delete daemonset chronocollector