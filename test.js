var foo = function()
{
	var self = {
		bar : function()
		{
			console.log('in bar');
		}
	};
	return self;
};

foo().bar();