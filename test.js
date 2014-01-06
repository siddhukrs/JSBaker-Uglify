var obj = function()
{
	
};
obj.prop = function()
{
	var self = {
		bar : function()
		{
			console.log('in bar');
		}
	};
	return self;
};

var x = JSON.parse('{"scrollLeft":"pageXOffset","scrollTop":"pageYOffset"}');
for(var key in x)
	console.log(key + ' - ' + x[key]);
obj.prop().bar();