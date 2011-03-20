var lib = require('../src/automate.js'),
    assert = require('assert'),
    fs = require('fs');

var json = lib.AutoMate.EC2.build(function(){
  var sg = securityGroup("InstanceSecurityGroup", "Enable SSH access and HTTP access on the inbound port", function() {
    tcp(22, 22, "0.0.0.0/0");
  });

  var i1 = instance("Ec2Instance1", {
    securityGroups:[sg],
    ami:"ami-7a11e213",
    userData:{}
  });

  var i2 = instance("Ec2Instance2", {
    securityGroups:[sg],
    ami:"ami-7a11e213",
    userData:{}
  });

  var lb = loadbalancer("ElasticLoadBalancer", {
    instances:[i1,i2]
  });
});

var am_template = JSON.parse(json);
var template = JSON.parse(fs.readFileSync("EC2WebSiteSample-1.0.0.template", 'utf8'));

assert.deepEqual(template, am_template);
