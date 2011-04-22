function AM_Template(desc) {
  this.description = desc;
  this.resources = {};
  this.parameters = {};

  this.addResource = function(r) {
    this.resources[r.name]=r;
  }
  this.addParameter = function(p) {
    this.parameters[p.name]=p;
  }
}

function AM_Instance(name) {
  this.name = name;
}

function AM_LoadBalancer(name) {
  this.name = name;
  this.listeners = [];

  this.addListener = function(l) {
    this.listeners.push(l);
  }
}

function AM_HttpLoadBalancerListener(input, output) {
  this.input = input;
  this.output = output;
}

function AM_TcpSecurityGroupRule(from, to, ip) {
  this.from = from;
  this.to = to;
  this.ip = ip;
}

function AM_SecurityGroup(name, description) {
  this.name = name;
  this.description = description;
  this.rules = [];
  
  this.addRule = function(rule) {
    this.rules.push(rule);
  }
}

function AM_StaticIP(name, resource) {
  this.name = name;
  this.resource = resource;
}

function AM_StringParameter(name, desc, defaultValue) {
  this.name = name;
  this.description = desc;
  this.defaultValue = defaultValue;
}

function AM_TemplateGenerator(desc, dsl) {
  var _t = new AM_Template(desc);

  this.string = function(name, description, defaultValue) {
    var p = new AM_StringParameter(name, description, defaultValue);
    _t.addParameter(p);
    return p;
  }


  this.instance = function(name, data) {
    var i = new AM_Instance(name);
    for(var key in data) {
      i[key]=data[key];
    }
    _t.addResource(i);
    return i;
  }

  this.securityGroup = function(name, description, rules) {
    var sg = new AM_SecurityGroup(name, description);
    this.tcp = function(from, to, ip) {
      sg.addRule(new AM_TcpSecurityGroupRule(from, to, ip));
    };

    rules();

    _t.addResource(sg);
    return sg;
  }

  this.loadbalancer = function(name, data) {
    var lb = new AM_LoadBalancer(name);
    lb.instances = data.instances;
    lb.healthCheck = data.healthCheck;

    this.http = function(input, output) {
      var hl = new AM_HttpLoadBalancerListener(input, output);
      lb.addListener(hl);
      return hl;
    }
    
    data.listeners();

    _t.addResource(lb);
    return lb;
  }

  this.elasticIp = function(name, resource) {
    var si = new AM_StaticIP(name, resource);
    _t.addResource(si);
    return si;
  }

  dsl.parameters();
  dsl.resources(_t.parameters);
  return _t;
}

var AutoMate = {
  generate: function(desc, dsl) {
    return AM_TemplateGenerator(desc, dsl);
  }
};


AutoMate.EC2 = [];

AutoMate.EC2._unRef = function(o) {
  if(o && o.name)
    return {"Ref":o.name};
  else if(o)
    return o;
  else
    throw "The object to unref is null!!";
}

AutoMate.EC2._userDataUnRef = function(list, name, value) {
  if(value instanceof AM_Instance) {
    list.push({"Fn::Join": ["", [name+".publicIp=", {"Fn::GetAtt" : [value.name, "PublicIp"] } ] ]});
    list.push({"Fn::Join": ["", [name+".privateIp=", {"Fn::GetAtt" : [value.name, "PrivateIp"] } ] ]});
  } else if(value instanceof AM_StringParameter){
    list.push({"Fn::Join": ["", [name+"=", {"Ref" : value.name }]]});
  } else {  // Literal
    list.push(name+"="+value);
  }
}

AutoMate.EC2.build = function(template) {
  var unRef = AutoMate.EC2._unRef;
  var userDataUnRef = AutoMate.EC2._userDataUnRef;
  var model = {"AWSTemplateFormatVersion": "2010-09-09",  "Description" : template.description, "Resources" : {}, "Parameters" : {} };

  for(var pk in template.parameters){
    var pv= template.parameters[pk];

    model.Parameters[pk] = {};
    model.Parameters[pk].Description= pv.description;

    if(!pv instanceof AM_StringParameter)
      throw "Unrecognized parameter type";

    model.Parameters[pk].Type= "String";

    if(pv.defaultValue) 
      model.Parameters[pk].Default= pv.defaultValue;
  }

      
  for(var rk in template.resources){
    var rv= template.resources[rk];

    if(rv instanceof AM_Instance){
      model.Resources[rk] = {
        "Type":"AWS::EC2::Instance",
        "Properties": {
          "SecurityGroups" : [ ],
          "KeyName" : unRef(rv.keyName),
          "ImageId" : unRef(rv.ami),
          "InstanceType" : unRef(rv.instanceType)
        }
      }

      for(var sgi=0; sgi<rv.securityGroups.length; sgi++) {
        model.Resources[rk].Properties.SecurityGroups.push(unRef(rv.securityGroups[sgi]));
      } 

      if(rv.userData){
        model.Resources[rk].Properties.UserData = {
            "Fn::Base64": {
              "Fn::Join": ["\n", []]
            }
        };

        var udl = model.Resources[rk].Properties.UserData["Fn::Base64"]["Fn::Join"][1];

        for(var udk in rv.userData) {
          userDataUnRef(udl, udk, rv.userData[udk]);
        }
      }
    } else if(rv instanceof AM_SecurityGroup) {
      model.Resources[rk] = {
        "Type":"AWS::EC2::SecurityGroup",
        "Properties": {
          "GroupDescription": rv.description,
          "SecurityGroupIngress":[]
        }
      };
      var sg = model.Resources[rk].Properties.SecurityGroupIngress;
      for(var i in rv.rules) {
        var r = rv.rules[i];
        if(!r instanceof AM_TcpSecurityGroupRule) {
          throw "Unkown security group rule.";
        }
        sg.push({
          "IpProtocol" : "tcp",
          "FromPort" : unRef(r.from),
          "ToPort" : unRef(r.to),
          "CidrIp" : unRef(r.ip)
        });
      }
    } else if(rv instanceof AM_LoadBalancer){
      model.Resources[rk] = {
        "Type":"AWS::ElasticLoadBalancing::LoadBalancer",
        "Properties": {
          "Instances": [],
          "Listeners": [],
          "HealthCheck": {}
        }
      };

      for(var ins=0; ins<rv.instances.length; ins++) {
        model.Resources[rk].Properties.Instances.push(unRef(rv.instances[ins]));
      }

      var listeners = model.Resources[rk].Properties.Listeners;
      for(var i in rv.listeners) {
        var l= rv.listeners[i];
        if(!l instanceof AM_HttpLoadBalancerListener) {
          throw "Unkown loadbalancer listener.";
        }
        listeners.push({
          "LoadBalancerPort" : unRef(l.input),
          "InstancePort" : unRef(l.output),
          "Protocol" : "HTTP"
        });
      }

      var hc = model.Resources[rk].Properties.HealthCheck;

      hc.Target = unRef(rv.healthCheck.target);
      hc.HealthyThreshold = unRef(rv.healthCheck.healthyThreshold);
      hc.UnhealthyThreshold = unRef(rv.healthCheck.unhealthyThreshold);
      hc.Interval = unRef(rv.healthCheck.interval);
      hc.Timeout = unRef(rv.healthCheck.timeout);
    }
    else if(rv instanceof AM_StaticIP) {
        model.Resources[rk]= {};
        model.Resources[rk].Type= "AWS::EC2::EIP";
        model.Resources[rk].Properties= {};
        model.Resources[rk].Properties.InstanceId= unRef(rv.resource);
    }
  }
  return JSON.stringify(model);
}

// This is just to test using node.js
if(typeof(exports) !== 'undefined' && exports !== null) {
	exports.AutoMate=AutoMate;
}
