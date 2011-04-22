var lib = require('../src/automate.js'),
    fs = require('fs');

// Load the argument file
var fileName = process.argv[2];
var amScript = fs.readFileSync(fileName, 'utf8');

// Execute AutoMate
eval("var t = lib."+ amScript);

var json = lib.AutoMate.EC2.build(t);

// Print JSon Template
process.stdout.write(json);

