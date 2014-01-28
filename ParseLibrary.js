/**** Top Level Code Starts ****/

/* Input CLI arguments*/
var inputFile;
var libName;
var methodCollection = {};

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
//var outAST = fs.openSync('uglify/' + libName + '-AST.js', 'w');
//fs.writeSync(outAST, JSON.stringify(toplevel, null, '\t'));

/*Walk the AST */
toplevel.figure_out_scope();
var walker = new UglifyJS.TreeWalker(primaryWalkerFunction);
toplevel.walk(walker);

//console.log('second pass');

var secondwalker = new UglifyJS.TreeWalker(secondaryWalkerFunction);
toplevel.walk(secondwalker);


/**** Top Level Code Ends ****/

/* A second walk to identify aliases*/
function secondaryWalkerFunction(node)
{
    if(node instanceof UglifyJS.AST_Assign)
    {
        if(node.right instanceof UglifyJS.AST_Dot || node.right instanceof UglifyJS.AST_Sub)
        {
            var name = visitDotSubExp(node.right, '');
            
            if(methodCollection.hasOwnProperty(name))
            {
                if(node.left instanceof UglifyJS.AST_Dot || node.left.expression instanceof UglifyJS.AST_Sub)
                {
                    var nameret = visitDotSubExp(node.left, '');
                    //console.log(removeProto(nameret));
                    methodCollection[removeProto(nameret)] = true;
                }

                else if(node.left instanceof UglifyJS.AST_SymbolRef)
                {
                    //console.log(removeProto(node.left.name));
                    methodCollection[removeProto(node.left.name)] = true;
                }
                addMethodsFromAssignmentChain(secondwalker.stack);
            }
        }
        if(node.right instanceof UglifyJS.AST_SymbolRef)
        {
            var name = node.right.name;
            //console.log('** ' + name);
            if(methodCollection.hasOwnProperty(name))
            {
                if(node.left instanceof UglifyJS.AST_Dot || node.left.expression instanceof UglifyJS.AST_Sub)
                {
                    //console.log(node.start.line);
                    var nameret = visitDotSubExp(node.left, '');
                    //console.log(removeProto(nameret));
                    if(nameret !== undefined && nameret !== null && nameret.indexOf('undefined') === -1)
                        methodCollection[removeProto(nameret)] = true;
                }

                else if(node.left instanceof UglifyJS.AST_SymbolRef)
                {
                    //console.log(removeProto(node.left.name));
                    methodCollection[removeProto(node.left.name)] = true;
                }
                addMethodsFromAssignmentChain(secondwalker.stack);
            }
        }
    }
    if(node instanceof UglifyJS.AST_VarDef)
    {
        if(node.value instanceof UglifyJS.AST_Dot || node.value instanceof UglifyJS.AST_Sub)
        {
            var name = visitDotSubExp(node.value, '');
            
            if(methodCollection.hasOwnProperty(name))
            {
                methodCollection[removeProto(node.name.name)] = true;
            }
        }
        if(node.value instanceof UglifyJS.AST_SymbolRef)
        {
            var name = node.value.name;
            if(methodCollection.hasOwnProperty(name))
            {
                methodCollection[removeProto(node.name.name)] = true;
            }
        }
    }
}

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
    });
    return parentTypes;
};

function printStackToFile(fname, stack) 
{
    for(var i = 0; i<stack.length; i++)
    {
        fs.writeSync(fname, '-- ' + stack[i] + '\n');
    }
};



function visitDotSubExp(node, name) 
{
    if(node.expression instanceof UglifyJS.AST_SymbolRef)
    {
        if(name !== '')
        {
            if(node.hasOwnProperty('property') && node.property.hasOwnProperty('name'))
                name =  node.expression.name + '.'  +  node.property.name + '.' + name;
            else if(node.hasOwnProperty('property'))
                name =  node.expression.name + '.'  +  node.property + '.' + name;
        }
        else
        {

            if(node.hasOwnProperty('property') && node.property.hasOwnProperty('name'))
                name =  node.expression.name + '.'  +  node.property.name;
            else if(node.hasOwnProperty('property'))
                name =  node.expression.name + '.'  +  node.property;
        }
        return name;
    }
    else if(node.expression instanceof UglifyJS.AST_Dot)
    {
        if(name !== '')
        {
            if(node.hasOwnProperty('property') && node.property.hasOwnProperty('name'))
                name = visitDotSubExp(node.expression, node.property.name + '.' + name);
            else if (node.hasOwnProperty('property'))
                name = visitDotSubExp(node.expression, node.property + '.' + name);
        }
        else
        {
            if(node.hasOwnProperty('property') && node.property.hasOwnProperty('name'))
                name = visitDotSubExp(node.expression, node.property.name);
            else if(node.hasOwnProperty('property'))
                name = visitDotSubExp(node.expression, node.property);
        }
        return name;
    }
    else if(node.expression instanceof UglifyJS.AST_Sub)
    {
        if(name !== '')
        {
            if(node.hasOwnProperty('property') && node.property.hasOwnProperty('name'))
                name = visitDotSubExp(node.expression, node.property.name + '.' + name);
            else if(node.hasOwnProperty('property'))
                name = visitDotSubExp(node.expression, node.property + '.' + name);
        }
        else
        {
            if(node.hasOwnProperty('property') && node.property.hasOwnProperty('name'))
                name = visitDotSubExp(node.expression, node.property.name);
            else if(node.hasOwnProperty('property'))
                name = visitDotSubExp(node.expression, node.property);
        }
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


function addMethodsFromAssignmentChain(stack)
{
    for(var i = stack.length-2; i>=0; i--)
    {
        //console.log(stack[i].TYPE);
        if(stack[i] instanceof UglifyJS.AST_Assign)
        {
            if(stack[i].left instanceof UglifyJS.AST_SymbolRef)
            {
                methodCollection[removeProto(stack[i].left.name)] = true;
            }
            else
            {
                var method = visitDotSubExp(stack[i].left, '');
                methodCollection[removeProto(method)] = true;
            }
        }
        else
            break;
    }
}

function primaryWalkerFunction(node) 
{

    /*Check for AST_Defun ( function foo(){} ) style function definitions */
    if (node instanceof UglifyJS.AST_Defun) 
    {
        methodCollection[removeProto(node.name.name)] = true;
        //fs.writeSync(names,  removeProto(node.name.name) + '\n');
        //printStackToFile(names, getParentTypes(node));
    }


    /*Check for AST_ObjectKeyVal having a function as a key ( obj : function {}; ) style function definitions */
    else if (node instanceof UglifyJS.AST_ObjectKeyVal) 
    {
        if(node.value instanceof UglifyJS.AST_Function)
        {
            methodCollection[removeProto(node.key)] = true;
            //fs.writeSync(names,  removeProto(node.key) + '\n' );
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
                methodCollection[removeProto(nameret)] = true;
                //fs.writeSync(names, removeProto(nameret)  + '\n');
                //printStackToFile(names, getParentTypes(node));
            }

            else if(node.left instanceof UglifyJS.AST_SymbolRef)
            {
                methodCollection[removeProto(node.left.name)] = true;
                //fs.writeSync(names, removeProto(node.left.name)  + '\n');
                //printStackToFile(names, getParentTypes(node));
            }

            else
            {
                // -- console.log(node.left.TYPE);
            }

            addMethodsFromAssignmentChain(walker.stack);
            
        }
    }

    else if(node instanceof UglifyJS.AST_VarDef)
    {
        if(node.value instanceof UglifyJS.AST_Function)
        {
            //console.log(node.name.name);
            methodCollection[removeProto(node.name.name)] = true;
        }
    }


    /*Handle the jquery.each() being used to create methods dynamically*/
    else if(node instanceof UglifyJS.AST_Call)
    {
        var functionName = '';
        if(node.expression.name !== undefined)
            functionName = node.expression.name;
        else
            functionName = visitDotSubExp(node.expression, '');
        
        if(functionName !== null && functionName !== undefined)
        {
            /* Fetch all library functions being utilised locally which we might not have determined */
            if(functionName.indexOf('undefined') === -1 && functionName.toLowerCase().indexOf(libName + '.') !== -1)
            {
                methodCollection[removeProto(functionName)] = true;
                //fs.writeSync(names,  removeProto(functionName) + '\n');
                //printStackToFile(names, getParentTypes(node));
            }

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
};


function getDynamicMethods (valuesNode, callbackNode, arg0)
{
    var flag = 0;

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
        var splitArr = jqueryFnMethod.split('.');
        var item = splitArr[splitArr.length-1];
        if(valuesNode instanceof Array)
        {
            if(item === callbackArg2)
            {
                for(var j = 0; j< valuesNode.length; j++)
                {
                    var temp = jqueryFnMethod.split('.');
                    temp.splice(-1, 1);
                    temp = temp.join('.');
                    temp = temp + '.' +  valuesNode[j];
                    //fs.writeSync(names,  removeProto(temp) + '\n');
                    methodCollection[removeProto(temp)] = true;
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
                    //fs.writeSync(names,  removeProto(temp) + '\n');
                    methodCollection[removeProto(temp)] = true;
                }
                else if(item === callbackArg1)
                {
                    var temp = jqueryFnMethod.split('.');
                    temp.splice(-1, 1);
                    temp = temp.join('.');
                    temp = temp + '.' +  key;
                    //fs.writeSync(names,  removeProto(temp) + '\n');
                    methodCollection[removeProto(temp)] = true;
                }
            }

        }
    }
    else
    {
        //console.log('flag not set');
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

function removeProto(name)
{
    var ret = '';
    var array = name.split('.');
    for(var i = 0; i< array.length; i++)
    {
        var item = array[i];
        if(item !== 'fn' && item !== 'prototype')
            ret = ret + '.' + item;
    }
    ret = ret.substring(1);
    return ret;
}



for(var key in methodCollection)
{
    fs.writeSync(names,  key + '\n');
    //console.log('++ ' + key);
}