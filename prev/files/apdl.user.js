// ==UserScript==
// @name         Mechanical APDL Database Search
// @namespace    http://gabetardy.github.io/
// @version      1.32
// @description  allows user to search APDL database for specific command
// @author       Gabriel Tardy
// @match        https://www.mm.bme.hu/~gyebro/files/ans_help_v182/ans_cmd/Hlp_C_CmdTOC.html
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bme.hu
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var l = document.createElement("header");
    l.innerHTML = `<style>dl{margin: 0;padding: 0 0 0 5px !important;}</style><input type="text" placeholder="Search database..." id="searchTool" oninput="filterAPDL()">&nbsp;<input type="checkbox" id="titleToggle" checked><span>Titles</span>&nbsp;<input type="checkbox" id="descToggle" checked><span>Descriptions</span><span style="float:right">APDL Database Search 1.32 - <a href="https://gabetardy.github.io/files/apdl.user.js">Check for Updates/Reinstall</a></span>`;
    l.style.background = '#fafafa';
    l.style.padding = "1em";
    l.id = "top";

    var validCommands = [];
    var elements = document.getElementsByClassName("command");
    for(var elem of elements){
        validCommands.push(elem.firstChild.textContent);
    }

    document.body.insertBefore(l, document.body.firstChild);
    var st = document.getElementById("searchTool");
    var tt = document.getElementById("titleToggle");
    var dt = document.getElementById("descToggle");

    var lf = document.getElementsByClassName("legalfooter")[0];
    lf.style.position = "fixed";
    lf.style.bottom = 0;
    lf.style.left = 0;
    lf.style.background = '#fafafa';
    lf.style.padding = "1em";
    lf.style.width = "100%";
    lf.style.fontAlign = "center";
    lf.style.margin = 0;
    lf.innerHTML += " - <small><a href='#top'>Top of Page</a></small>";

    var spacer = document.createElement("div");
    spacer.innerHTML = "<br><br><br>";
    document.body.insertBefore(spacer, lf);

    var callback = () => {
        var matchString = st.value;
        var titleToggle = tt.checked;
        var descToggle = dt.checked;
        var matchRegExp = new RegExp(matchString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "gim"); // Escape code "borrowed" from https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex

        for(var i = 0; i <= 4; i++){
            document.getElementsByTagName("dl")[0].children[i].style.display = matchString == "" ? "block" : "none";
        }
        for(var reference of document.getElementsByClassName("reference")){
            reference.parentNode.style.display = matchString == "" ? "block" : "none";
        }
        console.log(elements);
        for(var elem of elements){
            if((titleToggle && elem.firstChild.textContent.match(matchRegExp)) || (descToggle && elem.parentNode.parentNode.parentNode.lastChild.textContent.match(matchRegExp))){
                elem.parentNode.parentNode.parentNode.style.display = "block";
            }else{
                elem.parentNode.parentNode.parentNode.style.display = "none";
            }
        }
    };

    st.oninput = callback;
    tt.onchange = callback;
    dt.onchange = callback;

    st.onkeypress = (e) => {
        if(e.key == "Enter"){
            var matchString = document.getElementById("searchTool").value.toUpperCase();
            if(validCommands.includes(matchString)) {
                if(matchString.startsWith("*")) matchString = matchString.substr(1,matchString.length - 1) + (validCommands.includes(matchString.substr(1,matchString.length - 1)) ? "_st" : "")
                else matchString = matchString.replace(/\/|~/gm, "");

                window.open(`https://www.mm.bme.hu/~gyebro/files/ans_help_v182/ans_cmd/Hlp_C_${matchString}.html`, 'targetWindow', 'toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=500,height=400');
            } else alert(`${matchString} is not a valid command. Please try again.`);
        }
    };

})();
