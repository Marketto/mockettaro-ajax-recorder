export function xhrHistoryInjector() {
    const XHRHistory = [];

    function newXhrSend(oldSend){
        return function(body, ...args) {
            XHRHistory.push({
                time: new Date(),
                XResponse: this,
                XRequestBody: body
            });
            return oldSend.apply(this, [body, ...args]);
        }
    }

    function newXhrOpen(oldOpen){
        return function(...args) {
            this.openArguments = args;
            return oldOpen.apply(this, args);
        }
    }

    function inject(targetWindow) {
        if (!targetWindow.xhrHistoryInjected){
            const xhrProto = targetWindow.XMLHttpRequest.prototype;
            const originalSend = xhrProto.send;
            const originalOpen = xhrProto.open;
            targetWindow.xhrHistoryLog = ()=>{
                return (XHRHistory || []).map(xhr => {
                    try {
                        const xhrJson = {
                            timestamp: xhr.time.toJSON(),
                            url: xhr.XResponse.openArguments[1],
                            status: xhr.XResponse.status,
                            method: xhr.XResponse.openArguments[0],
                            response: xhr.XResponse.response && JSON.parse(xhr.XResponse.response),
                            request: xhr.XRequestBody && JSON.parse(xhr.XRequestBody)
                        };
                        return xhrJson;
                    } catch(err) {
                        return null;
                    }
                }).filter(xhr=>!!xhr);
            };
            targetWindow.xhrHistoryDestroy = () => {
                if (targetWindow.xhrHistoryInjected) {
                    delete targetWindow.xhrHistoryInjected;
                }
                if (targetWindow.xhrHistoryLog) {
                    delete targetWindow.xhrHistoryLog;
                }
                xhrProto.send = originalSend;
                xhrProto.open = originalOpen;
            };

            xhrProto.send = newXhrSend(xhrProto.send);
            xhrProto.open = newXhrOpen(xhrProto.open);
        }
    }

    if(parent.frames.length>0) {
        for (let i = parent.frames.length - 1; i >= 0; i--) {
            try {
                inject(parent.frames[i].window);
            } catch(err){
                console.warn(err);
            }
        }
    }
    inject(window);
}