import * as esprima from 'esprima';
import * as escodegen from 'escodegen';


var hashmapArgs ;
var hashmap = new Map();
var hashmapScope = new Map();
var newjsonobj;
var flag =true;
var lineNumToDelete=new Set();
var redLineNumber=new Set();
var greenLineNumber=new Set();
var insidescope = false;
var redscope=false;
var lineNumOutScope=new Set();

let parserSub=(left,right)=>{
    var expr =makesub(right);
    if(insidescope)
        hashmapScope.set(left,expr);
    else
        hashmap.set(left,expr);
};

let makesub =(x)=>{
    var subright =x.toString();
    if(insidescope)
        for (var [key, value] of hashmapScope)
            subright =replacesub(subright,key, value);
    else
        for (var [key1, value1] of hashmap)
            subright =replacesub(subright,key1, value1);
    return subright;
};

let replacesub=(right,key,val)=>{
    right= right.replace(/\s/g,'');
    do {
        right = right.replace('(*' + key, '*(' + val.toString() + ')').replace(key.toString() + '*', '(' + val.toString() + ') *');
    }while(right.includes('(*'+key) || right.includes(key.toString()+'*'));
    right=replacesub2(right,key,val);
    do {
        right = right.replace(key, val.toString());
    }while(right.includes(key));
    return right;
};

let replacesub2=(right,key,val)=>{
    do {
        right = right.replace('/' + key, '/(' + val.toString() + ')').replace(key.toString() + '/', '(' + val.toString() + ') /');
    }while(right.includes('/'+key) || (right.includes(key.toString()+'/') ));
    do{
        right=right.replace('^'+key,'^('+val.toString()+')').replace(key.toString()+'^','('+val.toString()+') ^');
    }while(right.includes('^'+key) || right.includes(key.toString()+'^'));
    return right;

};


let evalTest=(test)=>{
    let subtest=test.toString();
    for (var key in hashmapArgs) {
        if(Array.isArray(hashmapArgs[key]))
            subtest=subtest.replace(key.toString(),'['+hashmapArgs[key]+']');
        else
            while(subtest.includes(key.toString()))
                subtest=subtest.replace(key.toString(),hashmapArgs[key]).replace(key.toString(),hashmapArgs[key]).replace(key.toString(),hashmapArgs[key]);
    }
    return eval(subtest);
    // return test.evaluate(hashmapArgs);
};

const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse,{loc:true});
};

let stringToJson=(x)=>{
    return parseCode(x).body[0];
};

let caseBlockStatement = (jsonBody)=>{
    let arr =[];
    for (let i = 0; i < jsonBody.body.length; i++) {
        arr=arr.concat(parseJson(jsonBody.body[i]));
    }
    return arr;
};


let caseFunctionDeclaration = (x)=>{
    //  getParams(x.params);
    parseJson(x.body);
};

/*let getParams = (p)=>
{
    for (let i = 0; i < p.length; i++){
        //   arr.push( {name: p[i].name , line: p[i].loc.start.line ,type:'VariableDeclaration' ,value:'' ,condition:'' });
    //    hashmapArgs[p[i].name]=null;
    }

};*/

let caseVariableDeclaration = (x)=>{

    let declaration = x.declarations;
    for (let i = 0; i < declaration.length; i++){
        if(declaration[i].init == null){
            hashmap.set(declaration[i].id.name,0);
            // arr.push( {name: declaration[i].id.name , line: declaration[i].id.loc.start.line ,type: declaration[i].type ,value: hashmap.get(declaration[i].id.name) ,condition:''});
        }
        else{
            parserSub(declaration[i].id.name,escodegen.generate(declaration[i].init));
            x.declarations[i].init=stringToJson(hashmap.get(declaration[i].id.name));
            // arr.push( {name: declaration[i].id.name , line: declaration[i].id.loc.start.line ,type: declaration[i].type ,value: hashmap.get(declaration[i].id.name) ,condition: '' });
        }
        lineNumToDelete.add(declaration[i].id.loc.start.line);
    }
};

let caseExpressionStatement = (x)=>{
    parseJson(x.expression);
};

/*let caseUpdateExpression= (x)=>{
    let arr=[];
    let valueRight =escodegen.generate(x);
    arr.push({name: x.argument.name , line: x.loc.start.line ,type: x.type ,value:valueRight ,condition:''});
    return arr;
};*/

let caseWhileStatement = (x)=>{
    let cond = escodegen.generate(x.test);
    let cond1 = cond;
    for (var [key, value] of hashmap) {
        cond1 =replacesub(cond1,key, value);
    }
    /*
    for (var [key1, value1] of hashmap)
        subright =replacesub(subright,key1, value1);*/
    x.test=stringToJson(cond1.toString());
    // arr.push( {name: '' , line: x.loc.start.line ,type: x.type ,value:'' ,condition:cond1 });
    parseJson(x.body);
};

let caseIfStatement = (x)=>{
    let cond = escodegen.generate(x.test);
    let cond1 = makesub(cond);
    if(evalTest(cond1) && ((insidescope||flag) && !redscope)) {
        flag=false;
        greenLineNumber.add(x.loc.start.line);
        redscope = false;
    } else {
        redLineNumber.add(x.loc.start.line);
        redscope=true;
    }
    x.test=stringToJson(cond1.toString());
    //arr.push( {name: '' , line: x.loc.start.line ,type: x.type ,value:'' ,condition:cond1 });
    checkElseIfCase(x);
};

let caseElseIf = (x)=> {
    let cond = escodegen.generate(x.test);
    let cond1 = makesub(cond);
    if ( redscope || (!evalTest(cond1) || (insidescope && !flag) ) ){
        redLineNumber.add(x.loc.start.line);
        redscope = true;
    }else{
        greenLineNumber.add(x.loc.start.line) ;
        redscope = false;
        flag=false;
    }
    x.test=stringToJson(cond1);
    //arr.push( {name: '' , line: x.loc.start.line ,type: 'elseIfStatement' ,value:'' ,condition:cond1 });
    checkElseIfCase(x);

};

let checkElseIfCase =(x)=>{
    updateMap();
    if(!insidescope) hashmapScope=new Map(hashmap);
    insidescope=true;
    parseJson(x.consequent);
    setupInsideScope();
    if(x.alternate==null){
        setupInsideScope();
    }else if(x.alternate.type==='IfStatement'){
        redscope=false;
        insidescope=true;
        caseElseIf(x.alternate);
        hashmapScope=new Map(hashmap);
    }else {
        insidescope=true;
        parseJson(x.alternate);
        setupInsideScope();
    }
    redscope=false;
};

let updateMap=()=>{
    for (var [key, value] of hashmap)
        if(!hashmapScope.has(key))
            hashmapScope.set(key,value);
};

let setupInsideScope=()=>{
    insidescope=false;
    hashmapScope=new Map(hashmap);
};

/*let caseForStatement = (x)=>{
    let arr = [];
    let cond = escodegen.generate(x.test);
    arr.push( {name: '' , line: x.loc.start.line ,type: x.type ,value:'' ,condition:cond });
    arr = arr.concat(parseJson(x.init));
    arr = arr.concat(parseJson(x.update));
    arr = arr.concat(parseJson(x.body));
    return arr;
};*/

let caseReturnStatement = (x)=>{
    let val = escodegen.generate(x.argument);
    let val1 = makesub(val.toString());
    /*parser.Parser.parse(val);
    for (var [key, value] of hashmap) {
        val1 =val1.substitute(key, value);
    }
    val1=val1.toString().substring(1,val1.toString().length-1);*/
    x.argument=stringToJson(val1);
    // arr.push({name: '' , line: x.loc.start.line ,type: x.type ,value:val1 ,condition:'' });
};

let caseAssignmentExpression =(x)=>{
    let valueRight = escodegen.generate(x.right);
    let name = escodegen.generate(x.left);
    if(hashmap.has(name)){
        parserSub(name,valueRight);
        x.right=stringToJson(hashmap.get(name));
        lineNumToDelete.add(x.loc.start.line);
    }else {
        if(checkIfArray(name))
            hashmapArgs[getNameofArray(name).toString()][getNumberInArray(name)]=valueRight;
        else {
            x.right = stringToJson(makesub(valueRight).toString());
            hashmapArgs[name]=valueRight;
        }
    }
    // arr.push( {name: name , line: x.loc.start.line ,type: x.type ,value:hashmap.get(name) ,condition:'' });
};

let checkIfArray=(x)=>{
    return x.toString().includes('[');
};

let getNameofArray=(x)=>{
    let arr=x.split('[');
    return arr[0];
};

let getNumberInArray=(x)=>{
    let arr=x.split('[');
    let arr2=arr[1].split(']');
    return arr2[0];
};


let caseProgram = (x)=>{
    let arr=[];
    let funcindex =0;
    for (let i=0 ; i<x.body.length ; i++)
        if(x.body[i].type==='FunctionDeclaration')
            funcindex=i;
        else {
            arr = arr.concat(parseJson(x.body[i]));
            lineNumOutScope.add(x.body[i].declarations[0].id.loc.start.line);
        }
    arr= arr.concat(parseJson(x.body[funcindex]));
    return arr;
};



let ParseFunction = {
    FunctionDeclaration:caseFunctionDeclaration,
    VariableDeclaration:caseVariableDeclaration,
    ExpressionStatement:caseExpressionStatement,
    WhileStatement:caseWhileStatement,
    IfStatement:caseIfStatement,
    BlockStatement:caseBlockStatement,
    ReturnStatement:caseReturnStatement,
    //   ForStatement:caseForStatement,
    Program:caseProgram,
    AssignmentExpression:caseAssignmentExpression
    // UpdateExpression:caseUpdateExpression
};

let parseJson1 =(parsedCode,vectorInput)=>{
    setupVar();
    newjsonobj=new Object(parsedCode);
    inputToMap(vectorInput);
    parseJson(newjsonobj);
    return newjsonobj;
};



let setupVar=()=>{
    hashmapArgs=null ;
    hashmap = new Map();
    hashmapScope = new Map();
    newjsonobj=null;
    flag =true;
    lineNumToDelete=new Set();
    redLineNumber=new Set();
    greenLineNumber=new Set();
    insidescope = false;
};

let inputToMap=(input)=>{
    hashmapArgs = JSON.parse(input.toString());
    return hashmapArgs;
};

let parseJson =(data)=>{return ParseFunction[(data.type)](data);};

let outputString =(str)=>{
    let arr=str.split('\n');
    let newstr='';
    lineNumOutScope.forEach((value => {lineNumToDelete.delete(value);}));
    for(let i =0;i<arr.length ; i++)
        if(!lineNumToDelete.has(i+1))
            if( greenLineNumber.has(i+1))
                newstr+= '<p><pre><mark class="green" id="green"> '+arr[i]+' </mark></pre></p>  '+'\n';
            else if (redLineNumber.has(1+i))
                newstr+=' <p><pre><mark class="red" id="red"> '+ arr[i]+' </mark></pre></p> '+'\n';
            else
                newstr+= '<p><pre>' + arr[i]+'</pre></p>'+'\n';
    return newstr;
};

export {parseJson1,checkIfArray,getNumberInArray,getNameofArray,inputToMap,evalTest,outputString,parseCode,parseJson,caseBlockStatement,caseFunctionDeclaration,caseWhileStatement,caseIfStatement,caseAssignmentExpression,caseReturnStatement};