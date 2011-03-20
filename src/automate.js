
var AutoMate= {
	EC2: {
		build: function(dsl) {	
		  var model = {"AWSTemplateFormatVersion": "2010-09-09",  "Description" : "This is a test", "Resources" : {},
				"Parameters" : {
				   "WebServerPort" : {
					 "Description" : "TCP/IP port of the web server",
					 "Type" : "String",
					 "Default" : "8888"
				   },
				   "KeyName" : {
					 "Description" : "Name of an existing EC2 KeyPair to enable SSH access to the instance",
					 "Type" : "String"
				   }
				 },
			};

		  
		  
		  Object.prototype.instance = function(name, data) {

			model.Resources[name] = {
			  "Type":"AWS::EC2::Instance",
			  "Properties": {
					"SecurityGroups" : [ ],

					"KeyName" : { Ref: "KeyName" },

					"ImageId" : "ami-7a11e213",
					"InstanceType" : "t1.micro",
					"UserData" : { "Fn::Base64" : { "Ref" : "WebServerPort" }}
			  }
			}

			for(sg in data.securityGroups) {
			  model.Resources[name].Properties.SecurityGroups.push({"Ref":sg.name});
			}
			return {"name":name,"data":data};
		  }
		  
		  
		  
		  Object.prototype.securityGroup = function(name, description, rules) {
			model.Resources[name] = {
			  "Type":"AWS::EC2::SecurityGroup",
			  "Properties": {
				"GroupDescription":description,
				"SecurityGroupIngress":[]
			  }
			};
			var sg = model.Resources[name].Properties.SecurityGroupIngress;
			Object.prototype.tcp = function(from, to, ip) {
			  sg.push({
				"IpProtocol" : "tcp",
				"FromPort" : from,
				"ToPort" : to,
				"CidrIp" : ip
			  });
			}
			rules();
			return {"name":name, "description":description, "rules":rules};
		  }
		  
		  
		  Object.prototype.loadbalancer = function(name, data) {
			model.Resources[name] = {
			  "Type":"ElasticLoadBalancer",
			  "Properties": {
				"Instances":[]
			  }
			};
			for(ins in data.instances) {
			  model.Resources[name].Properties.Instances.push({"Ref":ins.name});
			}
			return {"name":name,"data":data};
		  }
		  dsl();
		  return JSON.stringify(model);
		}
	}
};

// This is just to test using node.js

if(typeof(exports) !== 'undefined' && exports !== null) {
	exports.AutoMate=AutoMate;
}




