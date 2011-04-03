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
            "KeyName" : unRef(data.keyName),
            "ImageId" : unRef(data.ami),
            "InstanceType" : unRef(data.instanceType)
            //"UserData" : { "Fn::Base64" : { "Ref" : "WebServerPort" }} //TODO: Implement
          }
        }


        for(var sgi=0; sgi<data.securityGroups.length; sgi++) {
          model.Resources[name].Properties.SecurityGroups.push(unRef(data.securityGroups[sgi]));
        }

        model.Resources[name].reference= function() {
          return {"Ref":name};
        }

        return model.Resources[name];
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
            "FromPort" : unRef(from),
            "ToPort" : unRef(to),
            "CidrIp" : unRef(ip)
          });
			  }

			  rules();

			  model.Resources[name].reference= function() {
          return {"Ref":name};
        }

			  return model.Resources[name];
		  }
		  
		  
		  Object.prototype.loadbalancer = function(name, data) {
        model.Resources[name] = {
          "Type":"AWS::ElasticLoadBalancing::LoadBalancer",
          "Properties": {
            "Instances": [],
            "Listeners": [],
            "HealthCheck": {}
          }
        };

        for(var ins=0; ins<data.instances.length; ins++) {
          model.Resources[name].Properties.Instances.push(unRef(data.instances[ins]));
        }

        var listeners = model.Resources[name].Properties.Listeners;
		  	Object.prototype.http = function(input, output) {
          listeners.push({
            "LoadBalancerPort" : unRef(input),
            "InstancePort" : unRef(output),
            "Protocol" : "HTTP"
          });
			  }

        data.listeners();

        var hc = model.Resources[name].Properties.HealthCheck;

        hc.Target = unRef(data.healthCheck.target);
        hc.HealthyThreshold = unRef(data.healthCheck.healthyThreshold);
        hc.UnhealthyThreshold = unRef(data.healthCheck.unhealthyThreshold);
        hc.Interval = unRef(data.healthCheck.interval);
        hc.Timeout = unRef(data.healthCheck.timeout);

        model.Resources[name].reference= function() {
          return {"Ref":name};
        }

        return model.Resources[name];
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




