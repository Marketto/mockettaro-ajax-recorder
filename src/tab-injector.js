export function tabInjector({methodToInject, destroySnippet, onDestroy}) {

    function destroyInjector(beforeDestroyEvent, destroyMethodName){
        const o = document.createElement('destroy-output');
        o.id = 'destroy-me';
        o.style.display = "none";
        o.innerHTML = JSON.stringify(beforeDestroyEvent());
        (document.body || document.documentElement).appendChild(o);
        destroyMethodName();
        setTimeout(() => {
            const destroyMe = document.getElementById('destroy-me');
            if ((destroyMe || {}).remove) {
                destroyMe.remove();
            }
        }, 10);
    }

    return `(${((functionToInject, destroyMethodName, beforeDestroyEvent, $destroy) => {
        const s = document.createElement('script');
        s.id = 'destroy-me';
        s.text = `(${functionToInject.toString()})();`;
        (document.head || document.documentElement).appendChild(s);

        window.uninject = () => {
            const d = document.createElement('script');
            d.id = 'destroy-me';
            d.text = `(${$destroy.toString()})(()=>${beforeDestroyEvent}, () => ${destroyMethodName});`;
            (document.head || document.documentElement).appendChild(d);

            const [o] = document.all[0].getElementsByTagName("destroy-output");
            const destroyOutput = JSON.parse(o.innerHTML);
            chrome.runtime.sendMessage(destroyOutput);
            window.injected = false;
            delete window.injected;
        };

        window.injected = true;
    }).toString()})(${methodToInject.toString()}, '${destroySnippet}', '${onDestroy}', ${destroyInjector.toString()})`;
}