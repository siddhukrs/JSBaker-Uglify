/* Requires*/
var UglifyJS = require('uglify-js')
var fs = require('fs');
var util = require('util');


/*Inputs*/
var inputFile = 'lib/jquery.js';
var code = fs.readFileSync(inputFile, "utf8");


/*Parser*/
var toplevel = UglifyJS.parse(code);

/*Output*/
var out = fs.openSync('uglify/jquery-uglify.js', 'w');


var walker = new UglifyJS.TreeWalker(function(node){
    //check for function calls
    /*if (node instanceof UglifyJS.AST_Call) 
    {
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
    }*/
    /*if(node instanceof UglifyJS.AST_Defun)
    {
        //defined but not called
        var parents = walker.stack;
        fs.writeSync(out, node.name.name);
        for(var i = 0; i<parents.length; i++)
        {
            if(parents[i].name !== undefined && parents[i].name !== null)
                fs.writeSync(out, "--- "+parents[i].name.name);
        }
        fs.writeSync(out, "\n");
        return false;
    }*/
    if (node instanceof UglifyJS.AST_Defun) 
    {
        // string_template is a cute little function that UglifyJS uses for warnings
        fs.writeSync(out, UglifyJS.string_template("Found AST_Defun {name} at {line},{col}", {
            name: node.name.name,
            line: node.start.line,
            col: node.start.col
        }) + "\n");
    }

    else if(node instanceof UglifyJS.AST_Assign)
    {
        if (node.right instanceof UglifyJS.AST_Function) 
        {
            // string_template is a cute little function that UglifyJS uses for warnings
            var functionNode = node.right;
            var keys = Object.keys(node.left);
                console.log(keys);

            var args = functionNode.argnames;
            var argStrings = [];
            for(var i = 0 ; i< args.length; i++)
            {
                //console.log(args[i].name);
                argStrings.push(args[i].name);
            }
            fs.writeSync(out, UglifyJS.string_template("Found AST_Function {name} at {line},{col}", {
                name: node.left.name,
                line: functionNode.start.line,
                col: functionNode.start.col
            }) + "\n");
        }
    }

    
});


/*Walk the AST */
toplevel.walk(walker);