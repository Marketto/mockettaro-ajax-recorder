
const Vue = require('vue');
import './menu.scss';
(() => {
    chrome.tabs.executeScript(undefined, {code: '!!window.injected', runAt: 'document_end'}, ([xhrHistoryInjected]) => {
        new Vue({
            el: "#mainmenu",
            data: {
                title: chrome.i18n.getMessage("l10nName"),
                recording: xhrHistoryInjected,
                urlFilter: "",
                stopButtonLabel:chrome.i18n.getMessage("l10nStopButtonLabel"),
                recordButtonLabel: chrome.i18n.getMessage("l10nRecordButtonLabel")
            },
            methods: {
                record: function() {
                    Promise.all([
                        import('../xhr-history-injector.js'),
                        import('../tab-injector.js')
                    ]).then(([{xhrHistoryInjector}, {tabInjector}]) => {
                        const code = tabInjector({
                            methodToInject: xhrHistoryInjector, 
                            destroyer: 'xhrHistoryDestroy()',
                            exporter: 'xhrHistoryLog()'
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
                        (data = []) => {
                            function wrapCallToFiles(call = {}){
                                const wrap = [];
                                const [,path] = call.url.match(/^(?:https?:\/\/[^\/]+)?\/([^?]+)/);
                                const responseContent = (call.response && typeof call.response === 'object') ? JSON.stringify(call.response) : call.response;
                                const ext = (!call.response || typeof call.response === 'object') ? 'json' : 'txt';
                                const statusCode = call.status;
                                const method = call.method;

                                //code
                                wrap.push({
                                    path: `${path}.${method}.code`,
                                    content: "" + statusCode
                                });
                                //response
                                if (responseContent) {
                                    wrap.push({
                                        path: `${path}.${method}.${ext}`,
                                        content: responseContent
                                    });
                                }

                                return wrap;
                            }

                            const filteredData = (this.urlFilter ? data.filter(record=>record.url.match(new RegExp(this.urlFilter))) : data)
                                .filter(record => typeof record.response !== 'string');
                            const fileMap = filteredData.length < 2 ? (filteredData[0] ? wrapCallToFiles(filteredData[0]) : []) : filteredData.reduce((prev,curr)=>{
                                const chain = Array.isArray(prev) ? prev : [].concat(wrapCallToFiles(prev));
                                
                                return chain.concat(wrapCallToFiles(curr));
                            });
                            
                            import('../zip-exporter.js').then(({mockettaroZipExporter}) => {
                                mockettaroZipExporter(fileMap).catch(err => {
                                    alert(`An error occurred while trying to export zip of records\n${err.toString()}`);
                                });
                            }).catch(err => {
                                alert(`An error occurred while trying to create zip of records\n${err.toString()}`);
                            });
                        }
                    );
                    chrome.tabs.executeScript(undefined, {code: 'window.uninject();', runAt: 'document_end'}, () => {
                        this.recording = false;
                    });
                }
            }
        });
    });
})();