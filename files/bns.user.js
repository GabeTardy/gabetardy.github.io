// ==UserScript==
// @name         Brand New Subway Fix
// @namespace    https://gabetardy.github.io/
// @version      0.1
// @description  Very simple (hacky) fix for broken station names in BNS
// @author       Gabrielium
// @match        http://jpw.nyc/subway/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var x = document.createElement("div");
    x.innerHTML = `<meta http-equiv="Access-Control-Allow-Origin" content="*">`;
    document.head.appendChild(x);
})();
