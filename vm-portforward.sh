#!/usr/bin/env bash
# ********************************************************************************************************************************************************
#
# The Monitoring Shop & Chronosphere
#
# vm-portforward.sh
#
#   Create a port-forward from local machine port 9090 to VM instance port 80
#
# Version History
#
# Version	Date		    Author		        Description
# 0.0.0	  06/11/2023	Mark Kelly-Smith  Started development
# ********************************************************************************************************************************************************

echo "Access the Command & Control Web GUI via:"
echo "  http://localhost:9090/"
echo ""
echo "CTRL+C to exit..."
echo ""

gcloud compute start-iap-tunnel university-psxw 80 \
  --local-host-port=localhost:9090
