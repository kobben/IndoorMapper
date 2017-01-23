# 5 dec 2016 by b.j.kobben@utwente.nl
# Handler for websocket server mod_pywebsocket ws://server:port/locate
# internally stores IndoorMapping location on message 'storeLocation:X;Y;F'
# sends stored IndoorMapping location on message 'giveLocation' as 'X;Y;F'


XYF = u'0;0;1' #string : x-location; y-location; floor

def web_socket_do_extra_handshake(request):
	# This example handler accepts any request. See origin_check_wsh.py for how
	# to reject access from untrusted scripts based on origin value.

	pass  # Always accept.


def web_socket_transfer_data(request):
	"""Gives or stores location and floor."""
	while True:
		global XYF
		line = request.ws_stream.receive_message()
		cmd = line.split(':')[0]
		if cmd == 'giveLocation':
			request.ws_stream.send_message(XYF, binary=False)
		elif cmd == 'storeLocation':
			XYF = line.split(':')[1]
			X = XYF.split(';')[0]
			Y = XYF.split(';')[1]
			F = XYF.split(';')[2]
			XYF = X + ';' + Y + ';' + F
			request.ws_stream.send_message('Stored [' + XYF + ']', binary=False)
		else:
			request.ws_stream.send_message('No Valid Request [' + line + ']', binary=False)


