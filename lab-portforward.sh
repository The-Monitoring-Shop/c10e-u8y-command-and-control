#!/usr/bin/env bash
# ********************************************************************************************************************************************************
#
# The Monitoring Shop & Chronosphere
#
# k8s-portforward-create.sh
#
#   Create a port-forward from local machine port 8080 to svc/c10e-u8y-labs-gen-frontendproxy on port 8080
#
# Version History
#
# Version	Date		    Author		        Description
# 0.0.0	  03/10/2023	Mark Kelly-Smith  Started development
# 0.1.0	  04/10/2023	Mark Kelly-Smith  Initial release
# 0.1.1	  24/10/2023	Mark Kelly-Smith	Updated for multi lab use
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

echo "The following services are now available at these paths:"
echo "Webstore             http://localhost:8080/"
echo "Feature Flags UI     http://localhost:8080/feature/"
echo "Load Generator UI    http://localhost:8080/loadgen/"
echo ""
echo "CTRL+C to exit..."
echo ""

kubectl port-forward svc/${1}-frontendproxy 8080:8080 --namespace $1
