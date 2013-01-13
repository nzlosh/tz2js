// Check if a period is within a given range.
/* EXAMPLES
   between 9am - 10am (range between time)
   Only Mondays (range between weekdays)
   1st Tuesday of each month ( repeat monthly,daily, hourly, weekly, fortnightly)
   1st Tuesday of each week ( repeat weekly, fortnightly ) 
   even weeks, odd weeks, modular x weeks  (modular calculation
   2nd & 3rd Wednesday between June and August (repeat between ranges)
   
   THIS CODE EXPECTS THE LOCALTIME TO BE SET TO UTC+0.
*/
function htmlLine(msg)
{
	document.write("<p>",msg,"</p>");
}

function periods()
{
	var d = new Date();
	htmlLine(d);
	htmlLine(d.toUTCString());
	htmlLine(timeBetweenRange());
}

function timeBetweenRange(lower, upper)
{
	var now = new Date();
	
	if (lower === undefined )
	{
		lower = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,1);
	}
	if ( upper === undefined )
	{
		upper = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23,59,59);
	}
	
	l = dateToDayEpoch(lower);
	u = dateToDayEpoch(upper);
	n = dateToDayEpoch(now);
	return l < n && n < u;
}

function dateToDayEpoch(d)
{
	htmlLine(d.toUTCString());
	return d.getUTCHours()*60000 + d.getUTCMinutes()*1000 + d.getUTCSeconds();
}

periods();
/*
t = new TimeRange ("00:00:01","23:59:59") // 00h00m01s to 23h59m59s
tr = new TimeList ([t, new TimeRange("12:00:01-20:01:30")])
w = new WeekdayRange ("Fri", "Sun") // Friday to Sunday
wdr = new WeekdayRepeat (["Mon","Wed", x]) // Monday, Wednesday, Friday to Sunday
woy new WeekofYear([1,2,3,(4-50)])
* 
WeeklyRangeRule ({ x: true, h:{l:[00,00,01], u:[23,59,59]}, d:["monday","friday"], m:["jan","dec"], tz:"europe/paris" });
WeeklyRangeRule ([ false, [[00,00,01], [23,59,59]], ["monday","friday"], ["jan","dec"], "europe/paris" ]);

RepeatRule (["LastDayOfMonth", "Sunday"])
RepeatRule ([50, "WeekOfYear"])
*/
