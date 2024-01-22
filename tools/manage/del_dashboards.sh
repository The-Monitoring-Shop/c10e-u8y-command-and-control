# Use chronoctl to delete all student created dashboards


chronoctl classic-dashboards list --collection-slugs troubleshooting-essentials |grep slug |grep dashboard|sed 's/ //g' | sed 's/slug://g' > /tmp/dash_list

echo "The following Dashboards will be deleted:"
echo

cat /tmp/dash_list

echo

read -e -p "Continue? [y/N]" choice

if [ "$choice" == "y" ] || [ "$choice" == "Y" ] 
then

	for dashboard in `cat /tmp/dash_list`
	do

		echo "Deleting Dashboard - "$dashboard
		
		chronoctl classic-dashboards delete $dashboard

	done

else

	echo "Aboriting."
fi

