#!/bin/bash
# ********************************************************************************************************************************************************
#
# The Monitoring Shop & Chronosphere
#
# lab-status.sh
#
#   Get the run status of the c10e-u8y-labs-gen application from the k8s cluster
#
# Version History
#
# Version	Date		Author									Description
# 0.0.0	    20/09/2023	Bill Fox					Started development
# 0.0.1	    22/09/2023	Bill Fox					MVP
# 0.1.0	    24/10/2023	Mark Kelly-Smith	Updated for multi lab use
# ********************************************************************************************************************************************************

# Check we have a lab name to use
if [[ -z $1 ]]; then
	echo "Error: No variable passed."
	echo "Usage:"
	echo "$0 <lab name>"
	exit 1
fi

# Check the lab instance exists
lab=$(kubectl get namespaces $1)
if [ $? == 1 ]; then
	echo "Error: That lab instance doesnt exist"
	exit 1
fi

# Get our working directory
WORKING=$(dirname $0)
#echo $WORKING

# Get a list of pods in our namespace
pod_list=$(kubectl get pods --namespace $1 2>&1 | sed 's/ /~/g')
result=0
some_running=0

# pod_list_running=$(kubectl get pods --namespace $1 --field-selector=status.phase==Running)

for pod in $pod_list; do
	line=$(echo $pod | sed 's/~/ /g' | xargs)

	if [[ $line =~ "No resources found in .* namespace" ]]; then
		echo $line >&2
		result=1
	fi

	status=$(echo $line | cut -d' ' -f3)
	pod=$(echo $line | cut -d' ' -f1)

	if [ "$status" != "STATUS" ]; then
		if [ "$status" != "Running" ]; then
			result=1

			echo "pod "$pod" status is "$status >&2
		else
			some_running=1
			echo "pod "$pod" status is "$status
		fi
	fi
done

if [ $some_running == 1 ] && [ $result == 1 ]; then
	result=2
fi

exit $result
