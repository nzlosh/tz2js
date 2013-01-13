#!/usr/bin/env python

# Required modules
import os, sys, re, json

# This file contains a table with the following columns:
# 1.  ISO 3166 2-character country code.  See the file `iso3166.tab'.
# 2.  Latitude and longitude of the zone's principal location
#     in ISO 6709 sign-degrees-minutes-seconds format,
#     either +-DDMM+-DDDMM or +-DDMMSS+-DDDMMSS,
#     first latitude (+ is north), then longitude (+ is east).
# 3.  Zone name used in value of TZ environment variable.
# 4.  Comments; present if and only if the country has multiple rows.


tzdata_version = "2012j"
tzpath = os.path.join(sys.argv[1],"tzdata"+tzdata_version)

"africa",
"antarctica",
"asia",
"australasia",
"backward",
"etcetera",
"europe",
"leapseconds",
"northamerica",
"pacificnew",
"solar87",
"solar88",
"solar89",
"southamerica",
"systemv",



def parseZoneFile():
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

		if z.has_key(rec[0]):
			z[rec[0]].append(rec[2])
		else:
			z[rec[0]] = [rec[2]]

	zones.close()
	return z

print json.dumps(parseZoneFile())
