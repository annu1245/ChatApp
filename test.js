var i = "ANNU"

// $("#btn").on("click", function (e) {});


var st = "Tue Jun 15 2021 21:08:12 GMT+0530 (India Standard Time)"
console.log(i);
console.log(new Date(st).getHours());

var d = new Date();
var time = d.setDate(d.getDate()-1);
console.log(time);