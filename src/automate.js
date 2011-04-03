function unRef(parameter) {
	return parameter.reference?parameter.reference():parameter;
}

var AutoMate= {
	EC2: {
		build: function(description, dsl) {	

		  var model = {"AWSTemplateFormatVersion": "2010-09-09",  "Description" : description, "Resources" : {}, "Parameters" : {} };
		  
		  Object.prototype.instance = function(name, data) {

			model.Resources[name] = {
			  "Type":"AWS::EC2::Instance",
			  "Properties": {
					"SecurityGroups" : [ ],
					"KeyName" : unRef(data.key_name),
					"ImageId" : unRef(data.ami),
					"InstanceType" : unRef(data.instance_type),
					"UserData" : { "Fn::Base64" : { "Ref" : "WebServerPort" }} //TODO: Implement
			  }
			}

			for(sg in data.securityGroups) {
			  model.Resources[name].Properties.SecurityGroups.push({"Ref":sg.name});
			}

			model.Resources[name].reference= function() {
                return {"Ref":name};
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

			model.Resources[name].reference= function() {
                return {"Ref":name};
            }

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

			model.Resources[name].reference= function() {
                return {"Ref":name};
            }

			return {"name":name,"data":data};
		  }

          Object.prototype.elasticIp = function(name, resource) {
			model.Resources[name]= {};
			model.Resources[name].Type= "AWS::EC2::EIP";
			model.Resources[name].Properties= {};
			model.Resources[name].Properties.InstanceId= unRef(resource);

			model.Resources[name].reference= function() {
                return {"Ref":name};
            }
			return model.Resources[name];
		  }

		  Object.prototype.string = function(name, description, defaultValue) {
			model.Parameters[name]= {};
			model.Parameters[name].Description= description;
			model.Parameters[name].Type= "String";
			if(defaultValue) 
				model.Parameters[name].Default= defaultValue;

			model.Parameters[name].reference= function() {
				return {"Ref":name};
			}
		  }

		  dsl.parameters();
		  dsl.resources(model.Parameters);

		  return JSON.stringify(model);
		}
	}
};

// This is just to test using node.js

if(typeof(exports) !== 'undefined' && exports !== null) {
	exports.AutoMate=AutoMate;
}




