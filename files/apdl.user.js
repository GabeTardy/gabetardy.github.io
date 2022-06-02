// ==UserScript==
// @name         Mechanical APDL Database Search
// @namespace    http://gabetardy.github.io/
// @version      1.3
// @description  allows user to search APDL database for specific command
// @author       Gabriel Tardy
// @match        https://www.mm.bme.hu/~gyebro/files/ans_help_v182/ans_cmd/Hlp_C_CmdTOC.html
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bme.hu
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var l = document.createElement("header");
    l.innerHTML = `<input type="text" placeholder="Search database..." id="searchTool" oninput="filterAPDL()">&nbsp;<input type="checkbox" id="titleToggle" checked><span>Titles</span>&nbsp;<input type="checkbox" id="descToggle" checked><span>Descriptions</span><span style="float:right">APDL Database Search 1.3 - <a href="https://gabetardy.github.io/files/apdl.user.js">Check for Updates/Reinstall</a></span>`;
    l.style.background = '#fafafa';
    l.style.padding = "1em";

    var validCommands = [];
    var elements = document.getElementsByClassName("command");
    for(var elem of elements){
        validCommands.push(elem.firstChild.textContent);
    }

    document.body.insertBefore(l, document.body.firstChild);
    var st = document.getElementById("searchTool");
    var tt = document.getElementById("titleToggle");
    var dt = document.getElementById("descToggle");

    var callback = () => {
        var matchString = st.value;
        var titleToggle = tt.checked;
        var descToggle = dt.checked;
        var matchRegExp = new RegExp(matchString, "gim");

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
                window.open(`https://www.mm.bme.hu/~gyebro/files/ans_help_v182/ans_cmd/Hlp_C_${matchString}.html`, 'targetWindow', 'toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=500,height=400');
            } else alert(`${matchString} is not a valid command. Please try again.`);
        }
    };

})();
