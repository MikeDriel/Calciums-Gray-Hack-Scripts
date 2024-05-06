line = "--------------------"
line1 = "########################################################################"
gray = "<color=#575656>"
white = "<color=white>"
version = "1.0"
print("Welcome to Calcium's remoteshell v" + version)
// ############################################################### IMPORTS ###############################################################
metaxploit = include_lib("/lib/metaxploit.so")

if not metaxploit then
	// Check if we  can fetch it from somewhere else..

	metaxploit = include_lib("metaxploit.so")

	if not metaxploit then
		exit("Missing metaxploit library, shutting down operation")
	end if
end if

// ############################################################### PARAMS ###############################################################

if params.len > 0 then
	ipAddress = params[0]
else
	exit(white + "usage: atk <b>[ip] [port(opt)] [passwd(opt)]\n" + white)
end if

if params.len > 1 then
	attackPort = params[1].to_int
else
	attackPort = null
end if

if params.len > 2 then
	passwd = params[2]
else
	passwd = ""
end if

// ############################################################### SETUP ###############################################################

if not attackPort then
	print("\n" + gray + "attacking: " + ipAddress + ":...")
else
	print("\n" + gray + "attacking: " + ipAddress + ":" + attackPort)
end if

if metaxploit then
	if not attackPort then
		net_session = metaxploit.net_use(ipAddress)
	else
		net_session = metaxploit.net_use(ipAddress, attackPort)
	end if

	if not net_session then
		print(white + "can't reach port " + attackPort)
	else
		metaLib = net_session.dump_lib
		print(gray + "session established")
	end if

else
	print("need metaxploit")
end if

resultList = []

if metaLib then
	libName = metaLib.lib_name
	libVer = metaLib.version
	// ############################################################### SCAN ###############################################################

	if metaLib then
		print(gray + "scanning library: " + libName + " v." + libVer + "\n")
	end if

	memory = metaxploit.scan(metaLib)

	if not memory then
		print(gray + "no exploits detected.")
	end if

	print(line1)
	// ############################################################### EXPLOIT ###############################################################

	for mem in memory
		address = metaxploit.scan_address(metaLib, mem).split("Unsafe check:")
		userList = null

		for add in address
			if add == address[0] then
				continue
			end if

			value = add[add.indexOf("<b>") + 3 : add.indexOf("</b>")]
			print(gray + "exploiting: " + value + "\n")

			if passwd then
				result = metaLib.overflow(mem, value, passwd)
			else
				result = metaLib.overflow(mem, value)
			end if

			if result then
				print(gray + "found: " + result + "\n")

				if typeof(result) == "shell" then
					resultList.push(result)
				end if

				if typeof(result) == "file" then
					resultList.push(result)
				end if
			else
				print(gray + "no results\n")
			end if

		end for

	end for

	// ############################################################### RESULTS ###############################################################

	if resultList.len > 0 then
		print(line1)
		print(gray + "results:")
		info = "INDEX TYPE PRIVILEGES PATH"
		i = 1

		for result in resultList
			if typeof(result) == "shell" then
				info = info + "\n" + i + " " + result + " " + "WIP"
			end if

			if typeof(result) == "file" then
				info = info + "\n" + i + " " + result + " " + "WIP" + " " + result.path
			end if
			i = i + 1
		end for

		print(format_columns(info) + "\n" + line1)

		selectedResult = user_input(gray + "choose a result to execute or press enter to exit: " + "\n" + white)

		if selectedResult.to_int then
			selectedResult = resultList[selectedResult.to_int - 1]

			if typeof(selectedResult) == "shell" then
				print(gray + "executing shell...")
				selectedResult.start_terminal
			end if

			if typeof(selectedResult) == "file" then
				if selectedResult.is_folder then
					files = selectedResult.get_files
					for file in files
						print(file.get_content)
					end for
				end if

			end if
		else
			exit("Exiting...")
		end if

	end if

	exit("Exiting...")
end if
