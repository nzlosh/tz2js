tz2js
=====

IANA timezone database parser to native javascript data structure.

The javascript data structure is destined for use within an interpreter
without disk or network access.  All script content must be contained
within the initial file used at execution time.

References:
http://www.iana.org/time-zones


License
=======

The MIT License (MIT)

Copyright (c) 2013 Carlos (nzlosh@yahoo.com)

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.


Installation
============

  * Requirements
    * Python 2.7
    * IANA tz data archive

  1 Download the IANA timezone data archive file.
    > wget 'http://www.iana.org/time-zones/repository/releases/tzdata2012j.tar.gz'

  2 Extract the archive to your desired directory.
    > mkdir /tmp/tzdata2012j

    > tar xzvf tzdata2012j.tar.gz /tmp/tzdata2012j

  3 Execute tz2js.py with tzdata's parent directory as an argument.
    > ./tz2js.py /tmp


Thanks to ...
=============

The group of people that maintain the timezone's extremely detailed and
complex database.  Great work people!
