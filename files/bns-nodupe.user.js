// ==UserScript==
// @name         BNS - Only One Prefix
// @namespace    https://gabetardy.github.io/
// @version      0.2
// @description  Blocks the game from adding too many prefixes to station names.
// @author       Gabrielium
// @match        http://jpw.nyc/subway/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var Transpile = {
        replace: function(f, ln, cd){
            var _f = f.toString();
            var _r = _f.split("\n");

            _r[0].replace(f.name, "function");

            _r[0] = "function (line) {";
            _r[ln+1] = _r[ln+1].replace(/(\t|\s+)(.*)/, "$1") + cd;
            _r = _r.join("\n");
            return Function("return (" + _r + ");")();
        }
    };

    Geocoder.prototype.geocode = Transpile.replace(Geocoder.prototype.geocode, 46, `if (enc_neighborhoods.length > 0 && !geo.name.match("-")) {`);
})();
