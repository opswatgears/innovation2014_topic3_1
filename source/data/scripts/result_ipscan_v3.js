
function scanNewUrl(){
    document.location = mainURL + "#submit-ip";
}

function ShowResultDetail(){
	if (rtl) {
		$("#info .button a").css({"left":"30px", "right":"auto"});
		$("#info #fileSize").css({"left":"30px", "right":"auto"});
        $("#fileName").css("float","right");
        $("#info .scan-buttons").css("float","left");
	}
    var dirty = 0;
    for(var x = 0;x < result.scan_results.length; x++){
        if(result['scan_results'][x].results[0].result === "dirty"){
            dirty++;
        }
    }
    var table_html_all = "";
    for (var i = 0; i < result.scan_results.length; i++) {
        var operationObject = returnChosenObject(result.scan_results[i].results);
        table_html_all += '<tr class="'+ operationObject.result +'">' + '<td class="name darkerColor">' + result.scan_results[i].source + '</td>' + '<td>' + formatDate(operationObject.detecttime) + '</td>' + '<td>' + returnATag(operationObject.alternativeid) + '</td>' + '<td>' + operationObject.assessment + '</td>'+ '<td class="darkerColor">' + operationObject.confident + '</td>';
        if (operationObject.result == "dirty") {
            table_html_all += '<td><div class="result"><img title="'+ threadDetected +'" alt="'+ threadDetected +'" src="' + mainURL + 'static/img/' + imageSupport("resd") + '" /></div></td>';
        } else {
            var tooltipstring = cleanResult;
            if(operationObject.assessment === "whitelist"){
                tooltipstring = whiteList;
            }
            table_html_all += '<td><div class="result"><img title="'+ tooltipstring +'" alt="'+ tooltipstring +'" src="' + mainURL + 'static/img/' + imageSupport("resc") + '" /></div></td>';
        }
        table_html_all += '</tr>';

    }
    $("#results-table-ipscan").append(table_html_all);
    $("#results-table-ipscan").show();
    sortables_init();
}

function formatDate(date){
    if(date == ""){
        return date;
    }
    var now = new Date();
    now.setHours(23);
    now.setMinutes(59);
    now.setSeconds(59);
    var nowNumber = now.getTime();

    var timeAgo = new Date();
    var arrayDateTime = date.match(/(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+)/)
    timeAgo.setYear(parseInt(arrayDateTime[1]),10);
    timeAgo.setMonth(parseInt(arrayDateTime[2],10)-1);
    timeAgo.setDate(parseInt(arrayDateTime[3],10));
    timeAgo.setHours(23);
    timeAgo.setMinutes(59);
    timeAgo.setSeconds(59);
    var timeNumber = timeAgo.getTime();

    var daydiff = Math.floor((nowNumber - timeNumber)/86400000);
    var returnString = '';
    if(daydiff > 7){
        returnString = calTime(Math.round(daydiff/7),'week');
    }else{
        returnString = calTime(daydiff,'day');
    }
    var returnDate = timeAgo.toDateString().match(/\w+\s(.*)/);
    return returnDate[1] + returnString;
}

function calTime(timedif,string){
    if(timedif <= 0){
        return '';
    }
    if(timedif === 1){
        return ' ('+ timedif + ' ' + string +' ago)';
    } else{
        return ' ('+ timedif + ' ' + string +'s ago)';
    }
}
function returnATag(link){
    if(link === ''){
        return '';
    }else{
        return '<a target="_blank" class="virusDefinitionClass" href="' + link +'">' + link  + '</a>';
    }
}
$("#fileNameDiv").click(function(){
    $("#fileNameInput").show();
    $("#fileNameInput").focus();
    $("#fileNameInput").select();
    $("#fileNameDiv").hide();
});
$("#fileNameInput").blur(function(){
    $("#fileNameInput").hide();
    $("#fileNameDiv").show();
});

function returnChosenObject(arrayObject){
    var chosenObject = arrayObject[0];
    var timeOfChosenObject = returnNumberFromStringTime(chosenObject.detecttime);
    var confidentOfChosenObject = parseInt(chosenObject.confident,10);
    for(i = 1;i< arrayObject.length;i++){
        var currentObject = arrayObject[i];
        var timeOfCurrentObject = returnNumberFromStringTime(currentObject.detecttime);
        var confidentOfCurrentObject = parseInt(currentObject.confident,10);
        var changeToCurrentObject = false;
        if((timeOfCurrentObject > timeOfChosenObject) || ((timeOfChosenObject == timeOfCurrentObject) && (confidentOfCurrentObject > confidentOfChosenObject))){
            chosenObject = currentObject;
            timeOfChosenObject = timeOfCurrentObject;
            confidentOfChosenObject = confidentOfCurrentObject;
        }
    }
    return chosenObject;
}
function returnNumberFromStringTime(stringTime){
    try{
        var arrayTime = stringTime.match(/(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+)/);
        return parseInt(addZeroToNumber(arrayTime[1],0) + addZeroToNumber(arrayTime[2],2) + addZeroToNumber(arrayTime[3],2) + addZeroToNumber(arrayTime[4],2) + addZeroToNumber(arrayTime[5],2) + addZeroToNumber(arrayTime[6],2),10);
    } catch (e){
        return 0;
    }
}

function addZeroToNumber(number,length){
    var numberLength = number.length;
    if(numberLength < length){
        for(i = 0;i<length - numberLength;i++){
            number = '0' + number;
        }
    }
    return number;
}