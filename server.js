var PORT = 3000;

var http = require('http');
var url = require("url");
var qs = require("querystring");

var data = [{
    image: "http://ww1.sinaimg.cn/large/bcc86cc5jw1dzizpa50jwj.jpg",
    height: 450,
    width: 321
}, {
    image: "http://ww1.sinaimg.cn/large/94c4bcf2jw1dzejmqudbij.jpg",
    height: 450,
    width: 590
}, {
    image: "http://down.laifudao.com/tupian/201342391349.jpg",
    height: 450,
    width: 611
}, {
    image: "http://a.hiphotos.baidu.com/zhidao/pic/item/8435e5dde71190efeed3490fca1b9d16fdfa6032.jpg",
    height: 450,
    width: 452
}];

var server = http.createServer(function (request, response) {
    var urlParse = url.parse(request.url);
    var query = qs.parse(urlParse.query);
    var contentType = "text/plain";
    response.writeHead(200, {
        'Content-Type': contentType
    });
    var tmp = [];
    for (var i = 0; i < 5; i++) {
        tmp = tmp.concat(data);
    }
    response.write(query.callback+"("+JSON.stringify(tmp)+")");
    response.end();
});

server.listen(PORT, function () {
    console.log("Server runing at port: " + PORT + ".");
});