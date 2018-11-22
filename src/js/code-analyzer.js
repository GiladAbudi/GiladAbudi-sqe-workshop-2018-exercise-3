import * as esprima from 'esprima';
import * as escodegen from 'escodegen';

const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse,{loc:true});
};


let caseBlockStatement = (jsonBody)=>{
    let arr =[];
    for (let i = 0; i < jsonBody.body.length; i++) {
        arr=arr.concat(parseJson(jsonBody.body[i]));
    }
    return arr;
};


let caseFunctionDeclaration = (x)=>{
    let arr=[];
    arr.push( {name: x.id.name , line: x.id.loc.start.line ,type:x.type ,value:'' ,condition:'' });
    arr = arr.concat( getParams(x.params));
    arr = arr.concat( parseJson(x.body));
    return arr;
};

let getParams = (p)=>
{
    let arr = [];
    for (let i = 0; i < p.length; i++){
        arr.push( {name: p[i].name , line: p[i].loc.start.line ,type:'VariableDeclaration' ,value:'' ,condition:'' });
    }
    return arr;
};

let caseVariableDeclaration = (x)=>{
    let arr = [] ;
    let declaration = x.declarations;
    for (let i = 0; i < declaration.length; i++){
        if(declaration[i].init == null)
            arr.push( {name: declaration[i].id.name , line: declaration[i].id.loc.start.line ,type: declaration[i].type ,value: null ,condition:''});
        else
            arr.push( {name: declaration[i].id.name , line: declaration[i].id.loc.start.line ,type: declaration[i].type ,value: escodegen.generate(declaration[i].init) ,condition: '' });
    }
    return arr;
};

let caseExpressionStatement = (x)=>{
    let arr=[];
    arr = arr.concat(parseJson(x.expression));
    return arr;
};

let caseUpdateExpression= (x)=>{
    let arr=[];
    let valueRight =escodegen.generate(x);
    arr.push({name: x.argument.name , line: x.loc.start.line ,type: x.type ,value:valueRight ,condition:''});
    return arr;

};

let caseWhileStatement = (x)=>{
    let arr = [];
    let cond = escodegen.generate(x.test);
    arr.push( {name: '' , line: x.loc.start.line ,type: x.type ,value:'' ,condition:cond });
    arr = arr.concat(parseJson(x.body));
    return arr;
};

let caseIfStatement = (x)=>{
    let arr = [];
    let cond = escodegen.generate(x.test);
    arr.push( {name: '' , line: x.loc.start.line ,type: x.type ,value:'' ,condition:cond });
    arr = arr.concat(checkElseIfCase(x));
    return arr;
};

let caseElseIf = (x)=>{
    let arr = [];
    let cond = escodegen.generate(x.test);
    arr.push( {name: '' , line: x.loc.start.line ,type: 'elseIfStatement' ,value:'' ,condition:cond });
    arr = arr.concat(checkElseIfCase(x));
    return arr;
};

let checkElseIfCase =(x)=>{
    let arr=[];
    arr = arr.concat(parseJson(x.consequent));
    if(x.alternate.type==='IfStatement')
        arr = arr.concat(caseElseIf(x.alternate));
    else arr = arr.concat(parseJson(x.alternate));
    return arr;
};

let caseForStatement = (x)=>{
    let arr = [];
    let cond = escodegen.generate(x.test);
    arr.push( {name: '' , line: x.loc.start.line ,type: x.type ,value:'' ,condition:cond });
    arr = arr.concat(parseJson(x.init));
    arr = arr.concat(parseJson(x.update));
    arr = arr.concat(parseJson(x.body));
    return arr;
};

let caseReturnStatement = (x)=>{
    let arr = [];
    let val = escodegen.generate(x.argument);
    arr.push({name: '' , line: x.loc.start.line ,type: x.type ,value:val ,condition:'' });
    return arr;
};

let caseAssignmentExpression =(x)=>{
    let arr=[];
    let valueRight = escodegen.generate(x.right);
    arr.push( {name: x.left.name , line: x.loc.start.line ,type: x.type ,value:valueRight ,condition:'' });
    return arr;
};


let caseProgram = (x)=>{
    return parseJson(x.body[0]);
};


let ParseFunction = {
    FunctionDeclaration:caseFunctionDeclaration,
    VariableDeclaration:caseVariableDeclaration,
    ExpressionStatement:caseExpressionStatement,
    WhileStatement:caseWhileStatement,
    IfStatement:caseIfStatement,
    BlockStatement:caseBlockStatement,
    ReturnStatement:caseReturnStatement,
    ForStatement:caseForStatement,
    Program:caseProgram,
    AssignmentExpression:caseAssignmentExpression,
    UpdateExpression:caseUpdateExpression
};

let parseJson =(data)=>{return ParseFunction[(data.type)](data);};



export {parseCode,parseJson,caseBlockStatement,caseFunctionDeclaration,caseWhileStatement,caseIfStatement,caseForStatement,caseAssignmentExpression,caseReturnStatement};