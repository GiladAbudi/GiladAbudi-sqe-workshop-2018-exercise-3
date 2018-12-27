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
var lineNumPass = new Set();
var upperString='';
var lowerString='';
let allDec='';
let assAll=false;

var nodeNum=1;
var genAssignment=0;
let signAssignment= 'a'+genAssignment.toString();
var genCond=0;
let signCond= 'c'+genCond.toString();
var genMerge =0;
let signMerge='m'+genMerge.toString();

let updateSign =()=>{
    signMerge='m'+genMerge.toString();
    signCond= 'c'+genCond.toString();
    signAssignment= 'a'+genAssignment.toString();
};

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
    return esprima.parseScript(codeToParse,{loc:true,range:true});
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
    assAll=true;
    let declaration = x.declarations;
    for (let i = 0; i < declaration.length; i++) {
        allDec+=escodegen.generate(declaration[i])+'\n';
        if (!redscope){
            lineNumPass.add(declaration[i].id.loc.start.line);
        }else{
            // upperString+=signAssignment+'=>operation: $'+escodegen.generate(x)+'$\n';
            // lowerString+='->'+signAssignment;
        }
        if(declaration[i].init == null){
            hashmap.set(declaration[i].id.name,0);
        }else{
            parserSub(declaration[i].id.name,escodegen.generate(declaration[i].init));
        }
        lineNumToDelete.add(declaration[i].id.loc.start.line);
    }
};

let updateAssigment=()=>{
    updateSign();
    if(!redscope)
        upperString+=signAssignment+'=>operation: ('+nodeNum.toString()+')\n' +allDec +' |approved \n';
    else
        upperString+=signAssignment+'=>operation: ('+nodeNum.toString()+')\n'+allDec +' \n';
    nodeNum++;
    lowerString+='->'+signAssignment;
    allDec='';
    genAssignment++;
    assAll=false;
};

let caseExpressionStatement = (x)=>{
    assAll=true;
    parseJson(x.expression);
};

let caseUpdateExpression= (x)=>{
    assAll=true;
    updateSign();
    allDec+=escodegen.generate(x)+'\n';
/*
    arr.push({name: x.argument.name , line: x.loc.start.line ,type: x.type ,value:valueRight ,condition:''});
*/
};

let caseWhileStatement = (x)=>{
    updateSign();
    let cond = escodegen.generate(x.test);
    lineNumPass.add(x.loc.start.line);
    let cond1 = cond;
    for (var [key, value] of hashmap) {
        cond1 =replacesub(cond1,key, value);
    }
    upperString+=signMerge+'=>start: '+'('+nodeNum.toString()+')\n '+'|past\n';
    nodeNum++;
    upperString+=signCond+'=>condition: '+'('+nodeNum.toString()+')\n'+' '+cond+' |past\n';
    nodeNum++;
    lowerString+='->'+signMerge+'->'+signCond;
    lowerString+='\n'+signCond+'(yes)';
    parseJson(x.body);
    checkIfNeedupdateAssigment();
    lowerString += '->' + signMerge+' \n'+signCond+'(no)';
    genMerge++;
    genCond++;
};

let caseIfStatement = (x)=>{
    updateSign();
    let cond = escodegen.generate(x.test);
    if(evalTest(makesub(cond)) && ((insidescope||flag) && !redscope)) {
        upperString+=signCond+'=>condition: ('+nodeNum.toString()+')\n'+cond+'|past \n'; //maybe green
        flag=false;redscope = false;
        greenLineNumber.add(x.loc.start.line);
    } else {
        upperString+=signCond+'=>condition: ('+nodeNum.toString()+')\n'+cond+'|past\n';
        redLineNumber.add(x.loc.start.line);
        redscope=true;
    }
    lowerString+='->'+signCond;
    nodeNum++;
    checkElseIfCase(x);
    joinToMergePoint();
    genCond++;
};



let caseElseIf = (x)=> {
    updateSign();
    let cond = escodegen.generate(x.test);
    let cond1 = makesub(cond);
    makeSignFromIf(cond);
    if ( redscope || (!evalTest(cond1) || (insidescope && !flag) ) ){
        redLineNumber.add(x.loc.start.line);
        redscope = true;
    }else{
        greenLineNumber.add(x.loc.start.line) ;
        redscope = false;
        flag=false;
    }
    nodeNum++;
    lowerString+='->'+signCond;
    checkElseIfCase(x);
    genCond++;
};

let makeSignFromIf=(cond)=>{
    if(!redscope&flag)
        upperString+=signCond+'=>condition: ('+nodeNum.toString()+')\n'+cond+' |past\n';
    else
        upperString+=signCond+'=>condition: ('+nodeNum.toString()+')\n'+cond+'\n';
};

let checkElseIfCase =(x)=>{
    extendCheckElseIfCase(x);
    lowerString+='\n'+signCond+'(no)';
    if(x.alternate==null){
        setupInsideScope();
    }else if(x.alternate.type==='IfStatement'){
        redscope=false; insidescope=true;
        genCond++;
        caseElseIf(x.alternate);
        hashmapScope=new Map(hashmap);
    }else {
        //  if(!redscope )
        redscope=!redscope;
        insidescope=true;
        parseJson(x.alternate); setupInsideScope();
        checkIfNeedupdateAssigment();
    }
    redscope=false;
};

let extendCheckElseIfCase=(x)=>{
    updateSign();
    updateMap();
    if(!insidescope) hashmapScope=new Map(hashmap);
    insidescope=true;
    lowerString+='\n'+signCond+'(yes)';
    parseJson(x.consequent);
    checkIfNeedupdateAssigment();
    setupInsideScope();
};

let checkIfNeedupdateAssigment=()=>{
    if(assAll)
        updateAssigment();
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
    lineNumPass.add(x.loc.start.line);
    upperString+='r=>operation: ('+nodeNum.toString()+')\n'+escodegen.generate(x).toString().replace(';','')+' |approved \n';
    lowerString+='->'+'r';
    nodeNum++;

    /*let val = escodegen.generate(x.argument);
    let val1 = makesub(val.toString());
    parser.Parser.parse(val);
    for (var [key, value] of hashmap) {
        val1 =val1.substitute(key, value);
    }
    val1=val1.toString().substring(1,val1.toString().length-1);
    x.argument=stringToJson(val1);
    arr.push({name: '' , line: x.loc.start.line ,type: x.type ,value:val1 ,condition:'' });*/
};

let caseAssignmentExpression =(x)=>{
    assAll=true;
    updateSign();
    let valueRight = escodegen.generate(x.right);
    let name = escodegen.generate(x.left);
    allDec+=escodegen.generate(x)+'\n';
    if(hashmap.has(name)){
        parserSub(name,valueRight);
        //x.right=stringToJson(hashmap.get(name));
        lineNumToDelete.add(x.loc.start.line);
    }else {
        if(checkIfArray(name)) {
            hashmapArgs[getNameofArray(name).toString()][getNumberInArray(name)] = valueRight;
        }else {
            hashmapArgs[name]=valueRight;
        }
    }
    //genAssignment++;
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
    upperString+='st=>start: Start \n';
    lowerString+='st';
    for (let i=0 ; i<x.body.length ; i++)
        parseJson(x.body[i]);
};

/*let caseProgram1 = (x)=>{
    let arr=[];
    let funcindex =0;
    upperString+='st=>start: Start \n';
    lowerString+='st';
    for (let i=0 ; i<x.body.length ; i++)
        if(x.body[i].type==='FunctionDeclaration') {
            funcindex = i;
        }else {
            arr = arr.concat(parseJson(x.body[i]));
            lineNumOutScope.add(x.body[i].declarations[0].id.loc.start.line);
            lineNumPass.add(x.body[i].declarations[0].id.loc.start.line);
        }

    arr= arr.concat(parseJson(x.body[funcindex]));
    return arr;
};*/



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
    AssignmentExpression:caseAssignmentExpression,
    UpdateExpression:caseUpdateExpression
};

let parseJson1 =(parsedCode,vectorInput)=>{
    setupVar();
    newjsonobj=new Object(parsedCode);
    inputToMap(vectorInput);
    parseJson(newjsonobj);
    let fullString= upperString +'\n'+ lowerString;
    return fullString;
};



let setupVar=()=>{
    lineNumPass=new Set();
    hashmapArgs=null ;
    hashmap = new Map();
    hashmapScope = new Map();
    newjsonobj=null;
    flag =true;
    lineNumToDelete=new Set();
    redLineNumber=new Set();
    greenLineNumber=new Set();
    insidescope = false;
    upperString='';
    lowerString='';
    genMerge =0;
    genCond=0;
    genAssignment=0;
    nodeNum=1;
    assAll=false;
};

let joinToMergePoint=()=>{
    let arr = lowerString.split('\n');
    let flag=true;
    for (let i = arr.length-1; (i <arr.length) && flag; i--) {
        if(arr[i].toString().charAt(0)=='c')
            arr[i]=arr[i].toString()+'->'+signMerge;
        else flag=false;
    }
    upperString+=signMerge+'=>start: '+'('+nodeNum.toString()+')'+' |approved \n';
    genMerge++;
    nodeNum++;
    lowerString=arr.join('\n');
};

let inputToMap=(input)=>{
    hashmapArgs = JSON.parse(input.toString());
    return hashmapArgs;
};

let parseJson =(data)=>{
    if(checkTypeAssignment(data) && data.type!=='UpdateExpression'&& assAll)
        updateAssigment();
    return ParseFunction[(data.type)](data);
};

let checkTypeAssignment=(data)=>{
    return (data.type!=='VariableDeclaration' && data.type!=='ExpressionStatement' && data.type!=='AssignmentExpression');
};

/*let outputString =(str)=>{
    let arr=str.split('\n');
    let newstr='';
    lineNumOutScope.forEach((value => {lineNumToDelete.delete(value);}));
    for(let i =0;i<arr.length ; i++)
        /!*if(!lineNumToDelete.has(i+1))*!/
        if( greenLineNumber.has(i+1) || lineNumPass.has(i+1))
            newstr+= '<p><pre><mark class="green" id="green"> '+arr[i]+' </mark></pre></p>  '+'\n';
        else if (redLineNumber.has(1+i))
            newstr+=' <p><pre><mark class="red" id="red"> '+ arr[i]+' </mark></pre></p> '+'\n';
        else
            newstr+= '<p><pre>' + arr[i]+'</pre></p>'+'\n';
    return newstr;
};*/

/*
let colorNode=(bbb)=>{
    let c=new Set();
    mapNameColor.forEach((value) =>c.add(value.replace(';','').replace(/\s+/g,'')));
    bbb.applyShapeStyles( shape => shape.getNodePathId()!=-1 , { fillColor: '#ffffff'});
    bbb.applyShapeStyles( shape => shape.getName().toString().includes('function') , { fillColor: '#4aff3c' });
    bbb.applyShapeStyles( shape => shape.getNodeType().includes('Program'), { fillColor: '#4aff3c' });
    bbb.applyShapeStyles( shape => c.has(shape.getName().replace(/\s+/g,'')) , { fillColor: '#4aff3c' });
    return bbb.print();
};
*/


export {parseJson1,checkIfArray,getNumberInArray,getNameofArray,inputToMap,evalTest,parseCode,parseJson,caseBlockStatement,caseFunctionDeclaration,caseWhileStatement,caseIfStatement,caseAssignmentExpression,caseReturnStatement};