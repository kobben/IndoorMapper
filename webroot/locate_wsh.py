# 5 dec 2016 by b.j.kobben@utwente.nl
# Handler for websocket server mod_pywebsocket ws://server:port/locate
# internally stores IndoorMapping location on message 'storeLocation:X,Y'
# sends stored IndoorMapping location on message 'giveLocation' as 'X,Y'


XY = u'0,0'

def web_socket_do_extra_handshake(request):
	# This example handler accepts any request. See origin_check_wsh.py for how
	# to reject access from untrusted scripts based on origin value.

	pass  # Always accept.


def web_socket_transfer_data(request):
	"""Gives or stores location."""
	while True:
		global XY
		line = request.ws_stream.receive_message()
		cmd = line.split(':')[0]
		if cmd == 'giveLocation':
			X = XY.split(',')[0]
			Y = XY.split(',')[1]
			request.ws_stream.send_message((X + ',' + Y), binary=False)
		elif cmd == 'storeLocation':
			XY = line.split(':')[1]
			X = XY.split(',')[0]
			Y = XY.split(',')[1]
			XY = X + ',' + Y
			request.ws_stream.send_message('Stored XY [' + X + ',' + Y + ']', binary=False)
		else:
			request.ws_stream.send_message('No Valid Request [' + line + ']', binary=False)


