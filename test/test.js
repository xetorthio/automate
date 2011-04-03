var lib = require('../src/automate.js'),
assert = require('assert'),
fs = require('fs');


var json = lib.AutoMate.EC2.build("simple test", {
  parameters: function() { 
      string("WebServerPort", "port of the web server", "8888");
      string("KeyName", "key name");
  },
      
  resources: function(params) {
    var defaultSG = securityGroup("defaultSG", "default sg", function() {
      tcp(22, 22, "0.0.0.0/0");
      tcp(params.WebServerPort, params.WebServerPort, "0.0.0.0/0");
    });


    var ws = instance("ws", {
      securityGroups:[defaultSG],
      ami:"ami-7a11e213",
      instanceType: "t1.micro",
      keyName: params.KeyName,	
      userData: ""
    });
    
    var eip= elasticIp("EIP", ws);
  }
});


var am_template = JSON.parse(json);
var template = JSON.parse(fs.readFileSync("SimpleTest.template", 'utf8'));

fs.writeFileSync("./output.log", json, 'utf8')

assert.deepEqual(template, am_template, "The generated template is different than the expected one.");
