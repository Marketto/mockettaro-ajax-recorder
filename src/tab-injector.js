export function tabInjector(functionToInject, destroyMethodName) {
    return `(${((functionToInject, destroyMethodName)=>{
        
        const s = document.createElement('script');
        s.setAttribute('destroy','me');
        s.text = `(${functionToInject.toString()})();`;
        (document.head || document.documentElement).appendChild(s);

        window.uninject = () => {
            if (destroyMethodName){
                const d = document.createElement('script');
                d.setAttribute('destroy','me');
                d.text = `(()=>{${destroyMethodName}()})();`;
                d.onload = function() {
                    setTimeout(()=>{
                        this.remove();
                    },200);
                };
                (document.head || document.documentElement).appendChild(d);
                s.remove();
                d.remove();
            };
            window.injected = undefined;
            delete window.injected;
        };

        window.injected = true;
    }).toString()})(${functionToInject.toString()}, '${destroyMethodName}')`;
}