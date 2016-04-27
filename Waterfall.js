;(function ($, window, undefined) {

    var DEFAULT_OPT = {
        container: "#waterfall-container",
        columns: [200, 200, 200, 200],
        marginRight: 20,
        marginBottom: 20,
        isReusable: true,
        reuseCount: 40,
        ajaxConf: {
            type: "GET",
            dataType: "json",
            url: "/"
        }
    };

    var ch = document.documentElement.clientHeight || document.body.clientHeight,
        cw = document.documentElement.clientWidth || document.body.clientWidth,
        minColumLength = 0,
        maxColumLength = 0,
        columLength = [],
        colums = [],
        isLoading = false,
        itemInfos = [], //存放复用的节点
        itemCount = 0,
        renderLength = 1,
        prevColums = [],
        rCount = 40,
        itemCache = [],
        isUp = false,
        isResize = false,
        oldST = 0,
        count = 0,
        container = null;

    if (!$._filter) {
        $._filter = function (arr, callback) {
            var fn = function (item, index, arr) {
                return callback(index, item, arr);
            };

            if (Array.prototype.filter) {
                return Array.prototype.filter.call(arr, fn);
            } else {
                var tmp = [];
                for (var i = 0, len = arr.length; i < len; i++) {
                    var item = arr[i];
                    if (fn(i, item, arr)) {
                        tmp.push(item);
                    }
                }
                return tmp;
            }
        };
    }

    if (!$._some) {
        $._some = function (arr, callback) {
            var fn = function (item, index, arr) {
                return callback(index, item, arr);
            };

            if (Array.prototype.some) {
                return Array.prototype.some.call(arr, fn);
            } else {
                for (var i = 0, len = arr.length; i < len; i++) {
                    if (fn(i, arr[i], arr)) {
                        return true;
                    }
                }
            }
        }
    }

    function Waterfall(opt) {
        if (!(this instanceof Waterfall)) {
            return new Waterfall(opt);
        }

        this.opt = $.extend({}, DEFAULT_OPT, opt);
        rCount = this.opt.reuseCount;
        container = $(this.opt.container);
        this._init();
    }

    Waterfall.prototype.on = function () {
        var $_me = $(this);
        $_me.on.apply($_me, arguments);
        return this;
    };

    Waterfall.prototype.off = function () {
        var $_me = $(this);
        $_me.off.apply($_me, arguments);
        return this;
    };

    Waterfall.prototype._init = function () {
        var _me = this;
        _me._initColums(_me.opt.columns);
        _me._addEvent();
        _me._loadResources(function (infos) {
            _me._render(infos);
        })

    };

    /**
     * 初始化列数组
     * @private
     */
    Waterfall.prototype._initColums = function (optColums) {
        var _me = this,
            opt = _me.opt,
            marginRight = opt.marginRight,
            count = 0;

        //初始化列数
        columLength = optColums.concat();
        columLength = $.map(columLength, function () {
            return 0;
        });

        //列宽计算
        colums = optColums.concat();
        $.each(colums, function (index, item) {
            colums[index] = count;
            count += (item + marginRight)
        });
    };

    /**
     * 注册scroll和resize事件
     * @private
     */
    Waterfall.prototype._addEvent = function () {
        var _me = this,
            optColums = _me.opt.columns,
            cloneColums;

        $(window).on("scroll", scrollHandler);

        $(window).on("resize", resizeHandler);

        function scrollHandler(ev) {
            var scrollTop = $(window).scrollTop();

            isUp = scrollTop - oldST < 0;
            oldST = scrollTop;

            _me._clearAnimate();

            //判断ajax加载，还是进行节点复用
            if ((renderLength + 1) * ch + scrollTop >= minColumLength) {
                isLoading = true;
                isUp = false;
                _me._loadResources(function (infos) {
                    _me._render(infos);
                });
            } else {
                _me._reuse()
            }
        }

        function resizeHandler() {
            clearTimeout(_me.timer);
            _me.timer = setTimeout(function () {
                ch = document.documentElement.clientHeight || document.body.clientHeight;
                cw = document.documentElement.clientWidth || document.body.clientWidth;

                if (cw < 800 && !isResize) {
                    isResize = true;
                    cloneColums = optColums.concat();
                    prevColums = optColums.concat();
                    cloneColums.pop();

                    _me._initColums(cloneColums);
                    _me._animate();
                } else if (cw > 1000 && isResize) {
                    isResize = false;
                    optColums = prevColums;

                    _me._initColums(optColums);
                    _me._animate();
                }

            }, 300);
        }
    };

    /**
     * 节点ajax加载
     * @param callback
     * @private
     */
    Waterfall.prototype._loadResources = function (callback) {
        var _me = this,
            $_me = $(_me),
            ajaxConf = _me.opt.ajaxConf;

        ajaxConf = $.extend({}, ajaxConf, {
            success: function (data) {
                if (data) {
                    $_me.trigger("loadComplete", {data: data});
                    itemCount += data.length;
                    callback.call(_me, data);
                    isLoading = false;
                }
            },
            error: function (err) {
                $_me.trigger("loadError", err);
            }
        });

        $_me.trigger("loadBefore");
        $.ajax(ajaxConf);
    };

    /**
     * 渲染添加节点
     * @param infos
     * @private
     */
    Waterfall.prototype._render = function (infos) {
        var _me = this,
            isReusable = _me.opt.isReusable;

        if (!isReusable || rCount >= itemCount) {
            _me._addItems(infos);
        } else {
            _me._loadReuse(infos);
        }
    };

    /**
     * 加载的节点复用
     * @private
     */
    Waterfall.prototype._loadReuse = function (infos) {
        var _me = this,
            $_me = $(_me),
            scrollTop = $(window).scrollTop(),
            reuseItems = _me._getReuseItems(itemInfos, filter),
            rLen = reuseItems.length,
            iLen = infos.length;

        //此处可以进行对应的优化
        //例如，设置一个队列进行多余节点的备份
        if (rLen > iLen) {
            reuseItems = reuseItems.splice(0, iLen);
        } else if (rLen < iLen) {
            infos = infos.splice(0, rLen);
        }

        $.each(reuseItems, function (index, item) {
            var info = infos[index],
                w = info.width,
                h = info.height,
                calInfo = _me._calColumItemInfo(item, h),
                top = calInfo.top,
                left = calInfo.left,
                htmlStr;

            htmlStr = $_me.triggerHandler("render", info);

            if (htmlStr) {
                itemCache.push({
                    htmlStr: htmlStr,
                    top: top,
                    left: left,
                    width: w,
                    height: h,
                    index: count++
                });

                item.target.html(htmlStr);

                item.target.css({
                    top: top,
                    left: left
                });

                _me._setAttr(item, {
                    top: top,
                    left: left,
                    width: w,
                    height: h
                });

                container.height(maxColumLength);
            }
        });

        function filter(index, item) {
            return item.top + item.height < scrollTop + ch;
        }

    };

    /**
     * 节点复用
     * @private
     */
    Waterfall.prototype._reuse = function () {
        var _me = this,
            scrollTop = $(window).scrollTop(),
            reuseItems = _me._getReuseItems(itemCache, filter),
            sortInfos = itemInfos.concat(),
            rLen;

        for (var i = reuseItems.length - 1; i >= 0; i--) {
            var flag = $._some(itemInfos, function (index, item) {
                return item.index == reuseItems[i].index &&
                    item.top == reuseItems[i].top
            });

            if (flag) {
                reuseItems.splice(i, 1);
            }
        }

        rLen = reuseItems.length;
        if (!rLen) {
            return;
        }

        sortInfos = sortInfos.sort(function (t1, t2) {
            if (isUp) {
                return (t2.top + t2.height) - (t1.top + t1.height);
            } else {
                return (t1.top + t1.height) - (t2.top + t2.height);
            }
        });

        sortInfos = sortInfos.splice(0, rLen);

        $.each(reuseItems, function (index, item) {
            var w = item.width,
                h = item.height,
                i = item.index,
                sortItem = sortInfos[index],
                top, left, htmlStr;

            top = item.top;
            left = item.left;
            htmlStr = item.htmlStr;

            sortItem.target.html(htmlStr);

            sortItem.target.css({
                top: top,
                left: left
            });

            _me._setAttr(sortItem, {
                top: top,
                left: left,
                width: w,
                height: h,
                index: i
            })

        });

        function filter(index, item) {
            return item.top + item.height > scrollTop - ch && item.top < scrollTop + 2 * ch;
        }
    };

    /**
     * 获取满足条件的复用节点
     * @private
     */
    Waterfall.prototype._getReuseItems = function (items, callback) {
        var tmp = [];

        tmp = $._filter(items, callback);
        tmp = tmp.sort(function (t1, t2) {
            return t1.top - t2.top;
        });

        return tmp;
    };

    /**
     * 添加节点到文档中
     * @param infos
     * @private
     */
    Waterfall.prototype._addItems = function (infos) {
        var _me = this,
            $_me = $(_me);

        $.each(infos, function (index, item) {
            var width = item.width,
                height = item.height,
                calInfo = _me._calColumItemInfo(item, height),
                top = calInfo.top,
                left = calInfo.left,
                index = count++,
                htmlStr, target;

            htmlStr = $_me.triggerHandler("render", item);

            if (htmlStr) {
                var columns = _me.opt.columns;
                target = _me._getItem(columns[index % columns.length], height, left, top);
                target.html(htmlStr);

                //节点对象及信息保存
                itemInfos.push({
                    target: target,
                    top: top,
                    left: left,
                    width: width,
                    height: height,
                    index: index
                });

                itemCache.push({
                    htmlStr: htmlStr,
                    top: top,
                    left: left,
                    width: width,
                    height: height,
                    index: index
                });

                container.height(maxColumLength);
                container.append(target);
            }
        })
    };

    /**
     * 获取列长最小
     * @returns {{num: number, index: number}}
     * @private
     */
    Waterfall.prototype._getMin = function () {
        var minLength = Math.min.apply(Math, columLength),
            minIndex = $.inArray(minLength, columLength);

        return {
            num: minLength,
            index: minIndex
        }
    }

    /**
     * 获取waterfall-item的字符串
     * @param url
     * @param width
     * @param height
     * @param left
     * @param top
     * @returns {string}
     * @private
     */
    Waterfall.prototype._getItem = function (width, height, left, top) {
        return $("<div class='waterfall-item' style='width:" + width + "px; top:" + top + "px" + "; left:" + left + "px; overflow:hidden; position:absolute;" + "'></div>");
    };

    /**
     * resize的运动
     * @param items
     * @private
     */
    Waterfall.prototype._animate = function () {
        var _me = this,
            scrollTop = $(window).scrollTop(),
            items, iLen, lLen;

        $.each(itemCache, function (index, item) {
            var h = item.height,
                calInfo = _me._calColumItemInfo(item, h);

            item.top = calInfo.top;
            item.left = calInfo.left;
        });

        items = _me._getReuseItems(itemCache, filter);
        iLen = items.length;
        lLen = itemInfos.length;
        items = iLen >= lLen ? items.splice(0, lLen) : items;

        $.each(items, function (index, item) {
            var top = item.top,
                left = item.left,
                i = item.index,
                w = item.width,
                h = item.height,
                htmlStr = item.htmlStr,
                target = itemInfos[index].target;

            target.html(htmlStr);
            target.addClass("animate").css({
                top: top,
                left: left
            });

            itemInfos[index] = {
                target: target,
                top: top,
                left: left,
                width: w,
                height: h,
                index: i
            };

        });

        function filter(index, item) {
            return item.top + item.height > scrollTop - ch;
        }
    };

    /**
     * 计算获取对应的top，left值
     * @param item
     * @returns {{top: *, left: *}}
     * @private
     */
    Waterfall.prototype._calColumItemInfo = function (item, height) {
        var _me = this,
            minInfo = _me._getMin(),
            opt = _me.opt,
            top, left;

        top = columLength[minInfo.index];
        left = colums[minInfo.index];
        columLength[minInfo.index] += (height + opt.marginBottom);
        minColumLength = Math.min.apply(Math, columLength);
        maxColumLength = Math.min.apply(Math, columLength);

        return {
            top: top,
            left: left
        }
    };

    /**
     * 清除动画class
     * @private
     */
    Waterfall.prototype._clearAnimate = function () {
        $.each(itemInfos, function (index, item) {
            item.target.removeClass("animate");
        });
    };

    /**
     * 设置属性
     * @param target
     * @param attrs
     * @private
     */
    Waterfall.prototype._setAttr = function (target, attrs) {
        for (var key in attrs) {
            if (attrs.hasOwnProperty(key)) {
                target[key] = attrs[key];
            }
        }
    };

    window.Waterfall = Waterfall;

}($, window));