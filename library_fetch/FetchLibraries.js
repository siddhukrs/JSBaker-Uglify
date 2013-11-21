var fs = require('fs');


var packageListFile = 'library_list.txt';
var packageList = fs.readFileSync(packageListFile);
var packageArray = packageList.toString().split("\n");


var sys = require('sys');
var exec = require('child_process').exec;


if (typeof String.prototype.startsWith != 'function') {
	String.prototype.startsWith = function (str){
		return this.slice(0, str.length) == str;
	};
}

if (typeof String.prototype.endsWith != 'function') {
	String.prototype.endsWith = function (str){
		return this.slice(this.length - str.length, this.length) == str;
	};
}

function puts(error, stdout, stderr) 
{ 
	sys.puts(stdout);
}

var walk = function(dir) {
    var results = [];
    var list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;

        var stat = fs.statSync(file);
        if (stat && stat.isDirectory())
        {
        	results = results.concat(walk(file));
        }
        else 
        {
        	results.push(file);
        }
    });
    return results;
};


for(var i=0; i<packageArray.length; i++)
{
	var packageName = packageArray[i];
	//exec("npm install " + packageName, puts);
	var results = walk('node_modules');
	for(var j = 0; j<results.length; j++)
	{
		var fileName = results[j];
		var splitName = fileName.split('/');
		//if(splitName[splitName.length-1].endsWith('js') === true &&  splitName[splitName.length-1].startsWith(packageName) === true)
		if(splitName[splitName.length-1] === (packageName + '.js'))
			console.log(fileName);
	}
}



