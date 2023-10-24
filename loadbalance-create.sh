#!/usr/bin/env bash
# ********************************************************************************************************************************************************
#
# The Monitoring Shop & Chronosphere
#
# k8s-loadbalance-create.sh
#
#   Create a named loadbalance service with firewall rule to allow port 80 access on external IP of machine running the script
#
# Version History
#
# Version	Date		    Author		        Description
# 0.0.0	  03/10/2023	Mark Kelly-Smith  Started development
# 0.1.0	  04/10/2023	Mark Kelly-Smith  Initial release
# ********************************************************************************************************************************************************

WORKING=$(dirname $0)
echo $WORKING

# Find our IP and hostname
export myip="$(curl -s -4 icanhazip.com)/32"
export hostname=$(hostname -s)

# Substitute the above vars into placeholders in the yaml file and pipe to kubectl create
envsubst <$WORKING/loadbalance-file.yaml | kubectl create -f -

# Get the IP we have
echo "Getting LoadBalance IP Address..."
SECONDS=0
lbip=""
until [ -n "$lbip" ]; do
  if ((SECONDS > 60)); then
    echo "LoadBalancer IP not provisioned in time."
    echo "Please check GKE console or run this command manually;"
    echo "  kubectl get svc "c10e-u8y-labs-gen-frontendproxy-$hostname-lb" --output jsonpath='{.status.loadBalancer.ingress[0].ip}'"
    exit 1
  fi

  lbip=$(kubectl get svc "c10e-u8y-labs-gen-frontendproxy-$hostname-lb" --output jsonpath='{.status.loadBalancer.ingress[0].ip}')

  echo "...waiting for IP Address to be provisioned"
  sleep 5
done

if [[ -n "$lbip" ]]; then
  echo ""
  echo "The following services are now available at these paths:"
  echo "Webstore             http://$lbip:8080/"
  echo "Feature Flags UI     http://$lbip:8080/feature/"
  echo "Load Generator UI    http://$lbip:8080/loadgen/"

fi
