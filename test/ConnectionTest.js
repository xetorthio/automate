AutoMate.generate("simple test", {
  parameters: function() { 
      string("WebServerPort", "port of the web server", "8888");
      string("KeyName", "key name");
  },
      
  resources: function(params) {
    var defaultSG = securityGroup("defaultSG", "default sg", function() {
      tcp(22, 22, "0.0.0.0/0");
      tcp(params.WebServerPort, params.WebServerPort, "0.0.0.0/0");
    });

    var redis = instance("redis", {
      securityGroups:[defaultSG],
      ami:"ami-7a11e213",
      instanceType: "t1.micro",
      keyName: params.KeyName
    });

    var ws = instance("ws", {
      securityGroups:[defaultSG],
      ami:"ami-7a11e213",
      instanceType: "t1.micro",
      keyName: params.KeyName,
      userData: {
        redisMaster: redis,
        redisMasterPort: 6379,
        tomcatPort: params.WebServerPort
      }
    });
    
    var eip= elasticIp("EIP", ws);
  }
});
