var lib = require('../src/automate.js'),
assert = require('assert'),
fs = require('fs');


var json = lib.AutoMate.EC2.build("1st test", {
        parameters: function() { 
            //string("WebServerPort", "TCP/IP port of the web server", "8888");
            string("KeyName", "Name of an existing EC2 KeyPair to enable SSH access to the instance");
        },
        
        resources: function(params) {
          var sg = securityGroup("InstanceSecurityGroup", "Enable SSH access and HTTP access on the inbound port", function() {
            tcp(22, 22, "0.0.0.0/0");
          });

          var i1 = instance("Ec2Instance1", {
            securityGroups:[sg],
            ami:"ami-7a11e213",
            instance_type: "t1.micro",
            key_name: params.KeyName,	
            user_data: ""
          });
        
          var i2 = instance("Ec2Instance2", {
            securityGroups:[sg],
            ami:"ami-7a11e213",
            instance_type: "t1.micro",
            key_name: params.KeyName,	
            userData: ""
          });
        
          var lb = loadbalancer("ElasticLoadBalancer", {
            instances:[i1,i2]
          });
          
          var eip= elasticIp("EIP", i2);
        }
	  }
    );


var am_template = JSON.parse(json);
var template = JSON.parse(fs.readFileSync("EC2WebSiteSample-1.0.0.template", 'utf8'));

fs.writeFileSync("./output.log", am_template, 'utf8')

console.log("Generated JSON:\n"+json+"\n");

assert.deepEqual(template, am_template, "The generated template is different than the expected one.");
