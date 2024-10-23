// ==UserScript==
// @name         D2L: Enter Advances Student
// @namespace    http://tampermonkey.net/
// @version      2024-09-13
// @description  While the cursor is in an input box in the grading view, hitting enter progresses to the next student's input box.
// @author       Gabriel Tardy
// @match        https://*.edu/d2l/lms/grades/admin/enter/grade_item_edit.d2l?objectId=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=d2l.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var allInputBoxes = [];
    var currentInputBox = 0;

    function advanceInputBox(e){
        if(e.keyCode != 13) return;

        // deactivate current input box
        document.activeElement.blur();

        // advance current input box
        currentInputBox++;

        // activate new input box
        allInputBoxes[currentInputBox].focus();
        allInputBoxes[currentInputBox].value = allInputBoxes[currentInputBox].value;

        console.log("[Userscript] Grading " + currentInputBox + "/" + allInputBoxes.length);
    }

    for(let shadowBase of document.getElementsByTagName("d2l-input-number")){
        let e = shadowBase.shadowRoot;
        let e2 = e.querySelector('d2l-input-text');
        //console.log(e2);

        let e3 = e2.shadowRoot;
        //console.log(e3);

        let inputBox = e3.querySelector('.d2l-input-container').querySelector('.d2l-input-text-container').querySelector('.d2l-input');
        //console.log(inputBox);

        inputBox.addEventListener('input', advanceInputBox);
        allInputBoxes.push(inputBox);
    }
})();