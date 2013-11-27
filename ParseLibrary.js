/* Requires*/
var UglifyJS = require('uglify-js')
var fs = require('fs');
var util = require('util');


/*Inputs*/
var inputFile = 'lib/jquery.js';
var code = fs.readFileSync(inputFile, "utf8");


/*Parser*/
var toplevel = UglifyJS.parse(code);
toplevel.figure_out_scope();

/*Output*/
var out = fs.openSync('uglify/jquery-uglify.js', 'w');
var names = fs.openSync('uglify/jquery-uglify-names.js', 'w');


var types = [];

/*To print the AST to a file: 
var outAST = fs.openSync('uglify/jquery-AST.js', 'w');
fs.writeSync(outAST, JSON.stringify(toplevel, null, '\t'));
*/
var getParentTypes = function(node) {
    var parents = walker.stack;
    var parentTypes = [];
    parents.forEach( function(value){
            parentTypes.push(value.TYPE);
        }
    );
    return parentTypes;
};

var printStackToFile = function(fname, stack){

    for(var i = 0; i<stack.length; i++)
        fs.writeSync(fname, '-- ' + stack[i] + '\n');
};

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
        var p = walker.find_parent(UglifyJS.AST_Defun);
        var pname = 'undefined';
            if(p !== undefined)
            {
                    pname = p.name.name;

            }
            /*if(pname !== 'undefined')
               console.log(pname);*/

             fs.writeSync(out, UglifyJS.string_template("Found AST_Defun {name} at {line},{col}", {
            name: node.name.name,
            line: node.start.line,
            col: node.start.col
        }) + "\n");
             fs.writeSync(names,  node.name.name + '\n');
             printStackToFile(names, getParentTypes(node));
             fs.writeSync(out, " Parent: " + pname + "\n");
    }

    else if (node instanceof UglifyJS.AST_ObjectKeyVal) 
    {
        if(node.value instanceof UglifyJS.AST_Function)
        {
                 fs.writeSync(out, UglifyJS.string_template("Found AST_ObjectKeyVal {name} at {line},{col}", {
                name: node.key,
                line: node.start.line,
                col: node.start.col
            }) + "\n");
                 fs.writeSync(names,  node.key + '\n' );
                 printStackToFile(names, getParentTypes(node));
                 //fs.writeSync(out, " Parent: " + pname + "\n");
        }
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

            var p = walker.find_parent(UglifyJS.AST_Defun);
            var pname = 'undefined';
            if(p !== undefined)
            {
                    pname = p.name.name;

            }
            /*if(pname !== 'undefined')
               console.log(pname);*/
            
            if(node.left instanceof UglifyJS.AST_Dot)
            {
                if(node.left.expression instanceof UglifyJS.AST_SymbolRef)
                {
                    fs.writeSync(out, "name: " + node.left.expression.name + '.'  +  node.left.property + " : line:" + functionNode.start.line + " col: " + functionNode.start.col + "\n");
                    fs.writeSync(names, node.left.expression.name + '.'  +  node.left.property + '\n' );
                    printStackToFile(names, getParentTypes(node));
                }
                else if(node.left.expression instanceof UglifyJS.AST_Dot)
                {
                   fs.writeSync(out, "name: " + node.left.expression.expression.name + '.' +  node.left.expression.property.val + '.'  +  node.left.property.value + " : line:" + functionNode.start.line + " col: " + functionNode.start.col + "\n");
                   fs.writeSync(names, node.left.expression.expression.name + '.' +  node.left.expression.property + '.'  +  node.left.property  + '\n');
                   printStackToFile(names, getParentTypes(node));
               }
               else if(node.left.expression instanceof UglifyJS.AST_Sub)
               {
                   fs.writeSync(out, "name: " + node.left.expression.expression.name + '.' +  node.left.expression.property + '.'  +  node.left.property.value + " : line:" + functionNode.start.line + " col: " + functionNode.start.col + "\n");
                   fs.writeSync(names, node.left.expression.expression.name + '.' +  node.left.expression.property + '.'  +  node.left.property.value  + '\n');
                   printStackToFile(names, getParentTypes(node));
               }
                else
                    console.log('!! : ' + node.left.expression.TYPE);
            }

            else if(node.left instanceof UglifyJS.AST_Sub)
            {
                if(node.left.expression instanceof UglifyJS.AST_SymbolRef)
                {
                    fs.writeSync(out, "name: " + node.left.expression.name + '.'  +  node.left.property + " : line:" + functionNode.start.line + " col: " + functionNode.start.col + "\n");
                    fs.writeSync(names, node.left.expression.name + '.'  +  node.left.property  + '\n');
                    printStackToFile(names, getParentTypes(node));
                }
                else if(node.left.expression instanceof UglifyJS.AST_Dot)
                {
                    fs.writeSync(out, "name: " + node.left.expression.expression.name + '.' +  node.left.expression.property + '.'  +  node.left.property.value + " : line:" + functionNode.start.line + " col: " + functionNode.start.col + "\n");
                    fs.writeSync(names, node.left.expression.expression.name + '.' +  node.left.expression.property + '.'  +  node.left.property.value + '\n');
                    printStackToFile(names, getParentTypes(node));
                }
                else if(node.left.expression instanceof UglifyJS.AST_Sub)
                {
                   fs.writeSync(out, "name: " + node.left.expression.expression.name + '.' +  node.left.expression.property + '.'  +  node.left.property.value + " : line:" + functionNode.start.line + " col: " + functionNode.start.col + "\n");
                   fs.writeSync(names, node.left.expression.expression.name + '.' +  node.left.expression.property + '.'  +  node.left.property.value  + '\n');
                   printStackToFile(names, getParentTypes(node));
                }
                else
                    console.log('++ : ' + node.left.expression.TYPE);
            }
            else if(node.left instanceof UglifyJS.AST_SymbolRef)
            {
                fs.writeSync(out, "name: "+ node.left.name + " : line: " + functionNode.start.line + " col: " + functionNode.start.col + "\n");
                fs.writeSync(names, node.left.name  + '\n');
                printStackToFile(names, getParentTypes(node));
            }
            else if(node.left instanceof UglifyJS.AST_Assign)
            {
                console.log("true too - handle this");
                //fs.writeSync(out, "name: "+ node.left.name + " : line: " + functionNode.start.line + " col: " + functionNode.start.col + "\n");
            }
            else
            {
                console.log(node.left.TYPE);
            }
        }
    }
    else if(node instanceof UglifyJS.AST_Function)
    {
        var parent = walker.parent().TYPE;
        if(types.indexOf(parent) === -1)
            types.push(parent);
    }

    
};


var walker = new UglifyJS.TreeWalker(walkerFunction);


/*Walk the AST */
toplevel.walk(walker);

types.forEach(function(entry)
    {
        console.log(entry);
    }
);