export function xhrHistoryInjector() {
    const XHRHistory = [];

    function inject(targetWindow) {
        if (!targetWindow.xhrHistoryInjected){
            const xhrProto = targetWindow.XMLHttpRequest.prototype;
            const originalSend = xhrProto.send;
            xhrProto.send = newXhrSend(xhrProto.send);
            targetWindow.xhrHistoryLog = ()=>{
                console.log(XHRHistory.map(xhr=>({
                    timestamp 	: xhr.time.toJSON(),
                    url 		: xhr.XResponse.responseUrl,
                    status		: xhr.XResponse.status,
                    response    : xhr.XResponse.response,
                    request 	: xhr.XRequest['0']
                })).filter(xhr=>!!xhr));
            };
            targetWindow.xhrHistoryDestroy = ()=>{
                Object.defineProperty(targetWindow, 'xhrHistoryInjected', {
                    configurable: true,
                    writable: false,
                    value: undefined
                });
                delete targetWindow.xhrHistoryInjected;
                targetWindow.xhrHistoryLog = undefined;
                delete targetWindow.xhrHistoryLog;
                xhrProto.send = originalSend;
            };
            Object.defineProperty(targetWindow, 'xhrHistoryInjected', {
                get: ()=>true
            });

            function newXhrSend(oldSend){
                return function() {
                    if (typeof arguments !== 'undefined' && arguments !== null) {
                        XHRHistory.push({
                            time: new Date(),
                            XResponse: this,
                            XRequest: arguments
                        });
                    }
                    return oldSend.apply(this, arguments);
                }
            }
        }
    }

    if(parent.frames.length>0) {
        for (let i = parent.frames.length - 1; i >= 0; i--) {
            inject(parent.frames[i].window)
        }
    }
    inject(window);

    function XHRHistoryDownload(filter){
        //filter can be a string or a regexp
        let dlXHRHistory = [];
        function addToHistory(r){
            if(!((typeof r.request === 'undefined' || r.request === null) && typeof r.response === 'undefined')){
                try{
                    let jsonRequest = JSON.parse(r.request);
                    r.request = jsonRequest;
                }catch(e){}
                try{
                    let jsonResponse = JSON.parse(r.response);
                    r.response = jsonResponse;
                }catch(e){}
                dlXHRHistory.push(r);
            }
        };
        for (let x=0; x<XHRHistory.length; x++){
            let evt = {
                timestamp 	: XHRHistory[x].time.toJSON(),
                url 		: XHRHistory[x].XResponse.responseUrl,
                status		: XHRHistory[x].XResponse.status,
                response    : XHRHistory[x].XResponse.response,
                request 	: XHRHistory[x].XRequest['0']
            };
            
            if(typeof filter === 'string' || filter instanceof RegExp){
                if(typeof filter === 'string' && ((typeof evt.url === 'string' && evt.url.indexOf(filter)>=0) || (typeof evt.response === 'string' && evt.response.indexOf(filter)>=0) || (typeof evt.request === 'string' && evt.request.indexOf(filter)>=0))){
                    addToHistory(evt);
                }else if(filter instanceof RegExp && (evt.url.match(filter)!==null ||  evt.response.match(filter)!==null || (typeof evt.request === 'string' && evt.request.match(filter)!==null) )) {
                    addToHistory(evt);
                }
            }else{
                addToHistory(evt);
            }

            console.log(dlXHRHistory);
        }
    }
}