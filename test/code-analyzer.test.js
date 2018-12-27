import assert from 'assert';
import {
    parseJson1,
    checkIfArray,
    getNumberInArray,
    getNameofArray,
    inputToMap,
    parseCode
} from '../src/js/code-analyzer';

//** variables for the test functions : **
let teststring1='function foo(x, y, z){' +
    '    let a = x + 1;' +
    '    let b = a + y;' +
    '    let c = 0;' +
    '    if (b < z) {' +
    '        c = c + 5;' +
    '    } else if (b < z * 2) {' +
    '        c = c + x + 5;' +
    '    } else {' +
    '        c = c + z + 5;' +
    '    }' +
    '        return c;' +
    '}';

let inputvector1='{"x":1,"y":2,"z":3}';

let res1='st=>start: Start \n' +
    'a0=>operation: (1)\n' +
    'a = x + 1\n' +
    'b = a + y\n' +
    'c = 0\n' +
    ' |approved \n' +
    'c0=>condition: (2)\n' +
    'b < z|past\n' +
    'a1=>operation: (3)\n' +
    'c = c + 5\n' +
    ' \n' +
    'c1=>condition: (4)\n' +
    'b < z * 2 |past\n' +
    'a2=>operation: (5)\n' +
    'c = c + x + 5\n' +
    ' |approved \n' +
    'a3=>operation: (6)\n' +
    'c = c + z + 5\n' +
    ' \n' +
    'm0=>start: (7) |approved \n' +
    'r=>operation: (8)\n' +
    'return c |approved \n' +
    '\n' +
    'st->a0->c0\n' +
    'c0(yes)->a1->m0\n' +
    'c0(no)->c1->m0\n' +
    'c1(yes)->a2->m0\n' +
    'c1(no)->a3->m0->r';

let teststring2='function foo(x, y, z){' +
    '    let a = x + 1;' +
    '    while (a < 5) {' +
    '        t = x + 2;' +
    '        a++; '+
    '        x = y;' +
    '    }' +
    '    return a;' +
    '}' ;
let inputvector2='{"x":1,"y":2,"z":3}';

let res2='st=>start: Start \n' +
    'a0=>operation: (1)\n' +
    'a = x + 1\n' +
    ' |approved \n' +
    'm0=>start: (2) |past \n'+
    'c0=>condition: (3)\n a < 5 |past\n' +
    'a1=>operation: (4)\n' +
    't = x + 2\n' +
    'a++\n' +
    'x = y\n' +
    ' |approved \n' +
    'r=>operation: (5)\n' +
    'return a |approved \n' +
    '\n' +
    'st->a0->m0->c0\n' +
    'c0(yes)->a1->m0 \n' +
    'c0(no)->r' ;

let teststring3=
    'function foo(x, y, z){' +
    '    let a;' +
    '    a=5;' +
    '    x[0] = 99;' +
    '    if (a <= x[0]) {' +
    '    let w=7;' +
    '        a=7;' +
    '    }else if (a> x[0]){' +
    '    let p=7;' +
    '        a=8;' +
    '}' +
    'return a;'+
    '}';

let inputvector3='{"x":[1,3],"y":2,"z":3}';

let res3='st=>start: Start \n' +
    'a0=>operation: (1)\n' +
    'a\n' +
    'a = 5\n' +
    'x[0] = 99\n' +
    ' |approved \n' +
    'c0=>condition: (2)\n' +
    'a <= x[0]|past \n' +
    'a1=>operation: (3)\n' +
    'w = 7\n' +
    'a = 7\n' +
    ' |approved \n' +
    'c1=>condition: (4)\n' +
    'a > x[0]\n' +
    'a2=>operation: (5)\n' +
    'p = 7\n' +
    'a = 8\n' +
    ' \n' +
    'm0=>start: (6) |approved \n' +
    'r=>operation: (7)\n' +
    'return a |approved \n' +
    '\n' +
    'st->a0->c0\n' +
    'c0(yes)->a1->m0\n' +
    'c0(no)->c1->m0\n' +
    'c1(yes)->a2->m0 \n' +
    'c1(no)->m0->r';

let teststring4=
    'function foo(x, y, z){' +
    '    let a=5;' +
    '    if(1==2){' +
    '    }'+
    'return a;'+
    '}';

let inputvector4='{"x":1,"y":true,"z":3}';

let res4='st=>start: Start \n' +
    'a0=>operation: (1)\n' +
    'a = 5\n' +
    ' |approved \n' +
    'c0=>condition: (2)\n' +
    '1 == 2|past\n' +
    'm0=>start: (3) |approved \n' +
    'r=>operation: (4)\n' +
    'return a |approved \n' +
    '\n' +
    'st->a0->c0\n' +
    'c0(yes)->m0 \n' +
    'c0(no)->m0->r';

describe('The javascript symbolic substitution', () => {

    it('is parsing a simple variable declaration correctly', () => {
        assert.equal(
            JSON.stringify(parseCode('let a = 1;')),
            '{"type":"Program","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"a","range":[4,5],"loc":{"start":{"line":1,"column":4},"end":{"line":1,"column":5}}},"init":{"type":"Literal","value":1,"raw":"1","range":[8,9],"loc":{"start":{"line":1,"column":8},"end":{"line":1,"column":9}}},"range":[4,9],"loc":{"start":{"line":1,"column":4},"end":{"line":1,"column":9}}}],"kind":"let","range":[0,10],"loc":{"start":{"line":1,"column":0},"end":{"line":1,"column":10}}}],"sourceType":"script","range":[0,10],"loc":{"start":{"line":1,"column":0},"end":{"line":1,"column":10}}}'.replace(/\s/g, '')
        );
    });

    it('function inputToMap 1', () => {
        let mapInput={};mapInput['x']=1;mapInput['y']=2;mapInput['z']=3;
        assert.equal(
            inputToMap('{"x":1,"y":2,"z":3}'), mapInput.toString());
    });


    it('function inputToMap 2', () => {
        let mapInput={};mapInput['x']=1;mapInput['y']=[2,3,4];mapInput['z']=3;
        assert.deepStrictEqual(
            inputToMap('{"x":1,"y":[2,3,4],"z":3}'), mapInput);
    });

    it('function inputToMap 3', () => {
        let mapInput={};mapInput['x']='string';mapInput['y']=[2,3,4];mapInput['z']=true;
        assert.equal(
            inputToMap('{"x":"string","y":[2,3,4],"z":true}'), mapInput.toString());
    });

    it('function getNameOfArray 1', () => {
        assert.equal(getNameofArray('myname[7]'), 'myname');
    });

    it('function getNameOfArray 2', () => {
        assert.equal(getNameofArray('array[7]'), 'array');
    });

    it('function getNameOfArray 3', () => {
        assert.equal(getNameofArray('a[7]'), 'a');
    });

    it('function getNumberInArray 1', () => {
        assert.equal(getNumberInArray('myname[777]'), '777');
    });

    it('function getNumberInArray 2', () => {
        assert.equal(getNumberInArray('myname[0]'), '0');
    });

    it('function checkIfArray 1', () => {
        assert.equal(checkIfArray('myname[7]'), true);
    });

    it('function checkIfArray 2', () => {
        assert.equal(checkIfArray('a[88]'), true);
    });

    it('function checkIfArray 3', () => {
        assert.equal(checkIfArray('args'), false);
    });

    it('function checkIfArray 4', () => {
        assert.equal(checkIfArray('args]'), false);
    });

    it('function parseJson1 1', () => {
        let sub2=parseJson1(parseCode(teststring1),inputvector1);
        sub2= sub2.toString().replace(/;/g,'').replace(/\s+/g,'');
        res1= res1.toString().replace(/;/g,'').replace(/\s+/g,'');
        assert.equal(res1.toString(),sub2.toString());
    });

    it('function parseJson1 2', () => {
        let sub2=parseJson1(parseCode(teststring2),inputvector2);
        sub2= sub2.toString().replace(/;/g,'').replace(/\s+/g,'');
        res2= res2.toString().replace(/;/g,'').replace(/\s+/g,'');
        assert.equal(res2.toString(),sub2.toString());
    });

    it('function parseJson1 3', () => {
        let sub2=parseJson1(parseCode(teststring3),inputvector3);
        sub2= sub2.toString().replace(/;/g,'').replace(/\s+/g,'');
        res3= res3.toString().replace(/;/g,'').replace(/\s+/g,'');
        assert.equal(res3.toString(),sub2.toString());
    });

    it('function parseJson1 4', () => {
        let sub2=parseJson1(parseCode(teststring4),inputvector4);
        sub2= sub2.toString().replace(/;/g,'').replace(/\s+/g,'');
        res4= res4.toString().replace(/;/g,'').replace(/\s+/g,'');
        assert.equal(res4.toString(),sub2.toString());
    });

});
