//to be run using nodejs
var UglifyJS = require('uglify-js')
var fs = require('fs');
var util = require('util');

var file = 'lib/jquery.js';
//read in the code
var code = fs.readFileSync(file, "utf8");
//parse it to AST
var toplevel = UglifyJS.parse(code);
//open the output DOT file
var out = fs.openSync('uglify/jquery-uglify.js', 'w');
//output the start of a directed graph in DOT notation
fs.writeSync(out, 'digraph test{\n');

//use a tree walker to examine each node
var walker = new UglifyJS.TreeWalker(function(node){
    //check for function calls
    if (node instanceof UglifyJS.AST_Call) {
        if(node.expression.name !== undefined)
        {
        //find where the calling function is defined
        var p = walker.find_parent(UglifyJS.AST_Defun);

        if(p !== undefined)
        {
            //filter out unneccessary stuff, eg calls to external libraries or constructors
            if(node.expression.name == "$" || node.expression.name == "Number" || node.expression.name =="Date")
            {
                //NOTE: $ is from jquery, and causes problems if it's in the DOT file.
                //It's also very frequent, so even replacing it with a safe string
                //results in a very cluttered graph
            }
            else
            {

                fs.writeSync(out, p.name.name);
                fs.writeSync(out, " -> ");
                fs.writeSync(out, node.expression.name);
                fs.writeSync(out, "\n");
            }
        }
        else
        {
            //it's a top level function
            fs.writeSync(out, node.expression.name);
            fs.writeSync(out, "\n");
        }

    }
}
if(node instanceof UglifyJS.AST_Defun)
{
    //defined but not called
    fs.writeSync(out, node.name.name);
    fs.writeSync(out, "\n");
}
});
//analyse the AST
toplevel.walk(walker);

//finally, write out the closing bracket
fs.writeSync(out, '}');