import $ from 'jquery';
import {parseCode,parseJson1} from './code-analyzer';
const flowchart= require('flowchart.js');

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let vectorinput = $('#vectorinput').val();
        let parsedCode = parseCode(codeToParse);
        let fullString =parseJson1(parsedCode,vectorinput);
        var diagram = flowchart.parse(fullString);
        diagram.drawSVG('diagram');
        diagram.drawSVG('diagram', {'symbols': {'start': {'font-color': 'black', 'element-color': 'green', 'fill': 'yellow'}, 'end':{'class': 'end-element'}},
            'flowstate' : {             // even flowstate support
                'past' : { 'fill' : '#59c4a4', 'font-size' : 12},
                'approved' : { 'fill' : '#58C4A3', 'font-size' : 12, 'yes-text' : 'APPROVED', 'no-text' : 'n/a' }
            }
        });
        $('#output').append(diagram);
    }); });



