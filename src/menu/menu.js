(() => {
    chrome.tabs.executeScript(undefined, {code: 'window.injected', runAt: 'document_end'}, ([xhrHistoryInjected]) => {
        new Vue({
            el: "#mainmenu",
            data: {
                title: 'Mockettaro Ajax Recorder',
                recording: xhrHistoryInjected,
                urlFilter: ""
            },
            methods: {
                record: function() {
                    Promise.all([
                        import('../xhr-history-injector.js'),
                        import('../tab-injector.js')
                    ]).then(([{xhrHistoryInjector}, {tabInjector}]) => {
                        const code = tabInjector({
                            methodToInject: xhrHistoryInjector, 
                            destroySnippet: 'xhrHistoryDestroy()',
                            onDestroy: 'xhrHistoryLog()'
                        });
                        chrome.tabs.executeScript(undefined, {code, runAt: 'document_start'}, ()=>{
                            this.recording = true;
                        });
                    }).catch(err => {
                        alert(`An error occurred while trying to inject the page\n${err.toString()}`);
                    });
                },
                stop: function() {
                    chrome.runtime.onMessage.addListener(
                        data => {
                          alert(JSON.stringify(data));
                        }
                    );
                    chrome.tabs.executeScript(undefined, {code: `window.uninject();`, runAt: 'document_end'}, () => {
                        this.recording = false;
                    });
                }
            }
        });
    });
})();