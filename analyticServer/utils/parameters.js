
var parameters = {};

var pargv = process.argv;
if (pargv.length > 2) {
    for (var i = 2; i < pargv.length; i++) {
        var element = pargv[i];
        var pkv = String(element).split("=");
        parameters[pkv[0]] = pkv[1];
    }
}

module.exports = parameters;