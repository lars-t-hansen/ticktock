/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// This creates a histogram of the expected time between receipt of
// trivial messages received from a worker that is just pumping out
// messages as fast as it can.  The purpose is to see if the message
// pump can be used as a substitute for a high-resolution clock.
//
// In order for it to be useful there would have to be a fairly
// tightly controlled span between messages, so that a counting loop
// could be use to detect differences in timing.  One would wait for a
// message, then perform an operation, then count until the next
// message - except the next message is an asynchronous event, we
// can't poll for events.  (In contrast, we can synchronously read
// performance.now and Date.now) So that's a problem.  And using an
// iframe does not help (runs on same thread).
//
// Hm, can we use two workers?
// Can we use web sockets?  WebRTC?
//
// Can we post messages to ourselves as a kind of polling timeslice?
// (Seems unlikely, the message queue should be full anyway, what
// we're measuring is the overhead of the trip through the event loop.)
//
// Can promises be used instead?  Are promises and events on the same
// queue?  (Looks questionable.)

var w = new Worker("ticktock-worker.js");
var then = 0;
var count = 0;
var buckets = [];
var granule = 1024;
w.onmessage = function (ev) {
    if (!then)
	then = performance.now();
    ++count;
    if ((count & (granule-1)) == 0) {
	var now = performance.now();
	var t = Math.floor((now - then)*1000);
	var msgt = Math.round(t/granule*10);
	buckets[msgt] = buckets[msgt] || 0;
	buckets[msgt]++;
	then = now;
    }
    if (ev.data == 0) {
	var a = [];
	for ( var i in buckets )
	    a.push([i/10, buckets[i]]);
	a.sort(function (a,b) {
	    if (a[0] < b[0]) return -1;
	    if (a[0] > b[0]) return 1;
	    return 0; });
	document.getElementById("scrool").innerHTML = "<pre>" + a.map(function(x) { return x[0] + " " + x[1] }).join("\n") + "</pre>";
    }
};
w.postMessage("go");
