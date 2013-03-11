/**********************************************************************
 * periods.js
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
 * Execution Policy
 * ================
 * The execution policy variable is a catch all execution flag.  In the event no
 * Periods are defined or matched, the execution policy variable is used
 * as the return result.
 *
 * The execution policy is used when calculating if a Period is an execution
 * or non execution period, specifically when no execution argument is supplied
 * to the Period object.
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


/**
 * Log
 * ===
 * A logging object inspired by the Python's logger class.
 * Logs to null, console or web page.
 * Levels are determined by an integer value.  The higher the value, the
 * more verbose the logging becomes.
 *
*/
var Log = function(level) {
    this.level = level;
    this.levels = {"debug": 10, "warn": 20, "info": 30};
    this.active_warn = this.level >= this.levels.debug ? this.html_logger : this.null_logger;
    this.active_debug = this.level >= this.levels.warn ? this.html_logger : this.null_logger;
    this.active_info = this.level >= this.levels.info ? this.html_logger : this.null_logger;
}
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


/**********************************************************************
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

Object.prototype.getType = function(){
    return Object.prototype.toString.call(this).split(' ').pop().split(']').shift().toLowerCase();
};
*/

/**********************************************************************
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
String.prototype.splitOnFirst = function splitOnFirst(split_char) {
    pos = this.indexOf(split_char);
    return pos == -1 ? this : [this.substr(0, pos), this.substr(pos+1)];
}


/**********************************************************************
 * Period
 * ======
 *
 * Period accepts a key value pair structure to override it's default parameters.
 * The parameters are then used to determine if the current time is with the defined period.
 *
 * Valid keys:
 *   @execute: boolean to indicate if the period is an execution or non-execution.
 *   @time: a two element array containing the start and end times for a period.
 *          valid time elements are hour, minute, second, millisecond:
 *            single int. i.e 4, 10, 17
 *            single string. i.e "4", "10:30", "17:45:30"
 *            array of int. i.e [4], [10,30], [17,45,30]
 *   @day: a two element array for the range mon=0 .. sun=6
 *   @dom: a two element array for the range of the day of the month 0 .. 31.
 *   @month: a two element array for the range of months jan=0 .. dec=11.
 *   @week: a two element array for the range of weeks in the year, 0 .. 52.
 *   @year: a two element array for the range of years, anything could be valid.
 *   @tz: a string indicating the timezone in which the date/time range is represented.
 */
function Period(kwargs){
    this.default_period = {
        execute: undefined,
        time:  [ [0, 0, 0, 0], [ 23, 59, 59, 999] ],
        day:   [0, 6],
        dom:   [1, 31],
        month: [0, 11],
        week:  [1, 52],
        year:  [2010, 2050],
        tz: "europe/paris"
    };

    // Merge supplied arguments into default argument set
    for ( var k in kwargs) {
        log.debug("Period = " + k + " : " + this.default_period[k] + " set to " + kwargs[k]);
        this.default_period[k] = kwargs[k];
    }
    // Call functions to process period arguments.
    this.parseExecute();
    this.parseTimeZone();
    this.parseYear();
    this.parseWeek();
    this.parseDayOfMonth();
    this.parseMonth();
    this.parseDay();
    this.parseTime();
};
//**********************************************************************
Period.prototype.toString = function toString() {
    s = "";
    for ( var k in this.default_period ) {
        s += "  " + k +": " + this.default_period[k] ;
    }
    return s;
}
/**********************************************************************
* checkDate
 * =========
 * Given a date/time with timezone extensions, determine if it falls within
 * the boundaries of the Period's constraints.
*/
Period.prototype.checkDate = function checkDate(check_date)
{
    throw "checkDate Unimplemented";
}
/**********************************************************************
 * parseExecute
 * ============
 *
*/
Period.prototype.parseExecute = function parseExecute() {
    var execute_period = this.default_period["execute"];
    log.debug('Period.parseExecute: Execute ' + execute_period + " and default policy is " + execute_policy);
    if ( execute_period == undefined ) {
        execute_period = !execute_policy;
    }
    this.default_period["execute"] = execute_period;
}
/**********************************************************************/
Period.prototype.parseTimeZone = function parseTimeZone() {
    var tmp_tz = this.default_period["tz"];

    log.debug("Period.parseTimeZone: using area/location: " + tmp_tz);

    this.default_period["tz"] = new tzDate(0, tmp_tz);
}
/**********************************************************************/
Period.prototype.parseYear = function parseYear() {
    var year = this.default_period["year"];

    // The argument is required to be an array, with a start/stop year.
    if ( getType(year) !== getType([]) ) {
        throw "Expected array type for argument year but got " + getType(year) + " instead." ;
    }
    if ( year.length != 2 ) {
        throw "Expected 2 agruments for year but got " + year.length;
    }

    year[0] = parseInt(year[0]);
    year[1] = parseInt(year[1]);

    // Sanity check the year range limits.
    if ( year[0] > year[1] ) {
        throw "[" + year + "] isn't a valid year range, the first element must be smaller than the second.";
    }

    this.default_period["year"] = year;
}
/**********************************************************************/
Period.prototype.parseWeek = function parseWeek() {
    var week = this.default_period["week"];
    log.info("To do: parse this " + week );

    // The argument is required to be an array, with a start/stop day.
    if ( getType(week) !== getType([]) ) {
        throw "Expected array type for argument week but got " + getType(week) + " instead." ;
    }
    if ( week.length != 2 ) {
        throw "Expected 2 agruments for week but got " + week.length;
    }

    week[0] = this._validateWeek(week[0]);
    week[1] = this._validateWeek(week[1]);

    // Sanity check the week range limits.
    if ( week[0] > week[1] ) {
        throw "[" + week + "] isn't a valid week range, the first element must be smaller than the second.";
    }

    this.default_period["week"] = week;
}
Period.prototype._validateWeek = function _validateWeek(week) {
    tmp = parseInt(week);
    if ( ! ( 1 <= tmp && tmp <= 52 ) ) {
        throw tmp + " isn't a valid week range value";
    }
    return tmp;
}
/**********************************************************************
 * parseTime
 * =========
 * Brief: Accept an array containing two elements of either type array or string.
 * A element array may contain between 1 and 4 elements, a string may be of the
 * format "[h]h[:[m]m][:[s]s][:[t][t]t]" h=hour, m=minute, s=second, t=millisecond.
 * Returns list of min/max integer.
*/
Period.prototype.parseTime = function parseTime() {
    var time = this.default_period["time"];

    log.debug("Got time range " + time );

    // The argument is required to be an array, with a start/stop day.
    if ( getType(time) !== getType([]) ) {
        throw "Expected array type for argument time but got " + getType(time) + " type instead." ;
    }
    if ( time.length != 2 ) {
        throw "Expected 2 agruments for time but got " + time.length;
    }
    time[0] = this._validateTime(time[0]);
    time[1] = this._validateTime(time[1]);

    // Sanity check the day range limits.
    if ( time[0] > time[1] ) {
        throw "[" + time + "] isn't a valid time range, the first element must be smaller than the second.";
    }

    this.default_period["time"] = time;
}
/**********************************************************************/
Period.prototype._validateTime = function _validateTime(time) {
    var ms_factor=[3600000,60000,1000,1];
    var max_limit=[23,59,59,999];
    var time_seconds = 0;
    try {
        // String format is described at parseTime method.
        if ( getType(time) === getType("") ) {
            time = time.split(":");
        }
        // A single integer was supplied, put it into an array.
        if ( getType(time) === getType(1) ) {
            time = [time];
        }
        // If time isn't an array by now, it's not a handled data type.
        if ( getType(time) !== getType([]) ) {
            throw time + " isn't a supported type for a time range.";
        }
        // The array's elements must be 4 or less and of type integer or (maybe string integer)
        if (time.length > 4) {
            throw "Too many arguments supplied in the time range [" + time + "].";
        }
        for ( var i = 0; i < time.length; i++ ) {
            var time_elm = parseInt(time[i]);
            if ( isNaN(time_elm) ) {
                throw time[i] + " isn't a valid time value.";
            }
            if ( 0 <= time_elm && time_elm <= max_limit[i] ) {
                time_seconds += time_elm * ms_factor[i];
            } else {
                throw time[i] + " is outside the valid range for time.";
            }
        }

    } catch (err) {
        // Give up, the argument isn't a valid time.
        throw ("An element in the time argument is invalid: " + err );
    }

    // Assert the time is within the boundaries of 0:0:0:0-23:59:59:999
    if ( time_seconds >= 0 && time_seconds <= 86399999 ) {
        return time_seconds;
    } else {
        throw time + " isn't a valid value for time argument.";
    }
}
/**********************************************************************
 * parseDay
 * ========
 * Brief: Takes a list and ensures the resulting internal
 * variable is updated with an integer representation of the day.
 *
 * @day: a key present in the default period variable.  It is expected
 * to hold one of the following: an array with two string elements or two
 * integer elements or an undefined value (this indicates a default value is to be used.)
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
/**********************************************************************/
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
            // If day is a string, no valid weekday name was matched.
            if ( isNaN(day) ) {
                throw (day + " isn't a valid name of week.");
            }
        } catch (err) {
            // Give up, the argument isn't a valid weekday name or an integer.
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
/**********************************************************************/
Period.prototype.parseMonth = function parseMonth() {
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
/**********************************************************************/
Period.prototype._validateMonth = function _validateMonth(month) {

    try {
        // Is argument a number?
        month = parseInt(month);
        if ( isNaN(month) ) {
            throw "Not a number";
        }

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
            // Give up, the argument isn't a valid month name or an integer.
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
/**********************************************************************/
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
/**********************************************************************/
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

/**********************************************************************
 * Test Date object with tz data values.
 * @date: A standard javascript Date object.
 * @tz: the timezone to use with the date.
 * @dst: the daylight savings rule to apply.
*/
function tzDate(date, tz, dst) {
    log.debug("tzDate.constructor: date: " + date + " timezone: " + tz + " dst: " + dst);
    this.now = new Date();
    // ZONE ... warning, this needs to have error checking applied!
    res = tz.splitOnFirst("/");
    log.debug("tzDate.constructor: timezone: " + zones[res[0]][res[1]][0]);
    this.zone = new Zone(zones[res[0]][res[1]][0]);
    this.rules = []
    this.parseDstRule();


    // these variables aren't all require but they're included in a previsory capacity.
    this.msPerLeapYear = 126230400000;
    this.msPerYear = 31536000000;
    this.msPerDay  = 86400000;
    this.msPerHour = 3600000;
    this.msPerMin  = 60000;
    /* Start to work on the calculations for converting epoch time to Y/M/D h:m:s:ms time. */
    this.msToday = this.now.getTime() % this.msPerDay;
    this.msThisHour = this.msToday % this.msPerHour;
    this.hour = Math.floor( this.msToday / this.msPerHour );
    this.msThisMinute = this.msToday % this.msPerMin;
    this.minute = Math.floor( this.msThisHour / this.msPerMin );
    this.second = Math.floor( this.msThisMinute / 1000);
    this.millisecond = this.msThisMinute % 1000;

    // millisecond based calculations *********
    this.msPerWeek = 7 * this.msPerDay;
    this.msPerLeapYear = this.msPerDay * ( 4 * 365 + 1);

    // day based calculations *********
    this.msOfYear = this.now.getTime() % this.msPerYear - ( this.totalLeptDays * this.msPerDay ) ;
    this.msToday = this.msOfYear % this.msPerDay;
    this.Year = ( this.msOfYear - this.msToday ) / this.msPerDay;
    this.dayOfYear = (this.msOfYear - this.msToday)  / this.msPerDay;

    // Calculate leap year.
    this.leapYearsSinceEpoch();


}
/**********************************************************************/
tzDate.prototype.toString = function toString() {
    // to do : implement this to include tz offset, dst and abbreviation.
    return  "Now: " + this.now +
            "ms per day: " + this.msPerDay +
            "ms per week: " +  this.msPerWeek +
            "ms per leap year: " +  this.msPerLeapYear +
            "leap years: " + this.totalLeptDays  +
            "ms of days of year: " + this.msOfYear  +
            "ms today: " + this.msToday  +
            "day of year: " + this.dayOfYear  +
            "Year: " + this.Year;
}
/**********************************************************************/
tzDate.prototype.parseDstRule = function parseDstRule() {
    // apply time zone offset to date in order to decide if a rule should be used.
    tz_now = new Date( this.now.getTime() + this.zone.gmtOffset() );
    rule_name = this.zone.getRule();
    log.debug("tzDate.parseDstRule: " + this.zone.getRule() + " : " + this.now + " : " + tz_now);

    for ( k in rules[rule_name] ) {
        var tmp_r = rules[rule_name][k];
        if ( tz_now.getUTCFullYear() >= tmp_r.year_from && tz_now.getUTCFullYear() <= tmp_r.year_to) {
            log.debug("tzDate.parseDstRule Rule match: "+rules[rule_name][k].year_from + "-" + rules[rule_name][k].year_to);
            this.rules.push(new Rule(rules[rule_name][k], tz_now));
        }
    };

}
tzDate.prototype.timezoneName = function timezoneName() {
    return this.zone.name();
}
//**********************************************************************
tzDate.prototype.leapYearsSinceEpoch = function leapYearsSinceEpoch() {
    // Add 2 years to calculate 1st leap 1972
    this.totalLeptDays = Math.floor( (this.msPerYear * 2  + this.now.getTime() ) / this.msPerLeapYear);
    return true;
}
//**********************************************************************
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



/**********************************************************************
/* Zone
 * ====
 * Creates the complete Zone object from the JSON data structure.
 * @kwargs: an object containing the timezone data structure.
 *   The valid keys are the follow:
 *      @gmt_off: GMT/UTC offset in seconds.
 *      @area: name of timezone area.
 *      @rules: name of rule used by timezone.  Used as key in the rules object data set.
 *      @location: name of timezone location.
 *      @zone_format: abbreviation of timezone+daylight savings time in string format.
 *      @until: date until the timezone is to be considered applicable.
*/
function Zone(kwargs) {
    this.zone_data = {
        gmt_off: undefined,
        area: undefined,
        rules: undefined,
        location: undefined,
        zone_format: undefined,
        until: undefined,
    };

    // Merge supplied arguments into default argument set
    for ( var k in kwargs) {
        log.debug("Zone.constructor: " + k + " : " + this.zone_data[k] + " set to " + kwargs[k]);
        this.zone_data[k] = kwargs[k];
    }
    this.zone_data["gmt_off"] *= 1000; // set value to milliseconds for consistency with javascript.
}
Zone.prototype.getRule = function getRule() {
    return this.zone_data["rules"];
}
Zone.prototype.gmtOffset = function getRule() {
    return this.zone_data["gmt_off"];
}
Zone.prototype.zoneName = function zoneName() {
    return this.zone_data["area"] + "/" + this.zone_data["location"];
}
/**********************************************************************
/* Rule
 * ====
 * Creates the complete Rule object from the JSON data structure.
 * @kwargs
 *   Valid keys
 *    @rule_type:
 *    @day_on:
 *    @save:
 *    @letters:
 *    @name:
 *    @month_in:
 *    @year_to:
 *    @year_from:
 *    @time_at:
 * @tzd: a Date object which is a variable used by day_on to get the day of the month.
*/
function Rule(kwargs, tzd) {
    this.rule_data = {
        rule_type: undefined,
        day_on: undefined,
        save: undefined,
        letters: undefined,
        name: undefined,
        month_in: undefined,
        year_to: undefined,
        year_from: undefined,
        time_at: undefined,
    };

    // Merge supplied arguments into default argument set
    for ( var k in kwargs) {
        log.debug(k + " : " + this.rule_data[k] + " set to " + kwargs[k]);
        this.rule_data[k] = kwargs[k];
    }

    // parse data
    this.closestDay(tzd);
}
Rule.prototype.toString = function toString() {
    return this.rule_data[rule_type] + " " +
            this.rule_data[day_on] + " " +
            this.rule_data[save] + " " +
            this.rule_data[letters] + " " +
            this.rule_data[name] + " " +
            this.rule_data[month_in] + " " +
            this.rule_data[year_to] + " " +
            this.rule_data[year_from] + " " +
            this.rule_data[time_at];
}
Rule.prototype.closestDay = function closestDay(tzd) {
    log.debug("Calculate the closest day for " + tzd.toUTCString() );
    var mon = this.rule_data["month_in"];
    var [day , cmp, dom] = this.rule_data["day_on"];
    
    
    log.debug( day + cmp + dom + mon );
    eval ( 31 + c+dm);
    tzd.getDay();
}

//~ var period1 = new Period( {time: ["4","5:56:30"]} );
//~ log.info( period1.toString() );
var period2 = new Period({tz:"pacific/auckland"});
log.info( "Period 2 == " + period2.toString() );
// A series of time tests
//~ new Zone(zones.pacific.auckland[0]);

//~ new Period( {time: [1,"1:57:30"]} );
//~ new Period( {time: ["2","2:56:30"]} );
//~ new Period( {time: [3,[3,56,30]]} );
//~ new Period( {time: [4,"5:59:30"]} );


log.debug("Try to get " + period2.default_period.length);

