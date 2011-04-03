
var AutoMate= {
	EC2: {
		build: function(dsl) {
		  var model = {"Resources" : {}};
		  
		  
		  Object.prototype.instance = function(name, data) {
			model.Resources[name] = {
			  "Type":"AWS::EC2::Instance",
			  "Properties": {
				"SecurityGroups":[]
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




