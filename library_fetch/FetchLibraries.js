/*
		--------------------------
	Helper functions and Prototype function adds:
		--------------------------
*/

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

var indexOf = function(needle) {
    if(typeof Array.prototype.indexOf === 'function') {
        indexOf = Array.prototype.indexOf;
    } else {
        indexOf = function(needle) {
            var i = -1, index = -1;

            for(i = 0; i < this.length; i++) {
                if(this[i] === needle) {
                    index = i;
                    break;
                }
            }

            return index;
        };
    }

    return indexOf.call(this, needle);
};

var walkExistingPackagesFound = function(dir) {
	var results = [];
	var list = fs.readdirSync(dir);
	if(list.length > 0)
	{
		list.forEach(function(file) {
			file = dir + '/' + file;

			var stat = fs.statSync(file);
			if (stat && stat.isDirectory())
			{
				results = results.concat(walk(file));
			}
			else 
			{
				var name = file.split('/');
				var packname = name[name.length-1].split('.js');
				results.push(packname[0]);
			}
		});
	}
	return results;
};


var walk = function(dir) {
	var results = [];
	var list = fs.readdirSync(dir);
	if(list.length > 0)
	{
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
	}
	return results;
};

/*
	--------------------------
		Main starts:
	--------------------------
*/

var fs = require('fs');


var packageListFile = 'library_list.txt';
var packageList = fs.readFileSync(packageListFile);
var packageArray = packageList.toString().split("\n");


var execSync = require('execSync');

var existingPackages = walkExistingPackagesFound('Fetched_Libraries');

var existingNpmInstalls = fs.readdirSync('node_modules');



var newresults = [];
var results =  walk('node_modules');

var notFoundArray = [];

for(var i=0; i<packageArray.length; i++)
{
	var packageName = packageArray[i];
	

	if(indexOf.call(existingPackages, packageName) === -1)
	{
		var foundFlag = 0;
		console.log('Fetching ' + packageName + ':')
		
		if(newresults.length > results.length)
			results = newresults;
		
		for(var j = 0; j<results.length; j++)
		{
			var fileName = results[j];
			var splitName = fileName.split('/');
			if(splitName[splitName.length-1] === (packageName + '.js'))
			{
				if(splitName[splitName.length-2] === packageName || splitName[splitName.length-2] === 'lib')
				{
					foundFlag = 1;
					console.log('-- Found ' + fileName);
					var commandOp = execSync.run('mv ' + fileName + ' ' +  'Fetched_Libraries/' + packageName + '.js');
					console.log('-- Moved ' + packageName + ' to Fetched_Libraries');
					break;
				}
			}
		}

		if(foundFlag === 0)
		{
			for(var j = 0; j<results.length; j++)
			{
				var fileName = results[j];
				var splitName = fileName.split('/');
				if(splitName[splitName.length-1].endsWith('js') === true &&  splitName[splitName.length-1].startsWith(packageName) === true)
				{
					if(splitName[splitName.length-2] === packageName || splitName[splitName.length-2] === 'lib')
					{
						foundFlag = 1;
						console.log('-- Found ' + fileName);
						var commandOp = execSync.run('mv ' + fileName + ' ' +  'Fetched_Libraries/' + packageName + '.js');
						console.log('-- Moved ' + packageName + ' to Fetched_Libraries');
						break;
					}
				}
			}
		}

		if(foundFlag === 0)
		{
			for(var j = 0; j<results.length; j++)
			{
				var fileName = results[j];
				var splitName = fileName.split('/');
				if(splitName[splitName.length-1].endsWith('js') === true &&  splitName[splitName.length-1].startsWith(packageName) === true)
				{
						foundFlag = 1;
						console.log('-- Found ' + fileName);
						var commandOp = execSync.run('mv ' + fileName + ' ' +  'Fetched_Libraries/' + packageName + '.js');
						console.log('-- Moved ' + packageName + ' to Fetched_Libraries');
						break;
				}
			}
		}

		if(foundFlag === 0)
		{
			for(var j = 0; j<results.length; j++)
			{
				var fileName = results[j];
				var splitName = fileName.split('/');
				if(splitName[splitName.length-2] === packageName)
				{
					if(splitName[splitName.length-1] === 'index.js')
					{
						foundFlag = 1;
						console.log('-- Found ' + fileName);
						var commandOp = execSync.run('mv ' + fileName + ' ' +  'Fetched_Libraries/' + packageName + '.js');
						console.log('-- Moved ' + packageName + ' to Fetched_Libraries');
						break;
					}
				}
			}
		}

		if(foundFlag === 0)
		{

			if(indexOf.call(existingNpmInstalls, packageName) === -1)
			{
				console.log('- Fetching ' + packageName + ' using npm:')
				var commandOp = execSync.run('npm install ' + packageName);
				console.log('- Fetched!')
				newresults = walk('node_modules');
				for(var j = 0; j<newresults.length; j++)
				{
					var fileName = newresults[j];
					var splitName = fileName.split('/');
					//if(splitName[splitName.length-1].endsWith('js') === true &&  splitName[splitName.length-1].startsWith(packageName) === true)
					if(splitName[splitName.length-1] === (packageName + '.js'))
					{
						if(splitName[splitName.length-2] === packageName || splitName[splitName.length-2] === 'lib')
						{
							foundFlag = 1;
							console.log('-- Found ' + fileName);
							var commandOp = execSync.run('mv ' + fileName + ' ' +  'Fetched_Libraries/' + packageName + '.js');
							console.log('-- Moved ' + packageName + ' to Fetched_Libraries');
							break;
						}
					}
				}
			}
		}

		if(foundFlag ===0)
		{
			notFoundArray.push(packageName);
		}
	}
}


console.log("NOT FOUND: ")
for(var i =0; i<notFoundArray.length; i++)
	console.log(notFoundArray[i]);