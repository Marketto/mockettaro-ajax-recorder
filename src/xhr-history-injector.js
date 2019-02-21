export function xhrHistoryInjector() {
    const XHRHistory = [];

    function newXhrSend(oldSend){
        return function(body, ...args) {
            const xhrLog = {
                timestamp: new Date(),
                url: this.openArguments[1],
                method: this.openArguments[0],
                request: body && JSON.parse(body)
            };
            XHRHistory.push(xhrLog);
            this.onreadystatechange = () => {
                if (this.readyState >= 2) {
                    xhrLog.status = this.status;
                    if (this.readyState === 4) {
                        try {
                            xhrLog.response = JSON.parse(this.response);
                        } catch(err) {
                            xhrLog.response = this.response;
                        }
                    }
                }
            };
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
            targetWindow.xhrHistoryLog = () => {
                return XHRHistory || [];
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