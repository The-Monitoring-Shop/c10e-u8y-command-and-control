#!/usr/bin/env bash
# ********************************************************************************************************************************************************
#
# The Monitoring Shop & Chronosphere
#
# vm-ssh.sh
#
#   SSH to VM instance
#
# Version History
#
# Version	Date		    Author		        Description
# 0.0.0	  09/11/2023	Mark Kelly-Smith  Started development
# ********************************************************************************************************************************************************

gcloud compute ssh university-psxw \
  --tunnel-through-iap
