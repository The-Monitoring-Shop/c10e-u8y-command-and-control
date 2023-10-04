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
# 1.0.0	  04/10/2023	Mark Kelly-Smith  Initial release
# ********************************************************************************************************************************************************

echo "The following services are now available at these paths:"
echo "Webstore             http://localhost:8080/"
echo "Feature Flags UI     http://localhost:8080/feature/"
echo "Load Generator UI    http://localhost:8080/loadgen/"
echo ""

kubectl port-forward svc/c10e-u8y-labs-gen-frontendproxy 8080:8080
