/**
 * Angular.js plugin
 *
 * Provides an $exceptionHandler for Angular.js
 * http://stackoverflow.com/questions/591857/how-can-i-get-a-javascript-stack-trace-when-i-throw-an-exception
 */
;(function(Raven, angular) {
'use strict';

// quit if angular isn't on the page
if (!angular) {
    return;
}

function ngRavenProvider($provide) {
    var time=Date.now();
    $provide.decorator('$exceptionHandler', ['$delegate','API_SERVER',
        function ($delegate, API_SERVER) {

            Raven.config('https://public@getsentry.com/1',{
                maxMessageLength:600,
                release:window.KARIBOU_INSTANCE,
                fetchContext:true,
                //includePaths:'/*app.js$/',
                shouldSendCallback:function(errorReport){

                    //
                    // do not send more than 1 issue each 500ms 
                    // it kills our message box for nothing
                    // this should be done in server side
                    if((Date.now()-time)<500){
                        return;
                    }


                    //
                    // do not send if issue equal the last issue 
                    if(errorReport.exception.value==="[object Object]"){
                        return false;
                    }

                    var url=API_SERVER+"/v1/trace/"+btoa(window.location.origin);
                    $.ajax({type: 'POST',data: JSON.stringify(errorReport),
                            contentType: 'application/json', url:url});

                    time=Date.now();

                    return false;
                }
            }).install();

            return function angularExceptionHandler(ex, cause) {
                $delegate(ex, cause);

                var when=(window.KARIBOU_INSTANCE)?new Date(window.KARIBOU_INSTANCE):null;

                var referrer=window.referrer||document.referrer;
                Raven.captureException(ex, {extra: {
                    cause: cause, 
                    referer:referrer,
                    release:when
                }});
                // throw ex;
            };
        }
    ]);
}


angular.module('app.raven', [])
    .config(['$provide', ngRavenProvider])
    .value('Raven', Raven);

})(window.Raven, window.angular);