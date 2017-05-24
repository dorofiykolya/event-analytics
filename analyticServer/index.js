const parameters = require("./utils/parameters");
const sql = require("mssql");
const util = require('util');
const http = require("http");

const localhost = "127.0.0.1";
const defaultPort = 80;

var port = Number(parameters.port) || defaultPort;
var host = parameters.host || localhost;

var dbHost = parameters.dbHost || localhost;
var dbUser = parameters.dbUser || "test";
var dbPassword = parameters.dbPassword || "test";
var dbName = parameters.dbName || "analytics";

const config = {
    user: dbUser,
    password: dbPassword,
    server: dbHost,
    database: dbName
};

const server = http.createServer((req, res) => {
    const chunks = [];
    req.on("data", chunk => {
        chunks.push(chunk)
    });
    req.on("end", () => {
        const buffer = Buffer.concat(chunks);
        const jsonString = String(buffer);

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
        const timeSourceTicks = json.timeSourceTicks;
        const advertisingId = json.advertisingId;
        const serverHostName = json.serverHostName;
        const remoteAddress = req.socket.remoteAddress;
        const remotePort = Number(req.socket.remotePort);
        const remoteFamily = req.socket.remoteFamily;
        const data = JSON.stringify(json.data);
        const header = JSON.stringify(req.headers);

        var keys = [
            "UserId",
            "EventName",
            "AdvertisingId",
            "TimeSourceTicks",
            "DeviceTime",
            "ServerHostname",
            "PlayerName",
            "LoginToken",
            "Platform",
            "DeviceModel",
            "DeviceName",
            "DeviceType",
            "DeviceUniqueIdentifier",
            "OperatingSystem",
            "SystemMemorySize",
            "GraphicsDeviceID",
            "GraphicsDeviceName",
            "GraphicsDeviceType",
            "GraphicsDeviceVendor",
            "GraphicsShaderLevel",
            "ScreenDpi",
            "ScreenWidth",
            "ScreenHeight",
            "Data",
            "Headers",
            "Address",
            "Port",
            "Family"
        ];
        var values = [
            userId,
            eventName,
            advertisingId,
            timeSourceTicks,
            deviceTime,
            serverHostName,
            playerName,
            loginToken,
            platform,
            deviceModel,
            deviceName,
            deviceType,
            deviceUniqueIdentifier,
            operatingSystem,
            systemMemorySize,
            graphicsDeviceID,
            graphicsDeviceName,
            graphicsDeviceType,
            graphicsDeviceVendor,
            graphicsShaderLevel,
            screenDpi | 0,
            screenWidth,
            screenHeight,
            data,
            header,
            remoteAddress,
            remotePort,
            remoteFamily
        ];

        for (var i = 0; i < values.length; i++) {
            var element = values[i];
            values[i] = formatData(element);
        }

        console.assert(keys.length == values.length, "keys.length != values.length");

        var query = util.format("INSERT INTO dbo.Event (%s) VALUES (%s)", keys.join(", "), values.join(", "));

        new sql.Request().query(query, (err, result) => {
            if (err) {
                console.error("sqlRequest-error:" + err.message);
            } else {
                console.log("sqlRequest-success: eventName:" + eventName);
            }
        });

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('ok');
    });
});

sql.connect(config, error => {

    server.listen(port, host, () => {
        console.log("start listen at:" + host + ":" + port);
    });
});

function formatData(data) {
    if (typeof (data) == "string") {
        return "'" + data + "'";
    }
    return data;
}