line = "--------------------"
line1 = "########################################################################"
version = "1.0"
// ############################################################### IMPORTS ###############################################################

crypto = include_lib("/lib/crypto.so")
// Load up crypto with library

if not crypto then
	// Check if we  can fetch it from somewhere else..

	crypto = include_lib("crypto.so")

	if not crypto then
		exit("Missing crypto library, shutting down operation")
	end if
end if

// ############################################################### MAIN ###############################################################

// Declare our own computer and the interface
hostPC = get_shell.host_computer
interface = "wlan0"
// Start monitoring mode on the interface

if not crypto.airmon("start", interface) then
	exit(("Can not start monitoring on " + interface))
end if

// Get the list of all the networks

unsortedNetworks = hostPC.wifi_networks(interface)

sortedNetworks = []
// Parse the list of networks to a map made of BSSID, PWR and ESSID

for unsortedNetwork in unsortedNetworks
	unsortedNetwork = unsortedNetwork.split(" ")
	bssid = unsortedNetwork[0]
	pwr = unsortedNetwork[1]
	essid = unsortedNetwork[2]
	sortedNetworks.push([pwr, bssid, essid])
end for

sortedNetworks = sortedNetworks.sort("pwr", 0)

sortedNetworks = slice(sortedNetworks, 0, 10)

PrintAndSelectNetwork = function()
	info = "INDEX PWR BSSID ESSID"
	i = 1

	if i < 10 then
		for sortedNetwork in sortedNetworks
			info = info + "\n" + i + " " + sortedNetwork[0] + " " + sortedNetwork[1] + " " + sortedNetwork[2]
			i = i + 1
		end for

	end if

	print(format_columns(info) + "\n" + line1)

	return info
end function

Space = function()
	print("\n")
end function

// ############################################################### NETWORK CAPTURING COMPLETE ###############################################################
PrintAndSelectNetwork
Space
userInput = user_input("Please select the network you want to crack: ")
Space

if userInput < 1 or userInput > len(sortedNetworks) then
	exit("Invalid input")
end if

selectedNetwork = sortedNetworks[userInput.val - 1]
pwr = 300000 / selectedNetwork[0].remove("%").val
bssid = selectedNetwork[1]
essid = selectedNetwork[2]
// ############################################################### TIME TO GATHER ACKS ###############################################################

print("Starting to gather ACKs for the network")

aireplayResult = crypto.aireplay(bssid, essid, pwr)
print("ACKs gathered successfully")
// ############################################################### TIME TO CRACK THE NETWORK ###############################################################
Space
print("Starting to crack the network")
password = "oopsie woopsie password is fucky wucky"
capfilepath = home_dir + "/file.cap"
capfile = hostPC.File(capfilepath)

if (aireplayResult == null) then
	password = crypto.aircrack(capfilepath)
	print("Password: " + password)
end if

// ############################################################### CONNECT TO NETWORK ###############################################################

if not hostPC.connect_wifi(interface, bssid, essid, password) then
	print("Failed to connect to wifi")

end if

print("Connected to: " + essid + " with: " + password)
// ############################################################### CLEANUP ###############################################################

if not crypto.airmon("stop", interface) then
	exit("Can not stop monitoring on " + interface)
end if

Space
print("Monitoring mode stopped successfully")
capfile.delete
print("Capfile deleted sucessfully")
exit("Exiting...")
