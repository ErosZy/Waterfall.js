# Waterfall.js

> simple waterfall layout library help you relay your layout


### 1. 开始使用

```javascript
var params = {
        startIndex: 0,
        offset: 10
    };

    var count = 0;

    var getResizeColums = function (cw) {
        var limit = [800, 1000, 1200];
        var colums = [200, 200, 200, 200, 200];

        limit.some(function (item, index) {
            if (cw < item) {
                colums = [];
                for (var i = 0; i < 2 + index; i++) {
                    colums.push(200);
                }
                return true;
            }

            return false;
        });

        return colums;
    };

    var waterfall = new Waterfall({
        isReusable: true,
        colums: getResizeColums(document.documentElement.clientWidth || document.body.clientWidth),
        reuseCount: 100,
        marginBottom: 50,
        marginRight: 50,
        ajaxConf: {
            type: "GET",
            dataType: "jsonp",
            data: params,
            url: "http://localhost:3000"
        }
    });

    waterfall.on("loadBefore", function (event) {
        console.log("loading");
    }).on("loadComplete", function (event, data) {
        console.log(data);
    }).on("loadError", function (event, err) {
        console.log(err);
    }).on("render", function (event, data) {
        return [
            '<img src="' + data.image + '" height="' + data.height + '" width="' + data.width + '" title="image"/>'
        ].join('');
    }).on("resize", function (event, cw) {
        var colums = getResizeColums(cw);
        waterfall.setColums(colums);
    });
	
```

### 2. 属性
```javascript
    var DEFAULT_OPT = {
        container: "#waterfall-container", // 容器
        columns: [200, 200, 200, 200], // 各列宽度
        marginRight: 20, // 右间距
        marginBottom: 20, // 下间距
        isReusable: true, // 是否启用节点服用
        reuseCount: 100, // 节点复用数(实际可用节点~=reuseCount)
        ajaxConf: { // 网络请求相关配置
            type: "GET",
            dataType: "json",
            url: "/"
        }
    };
```

### 3. 方法

* stop()：停止请求（不禁用scroll,resize事件）
* start()：开始请求
* setColums(colums:Array<int>): 设置列数
* clear(): 销毁对象
* on(eventName:String, callback: fn): 事件注册
* off(eventName:String, callback: fn): 取绑事件

### 4. 事件

* loadBefore
* loadComplete
* loadError
* render
* resize
