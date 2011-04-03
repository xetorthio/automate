AutoMate.EC2.build("load balancer test", {
  parameters: function() { 
      string("KeyName", "key name");
  },
      
  resources: function(params) {
    var defaultSG = securityGroup("defaultSG", "default", function() {
      tcp(22, 22, "0.0.0.0/0");
      tcp(8080, 8080, "0.0.0.0/0");
    });

    var ws1 = instance("ws1", {
      securityGroups:[defaultSG],
      ami:"ami-7a11e213",
      instanceType: "t1.micro",
      keyName: params.KeyName
    });

    var ws2 = instance("ws2", {
      securityGroups:[defaultSG],
      ami:"ami-7a11e213",
      instanceType: "t1.micro",
      keyName: params.KeyName
    });
    
    var lb = loadbalancer("balancer", {
      instances:[ws1, ws2],
      listeners: function(){
        http(80, 8080);
        http(443, 8443);
      },
      healthCheck: {
        target: "HTTP:8080/",
        healthyThreshold: "3",
        unhealthyThreshold: "5",
        interval: "30",
        timeout: "5"
      }
    });

  }
});
