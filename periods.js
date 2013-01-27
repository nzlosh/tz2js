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

*/


function htmlLine(msg)
{
	document.write("<p>",msg,"</p>");
}

function periods()
{
	var d = new Date(0);
	htmlLine(d);
	htmlLine(d.toUTCString());
	htmlLine( new Date(Date.UTC(2012,02,30)) );
	htmlLine( "Is the date within the range? " + betweenRange() );
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

function dateToDayEpoch(d)
{
	return d.getTime();
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

periods();


RangeRule([ false, "00:00:01-23:59:59", ["monday","friday"], ["jan","dec"], "europe/paris" ]);


var rule = {
	weeknames: {"mon":1, "tue":2, "wed":3, "thu":4, "fri":5, "sat":6 ,"sun":0 },
	months: {"jan":0, "feb":1, "mar":2, "apr":3, "may":4, "jun":5,
			 "jul":6, "aug":7, "sep":8, "oct":9, "nov":10, "dec":11},
	now: new Date(),
	execute: true,
	times: [[0,0,1], [23,59,59]],
	weekddays: "",
	timezone: "europe/paris"
};

function timerange(r) {
	this.range = r,
	this.begin = {h:0,m:0,s:0},
	this.end = {h:23,m:59,s:59},
	this.limit = {min:0, max:86400000}
	
	// private method 
	var _parseRange = function(){
		if ( this.range !== undefined ) {
			// todo
		}
	}
}


var weekrange = {

}
var monthrange = {

}

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
