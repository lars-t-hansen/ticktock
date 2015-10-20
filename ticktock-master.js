/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var w = new Worker("hitme-worker.js");
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
	var t = Math.floor((now - then)*1000); // index = number of microseconds for 4K messages
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
	document.getElementById("scrool").innerHTML = "<pre>" + a.map((x) => x[0] + " " + x[1]).join("\n") + "</pre>";
    }
};
w.postMessage("go");
