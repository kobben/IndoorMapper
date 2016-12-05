#!/Library/Frameworks/Python.framework/Versions/3.5/bin/python3
# -- use !/usr/bin/python for python 2.7
# -- use !/Library/Frameworks/Python.framework/Versions/3.5/bin/python3 for python 3.5
# -*- coding: UTF-8 -*-
# enable debugging
import sys
import cgitb
cgitb.enable()    
print ("Content-Type: text/html;charset=utf-8")
print ("")
print ("<html><head>")
print ("")
print ("</head><body>")
print (sys.version)
print ("</body></html>")