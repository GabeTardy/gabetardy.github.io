// input l formatted from excel rows InvType-Model
var c = l.split("\n");
for(var q = 0; q < c.length; q++){
c[q] = c[q].split("\t");
if(!(c[q][0].match("Inventory") || c[q][0] == "" || c[q][3].trim() != "")){

    var cq0;
    if(c[q][2] != "" && c[q][0].toLowerCase().match(c[q][2].toLowerCase()))
        cq0 = c[q][0].replace(new RegExp(c[q][2], 'gim'), "").trim();
    else cq0 = c[q][0];
    c[q][3] = cq0;
}
c[q] = c[q].join("\t");
}
c = c.join("\n");
console.log(c);
