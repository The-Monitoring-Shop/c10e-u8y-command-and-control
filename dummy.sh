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
# Version	Date		Author		Description
# 0.0.0	    13/05/2023	Bill Fox	Started development
# ********************************************************************************************************************************************************

WORKING=`dirname $0`
#echo $WORKING
usage="Usage: usecase.sh start|stop caseid\n    e.g: usecase.sh start 0001"

# Check input

if [ $# != 2 ]
then
    echo "ERROR: Invalid number of parameters."
    echo -e ${usage}
    exit 1
fi

case_id=$2
num_chars=`echo ${#case_id}`

if [ $num_chars != 4 ]
then
    echo "ERROR: "$case_id" is not a valid case ID. Case IDs are 4 digit codes, eg 0001."
    exit 1
fi

case $1 in

    "start")
        echo "Attempting to start case "${case_id}"....."
        echo "Looking for case deploy yaml: "${WORKING}"/lab_gen_values/case"${case_id}"-deploy.yaml"

        if [ -f $WORKING/lab_gen_values/case${case_id}-deploy.yaml ]
        then
            echo "Case deploy yaml found....."
        else
            echo "ERROR: Unable to find deploy file for case "$case_id". You can find a list of valid cases in ./conf/cases.json"
            exit 1
        fi

        #helm upgrade -f ${WORKING}/lab_gen_values/case${case_id}-deploy.yaml c10e-u8y-labs-gen ${WORKING}/helm_charts/lab-gen-initial-build --reuse-values


	echo "A line"
	echo "A line"
	echo "A line"
	echo "A line"
	echo "A line"
	echo "A line"
	echo "A line"
	echo "A line"
	echo "A line"
	echo "A line"
	echo "A line"
	echo "A line"
	echo "A line"





        exit $?

        ;;

    "stop")
        echo "Attempting to stop case "${case_id}"....."
        echo "Looking for case rollback yaml: "${WORKING}"/lab_gen_values/case"${case_id}"-rollback.yaml"

        if [ -f $WORKING/lab_gen_values/case${case_id}-rollback.yaml ]
        then
            echo "Case rollback yaml found....."
        else
            echo "ERROR: Unable to find rollback file for case "$case_id". You can find a list of valid cases in ./conf/cases.json"
            exit 1
        fi

        #helm upgrade -f ${WORKING}/lab_gen_values/case${case_id}-rollback.yaml c10e-u8y-labs-gen ${WORKING}/helm_charts/lab-gen-initial-build --reuse-values

        exit $?
    ;;

    *)
    echo "ERROR: Invalid parameter "$1
    echo "  Valid values are start or stop"
    exit 1
    ;;
esac

