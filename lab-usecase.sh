#!/bin/bash
# ********************************************************************************************************************************************************
#
# The Monitoring Shop & Chronosphere
#
# usecase.sh
#
#   Start or stop the specified use case in the training data
#
# Version History
#
# Version	Date		Author		        Description
# 0.0.0	    13/09/2023	Bill Fox	        Started development
# 0.0.1	    23/09/2023	Bill Fox	        MVP
# 0.1.0	    24/10/2023	Mark Kelly-Smith	Updated for multi lab use
# ********************************************************************************************************************************************************

# Check we have expected variables
if [[ $# != 3 ]]; then
    echo "Usage:"
    echo "$0 <lab name> start|stop caseid"
    echo "e.g.: usecase.sh c10e-essentials-1 start 0001"
    exit 1
fi

# Check the lab instance exists
lab=$(kubectl get namespaces $1)
if [ $? == 1 ]; then
    echo "Error: That lab instance doesnt exist"
    exit 1
fi

# Check we have a case ID number
case_id=$3
num_chars=$(echo ${#case_id})

if [ $num_chars != 4 ]; then
    echo "ERROR: "$case_id" is not a valid case ID. Case IDs are 4 digit codes, eg 0001."
    exit 1
fi

# Get our working directory
WORKING=$(dirname $0)
#echo $WORKING

# Are we start-ing or stop-ping
case $2 in
"start")
    echo "Attempting to start case ${case_id} for lab ${1}....."
    echo "Looking for case deploy yaml: ${WORKING}/lab_gen_values/case${case_id}-deploy.yaml"

    if [ -f $WORKING/lab_gen_values/case${case_id}-deploy.yaml ]; then
        echo "Case deploy yaml found....."
    else
        echo "ERROR: Unable to find deploy file for case "$case_id". You can find a list of valid cases in ./conf/cases.json"
        exit 1
    fi

    echo "Deploying yaml....."
    helm upgrade -f ${WORKING}/lab_gen_values/case${case_id}-deploy.yaml $1 ${WORKING}/helm_charts/lab-gen-initial-build --reuse-values --namespace $1

    exit $?

    ;;

"stop")
    echo "Attempting to stop case ${case_id} for lab ${1}....."
    echo "Looking for case rollback yaml: ${WORKING}/lab_gen_values/case${case_id}-rollback.yaml"

    if [ -f $WORKING/lab_gen_values/case${case_id}-rollback.yaml ]; then
        echo "Case rollback yaml found....."
    else
        echo "ERROR: Unable to find rollback file for case "$case_id". You can find a list of valid cases in ./conf/cases.json"
        exit 1
    fi

    echo "Rolling back yaml....."
    helm upgrade -f ${WORKING}/lab_gen_values/case${case_id}-rollback.yaml $1 ${WORKING}/helm_charts/lab-gen-initial-build --reuse-values --namespace $1

    exit $?
    ;;

*)
    echo "ERROR: Invalid parameter "$2
    echo "  Valid values are start or stop"
    exit 1
    ;;
esac
