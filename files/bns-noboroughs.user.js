// ==UserScript==
// @name         BNS: No Borough Label
// @namespace    https://gabetardy.github.io/
// @version      0.2
// @description  Fixes every name being prefixed with the borough if it isn't in Manhattan.
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

    Geocoder.prototype.geocode = Transpile.replace(Geocoder.prototype.geocode, 23, `if (["New York", "Brooklyn", "Queens", "Bronx", "Staten Island"].indexOf(city) == -1 && city != CUSTOM_CITY_NAME) {`);
})();
