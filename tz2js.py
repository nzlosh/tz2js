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
import os, sys, re, json, time, datetime, logging

logging.basicConfig( ) # level=logging.DEBUG

def usage():
    print "\nUsage: %s <path to tzdata directory>\n" % sys.argv[0]
    sys.exit(1)

if len(sys.argv) != 2:
    usage()

tzdata_version = "2012j"
tzpath = os.path.join(sys.argv[1],"tzdata"+tzdata_version)
if not os.path.exists(tzpath):
    logging.critical( "File '%s' doesn't exist" % tzpath )
    sys.exit(2)

months = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ]
days = [ "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" ]

MAX_YEAR = 2050

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



# Required to help transform Python objects into JSON comptiable objects.
# See the json module doc's for more information help(json)
# Help from: http://stackoverflow.com/questions/5160077/encoding-nested-python-object-in-json?rq=1
class jsonEncoderHelper(json.JSONEncoder):
    def default(self, o):
        if hasattr(o,"toJSON"):
            return o.toJSON()
        return json.JSONEncoder.default(self, o)


# Extend the datetime class to include a method which returns a JSON comptiable date string.
class DateTime(datetime.datetime):
    def toJSON(self):
        return self.isoformat() # present dates in ISO 8601 format


class tzRule(object):
    """
    Holds a timezone rule.  The expected format is a list which contains
    the [Rule, NAME, FROM, TO, TYPE, IN, ON, AT, SAVE, LETTER/S]
    """
    def __init__(self, name, year_from, year_to, rule_type, month_in, day_on, time_at, save, letters):
        self.setName(name)
        self.setYearFrom(year_from)
        self.setYearTo(year_to)         # Order matters; year_to, month_in,
        self.setMonthIn(month_in)       # day_on are used to calculate
        self.setDayOn(day_on)           # lastDay/firstDay entries correctly.
        self.setTimeAt(time_at)
        self.rule_type = rule_type
        self.save = save
        self.setLetters(letters)


    def setName(self, name):
        self.name = name


    def getName(self):
        return self.name


    def isCurrent(self):
        """
        Test if the current date/time falls with the min/max period.
        """
        if (self.year_from.year <= time.gmtime()[0] <= self.year_to) or (self.year_from.year > time.gmtime()[0]):
            logging.debug( "%s: Period included." % self.__class__.__name__ )
            return True
        logging.debug( "%s: Period excluded %s -> %s" % ( self.__class__.__name__, self.year_from.year, self.year_to ) )
        return False


    def setYearFrom(self, year_from):
        """
        Expected input: YYYY formatted year.
        """
        if year_from.isdigit():
            self.year_from = DateTime(int(year_from), 1, 1)
        else:
            logging.error( "%s: Unhandled format in Year From argument." % self.__class__.__name__ )
            raise "Year From isn't a digit!"


    def getYearFrom(self):
        return self.year_from


    def setYearTo(self, year_to):
        if year_to == "only":               # Transform TO "only" to the equivalent year as FROM
            self.year_to = self.year_from.year
        elif year_to == "max":              # Transform TO "max" arbitrarily selected maximum year.
            self.year_to = MAX_YEAR
            logging.info( "%s: Set 'max' to %d" % ( self.__class__.__name__, MAX_YEAR ) )
        else:
            self.year_to = int(year_to)     # expect year to be a number, so it's explicitly cast to an integer


    def getYearTo(self):
        return self.year_to


    def setMonthIn(self, month_in):
        self.month_in = months.index(month_in)+1


    def getMonthIn(self):
        return self.month_in


    def setDayOn(self, day_on):
        if day_on.isdigit():
            self.day_on = int(day_on)
        else:
            # confirm the format is valid then calculate the day of the month.
            self.day_on = "f(%s)" % day_on
            try:
                day, comp, dom = re.search('(\w+)(\W+)(\d+)',day_on).groups()
                logging.debug("%s: Day On: %s, %s, %s" % (self.__class__.__name__, day, comp, dom) )
            except(AttributeError):
                pass
            try:
                day = re.search('last(\w+)', day_on).groups()[0]
                # TODO: Handle calculation of last/first day of month etc.
                logging.debug("%s: Day On: %s, %s, %s" % (self.__class__.__name__, day, "<=", 31) )
            except(AttributeError):
                pass


    def setTimeAt(self, time_at):
        """
        Expects time [h]h:mm format.  Also seen 0 as a value.
        """
        logging.debug("%s: Time At: %s" % (self.__class__.__name__, time_at) )
        # Handle special case of 0
        if time_at == "0":
            time_at = "0:00"
        self.hour, self.minute = time_at.split(":")
        self.time_at = time_at

    def getTimeAt(self):
        return self.time_at

    def getDateTo(self):
        """
        Return the To date as a Python date object.
        """
        raise NotImplementedError


    def getDateFrom(self):
        """
        Return the From date as Python date object.
        """
        raise NotImplementedError


    def setLetters(self, letters):
        """
        @arg letters holds the letter to identify the day light savings.
        """
        self.letters = letters.strip()
        if self.letters == "-":
            self.letters = ""


    def getLetters(self):
        return self.letters


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

    def toJSON(self):
        return {
            "name": self.name,
            "year_from": self.year_from,
            "year_to": self.year_to,
            "month_in": self.month_in,
            "day_on": self.day_on,
            "time_at": self.time_at,
            "rule_type": self.rule_type,
            "save": self.save,
            "letters": self.letters
        }




class tzZone(object):
    """
    [Zone, NAME, GMTOFF, RULES, FORMAT, [UNTIL]] or
    [GMTOFF, RULES, FORMAT, [UNTIL]]
    """
    def __init__(self, name, gmt_off, rules, zone_format, until = MAX_YEAR):
        self.setName(name)
        self.setGMTOffset(gmt_off)
        self.setRules(rules)
        self.setFormat(zone_format)
        self.setYearUntil(until)


    def setName(self, name):
        """
        Expected format as 'area/location'. e.g. 'Atlantic/Canary'
        """

        if name.find("/") == -1:
            logging.debug("No slash in location '%s'"%name)
            self.area = name
            self.location = None
        else:
            logging.debug("Split on first slash for %s"%name)
            self.area, self.location = name.split("/", 1)


    def getName(self):
        return "%s/%s" % (self.area, self.location)


    def getArea(self):
        return self.area


    def getLocation(self):
        return self.location


    def setGMTOffset(self, gmt_off):
        self.gmt_off = gmt_off


    def getGMTOffset(self):
        return self.gmt_off


    def setRules(self, rules):
        self.rules = rules


    def getRules(self):
        return self.rules


    def setFormat(self, zone_format):
        self.zone_format = zone_format


    def getFormat(self):
        return self.zone_format


    def setYearUntil(self, until):
        """
        Examples "1916 May 14 23:00" or "1911" and anything in between.
        """
        default = [MAX_YEAR, 1, 1, 0, 0, 0]
        tmp = until.split(" ")
        if len(tmp[0]) == 0:
            # Empty until field, set the date to max.
            tmp = default
            logging.debug("*** %s: Year Until = %s" % (self.__class__.__name__, str(tmp) ) )

        if "" in tmp:
            logging.debug( "Fixed %s", str(tmp) )
            tmp.remove('')

         # TODO: Implement parsing for the year_until
        if len(tmp) >= 2 and type(tmp[1]) == type(""):
            tmp[1] = months.index(tmp[1])+1
        x = 0
        for i in tmp:
            try:
                tmp[x] = int(tmp[x])
                default[x] = tmp[x]
                x+=1
            except ValueError:
                default[x] = tmp[x]
                x+=1
        self.until = default


    def isCurrent(self):
        return self.until[0] >= time.gmtime()[0]    # Verify this code is correct!


    def getYearUntil(self):
        return self.until


    def __str__(self):
        return "Zone Area: %s Location %s, GMT Offset: %s, Rule: %s, Format: %s, Until: %s" % (
            self.area,
            self.location,
            self.gmt_off,
            self.rules,
            self.zone_format,
            self.until)


    def toJSON(self):
        return {
            "area": self.area,
            "location": self.location,
            "gmt_off": self.gmt_off,
            "rules": self.rules,
            "zone_format": self.zone_format,
            "until": self.until
        }



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

    z = {}


    zone_file = os.path.join(tzpath,"zone.tab")

    if not os.path.exists(zone_file):
        print "File '%s' doesn't exist" % zone_file
        sys.exit(2)

    zones = open( zone_file, "r")

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
        if not z.has_key(area):
            z[area] = {}
        z[area][location] = []

    zones.close()
    return z




def parseRuleZoneFile(filename, zones={}, rules={}):
    """
    Information about the files being parsed:

    If the Rule From > now and now < Rule To, apply the rule.
    # Rule  NAME    FROM    TO  TYPE    IN  ON  AT  SAVE    LETTER/S


    If the Zone UNTIL is < now ignore rule.
    # Zone  NAME        GMTOFF  RULES   FORMAT  [UNTIL]
    # Northern Territory
    #Zone Australia/Darwin   8:43:20 -  LMT 1895 Feb
    #            9:00   -   CST 1899 May
    #            9:30   Aus CST

    Link's to an already established timezone.
    Link    Antarctica/McMurdo  Antarctica/South_Pole
    """

    # variables used to track values over multiple lines.
    context = ""
    tmp_location = ""

    rule_zone_file = os.path.join(tzpath, filename)
    if not os.path.exists(rule_zone_file):
        print "File '%s' doesn't exist" % rule_zone_file
        sys.exit(2)

    zfh = open(rule_zone_file, "r")
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
        line_match = re.search('^(.)', line)

        # Get the context of the line either: Zone, Rule or Link.
        if line_match.groups()[0] != '\t':
            context = line_match.groups()[0]

        # Extract the fields from the line.
        if context.lower() == "z":
            if line_match.groups()[0].lower() == "z":
                r = re.search('^(Z[^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s*(.*)$', line)
                if r:
                    tmp = list( r.groups() )
                    tmp.pop(0) # Throw away the "Zone" keyword.

                    # Some lines don't explicitly have the zone's location so it's set here.
                    tmp_location = tmp[0]
                    logging.debug("parseRuleZone: Got location as = %s" % ( tmp_location ) )
                else:
                    raise ValueError("Zone doesn't match expected format %s" % line)
            elif re.search('^\s', line_match.groups()[0]):
                #           -4:32:36 1:00   BOST    1932 Mar 21 # Bolivia ST
                r = re.search('^\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)(.*)$', line)
                if r:
                    # Zone lines without explicit locations use the
                    # last explicitly mentioned zone location.
                    tmp = [tmp_location]
                    tmp.extend( list( r.groups() ) )
                    logging.debug("parseRuleZone: set location to = %s" % ( tmp_location ) )
                else:
                    raise ValueError("Zone doesn't match expected format %s" % line)
            else:
                logging.debug( "UNKNOWN ZONE FORMAT! %s" % line )
                continue

            # Strip white space from last field.
            tmp[4] = tmp[4].strip()

            tmpzone = tzZone(*tmp)

            if not zones.has_key(tmpzone.getArea()):
                logging.warning( "A zone area which wasn't defined has been added. %s" % tmpzone.getArea() )
                zones[tmpzone.getArea()] = {}

            if not zones[tmpzone.getArea()].has_key(tmpzone.getLocation()):
                logging.warning( "A zone location which wasn't defined has been added. %s" % tmpzone.getLocation() )
                zones[tmpzone.getArea()][tmpzone.getLocation()] = []

            if tmpzone.isCurrent():
                zones[tmpzone.getArea()][tmpzone.getLocation()].append( tmpzone )

        elif context.lower() == "r":
            r = re.search("^(R[^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)(.*)", line)
            if r:
                tmp = list(r.groups())
                tmp.pop(0) # discard "Rule" field.

                if not rules.has_key(tmp[0]):
                    rules[tmp[0]] = []

                tmprule = tzRule(*tmp)
                if tmprule.isCurrent():
                    rules[tmp[0]].append( tmprule )
            else:
                raise ValueError("UNKOWN RULE FORMAT! %s" % line)

        elif context.lower() == "l":
            r = re.search("^(L[^\s]+)\s+([^\s]+)\s+([^\s]+)", line)
            if r:
                tmp = list(r.groups())
                if not rules.has_key(tmp[1]):
                    rules[tmp[1]] = []
                rules[tmp[2]] = rules[tmp[1]]
            else:
                raise ValueError("UNKNOWN LINK FORMAT! %s" % line)

        else:
            raise ValueError("UNKNOWN LINE! %s" % line)
    zfh.close()

    return rules


zones = parseZoneFile()

rules = {}
for zone_file in zone_files:
    rules.update( parseRuleZoneFile(zone_file, zones, rules) )

print "zones =",json.dumps(zones, cls=jsonEncoderHelper)
print "rules =",json.dumps(rules, cls=jsonEncoderHelper)

#~ for rk in rules.keys():
    #~ print "Rule [%s]" % rk
    #~ for r in rules[rk]:
        #~ print "\t%s" % r
#~ 
#~ for zak in zones.keys():
    #~ print "Zone Area [%s]" % zak
    #~ for zlk in zones[zak].keys():
        #~ print "\tLocation [%s]" % zlk
        #~ for z in zones[zak][zlk]:
            #~ print "\t\t%s" % z
