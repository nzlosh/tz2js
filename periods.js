// Check if a period is within a given range.
/* EXAMPLES
   between 9am - 10am (range between time)
   Only Mondays (range between weekdays)
   1st Tuesday of each month ( repeat monthly,daily, hourly, weekly, fortnightly)
   1st Tuesday of each week ( repeat weekly, fortnightly )
   even weeks, odd weeks, modular x weeks  (modular calculation
   2nd & 3rd Wednesday between June and August (repeat between ranges)


---- Date / Time / Timezone

    Javascripts Date object calculations are done using milliseconds
    epoch timestamp.

Resource references:
* http://howtonode.org/prototypical-inheritance

*/


function htmlLine(msg, tag)
{
    tag = tag == undefined ? "p" : tag;
    document.write("<"+tag+">",msg,"</"+tag+">");
}


function betweenRange(lower, upper)
{
    var now = new Date();

    if (lower === undefined )
    {
        lower = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0);
    }
    if ( upper === undefined )
    {
        upper = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23,59,59);
    }

    l = dateToDayEpoch(lower);
    u = dateToDayEpoch(upper);
    n = dateToDayEpoch(now);

    htmlLine( "</p><h2>lower</h2><p> Timestamp = " + l );
    htmlLine( " Localtime = " + l);
    htmlLine( " UTC time = " + l.toUTCString);


    return l < n && n < u;
}


function RangeRule(r)
{

    if ( r.length < 3 )
    {
        htmlLine("Error, insufficient information to check range.");
        return false;
    }

    // extract time with /^(\d\d?):?(\d{0,2}):?(\d{0,2})/;
    // extract day of the week or month of the year with .toLowerCase().substr(0,3);

// [ false, ["00:00:01", "[+/]23:59:59","00:00:01"], ["monday","friday"], ["jan","dec"], "europe/paris" ]);
}

days = {"mon":1, "tue":2, "wed":3, "thu":4, "fri":5, "sat":6 ,"sun":0 };
months = {"jan":0, "feb":1, "mar":2, "apr":3, "may":4, "jun":5, "jul":6, "aug":7, "sep":8, "oct":9, "nov":10, "dec":11};

/*
 * Period accepts a key value pair structure to over-ride it's default parameters.
 * The parameters are then used to determine if the current time is with the defined period.
 */
function Period(kwargs){
    this.default_period = {
        execute: false,
        time: [[0,0,0,0],[23,59,59,999]],
        day: [1,7],
        dom: [1,31],
        month: [1,12],
        week: [1,52],
        year: undefined,
        tz: "europe/paris"
    };

    // Merge supplied arguments into default argument set
    for ( var k in kwargs) {
        this.default_period[k] = kwargs[k];
        console.log(this.default_period[k]);
    }
}
Period.prototype.toString = function toString() {
    s=""
    for ( var k in this.default_period ) {
        s += "  " + k +": " + this.default_period[k] ;
    }
    return s
};
Period.prototype.parseTime = function parseTime(t) {
    /* Accepts a single string, single integer, list string, list integer.
     * Returns list of min/max integer.
     */
    min = [  0,  0,  0,   0];
    max = [ 23, 59, 59, 999];
    if (t !== undefined) {
        // to do ... parse t as either a single string, a string encoded time, or a list time.
        // if a single string / list time is supplied, it's assumed to be the minimum time.
    }
    this.time = [ min , max ];
};

Period( { execute:false, time:["00:00:00","23:59:59"], day:["mon","fri"], dom: [1,31],  month:["jan","dec"], week: [1,52], year:[2013,2014],  tz:"europe/paris" } );
console.log(new Period().toString());
/*
Possible range / period usage formats:

t = new TimeRange ("00:00:01","23:59:59") // 00h00m01s to 23h59m59s
tr = new TimeList ([t, new TimeRange("12:00:01-20:01:30")])
w = new WeekdayRange ("Fri", "Sun") // Friday to Sunday
wdr = new WeekdayRepeat (["Mon","Wed", x]) // Monday, Wednesday, Friday to Sunday
woy new WeekofYear([1,2,3,(4-50)])

WeeklyRangeRule ({ x: true, h:{l:[00,00,01], u:[23,59,59]}, d:["monday","friday"], m:["jan","dec"], tz:"europe/paris" });
WeeklyRangeRule ([ false, ["00:00:01", "23:59:59"], ["monday","friday"], ["jan","dec"], "europe/paris" ]);

RepeatRule (["<=31", "Sunday"])
RepeatRule ([50, "WeekOfYear"])
*/

now = new Date();
msPerLeapYear = 126230400000;
msPerYear = 31536000000;
msPerDay = 86400000;
msPerHour = 3600000;
msPerMin = 60000;


/* Start to work on the calculations for converting epoch time to Y/M/D h:m:s:ms time. */
msToday = now.getTime() % msPerDay;

msThisHour = msToday % msPerHour;
hour = Math.floor( msToday / msPerHour );

msThisMinute = msToday % msPerMin;
minute = Math.floor( msThisHour / msPerMin );

second = Math.floor( msThisMinute / 1000);
millisecond = msThisMinute % 1000;

htmlLine( hour +":"+ minute +":"+ second +":"+ millisecond);
htmlLine( Math.floor(now.getTime() / msPerYear) );


/* Test Date object with tz data values" */
function tzDate(date, tz, dst) {
    this.date = new Date();
}
/*
 * Commented out until it can be intergrated into the tzDate object.
    var output = "<b>" + tz.area + "/" + tz.location + "</b> : ";

    // Calculate gmt offset
    d.setTime( d.getTime() + (tz.gmt_off*1000) );
    htmlLine(d.getTime() + "  is " + d.toUTCString() + " with zone as " + tz.zone_format + " and refers to rule " + tz.rules);

    // Calculate daylight savings offset

    var rule_output = ""
    // Display the rule information for the timezone.
    if ( tz.rules != "-" ) {
        // display any defined rules.
        if ( rules[tz.rules].length > 0 ) {
            for ( r in rules[tz.rules] ) {
                if ( rules[tz.rules][r]["year_from"] <= d.getUTCFullYear()
                     && d.getUTCFullYear() <= rules[tz.rules][r]["year_to"]  ) {
                    // Calculate the day of the month.

                    rule_output += "<br><i>Type:"+ rules[tz.rules][r]["rule_type"]+ ", " +
                           "Day On:"+ rules[tz.rules][r]["day_on"]+ ", " +
                           "Save:"+ rules[tz.rules][r]["save"]+ ", " +
                           "Letters:"+ rules[tz.rules][r]["letters"]+ ", " +
                           "Name:"+ rules[tz.rules][r]["name"]+ ", " +
                           "Month:"+ rules[tz.rules][r]["month_in"]+ ", " +
                           "Year: "+ rules[tz.rules][r]["year_to"]+ ", " +
                           "From: "+ rules[tz.rules][r]["year_from"]+ ", " +
                           "At: "+ rules[tz.rules][r]["time_at"] + "</i><br>";

                    // a date calculate will determine which rule is in effect for the current date/time.
                    tz.zone_format = tz.zone_format.replace("%s", rules[tz.rules][r]["letters"]);
                }
            }
        } else {
            tz.zone_format = tz.zone_format.replace("%s","");
            // the colour is for highlighting which zones don't have rules.
            tz.zone_format = "<font color=blue>" + tz.zone_format + "</font>"
        }
    } else {
        tz.zone_format = tz.zone_format.replace("%s","");
        tz.zone_format = "<font color=green>" + tz.zone_format + "</font>"
    }

    output += d.toUTCString() + "(" + tz.zone_format +")";
    htmlLine(output+rule_output);
}
*/

/*
 * "Split First" splits a string on the first occurrence
 * of the given character.
 *
 * Returns the string argument if no occurrence is found,
 * Returns an array with the split .
 *
*/
function splitfirst(splitee, split_char) {
    pos = splitee.indexOf(split_char);
    if ( pos == -1 ) {
        return splitee;
    }
    return [splitee.substr(0, pos), splitee.substr(pos+1)];
}

/* An example of using splitfirst
[area,loc] = splitfirst("America/Argentina/Buenos_Aires", "/");
tzDate(zones[area][loc][0]);
 */
for ( var area in zones ) {
    for ( var loc in zones[area]) {
        tzDate(zones[area][loc][0]);
    }
}

/* FROM PDA */

function w(msg, tag)
{
tag = tag == undefined ? "p" : tag ;
document.write( "<"+ tag +">"+ msg +"</"+ tag +">" );
}

w( "zeal", 'h1' );
w("Test date="+new Date(1360341593000).toUTCString() );
var TimeRange = function(){
this.st =[0, 0, 0 ];
this.et = [23,59,59];
}

TimeRange.prototype.insideRange = function() {

l = ( this.st[0] * 3600 +
this.st[1] * 60 +
this.st[2] ) * 1000;

u = ( this.et[0] * 3600 +
this.et[1] * 60 +
this.et[2] ) * 1000;

return true;
};


TimeRange.prototype.toString = function() {
return "" +  this.st[0] +
":" +  this.st[1] +
":" + this.st[2] +
" - " +  this.et[0] +
":" +  this.et[1] +
":" +  this.et[2];
};

w('b4 time range');
range = new TimeRange();

TimeRange.prototype.tz = function(tz){
    w('got tz:' + tz);
    if (tz == undefined) {
        tz = 1*60*60*1000; // force CET
    }
    this.tz = tz;
    w('set tz:' + tz);
    return true;
};

Date.prototype.getTzTime = function(){
    return this.getTime() + this.tz;
};

n = new Date();
w( n );
w( "localtime: " + new Date( n.getTime() ) );

w("LL "+ n.getTime() +'  ' + n.getTzTime() );

w( "1h east gmt: " + new Date( n.getTzTime() ) );
// i need to find out why this breaks.
//n.tz();
w( "4 1/2h east gmt: " + new Date( n.getTzTime() ) );

w( range.toString() );


// millisecond based calculations *********

var msPerDay = 24*60*60*1000;
var msPerWeek = 7 * msPerDay;
var msPerYear = msPerDay * 365;
var msPerLeapYear = msPerDay * ( 4 * 365 + 1);

function LeapYearsSinceEpoch(s)
{
// Add 2 years to calculate 1st leap 172
var l = (msPerYear * 2 ) + s
return ( l - l % msPerLeapYear ) / msPerLeapYear;
}

// day based calculations *********

var d0 = new Date(123456789000);

var totalLeptDays = LeapYearsSinceEpoch( d0.getTime() ) ;


msOfYear = d0.getTime() % msPerYear - ( totalLeptDays * msPerDay ) ;

msToday = msOfYear % msPerDay;

Year = ( msOfYear - msToday ) / msPerDay;

dayOfYear = (msOfYear- msToday)  / msPerDay;

h = "<tr><th>day 0</th><th>" + d0 + "</th></tr>";
l1 = "<tr><td>ms per day:</td><td>" + msPerDay + "</td></tr>";
l2 = "<tr><td>ms per week:</td><td>" +  msPerWeek + "</td></tr>";
l3 = "<tr><td>ms per leap year:</td><td>" +  msPerLeapYear + "</td></tr>";
l4 = "<tr><td>leap years:</td><td>" + totalLeptDays  + "</td></tr>";
l5 = "<tr><td>ms of days of year:</td><td>" + msOfYear  + "</td></tr>";
l6 = "<tr><td>ms today:</td><td>" + msToday  + "</td></tr>";
l7 = "<tr><td>day of year:</td><td>" + dayOfYear  + "</td></tr>";
l8 = "<tr><td>Year:</td><td>" + Year  + "</td></tr>";

w( h + l1 + l2 + l3 + l4 + l5 + l6 + l7 + l8, "table");


function describeZoneRules(zr)
{
    for ( var x in zr )
    {
        w( x, "h3" );
        var y_html="";
        for ( var y in zr[x] )
        {
            y_html += "<LI>"+y+": "+ rules["US"] [x][y] + "</LI>\n";
        }
        w( y_html, 'ol' );
    }
}



/* Test Date object with tz data values" */
function tzDate(tz) {
d = new Date();

w(tz.area + "/" + tz.location , "h2");

w("UTC Time : " + d.getTime() + " is " + d.toUTCString() );

d.setTime( d.getTime() + (tz.gmt_off*1000) );
w(d.getTime() + "  is " + d.toUTCString() + " with zone as " + tz.zone_format + " and refers to rule " + tz.rules );

describeZoneRules(  rules[ tz.rules ] );

}


tzDate(zones["Africa"]["Algiers"][0]);
tzDate(zones["Antarctica"]["Casey"][0]);
tzDate(zones["Asia"]["Kabul"][0]);
tzDate(zones["Australia"]["Darwin"][0]);
tzDate(zones["Europe"]["London"][0]);
/* 2 examples for America */
tzDate(zones["EST"]["null"][0]);
tzDate(zones["America"]["New_York"][0]);

tzDate(zones["America"]["Argentina/Buenos_Aires"][0]);

/*get utc time in ms
add timezone offset
get dateTime*/

function dayToNumber(d){
 var days = [ "sun", "mon", "tue", "thu", "fri", "sat" ];
 for ( var i = 0; i < days.length; i+=1)
 {
   if (days[i] == d.toLowerCase() )
  {
    return i;
  }
  return -1;
  }
}

find_day = ["Sun",">=",7];

w ( dayToNumber ( find_day[0]  ) );
current_month = new Date(Date.UTC(2013,2,find_day[2]));
w ( current_month.getDay() );

/*
function getFiles(filelist) {
if filelist.class == String.class
  if filelist == "all"
   else
    loadFile(filelist);
if filelist.class == Array.class ....
}
*/

w( find_day + " " + current_month );

w( "end", 'h6' );


/*
epoch timestamps are always in UTC.  To calculate if an epoche is within a given time of the day, a simple calculation of
todayms = Date() modulo 24*60*60*1000 must then have the tz offset and dst_offset values in seconds applied. e.g.
tz=1
dst=1
todayms += (tz+dst)*60*60*1000
leap years and seconds need to be factored into the calculation also.
*/

today = new Date();
w("dom = " + today.getDate() +
"<BR>dow = " + today.getDay()
);


days = Math.floor( today / msPerDay);

w("Days since 1970 " + days + "<BR>tz"+today);
w("ms today "+ (today - (days * msPerDay) ) );

w("ms today "+ today.getHours() +":"+ today.getMinutes() );

w("8h30m in ms = " + (18*60*60*1000 + 34*60*1000) );


function makeRange( begin, end, duration, interval )
{
w( "BEGIN: "+ begin +
"  END: " + end +
"  DURATION: " + duration +
"  INTERVAL: " + interval );
 return;
}


makeRange(0,23,1.5,2);
// "00:00:00-23:59:59"

range={
t: ['00:00:00','23:59:59'],
d:['mon',['saturday','sun']],
w:[1,3,'4-8','1-40/2'],
m:[1,3,'6-9','2-12/2'],
y:[2013,'15-20','%2'],
tz: "to do"
};


function CheckRange( arg )  {

wd={ "mon":1, "tue":2, "wed":3, "thu":4, "fri":5, "sat":6, "sun":0 };

w( "test range" );
w( arg.keys );

}


// RUN Every Monday
range({ run: true, d: "mon" });


// DONT RUN between 1am-6am and 6pm-midnight
range({run:false,t:"1:30-6,18-24", d:"sat-sun"});

// RUN between 12p-1pm on 25/dec/2013
range({t:"12-13", dm:"25", m:"dec", y:"2013"});

// RUN first 2 weeks of each year
range( {w:"1-2"} );


// 1:30-7 fixed time range 1:30am - 7am
// "0+1/3" fixed time duration with repetiton. Starting from midnight, apply a one hour period and repeat at 3h intervals.

var s = ["7-9","0+1/3","0+1:30","5-7:00:01/2:30"];


document.write('end');
