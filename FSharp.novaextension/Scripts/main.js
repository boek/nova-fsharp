
var langserver = null;

exports.activate = function() {
    // Do work when the extension is activated
    langserver = new FSharpLanguageServer();
}

exports.deactivate = function() {
    // Clean up state before the extension is deactivated
    if (langserver) {
        langserver.deactivate();
        langserver = null;
    }
}

class FSharpCommands {
    constructor(client) {
        this.client = client
    }
    
    loadWorkspaceAuto() {
        console.log("[FSAC] Loading workspace...")
        const params = {
            Directory: nova.workspace.path,
            Deep: 2,
            ExcludedDirs: []
        }
        this.client.sendRequest("fsharp/workspacePeek", params)
            .then(function(a) {
                console.log(JSON.stringify(a))
            })
    }
}


class FSharpLanguageServer {
    constructor() {
        // Observe the configuration setting for the server's location, and restart the server on change
        nova.config.observe('example.language-server-path', function(path) {
            this.start(path);
        }, this);
    }
    
    deactivate() {
        this.stop();
    }
    
    start(path) {
        if (this.languageClient) {
            this.languageClient.stop();
            nova.subscriptions.remove(this.languageClient);
        }
        
        // Use the default server path
        if (!path) {
            path = "/usr/local/share/dotnet/dotnet"
        }
        
        // Create the client
        var serverOptions = {
            path: path,
            args: [
                nova.extension.path + "/bin/fsautocomplete.dll",
                "--background-service-enabled"
            ]
        };
        var clientOptions = {
            // The set of document syntaxes for which the server is valid
            syntaxes: ['F#', 'fsharp', 'fs'],
            initializationOptions: {
                "AutomaticWorkspaceInit": false,
            }
        };
        var client = new LanguageClient('FSharp', 'F#', serverOptions, clientOptions);
        
        var commands = new FSharpCommands(client);
        
        
        console.log("created client");        
        try {
            // Start the client
            client.start();
            // Add the client to the subscriptions to be cleaned up
            commands.loadWorkspaceAuto()
            nova.subscriptions.add(client);
            this.languageClient = client;
        }
        catch (err) {
            // If the .start() method throws, it's likely because the path to the language server is invalid
            if (nova.inDevMode()) {
                console.error(err);
            }
        }
    }
    
    stop() {
        if (this.languageClient) {
            this.languageClient.stop();
            nova.subscriptions.remove(this.languageClient);
            this.languageClient = null;
        }
    }
}

