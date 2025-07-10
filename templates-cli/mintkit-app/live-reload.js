(function() {
    var pollInterval = null;
    var pollDelay = 1000; // 1 second
    var lastCheck = 0;
    
    function startPolling() {
        console.log('[Mintkit LiveServer] Starting HTTP polling...');
        pollInterval = setInterval(checkForChanges, pollDelay);
    }
    
    function checkForChanges() {
        fetch('/reload')
            .then(response => response.json())
            .then(data => {
                if (data.reload) {
                    console.log('[Mintkit LiveServer] Changes detected, reloading page...');
                    window.location.reload();
                }
                lastCheck = data.timestamp;
            })
            .catch(error => {
                console.error('[Mintkit LiveServer] Polling error:', error);
            });
    }
    
    function updateCSS(file) {
        var links = document.querySelectorAll('link[rel="stylesheet"]');
        for (var i = 0; i < links.length; i++) {
            var link = links[i];
            if (link.href.indexOf(file) !== -1 || file.indexOf(link.href) !== -1) {
                var newLink = link.cloneNode(true);
                newLink.href = link.href + '?v=' + Date.now();
                link.parentNode.replaceChild(newLink, link);
            }
        }
    }
    
    function updateJS(file) {
        var scripts = document.querySelectorAll('script[src]');
        for (var i = 0; i < scripts.length; i++) {
            var script = scripts[i];
            if (script.src.indexOf(file) !== -1 || file.indexOf(script.src) !== -1) {
                var newScript = script.cloneNode(true);
                newScript.src = script.src + '?v=' + Date.now();
                script.parentNode.replaceChild(newScript, script);
            }
        }
    }
    
    if (typeof Mint !== 'undefined') {
        console.log('[Mintkit LiveServer] Mintkit framework detected');
        
        var originalInjectHTML = Mint.injectHTML;
        var originalInjectCSS = Mint.injectCSS;
        
        if (originalInjectHTML) {
            Mint.injectHTML = function(selector, html) {
                originalInjectHTML.call(this, selector, html);
                console.log('[Mintkit LiveServer] injectHTML called:', selector);
            };
        }
        
        if (originalInjectCSS) {
            Mint.injectCSS = function(css) {
                originalInjectCSS.call(this, css);
                console.log('[Mintkit LiveServer] injectCSS called');
            };
        }
    }
    
    startPolling();
})();