/* periods.js
 * ==========
 * Checks the current time is within a given time period based on a set
 * of criteria which determine time of day, day of week, day of month,
 * month, week of year, year, timezone and execution state.
 *
 * Examples are:
 * between 9am - 10pm (range between time)
 * new Period({time: ["9","10"]});
 *
 * Only Mondays (range between weekdays)
 * new Period({dow: ["mon","mon"]});
 *
 *
 * Currently unimplemented ranges
 * ------------------------------
 * 1st Tuesday of each month ( repeat monthly, weekly, fortnightly)
 *
 * Even weeks, odd weeks, modular x weeks  (modular calculation)
 *
 * 2nd & 3rd Wednesday between June and August (repeat between ranges)
 *
 *
 * Date / Time / Timezone
 * ======================
 * Javascript's Date object calculations are done using milliseconds timestamp
 * since midnight 1st Jan 1970.
 *
 *
 * Resource references
 * ===================
 * http://howtonode.org/prototypical-inheritance
*/


// Global variables.
days = {"mon":1, "tue":2, "wed":3, "thu":4, "fri":5, "sat":6 ,"sun":0 };
months = {"jan":0, "feb":1, "mar":2, "apr":3, "may":4, "jun":5, "jul":6, "aug":7, "sep":8, "oct":9, "nov":10, "dec":11};
execute_policy = true;      // Set the default execution policy in the event no Periods match or are defined.


/*
 * A logging object inspired by the Python's logger class.
 * Logs to null, console or web page.
 * Levels are determined by an integer value.  The higher the value, the
 * more verbose the logging becomes.
 *
*/
var Log = function(level){
    this.level = level;
    this.levels = {"debug": 10, "warn": 20, "info": 30};
    this.active_warn = this.level >= this.levels.debug ? this.html_logger : this.null_logger;
    this.active_debug = this.level >= this.levels.warn ? this.html_logger : this.null_logger;
    this.active_info = this.level >= this.levels.info ? this.html_logger : this.null_logger;
};
Log.prototype.logger = function(lvl,msg) {
    console.log(lvl + ": " + msg);
}
Log.prototype.html_logger = function(lvl,msg) {
    document.write("<p><i>" + lvl + ": " + msg + "</i></p>");
}
Log.prototype.null_logger = function(lvl,msg) {
    return true;
}
Log.prototype.warn = function warn(msg) {
    this.active_warn("WARN", msg);
}
Log.prototype.debug = function debug(msg) {
    this.active_debug("DEBUG", msg);
}
Log.prototype.info = function info(msg) {
    this.active_info("INFO", msg);
}

// Create the logger object immediately so it's available for the function
// definitions that follow directly below.
log = new Log(30);


/*
 * getType
 * =======
 * This is taken from http://tech.karbassi.com/2009/12/18/object-type-in-javascript/ and
 * provides a clean implementation for extracting the object type as a string.
*/
function getType(obj){
    if (obj === undefined) { return 'undefined'; }
    if (obj === null) { return 'null'; }
    return Object.prototype.toString.call(obj).split(' ').pop().split(']').shift().toLowerCase();
}
/* The prototype method is part of the implementation but it causes undesirable
 * effects when integrated into the Zone and Rule objects.
*/
/*
Object.prototype.getType = function(){
    return Object.prototype.toString.call(this).split(' ').pop().split(']').shift().toLowerCase();
};
*/

/*
 * splitOnFirst
 * ============
 * Split a string on the first occurrence of the given character.
 *
 * @split_string: the string to attempt to split.
 * @split_char: the character to split on.
 *
 * If the split_char isn't found in the split_string argument, the
 *   split_string argument is returned unmodified.
 * If an occurence of split_char is found in split_string, an array containing
 *   the left hand side and right hand side strings is returned.
 *
*/
function splitOnFirst(split_string, split_char) {
    pos = split_string.indexOf(split_char);
    if ( pos == -1 ) {
        return split_string;
    }
    return [split_string.substr(0, pos), split_string.substr(pos+1)];
}



/* Period
 * ======
 *
 * Period accepts a key value pair structure to override it's default parameters.
 * The parameters are then used to determine if the current time is with the defined period.
 *
 * Valid keys:
 *   execute: boolean to indicate if the period is execution or non-execution.
 *   time: an array containing the start and end times for a period.
 *   day: the
 * .... to do ....
 */
function Period(kwargs){
    this.default_period = {
        execute: false,
        time: [ [0, 0, 0, 0], [ 23, 59, 59, 999] ],
        day: [0, 6],
        dom: [1, 31],
        month: [0, 11],
        week: [1, 52],
        year: undefined,
        tz: "europe/paris"
    };

    // Merge supplied arguments into default argument set
    for ( var k in kwargs) {
        log.debug(k + " : " + this.default_period[k]);
        this.default_period[k] = kwargs[k];
    }
    // Call functions to process period arguments.
    this.parseTimeZone();
    this.parseYear();
    this.parseWeek();
    this.parseDayOfMonth();
    this.parseMonth();
    this.parseDay();
    this.parseTime();
};
Period.prototype.toString = function toString() {
    s = "";
    for ( var k in this.default_period ) {
        s += "  " + k +": " + this.default_period[k] ;
    }
    return s;
}
/* insideBoundaries
 * ================
 * Given a date/time with timezone extensions, determine if it falls within
 * the boundaries of the Period's constraints.
*/
function insideBoundaries(check_date)
{
    throw "insideBoundaries Unimplemented";
}
Period.prototype.parseTimeZone = function paseTimeZone() {
    var tz = this.default_period["tz"];
    log.debug(splitOnFirst(tz, "/"));
    tz = splitOnFirst(tz, "/");
    tz = zones[tz[0]][tz[1]];
    this.default_period["tz"] = tz;
}
Period.prototype.parseYear = function parseYear() {
    var year = this.default_period["year"];

    log.info("To do: parse this " + year );

    this.default_period["year"] = year;
}
Period.prototype.parseWeek = function parseWeek() {
    var week = this.default_period["week"];

    log.info("To do: parse this " + week );

    this.default_period["week"] = week;
}
/* Period method parseTime
 * Brief: Accept an array containing two elements of either type array or string.
 * A element array may contain between 1 and 4 elements, a string may be of the
 * format "[h]h[:[m]m][:[s]s][:[t][t]t]" h=hour, m=minute, s=second, t=millisecond.
 * Returns list of min/max integer.
 */
Period.prototype.parseTime = function parseTime() {
    var time = this.default_period["time"];

    log.info("To do: parse this " + time );

    this.default_period["time"] = time;
}
/* Period method parseDay
 * Brief: Takes a list and ensures the resulting internal
 * variable is updated with an integer representation of the day.
 *
 * @day - a key present in the default period variable.  It is expected
 * to hold on of the following: an array with two string elements or two
 * integer elements, or an undefined value (this indicates a default value is to be used.)
 *
 * Return: No result is explicitly returned, however the internal state of the
 * Period object is updated with the calculated day range.
 */
Period.prototype.parseDay = function parseDay()
{
    var day = this.default_period["day"];
    // The argument is required to be an array, with a start/stop day.
    if ( getType(day) !== getType([]) ) {
        throw "Expected array type for argument day but got " + getType(day) + " instead." ;
    }
    if ( day.length != 2 ) {
        throw "Expected 2 agruments for day but got " + day.length;
    }
    day[0] = this._validateDay(day[0]);
    day[1] = this._validateDay(day[1]);

    // Sanity check the day range limits.
    if ( day[0] > day[1] ) {
        throw "[" + day + "] isn't a valid day range, the first element must be smaller than the second.";
    }
    this.default_period["day"] = day;
}
Period.prototype._validateDay = function _validateDay(day) {

    try {
        // Is argument a number?
        if ( isNaN(parseInt(day)) ) {
            throw "Not a number";
        }
        day = parseInt(day);

    } catch (err) {
        log.warn("Can't convert " + day +" to integer: " + err);
        try {
            // Store keys in an array so they can be compared against the day string.
            var keys = Object.keys(days);

            for ( var i = 0; i < keys.length; i++ ) {
                if ( day.substr(0,3).toLowerCase() == keys[i] ) {
                    log.debug("Matched : " + day.substr(0,3).toLowerCase() + " and " + days[keys[i]]);
                    day = days[keys[i]];
                    break;
                }
            }
            // If day is a string, we failed to match a valid weekday name.
            if ( isNaN(day) ) {
                throw (day + " isn't a valid name of week.");
            }
        } catch (err) {
            // Give up, the argument isn't a valid weekday name or a valid integer value.
            throw ("An element in the day argument is invalid: " + err );
        }
    }

    // Assert the day is within the boundaries of 0-6
    if ( day >= 0 && day <= 6 ) {
        return day;
    } else {
        throw day + " isn't a valid value for day argument.";
    }

}
Period.prototype.parseMonth = function parseMonth()
{
    var month = this.default_period["month"];
    // The argument is required to be an array, with a start/stop day.
    if ( getType(month) !== getType([]) ) {
        throw "Expected array type for argument month but got " + getType(month) + " instead." ;
    }
    if ( month.length != 2 ) {
        throw "Expected 2 agruments for month but got " + month.length;
    }
    month[0] = this._validateMonth(month[0]);
    month[1] = this._validateMonth(month[1]);

    // Sanity check the day range limits.
    if ( month[0] > month[1] ) {
        throw "[" + month + "] isn't a valid month range, the first element must be smaller than the second.";
    }

    this.default_period["month"] = month;
}
Period.prototype._validateMonth = function _validateMonth(month) {

    try {
        // Is argument a number?
        if ( isNaN(parseInt(month)) ) {
            throw "Not a number";
        }
        month = parseInt(month);

    } catch (err) {
        log.warn("Can't convert " + month + " to integer: " + err);
        try {
            // Store keys in an array so they can be compared against the day string.
            var keys = Object.keys(months);

            for ( var i = 0; i < keys.length; i++ ) {
                if ( month.substr(0,3).toLowerCase() == keys[i] ) {
                    log.debug("Matched : " + month.substr(0,3).toLowerCase() + " and " + months[keys[i]]);
                    month = months[keys[i]];
                    break;
                }
            }
            // If month is a string, we failed to match a valid month name.
            if ( isNaN(month) ) {
                throw (month + " isn't a valid month name .");
            }
        } catch (err) {
            // Give up, the argument isn't a valid month name or a valid integer value.
            throw ("An element in the month argument is invalid: " + err );
        }
    }

    // Assert the month is within the boundaries of 0-11
    if ( month >= 0 && month <= 11 ) {
        return month;
    } else {
        throw month + " isn't a valid value for month argument.";
    }

}
Period.prototype.parseDayOfMonth = function parseDayOfMonth() {
    var dom = this.default_period["dom"];
    log.debug("got:"+dom);
    // The argument is required to be an array, with a start/stop day of month.
    if ( getType(dom) !== getType([]) ) {
        throw "Expected array type for argument day of month but got " + getType(dom) + " instead." ;
    }
    if ( dom.length != 2 ) {
        throw "Expected 2 agruments for day of month but got " + dom.length;
    }

    dom[0] = this._validateDayOfMonth(dom[0]);
    dom[1] = this._validateDayOfMonth(dom[1]);

    // Sanity check the day range limits.
    if ( dom[0] > dom[1] ) {
        throw "[" + dom + "] isn't a valid day of the month range, the first element must be smaller than the second.";
    }
    this.default_period["dom"] = dom;
}
Period.prototype._validateDayOfMonth = function _validateDayOfMonth(dom) {
    try {
        dom = parseInt(dom);
        if (! ( dom >= 1 && dom <= 31 ) ) {
            throw dom + " isn't a valid day of the month.";
        }
    } catch (err) {
        throw err;
    }
    return dom;
}

//**********************************************************************
/* Test Date object with tz data values" */
function tzDate(date, tz, dst) {
    this.now = new Date();
    // these variables aren't all require but they're included in a previsory capacity.
    this.msPerLeapYear = 126230400000;
    this.msPerYear = 31536000000;
    this.msPerDay = 86400000;
    this.msPerHour = 3600000;
    this.msPerMin = 60000;
    /* Start to work on the calculations for converting epoch time to Y/M/D h:m:s:ms time. */
    this.msToday = this.now.getTime() % this.msPerDay;
    this.msThisHour = this.msToday % this.msPerHour;
    this.hour = Math.floor( this.msToday / this.msPerHour );
    this.msThisMinute = this.msToday % this.msPerMin;
    this.minute = Math.floor( this.msThisHour / this.msPerMin );
    this.second = Math.floor( this.msThisMinute / 1000);
    this.millisecond = this.msThisMinute % 1000;

    // millisecond based calculations *********
    this.msPerWeek = 7 * msPerDay;
    this.msPerLeapYear = msPerDay * ( 4 * 365 + 1);

    // day based calculations *********
    this.msOfYear = this.now.getTime() % this.msPerYear - ( this.totalLeptDays * this.msPerDay ) ;
    this.msToday = this.msOfYear % this.msPerDay;
    this.Year = ( this.msOfYear - this.msToday ) / this.msPerDay;
    this.dayOfYear = (this.msOfYear - this.msToday)  / this.msPerDay;

    //this.leapYearsSinceEpoch();


    h = "<tr><th>day 0</th><th>" + now + "</th></tr>";
    l1 = "<tr><td>ms per day:</td><td>" + this.msPerDay + "</td></tr>";
    l2 = "<tr><td>ms per week:</td><td>" +  this.msPerWeek + "</td></tr>";
    l3 = "<tr><td>ms per leap year:</td><td>" +  this.msPerLeapYear + "</td></tr>";
    l4 = "<tr><td>leap years:</td><td>" + this.totalLeptDays  + "</td></tr>";
    l5 = "<tr><td>ms of days of year:</td><td>" + this.msOfYear  + "</td></tr>";
    l6 = "<tr><td>ms today:</td><td>" + this.msToday  + "</td></tr>";
    l7 = "<tr><td>day of year:</td><td>" + this.dayOfYear  + "</td></tr>";
    l8 = "<tr><td>Year:</td><td>" + this.Year  + "</td></tr>";

    log.debug( h + l1 + l2 + l3 + l4 + l5 + l6 + l7 + l8);
};
tzDate.prototype.toString = function toString() {
    // to do : implement this to include tz offset, dst and abbreviation.
    return this.date.toString();
}
tzDate.prototype.leapYearsSinceEpoch = function leapYearsSinceEpoch() {
    // Add 2 years to calculate 1st leap 1972
    s = this.now.getTime();
    this.totalLeptDays = Math.floor( (this.msPerYear * 2  + s) / this.msPerLeapYear);
    return true;
}
tzDate.prototype.tz = function tz(tz) {
    /* epoch timestamps are always in UTC.
     * To calculate if an epoche is within
     * a given time of the day,
     * a simple calculation of
     *      todayms = Date() modulo 24*60*60*1000
     * must then have the tz offset and dst_offset
     * values in seconds applied. e.g.
     *      tz=1
     *      dst=1
     *      todayms += (tz+dst)*60*60*1000
     * leap years and seconds need to be factored
     * into the calculation also.
     */

    log.debug("dom = " + this.now.getDate() + "<BR>dow = " + this.now.getDay() );
    this.days = Math.floor( this.now / msPerDay);
    log.debug("Days since 1970 " + this.days + "<BR>tz" + this.now);
    log.debug("ms today "+ (this.now - (this.days * this.msPerDay) ) );
    log.debug("ms today "+ this.now.getHours() +":"+ this.now.getMinutes() );
    log.debug("8h30m in ms = " + (20*60*60*1000 + 30*60*1000) );

    log.debug('got tz:' + tz);
    if (tz == undefined) {
        tz = 1*60*60*1000; // force CET
    }
    this.tz = tz;
    log.debug('set tz:' + tz);
    return true;
}
tzDate.prototype.getTzTime = function getTzTime(){
    return this.getTime() + this.tz;
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




var period1 = new Period( );
log.info( period1.toString() );

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

/*get utc time in ms add timezone offset get dateTime*/
function dayToNumber(d) {
    var days = [ "sun", "mon", "tue", "thu", "fri", "sat" ];
    for ( var i = 0; i < days.length; i+=1) {
        if (days[i] == d.toLowerCase() ) {
            return i;
        }
    }
    return -1;
}
