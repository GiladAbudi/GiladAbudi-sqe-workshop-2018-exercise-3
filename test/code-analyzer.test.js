import assert from 'assert';
import {
    parseJson1,
    checkIfArray,
    getNumberInArray,
    getNameofArray,
    inputToMap,
    parseCode,
    outputString
} from '../src/js/code-analyzer';

import * as escodegen from 'escodegen';


//** variables for the test functions : **
let teststring1='function foo(x, y, z){' +
    '    let a = x + 1;' +
    '    let b = a + y;' +
    '    let c = 0;' +
    '    if (b < z) {' +
    '        c = c + 5;' +
    '        return x + y + z + c;' +
    '    } else if (b < z * 2) {' +
    '        c = c + x + 5;' +
    '        return x + y + z + c;' +
    '    } else {' +
    '        c = c + z + 5;' +
    '        return x + y + z + c;' +
    '    }' +
    '}';

let inputvector1='{"x":1,"y":2,"z":3}';

let res1='function foo(x, y, z) {\n' +
    '    let a = x + 1;\n' +
    '    let b = x + 1 + y;\n' +
    '    let c = 0;\n' +
    '    if (x + 1 + y < z) {\n' +
    '        c = 0;\n' +
    '        return x + y + z + 0 + 5;\n' +
    '    } else if (x + 1 + y < z * 2) {\n' +
    '        c = 0;\n' +
    '        return x + y + z + 0 + x + 5;\n' +
    '    } else {\n' +
    '        c = 0;\n' +
    '        return x + y + z + 0 + z + 5;\n' +
    '    }\n' +
    '}';

let teststring2='function foo(x, y, z){' +
    '    let a = x + 1;' +
    '    let b = a + y;' +
    '    let c = 0;    ' +
    '    while (a < z) {' +
    '        c = a + b;' +
    '        z = c * 2;' +
    '    }' +
    '    return z;' +
    '}';
let inputvector2='{"x":1,"y":2,"z":3}';

let res2='function foo(x, y, z) {\n' +
    '    let a = x + 1;\n' +
    '    let b = x + 1 + y;\n' +
    '    let c = 0;\n' +
    '    while (x + 1 < z) {\n' +
    '        c = x + 1 + x + 1 + y;\n' +
    '        z = (x + 1 + x + 1 + y) * 2;\n' +
    '    }\n' +
    '    return z;\n' +
    '}';

let teststring3='let b=5;' +
    'function foo(x, y, z){' +
    '    let a;' +
    '    a=5;' +
    '    x[0] = 99;' +
    '    if (a <= x[0]) {' +
    '        return x + y + z + a;' +
    '    }else if (a> x[0]){' +
    '        return y;' +
    '}' +
    '}';

let inputvector3='{"x":[1,3],"y":2,"z":3}';

let res3='let b=5;\n' +
    'function foo(x, y, z){\n' +
    '    let a;\n' +
    '    a=5;\n' +
    '    x[0] = 99;\n' +
    '    if (5 <= x[0]) {\n' +
    '        return x + y + z + 5;\n' +
    '    }else if (5> x[0]){\n' +
    '        return y;\n' +
    '}\n' +
    '}';



describe('The javascript symbolic substitution', () => {

    it('is parsing a simple variable declaration correctly', () => {
        assert.equal(
            JSON.stringify(parseCode('let a = 1;')),
            '{ "type": "Program", "body": [ { "type": "VariableDeclaration", "declarations": [ { "type": "VariableDeclarator", "id": { "type": "Identifier", "name": "a", "loc": { "start": { "line": 1, "column": 4 }, "end": { "line": 1, "column": 5 } } }, "init": { "type": "Literal", "value": 1, "raw": "1", "loc": { "start": { "line": 1, "column": 8 }, "end": { "line": 1, "column": 9 } } }, "loc": { "start": { "line": 1, "column": 4 }, "end": { "line": 1, "column": 9 } } } ], "kind": "let", "loc": { "start": { "line": 1, "column": 0 }, "end": { "line": 1, "column": 10 } } } ], "sourceType": "script", "loc": { "start": { "line": 1, "column": 0 }, "end": { "line": 1, "column": 10 } } }'.replace(/\s/g, '')
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

    it('function getNumberInArray 1', () => {
        assert.equal(getNumberInArray('myname[7]'), '7');
    });

    it('function checkIfArray 1', () => {
        assert.equal(checkIfArray('myname[7]'), true);
    });

    it('function checkIfArray 2', () => {
        assert.equal(checkIfArray('args'), false);
    });

    it('function parseJson1 1', () => {
        let sub1=parseJson1(parseCode(teststring1),inputvector1);
        let sub2= escodegen.generate(sub1).replace(/;;/g, ';').replace(';)', ')').replace(';)', ')');
        assert.equal(sub2.toString().replace(/\s/g, ''),res1.toString().replace(/\s/g, ''));
    });

    it('function parseJson1 2', () => {
        let sub1=parseJson1(parseCode(teststring2),inputvector2);
        let sub2= escodegen.generate(sub1).replace(/;;/g, ';').replace(';)', ')').replace(';)', ')');
        assert.equal(sub2.toString().replace(/\s/g, ''),res2.toString().replace(/\s/g, ''));
    });

    it('function parseJson1 3', () => {
        let sub1=parseJson1(parseCode(teststring3),inputvector3);
        let sub2= escodegen.generate(sub1).replace(/;;/g, ';').replace(';)', ')').replace(';)', ')');
        assert.equal(sub2.toString().replace(/\s/g, ''),res3.toString().replace(/\s/g, ''));
    });

    it('test output', () => {

        let resOutput='<p><pre>'+'function foo(x, y, z) '+'{</pre></p>\n' +
            ' <p><pre><mark class="red" id="red">     if (x + 1 + y < z) { </mark></pre></p> \n' +
            '<p><pre>        return x + y + z + 0 + 5;</pre></p>\n' +
            '<p><pre><mark class="green" id="green">     } else if (x + 1 + y < z * 2) { </mark></pre></p>  \n' +
            '<p><pre>        return x + y + z + 0 + x + 5;</pre></p>\n' +
            '<p><pre>    } else {</pre></p>\n' +
            '<p><pre>        return x + y + z + 0 + z + 5;</pre></p>\n' +
            '<p><pre>    }</pre></p>\n' +
            '<p><pre>}</pre></p>\n';

        let teststring4='function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' +
            '    if (b < z) {\n' +
            '        c = c + 5;\n' +
            '        return x + y + z + c;\n' +
            '    } else if (b < z * 2) {\n' +
            '        c = c + x + 5;\n' +
            '        return x + y + z + c;\n' +
            '    } else {\n' +
            '        c = c + z + 5;\n' +
            '        return x + y + z + c;\n' +
            '    }' +
            '}';
        let sub1=parseJson1(parseCode(teststring4),inputvector1);
        let sub2= escodegen.generate(sub1).toString().replace(/;;/g, ';').replace(/;\)/g, ')');
        let output=outputString(sub2.toString().replace(/\[\s+/g,'[').replace(/,\n\s+/g,',').replace(/\n\s*]/g,']'));

        assert.equal(resOutput.toString().replace(/\s/g, ''),output.toString().replace(/\s/g, ''));


    });




});
