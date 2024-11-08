// ==UserScript==
// @name         D2L: Save Draft and Advance Student
// @namespace    http://tampermonkey.net/
// @version      2024-11-07
// @description  try to take over the world!
// @author       You
// @match        https://*.edu/d2l/le/activities/iterator/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=d2l.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    var saveDraft;
    var advanceStudent;
    var advanceStudentParent;
    var b0, a0, a1, a2, a3, a4;

    var behaviorSet = function(){
        var tryToSetupBehavior = setInterval(function(){
            try{
                // Complication due to how tampermonkey scripts are loaded
                b0 = document.body.parentNode.getRootNode().body;
                a0 = document.body.parentNode.getRootNode().querySelector('.d2l-body');

                if(a0 == null) return;
                if(b0.id == "tinymce") return;

                console.log(a0);
                a1 = a0.querySelector("d2l-consistent-evaluation");
                a2 = a1.shadowRoot.querySelector("d2l-consistent-evaluation-page");
                a3 = a2.shadowRoot.querySelector("#evaluation-template");
                a4 = a3.querySelector('div[slot="footer"]');
                advanceStudentParent = a4.querySelector('d2l-consistent-evaluation-footer');
                saveDraft = advanceStudentParent.shadowRoot.querySelector('#consistent-evaluation-footer-save-draft');
                saveDraft.textContent = "Save and Advance";
                advanceStudent = advanceStudentParent.shadowRoot.querySelector('#consistent-evaluation-footer-next-student');

                if(!saveDraft) return;
                if(!advanceStudent) return;

                saveDraft.addEventListener("click", function(e){
                    if(!advanceStudent) advanceStudent = advanceStudentParent.shadowRoot.querySelector('#consistent-evaluation-footer-next-student');
                    var currentHref = location.href;
                    var advanceStudentTimeout = setInterval(function(){
                        if(location.href !== currentHref) clearInterval(advanceStudentTimeout);
                        else {
                            console.log("Trying to click button...");
                            advanceStudent.click();
                        }
                    }, 100);
                })

                document.addEventListener("keyup", function (e) {
                    console.log(e.key);
                    if (e.key === "ArrowRight") {
                        if(!advanceStudent) advanceStudent = advanceStudentParent.shadowRoot.querySelector('#consistent-evaluation-footer-next-student');
                        var currentHref = location.href;
                        var advanceStudentTimeout = setInterval(function(){
                            if(location.href !== currentHref) clearInterval(advanceStudentTimeout);
                            else {
                                console.log("Trying to click button...");
                                advanceStudent.click();
                            }
                        }, 100);
                    }
                });
                clearInterval(tryToSetupBehavior);
            }catch(e){
                console.log("Shadow root not loaded. Trying again in 0.5 ms...");
                console.log(e);
            }
        },500);
    };
    behaviorSet();
})();