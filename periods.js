/***********************************************************************
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
 * Limitations
 * ===========
 * The period checking code is a simple wall clock check.  This means when
 * time is rolled forward/backward, the period check isn't aware of shift.
 * E.g. On the last Sun of Marh
 *
 * Resource references
 * ===================
 * http://howtonode.org/prototypical-inheritance
*/


// Global constants.
days = {"mon":1, "tue":2, "wed":3, "thu":4, "fri":5, "sat":6 ,"sun":0 };
months = [  {"name" : "jan", "maxdays" :31}, {"name" : "feb", "maxdays" :28},
            {"name" : "mar", "maxdays" :31}, {"name" : "apr", "maxdays" :30},
            {"name" : "may", "maxdays" :31}, {"name" : "jun", "maxdays" :30},
            {"name" : "jul", "maxdays" :31}, {"name" : "aug", "maxdays" :31},
            {"name" : "sep", "maxdays" :30}, {"name" : "oct", "maxdays" :31},
            {"name" : "nov", "maxdays" :30}, {"name" : "dec", "maxdays" :31}];



/***********************************************************************
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
    this.levels = {"debug": 30, "warn": 20, "info": 10};
    this.active_debug = this.level >= this.levels.debug ? this.html_logger : this.null_logger;
    this.active_warn = this.level >= this.levels.warn ? this.html_logger : this.null_logger;
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


/***********************************************************************
 * getType
 * =======
 * This is taken from http://tech.karbassi.com/2009/12/18/object-type-in-javascript/ and
 * provides a clean implementation for extracting the object type as a string.
*/
function getType(obj) {
    if (obj === undefined) { return 'undefined'; }
    if (obj === null) { return 'null'; }
    return Object.prototype.toString.call(obj).split(' ').pop().split(']').shift().toLowerCase();
}
function isString(obj) {
    return getType(obj) === "string";
}
function isArray(obj) {
    return getType(obj) == "array";
}
function isNumber(obj) {
    return getType(obj) == "number";
}
function isDate(obj) {
    return getType(obj) == "date";
}
/* The prototype method is part of the implementation but it causes undesirable
 * effects when integrated into the Zone and Rule objects.

Object.prototype.getType = function(){
    return Object.prototype.toString.call(this).split(' ').pop().split(']').shift().toLowerCase();
};
*/

// Return a string representation of the objects properties as Key:values pairs
function objectAsString(o) {
    var str = "";
    var keys = Object.getOwnPropertyNames(o);
    for ( var key in keys ) {
        str += keys[key] +":"+ o[keys[key]]+ ", ";
    }
    return str;
}
/**********************************************************************
 * isLeap
 * ======
 * Returns 0 for non leap years or 1 for leap years.
 * Note: This code is valid until 2099, 2100 isn't a leap year.
*/
function isLeap(year) {
    return year % 4 ? 0 : 1;
}

/***********************************************************************
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


/***********************************************************************
 * Period
 * ======
 *
 * Period accepts a key value pair structure to override it's default parameters.
 * The parameters are then used to determine if the current time is with the defined period.
 *
 * Valid keys:
 *   @execute: boolean to indicate if the period is to determine execution or non-execution.
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
    this.period_match = false;

    // Merge supplied arguments into default argument set
    var tmp_s = "";
    for ( var k in kwargs) {
        tmp_s += "  " + k + "=" + kwargs[k];
        this.default_period[k] = kwargs[k];
    }
    log.debug("Period Args: " + tmp_s);
    // Call functions to process period arguments.
    this.parseExecute();
    this.parseTimeZone();
    this.parseYear();
    this.parseMonth();
    this.parseWeek();
    this.parseDayOfMonth();
    this.parseDay();
    this.parseTime();
    log.debug("Period = " + this.toString());
    this.checkDate();
};
//**********************************************************************
Period.prototype.toString = function toString() {
    return objectAsString(this.default_period);
}
/**********************************************************************
* checkDate
 * =========
 * Given a date/time with timezone extensions, determine if it falls within
 * the boundaries of the Period's constraints.
*/
Period.prototype.checkDate = function checkDate()
{
    // Create a timezone aware date/time from UTC time.
    var now = new Date();
    var check_time = new tzDate(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds(), this.default_period.tz);

    // compare the date with the period definition working for largest
    // time unit to smallest.

    log.debug("Check Period using local time as: " + check_time);

    // if the date matches set matched to TRUE
    this.period_match = true;

}
Period.prototype.inProgress = function inProgress(){
    this.checkDate();
    return this.period_match;
}
/**********************************************************************
 * parseExecute
 * ============
 *
*/
Period.prototype.parseExecute = function parseExecute() {
    var execute_period = this.default_period["execute"];
    log.debug('Period.parseExecute: Execute ' + execute_period + " and default policy is " + default_execution_policy);
    if ( execute_period == undefined ) {
        execute_period = !default_execution_policy;
    }
    this.default_period["execute"] = execute_period;
}
Period.prototype.getExecutionPeriod = function getExecutionPeriod() {
    return this.default_period["execute"]
}
/***********************************************************************
 * parseTimeZone
 * =============
 * Deprecated function.
 * The timezone is passed to tzDate object.  Nothing to do here.
 */
Period.prototype.parseTimeZone = function parseTimeZone() {
    log.debug("Period.parseTimeZone: using area/location: " + this.default_period["tz"]);
}
/***********************************************************************
 * parseYear
 * =========
 */
Period.prototype.parseYear = function parseYear() {
    var year = this.default_period["year"];

    if ( ! isArray(year) ) {
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
/**********************************************************************
 * parseWeek
 * =========
 * Given the internal object variables, assert they confirm to the function
 * requirements and pass them on to the validation method.
 * Assert the returned results for the validation process are coherent.
 */
Period.prototype.parseWeek = function parseWeek() {
    var week = this.default_period["week"];

    if ( ! isArray(week) ) {
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
/**********************************************************************
 * _validateWeek
 * =============
 * The "week" argument is required to be an array, with a start/stop day.
 * The lower bound is 1 and the upper bound is 52.
 */
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

    if ( ! isArray(time) ) {
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
/**********************************************************************
 * _validateTime
 * =============
 */
Period.prototype._validateTime = function _validateTime(time) {
    var ms_factor=[3600000,60000,1000,1];
    var max_limit=[23,59,59,999];
    var time_seconds = 0;
    try {
        // String format is described at parseTime method.
        if ( isString(time) ) {
            time = time.split(":");
        }
        // A single integer was supplied, put it into an array.
        if ( isNumber(time) ) {
            time = [time];
        }
        // If time isn't an array by now, it's not a handled data type.
        if ( ! isArray(time) ) {
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
    if ( ! isArray(day) ) {
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
/**********************************************************************
 * _validateDay
 * ============
 */
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
/**********************************************************************
 * parseMonth
 * ==========
 */
Period.prototype.parseMonth = function parseMonth() {
    var month = this.default_period["month"];
    // The argument is required to be an array, with a start/stop day.
    if ( ! isArray(month) ) {
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
/**********************************************************************
 * _validateMonth
 * ==============
 */
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
/**********************************************************************
 * parseDayOfMonth
 * ===============
 */
Period.prototype.parseDayOfMonth = function parseDayOfMonth() {
    var dom = this.default_period["dom"];

    // The argument is required to be an array, with a start/stop day of month.
    if ( ! isArray(dom) ) {
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
/**********************************************************************
 * _validateDayOfMonth
 * ===================
 * FIXME - implement a month aware day of month test.
 */
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
 * @Y: Integer : year 4 digit format. Default 1970
 * @M: Integer : month 1-12. Default: 1
 * @D: Integer : day of the month 1-31. Default: 1
 * @h: Integer : hour of the day 0-24. Defualt: 0
 * @m: Integer : minutes 0-59. Default: 0
 * @s: Integer : seconds 0-59. Default: 0
 * @ms: Integer : milliseconds 0-999. Default: 0
 * @tz: String : timezone to use.  Default: "UTC"
 * @is_dst: Boolean : used for ambigous times
 *          across daylight savings transitions. Default: false
*/
function tzDate( Y, M, D, h, m, s, ms, tz, is_dst) {
    // Argument cases
    // To do: bound checking "Insufficient arguments supplied to tzDate"
    // To do: "Too many arguments"

    this.utc_ms = Date.UTC(Y, M, D, h, m, s, ms);

    if ( tz != undefined ) {
        this.zone = undefined;
        this.dst_off = undefined;
        this.zone_dst_abbr = undefined;

        // Match timezone area/location and set its UTC offset and abbreviation.
        this.parseZone(tz);

        // Advance towards the correct UTC timestamp by removing the timezone offset.
        this.localtime = new Date( this.utc_ms - this.zone.getUTCOffset());

        // Determine the daylight savings time and modification of the zone abbreviation
        this.parseDstRule();
    } else {
        this.zone = new Zone({gmt_off: 0, zone_format: "UTC"});
        this.dst_off = 0;
        this.zone_dst_abbr = "UTC";
    }
    // Remove the daylight savings offset from UTC.
    log.debug("Before DST offset: " +[this.localtime.getTime(), this.dst_off]);
    this.walltime = new Date( this.localtime.getTime() - this.dst_off);
    log.debug("After DST offset: " +[this.walltime.getTime(), this.dst_off]);

}
/**********************************************************************/
tzDate.prototype.parseZone = function parseZone(tz) {
    if ( ! isString(tz) ) {
        throw "Timezone must be of type string but received " + getType(tz);
    }
    if ( tz.indexOf("/") == -1 ) {
        throw "Unexpected timezone string format: " + tz + " ... expected 'area/location' string.";
    }
    res = tz.toLowerCase().splitOnFirst("/");
    this.zone = new Zone(zones[res[0]][res[1]][0]);
}
/**********************************************************************/
tzDate.prototype.DST = function DST() {
    throw("tzDate.DST is not Implemented");
    var utc = new Date(normalised_rules.idx[i] - offset );
    dst_abbr = this.zone.getAbbreviation().replace("%s", normalised_rules[normalised_rules.idx[i]].letter);
    var localtime = new Date(utc.getTime() + offset );
    log.info( i+") UTC: " + utc.toUTCString() + ", Localtime: " + localtime.toUTCString() + "("+dst_abbr+")" );
}
/**********************************************************************/
tzDate.prototype.toString = function toString() {
    return  this.walltime.getUTCHours() + ":" +
            this.walltime.getUTCMinutes() + ":" +
            this.walltime.getUTCSeconds() + " " +
            this.walltime.getUTCDate() + "/" +
            (this.walltime.getUTCMonth() + 1)+ "/" +
            this.walltime.getUTCFullYear() + " " +
            (this.zone.getUTCOffset()+this.dst_off)/1000/60/60 + " " +
            this.zone.getAbbreviation().replace("%s", this.zone_dst_abbr) +
            "@"+this.utc_ms;
}
/**********************************************************************
 * parseDstRule
 * ============
 * Using the Rule's time offset:
 * ZIC(8) <quote>
 *  Any of these forms may be followed by the letter
 *  w if the given time is local "wall clock" time,
 *  s if the given time is local "standard" time, or
 *  u (or g or z) if the given time is universal time;
 * in the absence of an indicator, wall clock time is assumed.
 * </quote>
 *
 * Find any rules that fall within 1 year of the date to be tested.
 * Rules are normalised to UTC time.
 *
 *   Rule keys
 *   ---------
 *    @rule_type:
 *    @day_on:
 *    @save:
 *    @letters:
 *    @name:
 *    @month_in:
 *    @year_to:
 *    @year_from:
 *    @time_at:
*/
tzDate.prototype.parseDstRule = function parseDstRule() {
    var rule_name = this.zone.getRule();
    var normalised_rules = {idx:[]};

    // Pass 1: Construct a list of rules which will be sorted to  ascending chronological order!
    for ( var rule_def in rules[rule_name] ) {
        var r = rules[rule_name][rule_def];

        log.info("Ruleset: " + objectAsString(r) );

        for ( var year = r.year_from; year <= r.year_to; year++ ) {

            // Skip dates outside a ±2 year range.
            if (year < this.localtime.getFullYear()-2 || year > this.localtime.getFullYear()+2) {
                continue;
            }

            // Retruns a UTC time for the rule's transition (ignores tz and dst offset).
            var naive_utc = this.getRuleAsNaiveUTC(year, r);

            // Stored daylight savings transition date/time as naive utc.  These
            // will be re-processed to make adjustments for the timezone and dst in effect.
            normalised_rules.idx.push(naive_utc.getTime());
            normalised_rules[naive_utc.getTime()] = {offset: r.save*1000, letter: r.letters, fmt: r.time_at[1]};
        }
    }

    // sort into chronological order.
    normalised_rules.idx.sort();

    // Pass 2: Calculate the dayight savings offsets based on the datetime encoding.
    for (var i in normalised_rules.idx) {
        var r_timestamp = normalised_rules.idx[i];
        var offset = 0;
        switch ( normalised_rules[r_timestamp].fmt ) {
            case "u":
            case "g":
            case "z":
                // rule in utc, no offset required.
                offset = 0;
                break;
            case "s":
                // Standard time : utc - tz
                offset = this.zone.getUTCOffset();
                break;
            case "w":
                // Wall time: utc - tz - dst
                // In the event there are no previous daylight savings
                // transitions "standard time" is assumed.
                // fall through to default, it's wall time.
            default:
                if ( i > 0 ) {
                    offset = this.zone.getUTCOffset() + normalised_rules[normalised_rules.idx[i-1]].offset;
                } else {
                    offset = this.zone.getUTCOffset()
                }
        }
        // Store the dst timestamp with it's offset applied.
        normalised_rules[r_timestamp].datetime = new Date(r_timestamp + offset);
        var tmp = new Date(this.localtime.getTime() + this.zone.getUTCOffset());
        if ( tmp > normalised_rules[r_timestamp].datetime ) {
            this.dst_off = normalised_rules[r_timestamp].offset;
            this.zone_dst_abbr = normalised_rules[r_timestamp].letter;
        }
    }
}
/**********************************************************************
 * getRuleAsNaiveUTC
 * =================
 * Given a rule, the YYYY/MM/DD HH:MM:SS, the values are used as a
 * UTC date/time create a Date object.
 */
tzDate.prototype.getRuleAsNaiveUTC = function getRuleAsNaiveUTC(year, r) {

    var [day, cmp, dom] = r["day_on"];
    var mon = r["month_in"];

    if ( isString(day) ) {
        day = days[day.toLowerCase()];
    }
    if ( isString(dom) ) {
        if ( dom.match("^last") ) {
            dom = months[ mon - 1]["maxdays"];
            if ( mon == 2 ) {
                dom += isLeap(year);
            }
        }
    }
    var def_time = [0,0,0];

    var time_at = r["time_at"][0].split(":");
    for ( var i in time_at ) {
        def_time[i] = parseInt(time_at[i]);
    }
    var [h,m,s] = def_time;

    // Reminder: months in javascript at 0-11
    var utc = new Date(Date.UTC(year, mon-1, dom, h, m ,s));

    switch (cmp) {
        case ">=":
            while (day != utc.getUTCDay() ) {
                utc.setDate(utc.getUTCDate() + 1);
            }
            break;
        case "<=":
            while (day != utc.getUTCDay() ) {
                utc.setDate(utc.getUTCDate() - 1);
            }
            break;
        default:
            // An exact day of the month is expected, test it's coherent.
    }

    log.debug("Rule : " + utc.toUTCString() + " @" + utc.getTime() + "[" + [day, cmp, dom] + "]");
    return utc;
}

tzDate.prototype.timezoneName = function timezoneName() {
    return this.zone.name();
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
    var tmp_s = "";
    for ( var k in kwargs) {
        tmp_s += "  " + k + "=" + kwargs[k];
        this.zone_data[k] = kwargs[k];
    }
    log.debug("Zone Args: " + tmp_s);
    this.zone_data["gmt_off"] *= 1000; // set value to milliseconds for consistency with javascript.
}
Zone.prototype.getRule = function getRule() {
    return this.zone_data["rules"];
}
Zone.prototype.getUTCOffset = function getUTCOffset() {
    return this.zone_data["gmt_off"];
}
Zone.prototype.zoneName = function zoneName() {
    return this.zone_data["area"] + "/" + this.zone_data["location"];
}
Zone.prototype.getAbbreviation = function getAbbreviation() {
    return this.zone_data["zone_format"];
}

/**********************************************************************
/* CheckPeriods
 * ============
 *
 * Given a list of periods to test,
 */
function CheckPeriods(periods)
{
    var execution = default_execution_policy;
    for ( var period in periods ) {
        if (periods[period].inProgress()){
            log.debug("Time inside period matched! Do we execute the script? " + periods[period].getExecutionPeriod() );
            execution = periods[period].getExecutionPeriod();
        }
    }
    return execution;
}

var default_execution_policy = true;      // Set the default execution policy in the event no Periods match or are defined.

var periods = [];

periods.push(new Period({time: [1,"1:57:30"],   tz:"america/campo_grande"}));
periods.push(new Period({time: ["2","2:56:30"], tz:"europe/paris"}));
periods.push(new Period({time: [3,[3,56,30]],   tz:"pacific/auckland"}));
periods.push(new Period({time: [4,"5:59:30"],  tz:"america/iqaluit"}));
periods.push(new Period({tz:"asia/tehran"}));


//~ new tzDate(new Date(2013,2),"america/campo_grande");

//~ var auckland = new tzDate(new Date(2013,2,31,2,0,55),"pacific/auckland"); //standard time. (no dst) new Date(2013,4,7,3,0,0)
//~ new tzDate(new Date(2013,2),"america/iqaluit");
//~ new tzDate(new Date(2013,2),"asia/tehran");  // undefined, default wall clock.

//~ log.info(auckland);

