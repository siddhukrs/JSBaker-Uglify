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

/*Output*/
var out = fs.openSync('uglify/' + libName +'-uglify.js', 'w');
var names = fs.openSync('uglify/' + libName + '-uglify-names.js', 'w');


var types = [];

/*To print the AST to a file: */
/*var outAST = fs.openSync('uglify/' + libName + '-AST.js', 'w');
fs.writeSync(outAST, JSON.stringify(toplevel, null, '\t'));*/


toplevel.figure_out_scope();


function getParentTypes(node) 
{
    var parents = walker.stack;
    var parentTypes = [];
    parents.forEach( function(value) {
        if(value instanceof UglifyJS.AST_VarDef)
        {
            parentTypes.push(value.TYPE + ' --- ' + value.name.name);
        }
        else if(value instanceof UglifyJS.AST_Call)
        {
                //parentTypes.push(value.TYPE + ' --- ' + value.name.name);
            }
            else
            {
                parentTypes.push(value.TYPE);
            }
        }
        );
    return parentTypes;
};

function printStackToFile(fname, stack) 
{

    for(var i = 0; i<stack.length; i++)
    {
        fs.writeSync(fname, '-- ' + stack[i] + '\n');
    }
};

function printImmediateParentToFile(fname, stack) 
{

};


function visitDotSubExp(node, name) 
{
    // -- console.log('-- ' + node.TYPE + ' --');

    if(node.expression instanceof UglifyJS.AST_SymbolRef)
    {

        if(name !== '')
        {
            if(node.hasOwnProperty('property') && node.property.hasOwnProperty('name'))
                name =  node.expression.name + '.'  +  node.property.name + '.' + name;
            else
                name =  node.expression.name + '.'  +  node.property + '.' + name;
        }
        else
        {

            if(node.hasOwnProperty('property') && node.property.hasOwnProperty('name'))
                name =  node.expression.name + '.'  +  node.property.name;
            else
                name =  node.expression.name + '.'  +  node.property;
        }
        return name;
    }
    else if(node.expression instanceof UglifyJS.AST_Dot)
    {
        if(name !== '')
            name = visitDotSubExp(node.expression, node.property.name + '.' + name);
        else
            name = visitDotSubExp(node.expression, node.property.name);
        return name;
    }
    else if(node.expression instanceof UglifyJS.AST_Sub)
    {
        if(name !== '')
            name = visitDotSubExp(node.expression, node.property.name + '.' + name);
        else
            name = visitDotSubExp(node.expression, node.property.name);
        return name;
    }
    else
    {
        if(node.expression !== undefined)
        {
            //console.log('!! : ' + node.expression.TYPE);
        }
    }
};

function walkerFunction(node) 
{

    /*Check for AST_Defun ( function foo(){} ) style function definitions */
    if (node instanceof UglifyJS.AST_Defun) 
    {
        fs.writeSync(out, UglifyJS.string_template("Found AST_Defun {name} at {line},{col}", {
            name: node.name.name,
            line: node.start.line,
            col: node.start.col
        }) + "\n");
        fs.writeSync(names,  node.name.name + '\n');
             //printStackToFile(names, getParentTypes(node));
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
                 //printStackToFile(names, getParentTypes(node));
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
                // -- console.log(nameret + " ^^^" + node.left.start.line);
                fs.writeSync(out, "name: " + nameret + " : line:" + functionNode.start.line + " col: " + functionNode.start.col + "\n");
                fs.writeSync(names, nameret + '\n' );
                //printStackToFile(names, getParentTypes(node));
            }

            else if(node.left instanceof UglifyJS.AST_SymbolRef)
            {
                fs.writeSync(out, "name: "+ node.left.name + " : line: " + functionNode.start.line + " col: " + functionNode.start.col + "\n");
                fs.writeSync(names, node.left.name  + '\n');
                //printStackToFile(names, getParentTypes(node));
            }
            else if(node.left instanceof UglifyJS.AST_Assign)
            {
                // -- console.log("AST_Assign - handle this");
                //fs.writeSync(out, "name: "+ node.left.name + " : line: " + functionNode.start.line + " col: " + functionNode.start.col + "\n");
            }
            else
            {
                // -- console.log(node.left.TYPE);
            }
        }
    }

    /*Usual Function assignments: function foo(arg1, arg2){}*/
    else if(node instanceof UglifyJS.AST_Function)
    {
        var parent = walker.parent().TYPE;
        if(types.indexOf(parent) === -1)
            types.push(parent);
    }

    /*Handle the jquery.each() being used to create methods dynamically*/
    else if(node instanceof UglifyJS.AST_Call)
    {
        var functionName;
        if(node.expression.name !== undefined)
            functionName = node.expression.name;
        else
            functionName = visitDotSubExp(node.expression, '');
        console.log('------------------------------------------------ '+functionName);
        if(true)
        {

        }

        if(functionName === 'jQuery.each')
        {
            var args = node.args;

            var callbackFunction = args[1];
            if(callbackFunction instanceof UglifyJS.AST_Function)
            {
                var stream = UglifyJS.OutputStream({quote_keys : true});
                var code = args[0].print(stream);
                
                var arg0 = stream.toString();

                var obj;
                try
                {
                    obj = eval(arg0);
                }
                catch(err)
                {
                    if(err.name !== 'SyntaxError' && err.name !== 'ReferenceError')
                    {
                        throw err;
                    }
                }

                if(obj !== null)
                {
                    if(callbackFunction.argnames.length === 2)
                    {
                        getDynamicMethods(obj, callbackFunction, arg0);
                    }
                }              
            }
        }
        
    }

    else if(node instanceof UglifyJS.AST_PropAccess)
    {
        // -- console.log('here!!!!!-------------------------------'+ node.expression);
        // -- console.log()
        var parent = walker.parent().TYPE;
        if(types.indexOf(parent) === -1)
            types.push(parent);
    }

    
};


function getDynamicMethods (valuesNode, callbackNode, arg0)
{
    var flag = 0;
    console.log('***********');

    var callbackArg1, callbackArg2;
    if(flag === 0)
    {
        callbackArg1 = callbackNode.argnames[0].name;
        callbackArg2 = callbackNode.argnames[1].name;
    }


    setFlag = true;
    var fnBodyWalker = new UglifyJS.TreeWalker(lookForJqueryFn);
    callbackNode.walk(fnBodyWalker);
    if(setFlag === false)
    {
        console.log(jqueryFnMethod);
        var splitArr = jqueryFnMethod.split('.');
        var item = splitArr[splitArr.length-1];
        console.log(item);
        if(valuesNode instanceof Array)
        {
            if(item === callbackArg2)
            {
                for(var j = 0; j< valuesNode.length; j++)
                {
                    var temp = jqueryFnMethod.split('.');
                    //console.log(temp);
                    temp.splice(-1, 1);
                    temp = temp.join('.');
                    temp = temp + '.' +  valuesNode[j];
                    console.log(' --> Array value ' + j + ': ' + temp);
                    fs.writeSync(names,  temp + '\n');
                }
            }
        }
        else
        {
            try
            {
                valuesNode = JSON.parse(arg0);
            }
            catch(err)
            {
                if(err.name !== 'SyntaxError')
                    throw err;

            }
            for(var key in valuesNode)
            {
                if(item === callbackArg2)
                {
                    var temp = jqueryFnMethod.split('.');
                    temp.splice(-1, 1);
                    temp = temp.join('.');
                    temp = temp + '.' +  valuesNode[key];
                    console.log(' --> ' + key + ' : ' + temp);
                    fs.writeSync(names,  temp + '\n');
                }
                else if(item === callbackArg1)
                {
                    var temp = jqueryFnMethod.split('.');
                    temp.splice(-1, 1);
                    temp = temp.join('.');
                    temp = temp + '.' +  key;
                    console.log(' --> ' + key + ' : ' + temp);
                    fs.writeSync(names,  temp + '\n');
                }
            }

        }
    }
    else
    {
        console.log('flag not set');
    }
}


var jqueryFnMethod;
var setFlag = false;
function lookForJqueryFn(node)
{
    if(node instanceof UglifyJS.AST_Assign)
    {
        if(node.right instanceof UglifyJS.AST_Function)
        {
            jqueryFnMethod = visitDotSubExp(node.left, '');
            setFlag = !setFlag;
        }
    }
}

var walker = new UglifyJS.TreeWalker(walkerFunction);


/*Walk the AST */
toplevel.walk(walker);

types.forEach(function(entry)
{
       // --  console.log(entry);
   }
   );