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
import os, sys, re, json, time

tzdata_version = "2012j"
tzpath = os.path.join(sys.argv[1],"tzdata"+tzdata_version)

months = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ]
days = [ "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" ]

zone_files = [
	"africa",
	"antarctica",
	"asia",
	"australasia",
	#~ "backward",
	"etcetera",
	"europe",
	#~ "leapseconds",
	"northamerica",
	"pacificnew",
	#~ "solar87",
	#~ "solar88",
	#~ "solar89",
	"southamerica",
	#~ "systemv"
]





class tzRule(object):
	"""
	Holds a timezone rule.  The expected format is a list which contains
	the [Rule, NAME, FROM, TO, TYPE, IN, ON, AT, SAVE, LETTER/S]
	"""
	def __init__(self, name, year_from, rule_type, year_to, month_in, day_on, time_at, save, letters):
		self.name = name
		self.setYearFrom(year_from)
		self.setYearTo(year_to)
		self.setMonthIn(month_in)
		self.getDayOn(day_on)
		self.time_at = time_at
		self.rule_type = rule_type
		self.save = save
		self.setLetters(letters)


	def setFromYear(self):
		# We only test times equal to or greater than the present.
		if int(z[2]) <= time.gmtime()[0] <= int(z[3]):
			print "Fields: %d" %len(z), "*** Name:", z[1], "From: ", z[2], "to %s/%s/%s" % (z[3], months.index(z[5]), z[6]), "^^^ TYPE:",z[4], "AT:", z[7],"SAVE:",z[8], z[9].strip()


	def setYearFrom(self, year_from):
		"""
		Expected input: YYYY formatted year.
		"""
		if year_from.isdigit():
			self.year_from = int(year_from)
		else:
			raise "Year From isn't a digit!"


	def getYearFrom(self):
		return self.year_from


	def setYearTo(self, year_to):
		if year_to == "only":				# Transform TO "only" to the equivalent year as FROM
			self.year_to = self.year_from
		elif year_to == "max":				# Transform TO "max" arbitrarily to 40 years in the future.
			self.year_to = 2050
		else:
			self.year_to = int(year_to)		# cast to integer


	def getYearTo(self):
		return self.year_to


	def setMonthIn(self, month_in):
		self.month_in = months.index(month_in)+1


	def getMonthIn(self):
		return self.month_in


	def getDayOn(self, day_on):
		if day_on.isdigit():
			self.day_on = int(day_on)
		else:
			# confirm the format is valid then calculate the day of the month.
			self.day_on = "f(%s)" % day_on
			try:
				day, comp, dom = re.search('(\w+)(\W+)(\d+)',day_on).groups()
				print day, comp, dom
			except(AttributeError):
				try:
					day = re.search('last(\w+)', day_on).groups()[0]
					print day,"<",31
				except:
					print "ZOOOOOT!", day_on


	def setLetters(self, letters):
		self.letters = letters.strip()
		if self.letters == "-":
			self.letters = ""



	def __str__(self):
		return "Rule: %s %s -> %s/%s/%s@%s Type: %s Save: %s Letter: %s" % (
			self.name,
			self.year_from,
			self.year_to,
			self.month_in,
			self.day_on,
			self.time_at,
			self.rule_type,
			self.save,
			self.letters
		)



class tzZone(object):
	"""
	[Zone, NAME, GMTOFF, RULES, FORMAT, [UNTIL]] or
	[GMTOFF, RULES, FORMAT, [UNTIL]]
	"""
	def __init__(name, gmt_off, rules, zone_format, until):
		self.name
		self.gmt_off
		self.rules
		self.zone_format
		self.until




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
	tmp = []

	zfh = open(os.path.join(tzpath, zone_file), "r")
	for line in zfh.readlines():
		# Skip full line comments
		if re.search(r"^\s*#", line):
			continue

		# Remove carriage returns and trailing comments.
		line = line.strip("\n").split('#',1)[0]

		# Skip empty lines.
		if re.search(r"^$", line):
			continue

		# Identify the type of line to process.
		x = re.search('^(.)', line)

		# Get the context of the line either: Zone, Rule or Link.
		if x.groups()[0] != '\t':
			context = x.groups()[0]

		# Extract the fields from the line.
		if context.lower() == "z":
			if x.groups()[0].lower() == "z":
				r = re.search('^(Z[^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+(.*)$', line)
				if r:
					#~ print len(r.groups()), r.groups()
					tmp.append( list(r.groups()) )
			elif re.search('^\s', x.groups()[0]):
				# 			-4:32:36 1:00	BOST	1932 Mar 21 # Bolivia ST
				r = re.search('^\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)(.*)$', line)
				if r:
					#~ print len(r.groups()), r.groups()
					tmp.append( list(r.groups()) )
			else:
				print "UNKNOWN ZONE FORMAT!", line
		elif context.lower() == "r":
			r = re.search("^(R[^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)(.*)", line)
			if r:
				#~ print len(r.groups()), r.groups()
				tmp.append( list(r.groups()) )
			else:
				print "UNKOWN RULE FORMAT!", line
		elif context.lower() == "l":
			r = re.search("^(L[^\s]+)\s+([^\s]+)\s+([^\s]+)", line)
			if r:
				#~ print len(r.groups()), r.groups()
				tmp.append( list(r.groups()) )
			else:
				print "UNKNOWN LINK FORMAT!", line
		else:
			print "UNKNOWN LINE!", line
	zfh.close()

	return tmp


zone_list = parseZoneFile();

zone_result = []
for z in zone_files:
	zone_result.append(parseRuleZoneFiles(z))

#print json.dumps(zone_result)
#print json.dumps(parseZoneFile())


for zr in zone_result:
	for z in zr:
		if z[0].lower() == "rule":
			a_rule = tzRule(z[1],z[2],z[4],z[3],z[5],z[6],z[7],z[8],z[9])
			print a_rule
		else:
			print z
