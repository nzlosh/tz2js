#!/usr/bin/env python

# The MIT License (MIT)
#
# Copyright (c) 2013 Carlos (nzlosh@yahoo.com)
#
# Permission is hereby granted, free of charge, to any person obtaining a
# copy of this software and associated documentation files (the "Software"),
# to deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense,
# and/or sell copies of the Software, and to permit persons to whom the
# Software is furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included
# in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
# OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
# THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR
# OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
# ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
# OTHER DEALINGS IN THE SOFTWARE.


# Required modules
import os, sys, re, json

tzdata_version = "2012j"
tzpath = os.path.join(sys.argv[1],"tzdata"+tzdata_version)

months = [
	"january",
	"february",
	"march",
	"april",
	"may",
	"june",
	"july",
	"august",
	"september",
	"october",
	"november",
	"december"
]

zone_files = [
#	"africa",
#	"antarctica",
#	"asia",
#	"australasia",
	#~ "backward",
#	"etcetera",
#	"europe",
	#~ "leapseconds",
#	"northamerica",
#	"pacificnew",
	#~ "solar87",
	#~ "solar88",
	#~ "solar89",
	"southamerica",
	#~ "systemv"
]

def parseZoneFile():
	"""
	Information about the file being parsed:

	This file contains a table with the following columns:
	1.  ISO 3166 2-character country code.  See the file `iso3166.tab'.
	2.  Latitude and longitude of the zone's principal location
		in ISO 6709 sign-degrees-minutes-seconds format,
		either +-DDMM+-DDDMM or +-DDMMSS+-DDDMMSS,
		first latitude (+ is north), then longitude (+ is east).
	3.  Zone name used in value of TZ environment variable.
	4.  Comments; present if and only if the country has multiple rows.
	"""
	zone_file = "zone.tab"
	z = {}
	zones = open( os.path.join(tzpath,zone_file), "r")

	for line in zones.readlines():
		# Skip full line comments
		if re.search(r"^\w*#", line):
			continue

		# strip carriage return, remove end of line comments, clean whitespace
		# after 1st split and then split the remainder as a tab delimited record.
		rec = line.strip("\n").split("#",1)[0].strip().split("\t")

		# The only information required are Zone names.  Which are split
		# into Area and Location.
		area, location = rec[2].split("/",1)
		if z.has_key(area):
			z[area][location] = {}
		else:
			z[area] = {}
			z[area][location] = {}

	zones.close()
	return z

#~ print json.dumps(parseZoneFile())

def parseRuleZoneFiles(zone_file):
	"""
	Information about the files being parsed:

	If the Rule From > now and now < Rule To, apply the rule.
	# Rule	NAME	FROM	TO	TYPE	IN	ON	AT	SAVE	LETTER/S


	If the Zone UNTIL is < now ignore rule.
	# Zone	NAME		GMTOFF	RULES	FORMAT	[UNTIL]
	# Northern Territory
	#Zone Australia/Darwin	 8:43:20 -	LMT	1895 Feb
	#			 9:00	-	CST	1899 May
	#			 9:30	Aus	CST

	Link's to an already established timezone.
	Link	Antarctica/McMurdo	Antarctica/South_Pole
	"""

	# variables used to track values over multiple lines.
	context=''
	area = ''
	location = ''

	zfh = open(os.path.join(tzpath, zone_file), "r")
	for line in zfh.readlines():
		# Skip full line comments
		if re.search(r"^\w*#", line):
			continue

		# Remove carriage returns and trailing comments.
		line = line.strip("\n").split('#',1)[0]

		# Skip empty lines.
		if re.search(r"^$", line):
			continue

		# Split the line into each field of the record.
		x = re.search('^(.)', line)

		# Get the context of the line either: Zone, Rule or Link.
		if x.groups()[0] != '\t':
			context = x.groups()[0]

		# Detect malformed records and attempt to fix them.
		if context.lower() == "z":
			if x.groups()[0].lower() == "z":
				r = re.search('^(Z[^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+(.*)$', line)
				if r:
					print len(r.groups()), r.groups()
			elif re.search('\s', x.groups()[0]):
				# 			-4:32:36 1:00	BOST	1932 Mar 21 # Bolivia ST
				r = re.search('^\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)(.*)$', line)
				if r:
					print len(r.groups()), r.groups()
			else:
				print "UNKNOWN ZONE FORMAT!"
		elif context.lower() == "r":
			print line
		elif context.lower() == "l":
			print line
		else:
			print "UNKNOWN LINE"
	zfh.close()

for z in zone_files:
	parseRuleZoneFiles(z)
