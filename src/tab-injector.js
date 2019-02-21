export function tabInjector({methodToInject, exporter, destroyer}) {

    function dumpLogInHtml(dataExtractor){
        const o = document.createElement('div');
        o.className = "mockettaro destroy-me";
        o.id = "mockettaro-output";
        o.style.display = "none";
        o.textContent = btoa(encodeURIComponent(JSON.stringify(dataExtractor())));
        (document.body || document.documentElement).appendChild(o);
    }

    function destroyInjector(init){
        init();
        Array.from(document.getElementsByClassName("mockettaro destroy-me")).forEach(e => e.remove());
        window.injected = false;
        delete window.injected;
    }

    return `(${((functionToInject, exporterMethodName, $dump, destroyMethodName, $destroy) => {
        function injectScript(targetScript, callBacks = []) {
            const x = document.createElement('script');
            const paramsString = [].concat(callBacks).map(callBack => `() => ${callBack}`).join(', ');

            x.className = "mockettaro destroy-me";
            x.text = `(${targetScript.toString()})(${paramsString});`;
            (document.head || document.documentElement).appendChild(x);
        }

        injectScript(functionToInject);

        window.uninject = () => {
            //injecting self-destroy script
            injectScript($dump, exporterMethodName);

            //Extracting xhrLog injected in html tag
            const o = document.getElementById("mockettaro-output");
            const xhrLog = JSON.parse(decodeURIComponent(atob(o.innerHTML)));
            chrome.runtime.sendMessage(xhrLog);

            //injectScript($destroy, destroyMethodName);
        };

        window.injected = true;
    }).toString()})(${methodToInject.toString()}, '${exporter}', ${dumpLogInHtml.toString()}, '${destroyer}', ${destroyInjector.toString()})`;
}