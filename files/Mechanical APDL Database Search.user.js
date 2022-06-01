// ==UserScript==
// @name         Mechanical APDL Database Search
// @namespace    http://gabetardy.github.io/
// @version      1.2
// @description  allows user to search APDL database for specific command
// @author       Gabriel Tardy
// @match        https://www.mm.bme.hu/~gyebro/files/ans_help_v182/ans_cmd/Hlp_C_CmdTOC.html
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bme.hu
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

var l = document.createElement("header");
l.innerHTML = `<input type="text" placeholder="Search database..." id="searchTool" oninput="filterAPDL()">`;
l.style.background = '#fafafa';
l.style.padding = "1em";

var validCommands = [];
var elements = document.getElementsByClassName("command");
for(var elem of elements){
    validCommands.push(elem.firstChild.textContent);
}

document.body.insertBefore(l, document.body.firstChild);
var st = document.getElementById("searchTool");
st.oninput = (e) => {
    var matchString = document.getElementById("searchTool").value;
    var matchRegExp = new RegExp(matchString, "gim");

    for(var i = 0; i <= 4; i++){
        document.getElementsByTagName("dl")[0].children[i].style.display = matchString == "" ? "block" : "none";
    }
    for(var reference of document.getElementsByClassName("reference")){
        reference.parentNode.style.display = matchString == "" ? "block" : "none";
    }
    console.log(elements);
    for(var elem of elements){
        if(elem.firstChild.textContent.match(matchRegExp)){
            elem.parentNode.parentNode.parentNode.style.display = "block";
        }else{
            elem.parentNode.parentNode.parentNode.style.display = "none";
        }
        // elem.parentNode.
    }
};

st.onkeypress = (e) => {
    if(e.key == "Enter"){
        var matchString = document.getElementById("searchTool").value.toUpperCase();
        if(validCommands.includes(matchString)) {
            window.open(`https://www.mm.bme.hu/~gyebro/files/ans_help_v182/ans_cmd/Hlp_C_${matchString}.html`, 'targetWindow', 'toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=500,height=400');
        } else alert(`${matchString} is not a valid command. Please try again.`);
    }
};

    // Your code here...
})();