import $ from 'jquery';
import {parseCode,parseJson} from './code-analyzer';


$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let parsedCode = parseCode(codeToParse);
        let arrTable = parseJson(parsedCode);
        $('#parseTable tr>td').remove();
        let jsontable = '<tbody>';
        for (var i = 0, size = arrTable.length; i < size ; i++) {
            jsontable += '<tr>';
            jsontable += '<td>' + arrTable[i]['line'] + '</td>';
            jsontable += '<td>' + arrTable[i]['type'] + '</td>';
            jsontable += '<td>' + arrTable[i]['name'] + '</td>';
            jsontable += '<td>' + arrTable[i]['condition'] + '</td>';
            jsontable += '<td>' + arrTable[i]['value'] + '</td>';
            jsontable += '</tr>';
        }
        jsontable += '</tbody>';
        $('#parseTable').append(jsontable);
        $('#parsedCode').val(JSON.stringify(parsedCode, null, 2));
    }); });
