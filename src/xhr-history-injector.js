export function xhrHistoryInjector() {
    const XHRHistory = [];

    function inject(targetWindow) {
        if (!targetWindow.xhrHistoryInjected){
            const xhrProto = targetWindow.XMLHttpRequest.prototype;
            const originalSend = xhrProto.send;
            xhrProto.send = newXhrSend(xhrProto.send);
            targetWindow.xhrHistoryLog = ()=>{
                return XHRHistory.map(xhr=>({
                    timestamp 	: xhr.time.toJSON(),
                    url 		: xhr.XResponse.responseUrl || xhr.XResponse.responseURL,
                    status		: xhr.XResponse.status,
                    response    : xhr.XResponse.response && JSON.parse(xhr.XResponse.response),
                    request 	: xhr.XRequest['0'] && JSON.parse(xhr.XRequest['0'])
                })).filter(xhr=>!!xhr);
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
}