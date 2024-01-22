# Use chronoctl to delete all monitors ending in mc_payments


chronoctl monitors list |grep slug |grep mc-payments |sed 's/ //g' | sed 's/slug://g' > /tmp/mon_list

echo "The following Monitors will be deleted:"
echo

cat /tmp/mon_list

echo

read -e -p "Continue? [y/N]" choice

if [ "$choice" == "y" ] || [ "$choice" == "Y" ] 
then

	for monitor in `cat /tmp/mon_list`
	do

		echo "Deleting Monitor - "$monitor
		
		chronoctl monitors delete $monitor

	done

else

	echo "Aboriting."
fi

