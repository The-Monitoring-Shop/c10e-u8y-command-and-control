# Use chronoctl to delete all custom metrics ending in _quoteservice


chronoctl trace-metrics-rules list |grep slug |grep quoteservice  |sed 's/ //g' | sed 's/slug://g' > /tmp/met_list

echo "The following Custom Metrics will be deleted:"
echo

cat /tmp/met_list

echo

read -e -p "Continue? [y/N]" choice

if [ "$choice" == "y" ] || [ "$choice" == "Y" ] 
then

	for metric in `cat /tmp/met_list`
	do

		echo "Deleting Custom Metric - "$metric
		
		chronoctl trace-metrics-rules delete $metric

	done

else

	echo "Aboriting."
fi

