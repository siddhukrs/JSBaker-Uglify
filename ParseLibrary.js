/* Input CLI arguments*/
var inputFile;
var libName;
if (process.argv.length < 3)
{
    console.log('Missing file name argument.');
    process.exit(1);
}
else
{
    inputFile = process.argv[2];
    var temp = inputFile.split('/');
    var libNameJS = temp[temp.length-1];
    libName = libNameJS.split('.')[0];
}




/* Requires*/
var UglifyJS = require('uglify-js')
var fs = require('fs');
var util = require('util');


/*Fetch Code*/
var code = fs.readFileSync(inputFile, "utf8");


/*Parser*/
var toplevel = UglifyJS.parse(code);
toplevel.figure_out_scope();

/*Output*/
var out = fs.openSync('uglify/' + libName +'-uglify.js', 'w');
var names = fs.openSync('uglify/' + libName + '-uglify-names.js', 'w');


var types = [];

/*To print the AST to a file: 
var outAST = fs.openSync('uglify/' + libName + '-AST.js', 'w');
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

var printImmediateParentToFile = function(fname, stack) {

};


var visitDotSubExp = function(node, name) {

    console.log('-- ' + node.TYPE + ' --');

    if(node.expression instanceof UglifyJS.AST_SymbolRef)
    {
        if(name !== '')
            name =  node.expression.name + '.'  +  node.property + '.' + name;
        else
            name =  node.expression.name + '.'  +  node.property;
        return name;
    }
    else if(node.expression instanceof UglifyJS.AST_Dot || node.expression instanceof UglifyJS.AST_Sub)
    {
        name = visitDotSubExp(node.expression, node.property);
        return name;
    }
    else
        console.log('!! : ' + node.left.expression.TYPE);
};

var walkerFunction = function(node){

    /*Check for AST_Defun ( function foo(){} ) style function definitions */
    if (node instanceof UglifyJS.AST_Defun) 
    {
             fs.writeSync(out, UglifyJS.string_template("Found AST_Defun {name} at {line},{col}", {
            name: node.name.name,
            line: node.start.line,
            col: node.start.col
        }) + "\n");
             fs.writeSync(names,  node.name.name + '\n');
             printStackToFile(names, getParentTypes(node));
    }


    /*Check for AST_ObjectKeyVal having a function as a key ( obj : function {}; ) style function definitions */
    
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
        }
    }

    /*Check for AST_Assign having a function as the RHS ( x = function {}; ) style function definitions. Handle for multiple LHS */
    else if(node instanceof UglifyJS.AST_Assign)
    {
        if (node.right instanceof UglifyJS.AST_Function) 
        {
            /*Collect Function args and details */
            var functionNode = node.right;
        
            var args = functionNode.argnames;
            var argStrings = [];
            for(var i = 0 ; i< args.length; i++)
            {
                argStrings.push(args[i].name);
            }
            
            
            if(node.left instanceof UglifyJS.AST_Dot || node.left.expression instanceof UglifyJS.AST_Sub)
            {
                var nameret = visitDotSubExp(node.left, '');
                console.log(nameret + " ^^^" + node.left.start.line);
                fs.writeSync(out, "name: " + nameret + " : line:" + functionNode.start.line + " col: " + functionNode.start.col + "\n");
                fs.writeSync(names, nameret + '\n' );
                printStackToFile(names, getParentTypes(node));
            }

            else if(node.left instanceof UglifyJS.AST_SymbolRef)
            {
                fs.writeSync(out, "name: "+ node.left.name + " : line: " + functionNode.start.line + " col: " + functionNode.start.col + "\n");
                fs.writeSync(names, node.left.name  + '\n');
                printStackToFile(names, getParentTypes(node));
            }
            else if(node.left instanceof UglifyJS.AST_Assign)
            {
                console.log("AST_Assign - handle this");
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