function s2a(input, threshhold){
  var threshhold = 10;
  var csvText = "";
  var times = input.split("\n");

  var classrooms = {};

  for(var i = 0; i < times.length; i++){
      times[i] = times[i].split("\t");
      times[i][1] = times[i][1].split(/:| /gim);
      var dsc = times[i][1].pop();
      times[i][1][0] = times[i][1][0]*1 + (dsc == "PM" && times[i][1][0] != 12 ? 12 : (times[i][1][0] == 12 && dsc == "AM" ? -12 : 0));
      times[i][1] = times[i][1].join(":");

      times[i][2] = times[i][2].split(/:| /gim);
      dsc = times[i][2].pop();
      times[i][2][0] = times[i][2][0]*1 + (dsc == "PM" && times[i][2][0] != 12 ? 12 : (times[i][2][0] == 12 && dsc == "AM" ? -12 : 0));
      times[i][2] = times[i][2].join(":");

      if(['CHEC', 'CHSCC', 'COSCC', 'CKVLL', 'JACKS', 'LIVE', 'LIVE STREAM', 'MCMIN', 'MSTCC', 'OKRDG', 'OKLND', 'PSTCC', 'ROANE', 'SCHEC', 'TBA', 'WEB', 'WEB ONLINE', 'WSTA', ' ', ''].includes(times[i][3].trim())) {
          console.log('Skipped class matching "' + times[i][3].trim() + '".');
          continue;
      }
      if(!classrooms[times[i][3]]){
          classrooms[times[i][3]] = {
              locked: {M: [], T: [], W: [], R: [], F: []},
              availabilities: {M: [], T: [], W: [], R: [], F: []}
          };
      }

      for(var j = 0; j < times[i][0].length; j++){
         if(!classrooms[times[i][3]].locked[times[i][0][j]]) continue;
         classrooms[times[i][3]].locked[times[i][0][j]].push([times[i][1], times[i][2]]);
         classrooms[times[i][3]].locked[times[i][0][j]].sort();
      }
  }
  //var k = 0;
  for(var classroom in classrooms){
      //if(k++ > 20) break;
      for(var _day in classrooms[classroom].locked){
          var day = classrooms[classroom].locked[_day];
          day.sort((a, b) => a[0].split(":")[0]*1 - b[0].split(":")[0]*1);
          day = day.filter(tme => tme[1].split(":")[0] >= 7 && tme[0].split(":")[0] <= 17); 
          day.unshift(["0:00","7:00"]);
          day.push(["17:00","24:00"]);

          for(var i = 0; i < day.length - 1; i++){
              var event1 = day[i];
              var event2 = day[i+1];

              var e1E = event1[1].split(":");
              var e2B = event2[0].split(":");

              e1E = e1E[0]*60 + e1E[1]*1;
              e2B = e2B[0]*60 + e2B[1]*1;

              if(Math.abs(e1E - e2B) > threshhold && e2B > e1E){
                  classrooms[classroom].availabilities[_day].push([event1[1], event2[0]]);
              }
          }
      }

      csvText += classroom + ",";

      for(var _day in classrooms[classroom].availabilities){
          var today = classrooms[classroom].availabilities[_day];
          for(var i = 0; i < today.length; i++){
              for(var j = 0; j < today[i].length; j++){
                  var t = today[i][j].split(":");
                  if(+t[0] >= 12){
                      t[0] = +t[0] - (+t[0] == 12 ? 0 : 12);
                      t[1] += " PM";
                  } else {
                      t[1] += " AM";
                  }
                  today[i][j] = t.join(":");
              }
              today[i] = today[i].join(" - ");
          }

          csvText += `"${today.join(", ")}"${(_day != "F" ? "," : "\n")}`;
      }
  }

  var csvd = document.createElement("a");
  csvd.href = 'data:text/csv;charset=utf-8,' + encodeURI(csvText);
  csvd.target = '_blank'; 
  csvd.download = 'AvailabilityData.csv';
  csvd.click();
}
