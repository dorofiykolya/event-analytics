const parameters = require("./utils/parameters");
const sql = require("mssql");
const util = require('util');
const http = require("http");
const fs = require("fs");

const localhost = "127.0.0.1";
const defaultPort = 80;

var port = Number(parameters.port) || defaultPort;
var host = parameters.host || localhost;

var dbReconnectTimeout = 10000;
var dbHost = parameters.dbHost || localhost;
var dbUser = parameters.dbUser || "test";
var dbPassword = parameters.dbPassword || "test";
var dbName = parameters.dbName || "analytics";

var sqlLogFile = parameters.sqlLogFile;
var sqlLogFileDescriptor = null;

var sqlLogFileQuery = null;
if (sqlLogFile) {
    if (!fs.existsSync(sqlLogFile)) {
        sqlLogFileDescriptor = fs.openSync(sqlLogFile);
    }
    sqlLogFileQuery = [];
}

function enqueueQueryLog(query) {
    if (sqlLogFileQuery != null) {
        sqlLogFileQuery.push(query);
        processWriteFile();
    }
}

function processWriteFile() {
    if (sqlLogFileQuery.length != 0) {
        var query = sqlLogFileQuery.shift();
        fs.appendFile(sqlLogFile, query + "\n", (error) => {
            if (error) {
                console.error("error write log file: " + error);
            }
            processWriteFile();
        });
    }
}

var dbConnectId = null;
var onDbConnect = [];

const config = {
    user: dbUser,
    password: dbPassword,
    server: dbHost,
    database: dbName
};

const dbTableQuery = "IF NOT EXISTS (select * from INFORMATION_SCHEMA.TABLES where TABLE_NAME = 'Event' AND TABLE_SCHEMA = 'dbo')" +
    "CREATE TABLE Event(													   " +
    "	[UserId] 					BIGINT 	      NOT NULL," +
    "	[EventName] 				NVARCHAR(100) NOT NULL," +
    "	[AdvertisingId] 			NVARCHAR(200),		   " +
    "	[Data]						NVARCHAR(500),		   " +
    "	[TimeSourceTicks] 			BIGINT,       		   " +
    "	[DeviceTime]				NVARCHAR(100),		   " +
    "	[ServerHostname]			NVARCHAR(100),		   " +
    "	[PlayerName]				NVARCHAR(100),		   " +
    "	[LoginToken]				NVARCHAR(200),		   " +
    "	[Platform]			  		NVARCHAR(100),		   " +
    "                                             		   " +
    "	[DeviceModel]			  	NVARCHAR(100),		   " +
    "   [DeviceName]			    NVARCHAR(100),		   " +
    "	[DeviceType]			  	NVARCHAR(100),		   " +
    "	[DeviceUniqueIdentifier] 	NVARCHAR(100),		   " +
    "                                             		   " +
    "	[OperatingSystem] 			NVARCHAR(100),		   " +
    "	[SystemMemorySize] 			BIGINT,       		   " +
    "                                             		   " +
    "	[Address]					NVARCHAR(100),		   " +
    "	[Port]						INT,          		   " +
    "	[Family]					NVARCHAR(100),		   " +
    "                                             		   " +
    "	[GraphicsDeviceID] 			NVARCHAR(100),		   " +
    "	[GraphicsDeviceName] 		NVARCHAR(100),		   " +
    "	[GraphicsDeviceType] 		NVARCHAR(100),		   " +
    "	[GraphicsDeviceVendor] 		NVARCHAR(100),		   " +
    "	[GraphicsShaderLevel] 		INT,          		   " +
    "                                             		   " +
    "	[ScreenDpi] 				INT,          		   " +
    "	[ScreenWidth] 				INT,          		   " +
    "	[ScreenHeight] 				INT,          		   " +
    "                                             		   " +
    "	[Headers]					NVARCHAR(500),		   " +
    "	[ClientVersion]				NVARCHAR(100),		   " +
    "	[FBDeepLink]				NVARCHAR(500),		   " +
    "	[GetRequest]				NVARCHAR(500) 		   " +
    ")";

const server = http.createServer((req, res) => {
    if (!req.url.startsWith("/event.php?")) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end();
        return;
    }
    const chunks = [];
    req.on("data", chunk => {
        chunks.push(chunk)
    });
    req.on("end", () => {
        var jsonString = "";
        try {
            const buffer = Buffer.concat(chunks);
            jsonString = String(buffer);

            const json = JSON.parse(jsonString);

            const eventName = json.eventName;
            const userId = json.userId;
            const platform = json.platform;
            const deviceModel = json.deviceModel;
            const deviceName = json.deviceName;
            const deviceType = json.deviceType;
            const deviceUniqueIdentifier = json.deviceUniqueIdentifier;
            const operatingSystem = json.operatingSystem;
            const systemMemorySize = json.systemMemorySize;
            const graphicsDeviceID = json.graphicsDeviceID;
            const graphicsDeviceName = json.graphicsDeviceName;
            const graphicsDeviceType = json.graphicsDeviceType;
            const graphicsDeviceVendor = json.graphicsDeviceVendor;
            const graphicsShaderLevel = json.graphicsShaderLevel;
            const screenDpi = json.screenDpi;
            const screenWidth = json.screenWidth;
            const screenHeight = json.screenHeight;
            const loginToken = json.loginToken;
            const playerName = json.playerName;
            const deviceTime = json.deviceTime;
            const fbDeepLink = json.fbDeepLink;
            const timeSourceTicks = json.timeSourceTicks;
            const advertisingId = json.advertisingId;
            const serverHostName = json.serverHostName;
            const remoteAddress = req.socket.remoteAddress;
            const remotePort = Number(req.socket.remotePort);
            const remoteFamily = req.socket.remoteFamily;
            const clientVersion = json.clientVersion;
            const data = JSON.stringify(json.data);
            const header = JSON.stringify(req.headers);

            var keyValue = [
                { "UserId": userId },
                { "EventName": eventName },
                { "AdvertisingId": advertisingId },
                { "TimeSourceTicks": timeSourceTicks },
                { "DeviceTime": deviceTime },
                { "ServerHostname": serverHostName },
                { "PlayerName": playerName },
                { "LoginToken": loginToken },
                { "Platform": platform },
                { "DeviceModel": deviceModel },
                { "DeviceName": deviceName },
                { "DeviceType": deviceType },
                { "DeviceUniqueIdentifier": deviceUniqueIdentifier },
                { "OperatingSystem": operatingSystem },
                { "SystemMemorySize": systemMemorySize },
                { "GraphicsDeviceID": graphicsDeviceID },
                { "GraphicsDeviceName": graphicsDeviceName },
                { "GraphicsDeviceType": graphicsDeviceType },
                { "GraphicsDeviceVendor": graphicsDeviceVendor },
                { "GraphicsShaderLevel": graphicsShaderLevel },
                { "ScreenDpi": screenDpi | 0 },
                { "ScreenWidth": screenWidth },
                { "ScreenHeight": screenHeight },
                { "Data": data },
                { "Headers": header },
                { "Address": remoteAddress },
                { "Port": remotePort },
                { "Family": remoteFamily },
                { "ClientVersion": clientVersion },
                { "FBDeepLink": fbDeepLink },
                { "GetRequest": req.url }
            ];

            var keys = [];
            var values = [];

            for (var i = 0; i < keyValue.length; i++) {
                var element = keyValue[i];
                for (var key in element) {
                    var value = element[key];
                    keys[i] = key;
                    values[i] = value;
                }
            }

            for (var i = 0; i < values.length; i++) {
                var element = values[i];
                values[i] = formatData(element);
            }

            console.assert(keys.length == values.length, "keys.length != values.length");

            var query = util.format("INSERT INTO dbo.Event (%s) VALUES (%s)", keys.join(", "), values.join(", "));

            function sqlRequest() {
                enqueueQueryLog(query);
                new sql.Request().query(query, (err, result) => {
                    if (err) {
                        console.error("sqlRequest-error:" + err.message);
                        if (err.message.indexOf("Connection is closed") != -1 || err.message.indexOf("No connection") != -1) {
                            sqlConnect(sqlRequest);
                        }
                    } else {
                        console.log("sqlRequest-success: eventName:" + eventName);
                    }
                });
            }

            sqlRequest();

            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('ok');
        } catch (exc) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('fail');
            console.error("fail-data-error:" + exc);
            console.error("fail-data-content:" + jsonString);
            console.error("fail-data-url:" + req.url);
        }
    });
});
server.on("error", (e) => {
    if (e.code == 'EADDRINUSE') {
        console.log("Address in use, retrying...");
        setTimeout(() => {
            server.close();
            server.listen(port, host);
        }, 1000);
    }
});

function sqlConnect(onConnect) {
    if (!dbConnectId) {
        console.log("try to connect to the database[user:" + config.user + ", server:" + config.server + ", db:" + config.database + "]");
        sql.connect(config, error => {
            if (!server.listening) {
                server.listen(port, host, () => {
                    console.log("start listen at:" + host + ":" + port);
                });
            }
            if (error) {
                console.error(error.message);

                sql.close();
                console.log("try to connect to the database after 5 seconds");
                dbConnectId = setTimeout(() => {
                    dbConnectId = null;
                    sqlConnect(onConnect);
                }, dbReconnectTimeout);

            } else {
                enqueueQueryLog(dbTableQuery);
                new sql.Request().query(dbTableQuery, (e, r) => {
                    if (e) {
                        console.error("CREATE TABLE sqlRequest-error:" + e.message);
                        if (e.message.indexOf("Connection is closed") != -1 || e.message.indexOf("No connection") != -1) {
                            sqlConnect(sqlRequest);
                        }
                    } else {
                        console.log("CREATE TABLE sqlRequest-success");
                    }
                });
                onDbConnect.forEach(function (element) {
                    element();
                }, this);
                onDbConnect.length = 0;
            }
        });
    }
    else if (onConnect) {
        if (onDbConnect.indexOf(onConnect) == -1) {
            onDbConnect.push(onConnect);
        }
    }
}

function formatData(data) {
    if (typeof (data) == "string") {
        return "'" + data + "'";
    }
    if (data == null) {
        return "null";
    }
    return data;
}

sqlConnect();