var obj = {};
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
obj.prop().bar();