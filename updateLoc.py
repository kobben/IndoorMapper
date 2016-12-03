#!/Library/Frameworks/Python.framework/Versions/3.5/bin/python3
# -- use !/usr/bin/python for python 2.7
# -- use !/Library/Frameworks/Python.framework/Versions/3.5/bin/python3 for python 3.5
# -*- coding: UTF-8 -*-
# enable debugging
import sys
import cgi
import cgitb
cgitb.enable()    
print ("Content-Type: text/html;charset=utf-8")
print ("")
print ("<html><head></head>")
bodyStr = '<body onload=\"window.location=\'control.html\'\">' 

# bodyStr = "<body>"

print (bodyStr)

theRequest = cgi.FieldStorage()
x = theRequest['x'].value
y = theRequest['y'].value
t = theRequest['t'].value

theStr = '{ "type": "Feature", "geometry": {"type": "Point", "coordinates": [%s, %s]}, "properties": {"timestamp": "%s"}}' % (x, y, t)
#print (theStr)

with open('./data/curLoc.json', 'w') as out:
	out.write(theStr)

print ("</body></html>")

