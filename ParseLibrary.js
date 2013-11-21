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
var outAST = fs.openSync('uglify/jquery-AST.js', 'w');
var out = fs.openSync('uglify/jquery-uglify.js', 'w');

fs.writeSync(outAST, JSON.stringify(toplevel, null, '\t'));

var walkerFunction = function(node){
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
            
            var functionNode = node.right;
        
            var args = functionNode.argnames;
            var argStrings = [];
            for(var i = 0 ; i< args.length; i++)
            {
                argStrings.push(args[i].name);
            }

            fs.writeSync(out, node.left.TYPE + ":" + node.left + "\n");
            
            var keys = Object.keys(node.left);
                fs.writeSync(out, "-- " + keys.length + "\n");
            
            for(var i = 0; i< keys.length; i++)
                fs.writeSync(out, "   --- " + keys[i] + "\n");

            if(node.left instanceof UglifyJS.AST_Dot)
            {
                fs.writeSync(out, "dot..\n");
                fs.writeSync(out, "name: " + node.left.property.TYPE + " : line:" + functionNode.start.line + " col: " + functionNode.start.col + "\n");
            }
            else if(node.left instanceof UglifyJS.AST_SymbolAccessor)
            {
                //console.log("true too");
                //fs.writeSync(out, "name: "+ node.left.name + " : line: " + functionNode.start.line + " col: " + functionNode.start.col + "\n");
            }
            else if(node.left instanceof UglifyJS.AST_Assign)
            {
                //console.log("true too");
                //fs.writeSync(out, "name: "+ node.left.name + " : line: " + functionNode.start.line + " col: " + functionNode.start.col + "\n");
            }
        }
    }

    
};


var walker = new UglifyJS.TreeWalker(walkerFunction);


/*Walk the AST */
toplevel.walk(walker);