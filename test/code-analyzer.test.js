import assert from 'assert';
import {parseCode,parseJson,caseBlockStatement,caseFunctionDeclaration,caseWhileStatement,caseIfStatement,caseForStatement,caseAssignmentExpression,caseReturnStatement} from '../src/js/code-analyzer';


//** variables for the test functions : **

//caseBlockStatement
let json1= parseCode('{ }').body[0];
let arrjson1= [];

//caseFunctionDeclaration
let json2 = parseCode('function binarySearch(x,y){ }').body[0];
let arrjson2 = [{name: 'binarySearch' , line: 1 ,type: 'FunctionDeclaration' ,value:'' ,condition:'' },
    {name: 'x' , line: 1 ,type: 'VariableDeclarator' ,value:'' ,condition:'' },
    {name: 'y' , line: 1 ,type: 'VariableDeclarator' ,value:'' ,condition:'' }];

//caseWhileStatement
let json3 = parseCode('while(x[3]<=N){ }').body[0];
let arrjson3 = [{name: '' , line: 1 ,type: 'WhileStatement' ,value:null ,condition:'x[3]<=N' }];

//caseIfStatement
let json4 = parseCode('function iftest (x){ if( x>5 ) return 1; else if (x<5) return 0; else return 5; }').body[0].body.body[0];
let arrjson4 = [{name: '' , line: 1 ,type: 'IfStatement' ,value:null ,condition:'x>5' },
    {name: '' , line: 1 ,type: 'ReturnStatement' ,value:'1' ,condition:'' },
    {name: '' , line: 1 ,type: 'elseIfStatement' ,value:null ,condition:'x<5' },
    {name: '' , line: 1 ,type: 'ReturnStatement' ,value:'0' ,condition:'' },
    {name: '' , line: 1 ,type: 'ReturnStatement' ,value:'5' ,condition:'' }];

//caseForStatement
let json5 = parseCode('for( let i= 1 ; i<=10 ; ++i){}').body[0];
let arrjson5 = [{name: '' , line: 1 ,type: 'ForStatement' ,value:null ,condition:'i<=10' },
    {name: 'i' , line: 1 ,type: 'AssignmentExpression' ,value:'1' ,condition:'' },
    {name: 'i' , line: 1 ,type: 'AssignmentExpression' ,value:'++i' ,condition:'' }];

let json5_2 = parseCode('for( let i= 0 ; i*2<=10*10 ; i=i+2){}').body[0];
let arrjson5_2 = [{name: '' , line: 1 ,type: 'ForStatement' ,value:null ,condition:'i*2<=10*10' },
    {name: 'i' , line: 1 ,type: 'AssignmentExpression' ,value:'0' ,condition:'' },
    {name: 'i' , line: 1 ,type: 'AssignmentExpression' ,value:'i=i+2' ,condition:'' }];

//caseAssignmentExpression
let json6 = parseCode('x=x+5').body[0].expression;
let arrjson6 = [{name: 'x' , line: 1 ,type: 'AssignmentExpression' ,value:'x+5' ,condition:'' }];

//caseReturnStatement
let json7 = parseCode('function x () {\n' +
    'return 7;\n' +
    '}').body[0].body.body[0];
let arrjson7 = [{name: '' , line: 2 ,type: 'ReturnStatement' ,value:'7' ,condition:'' }];

let json8 = parseCode('function x (z) {\n' +
    'return 7;\n' +
    '}').body[0].body.body[0];
let arrjson8 = [{name: '' , line: 2 ,type: 'ReturnStatement' ,value:'x+7*2' ,condition:'' }];

describe('The javascript parser', () => {

    it('is parsing an empty function correctly', () => {
        assert.equal(
            JSON.stringify(parseCode('')),
            '{"type":"Program","body":[],"sourceType":"script","loc":{"start":{"line":0,"column":0},"end":{"line":0,"column":0}}}'
        );
    });



    it('is parsing a simple variable declaration correctly', () => {
        assert.equal(
            JSON.stringify(parseCode('let a = 1;')),
            '{ "type": "Program", "body": [ { "type": "VariableDeclaration", "declarations": [ { "type": "VariableDeclarator", "id": { "type": "Identifier", "name": "a", "loc": { "start": { "line": 1, "column": 4 }, "end": { "line": 1, "column": 5 } } }, "init": { "type": "Literal", "value": 1, "raw": "1", "loc": { "start": { "line": 1, "column": 8 }, "end": { "line": 1, "column": 9 } } }, "loc": { "start": { "line": 1, "column": 4 }, "end": { "line": 1, "column": 9 } } } ], "kind": "let", "loc": { "start": { "line": 1, "column": 0 }, "end": { "line": 1, "column": 10 } } } ], "sourceType": "script", "loc": { "start": { "line": 1, "column": 0 }, "end": { "line": 1, "column": 10 } } }'.replace(/\s/g, '')
        );
    });

    it('function caseBlockStatement', () => {
        assert.deepStrictEqual( caseBlockStatement(json1).toString() ,
            arrjson1.toString());
    });

    it('function caseFunctionDeclaration ', () => {
        assert.deepStrictEqual( caseFunctionDeclaration(json2).toString() ,
            arrjson2.toString());
    });

    it('function caseWhileStatement ', () => {
        assert.deepStrictEqual( caseWhileStatement(json3).toString() ,
            arrjson3.toString());
    });


    it('function caseIfStatement ', () => {
        assert.deepStrictEqual( caseIfStatement(json4).toString() ,
            arrjson4.toString());
    });

    it('function caseForStatement 1 ', () => {
        assert.deepStrictEqual( caseForStatement(json5).toString() ,
            arrjson5.toString());
    });

    it('function caseForStatement 2 ', () => {
        assert.deepStrictEqual( caseForStatement(json5_2).toString() ,
            arrjson5_2.toString());
    });

    it('function caseAssignmentExpression ', () => {
        assert.deepStrictEqual( caseAssignmentExpression(json6).toString() ,
            arrjson6.toString());
    });

    it('function caseReturnStatement 1', () => {
        assert.deepStrictEqual( caseReturnStatement(json7).toString() ,
            arrjson7.toString());
    });

    it('function caseReturnStatement 2', () => {
        assert.deepStrictEqual( caseReturnStatement(json8).toString() ,
            arrjson8.toString());
    });

    it(' parseJson function', () => {
        let arr1=[{name: 'binarySearch' , line: 1 ,type: 'FunctionDeclaration' ,value:'' ,condition:'' },
            {name: 'x' , line: 1 ,type: 'VariableDeclarator' ,value:'' ,condition:'' },
            {name: 'low' , line: 2 ,type: 'VariableDeclarator' ,value:null ,condition:'' }] ;

        let input = parseCode('function binarySearch(x){\n' +
            '    let low;\n' +
            '}');

        assert.deepStrictEqual( parseJson(input).toString() ,
            arr1.toString());
    });


    it('is parsing a program - parseJson function ', () => {
        let arr2=[{name: 'binarySearch' , line: 1 ,type: 'FunctionDeclaration' ,value:'' ,condition:'' },
            {name: 'x' , line: 1 ,type: 'VariableDeclarator' ,value:'' ,condition:'' },
            {name: 'N' , line: 1 ,type: 'VariableDeclarator' ,value:'' ,condition:'' },
            {name: '' , line: 3 ,type: 'WhileStatement' ,value:null ,condition:'x<=N' },
            {name: 'x' , line: 4 ,type: 'AssignmentExpression' ,value:'x+1' ,condition:'' },
            {name: '' , line: 6 ,type: 'ReturnStatement' ,value:'x' ,condition:'' }] ;

        let input = parseCode('function binarySearch(x, N){\n' +
            '   \n' +
            '    while (x<= N) {\n' +
            '       x = x+1;\n' +
            '    }\n' +
            '    return x;\n' +
            '}');

        assert.deepStrictEqual( parseJson(input).toString() ,
            arr2.toString());
    });



});
