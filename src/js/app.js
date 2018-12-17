import $ from 'jquery';
import {outputString,parseCode,parseJson1} from './code-analyzer';
import * as escodegen from 'escodegen';



$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let vectorinput = $('#vectorinput').val();
        let parsedCode = parseCode(codeToParse);
        let arrTable = parseJson1(parsedCode,vectorinput);
        let str=escodegen.generate(arrTable).toString().replace(/;;/g, ';').replace(/;\)/g, ')');
        str=str.replace(/\[\s+/g,'[').replace(/,\n\s+/g,',').replace(/\n\s*]/g,']');
        $('#output').html(outputString(str.toString()));
    }); });


