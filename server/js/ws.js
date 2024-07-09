
const Utils = require('./utils'),
    _ = require('underscore'),
    uws = require('uWebSockets.js');

class Server {
    constructor(port) {
        this.port = port;
        this._connections = {};
        this._counter = 0;

        uws.App().ws('/*', {

            open: (ws) => {

                const id = this._createId();

                ws.id = id;

                const connection = new Connection(id, ws, this);

                if (this.connection_callback) {
                    this.connection_callback(connection);
                }

                this.addConnection(connection);
            },

            message: (ws, message, isBinary) => {
                const receivedMessage = Buffer.from(message).toString();

                const connection = this.getConnection(ws.id);

                connection.handleMessage(receivedMessage);
            },

            close: (ws, code, message) => {
                const connection = this.getConnection(ws.id);

                connection.handleClose(code, message);
            }

        }).get('/status', (res, req) => {
            if (this.status_callback) {
                res.writeStatus('200 OK');
                res.write(this.status_callback());
            } else {
                res.writeStatus('404 Not Found');
            }
            res.end();
        })
        .listen(this.port, (listenSocket) => {

        });
    }

    onConnect(callback) {
        this.connection_callback = callback;
    }
    
    onError(callback) {
        this.error_callback = callback;
    }
    
    forEachConnection(callback) {
        _.each(this._connections, callback);
    }
    
    addConnection(connection) {
        this._connections[connection.id] = connection;
    }
    
    removeConnection(id) {
        delete this._connections[id];
    }
    
    getConnection(id) {
        return this._connections[id];
    }

    _createId() {
        return '5' + Utils.random(99) + '' + (this._counter++);
    }
    
    broadcast(message) {
        this.forEachConnection(function(connection) {
            connection.send(message);
        });
    }
    
    onRequestStatus(status_callback) {
        this.status_callback = status_callback;
    }
}

class Connection {
    constructor(id, ws, server) {
        this.ws = ws;
        this.server = server;
        this.id = id;
    }
    
    handleMessage(message) {
        if(this.listen_callback) {
            this.listen_callback(JSON.parse(message));
        }
    }

    handleClose(code, message) {
        if(this.close_callback) {
            this.close_callback();
        }
        delete this.server.removeConnection(this.id);
    }

    onClose(callback) {
        this.close_callback = callback;
    }
    
    listen(callback) {
        this.listen_callback = callback;
    }

    send(message) {
        const data = JSON.stringify(message);
        this.ws.send(data);
    }
    
    sendUTF8(data) {
        this.ws.send(data);
    }

    getRemoteAddress() {
        return Buffer.from(this.ws.getRemoteAddressAsText()).toString();
    }

    close(logError) {
        log.info("Closing connection to "+this.getRemoteAddress()+". Error: "+logError);
        this.ws.close();
    }
}

module.exports = {
    Server
}