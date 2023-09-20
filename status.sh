#!/bin/bash
# ********************************************************************************************************************************************************
#
# The Monitoring Shop & Chronosphere
#
# status.sh
#
#   Get the run status of the c10e-u8y-labs-gen application from the k8s cluster
#
# Version History
#
# Version	Date		Author		Description
# 0.0.0	    20/05/2023	Bill Fox	Started development
# ********************************************************************************************************************************************************

WORKING=`dirname $0`

pod_list=`kubectl get pods 2>&1 |sed 's/ /~/g'`
result=0

for pod in $pod_list
do
	line=`echo $pod |sed 's/~/ /g' | xargs`

	if [ "$line" == "No resources found in default namespace." ]
	then
		echo $line >&2
		result=1
	fi

	status=`echo $line | cut -d' ' -f3`
	pod=`echo $line | cut -d' ' -f1`

	if [ "$status" != "STATUS" ]
	then
		if [ "$status" != "Running" ]
		then
			result=1

			echo "pod "$pod" status is "$status >&2
		else
			
			echo "pod "$pod" status is "$status 
		fi
	fi
done


exit $result
