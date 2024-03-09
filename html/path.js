
// this class represents a path segment connecting resources together
// to be used for rendering and also for route tracing

class Path
{
    // constructs new path starting from the given object and pin
    // originObj: origin from which the path starts
    // originPin: specific pin on the origin object from which the path starts
    // originType: type of path origin
    // - 'source': path is travelled from the origin point
    // - 'dest': path is travelled to the origin point
    // - 'both': path can be travelled both ways
    // gPt: G coordinates of the source point
    // dir: direction the path goes, 'H' or 'V'
    constructor(originObj, originPin, originType, gPt, dir)
    {
        gPt = this.parseCoords(gPt);

        var data = {
            type: 'endpoint',
            obj: originObj,
            pin: originPin,
            gPt: gPt,
        };

        if (originObj && originObj.type == 'junction')
            this.rootPath = originObj.path.rootPath;
        else
            this.rootPath = this;

        this.path = [];
        this.pathByG = [];
        this.pathById = [];
        this.lastElem = null;
        this.appendElement(data, dir);

        this.origin = data;
        this.originType = originType;
    }

    isEnabled()
    {
        let obj = this.origin.obj;
        if (!obj) return true;
        return obj.pinEnabled(this.origin.pin);
    }

    parseCoords(name)
    {
        var ret;

        if (typeof name == 'string')
            ret = getGCoords(name);
        else
            ret = name;

        if (typeof ret == 'undefined')
            console.log('incorrect coords '+name);

        return ret;
    }

    parsePoint(name)
    {
        var ret = {};

        if (typeof name == 'number')
            name = ''+name;
        if (typeof name == 'string')
            name = name.split(':');

        if (name.length >= 2)
            ret.id = name[1];

        var pt = name[0];
        if ((pt[0] == '+' || pt[0] == '-') && this.lastElem)
        {
            if (this.curDir == 'H')
            {
                ret.x = this.lastElem.gPt.x + parseInt(pt);
                ret.y = this.lastElem.gPt.y;
            }
            else
            {
                ret.x = this.lastElem.gPt.x;
                ret.y = this.lastElem.gPt.y + parseInt(pt);
            }
        }
        else
        {
            if (this.curDir == 'H')
            {
                ret.x = isNaN(pt) ? colInfo[pt] : parseInt(pt);
                ret.y = this.lastElem.gPt.y;
            }
            else
            {
                ret.x = this.lastElem.gPt.x;
                ret.y = isNaN(pt) ? rowInfo[pt] : parseInt(pt);
            }
        }

        return ret;
    }

    appendElement(elem, dir=null)
    {
        if (!dir) dir = this.curDir;

        var last = this.lastElem;
        if (last)
        {
            last.next = elem;
            elem.dirPrev = last.dirNext;
        }
        elem.path = this;
        elem.screenPt = getSCoords(elem.gPt);
        elem.dirNext = dir;
        elem.prev = last;
        elem.next = null;
        this.path.push(elem);
        this.pathByG[elem.gPt.x+'G'+elem.gPt.y] = elem;
        if (elem.gPt.id) this.rootPath.pathById[elem.gPt.id] = elem;
        this.lastElem = elem;
        this.curDir = dir;
    }

    // append a simple path turn
    appendTurn(gPt)
    {
        gPt = this.parsePoint(gPt);
        var nextdir = (this.curDir == 'H') ? 'V' : 'H';

        var data = {
            type: 'turn',
            gPt: gPt
        };
        this.appendElement(data, nextdir);
    }

    // append a T junction (started as a new path)
    appendJunction(gPt)
    {
        gPt = this.parsePoint(gPt);
        var juncdir = (this.curDir == 'H') ? 'V' : 'H';

        var data = {
            type: 'junction',
            gPt: gPt,
            path: this
        };

        var junc = new Path(data, null, this.originType, gPt, juncdir);
        data.obj = junc;

        this.appendElement(data);
        return junc;
    }

    // append a PIP
    // gPt: coordinate of the PIP along the current path axis
    // type: PIP type
    // - H->V, V->H: only allows turning in one direction
    // - ND: may allow turning in both directions depending on config (takes two data bits)
    // - BIDI: only allows travel if enabled
    appendPip(gPt, type=null)
    {
        gPt = this.parsePoint(gPt);

        if (!type)
        {
            if (this.originType == 'source')
                type = (this.curDir == 'H') ? 'H->V' : 'V->H';
            else if (this.originType == 'dest')
                type = (this.curDir == 'H') ? 'V->H' : 'H->V';
            else
                type = 'ND';
        }

        var data = {
            type: 'pip',
            gPt: gPt,
            pipType: type
        };

        var pip = pipDecoder.registerPip(gPt, type, data, this.curDir);
        data.obj = pip;

        this.appendElement(data);
        return pip;
    }

    // append a list of PIPs (for ie. CLB input/output lines)
    appendPipList(pips, coordparse=null, level=0)
    {
        if (level > 300)
        {
            console.log('too much recursion');
            return;
        }

        pips.forEach((p) =>
        {
            if (typeof p == 'string')
            {
                var coord = p;
                if (coordparse) coord = coordparse(coord);

                if (coord[0] == 'T')
                    this.appendTurn(coord.substring(2));
                else
                    this.appendPip(coord);
            }
            else if (Array.isArray(p))
            {
                var coord = p[0];
                if (coordparse) coord = coordparse(coord);

                var branch = this.appendJunction(coord);
                branch.appendPipList(p.slice(1), coordparse, level+1);
            }
        });
    }

    terminate(obj, objPin, gPt)
    {
        gPt = this.parsePoint(gPt);

        var data = {
            type: 'endpoint',
            obj: obj,
            pin: objPin,
            gPt: gPt,
        };

        this.appendElement(data);
    }

    // set the status for a PIP selected by ID
    setPipStatus(id, status)
    {
        var elem = this.pathById[id];
        if (!elem)
        {
            console.log('element '+id+' not found');
            console.log(this);
            return;
        }
        if (elem.type != 'pip')
        {
            console.log('element '+id+' is not a PIP');
            return;
        }

        elem.obj.status = status;

        if (status)
        {
            // go through the objects connected to this PIP
            // to notify them that this path is active

            Object.entries(elem.obj.paths).forEach(([k, path]) =>
            {
                path.path.signalConnection();
            });
        }
    }

    signalConnection()
    {
        if (this.rootPath != this)
            return this.rootPath.signalConnection();

        if (!this.origin.obj)
            return;

        this.origin.obj.signalConnection(this.origin.pin);
    }

    traceFrom(gPt=null, net=null, level=0)
    {
        if (level > 300)
        {
            console.log('too much recursion');
            return undefined;
        }

        if (level == 0)
        {
            var src = this.origin.obj;
            if (src)
            {
                net = new Net(this.origin);
            }
            else
            {
                console.log('Path.traceFrom(): origin not defined');
                return undefined;
            }
        }
        else
        {
            if (!gPt || !net)
            {
                console.log('Path.traceFrom(): invalid parameters');
                console.log(gPt, net, level);
                return undefined;
            }
        }

        if (this.path.length == 0)
            return net;

        function handleNode(prev, cur, dir)
        {
            //if (net.checkVisited(cur.gPt))
            //    return false;

            net.appendPoint(cur.gPt);

            if (cur.type == 'pip')
            {
                if (net.checkVisited(cur.gPt))
                {
                    net.commitPath();
                    return false;
                }

                let pip = cur.obj;
//console.log(' - got PIP ', dir, pip);
                switch (pip.type)
                {
                    case 'splitH':
                    case 'splitV':
                        if (dir == (pip.type=='splitH' ? 'V':'H')) return false;
                        if (!pip.status) return false;
                        net.appendPip(cur.gPt);
                        break;

                    case 'bidiH':
                    {
                        if (dir == 'V') return false;
                        let mask = (prev.gPt.x < cur.gPt.x) ? 1 : 2;
                        if (!(pip.status & mask)) return false;
                        net.appendPip(cur.gPt);
                        break;
                    }

                    case 'bidiV':
                    {
                        if (dir == 'H') return false;
                        let mask = (prev.gPt.y < cur.gPt.y) ? 1 : 2;
                        if (!(pip.status & mask)) return false;
                        net.appendPip(cur.gPt);
                        break;
                    }

                    case 'H->V':
                    case 'V->H':
                    {
                        if (dir == (pip.type == 'H->V' ? 'V' : 'H')) break;
                        if (pip.status)
                        {
                            let otherpath = pip.paths[dir == 'H' ? 'V' : 'H'].path;
                            //if (!otherpath.isEnabled()) break;
//console.log('TRACING FROM PIP ', cur);
                            net.appendPip(cur.gPt);
                            net.pushJunction(cur);
                            otherpath.traceFrom(cur.gPt, net, level + 1);
                            net.popJunction();
                        }
                        break;
                    }

                    case 'ND':
                    {
                        let mask = (dir == 'H') ? 1 : 2;
                        if (pip.status & mask)
                        {
                            let otherpath = pip.paths[dir == 'H' ? 'V' : 'H'].path;
                            //if (!otherpath.isEnabled()) break;

                            net.appendPip(cur.gPt);
                            net.pushJunction(cur);
                            otherpath.traceFrom(cur.gPt, net, level + 1);
                            net.popJunction();
                        }
                        break;
                    }
                }
            }
            else if (cur.type == 'junction')
            {
                let junc = cur.obj;

                net.pushJunction(cur);
                junc.traceFrom(cur.gPt, net, level+1);
                net.popJunction();
            }
            else if (cur.type == 'endpoint')
            {//console.log('GOT ENDPOINT!', cur);
                if (!cur.obj) return false;

                if (cur.obj.type == 'junction')
                {
                    let junc = cur.obj.path;

                    net.pushJunction(cur);
                    junc.traceFrom(cur.gPt, net, level+1);
                    net.popJunction();
                }
                else
                {
                    if (!cur.obj.pinEnabled(cur.pin)) return false;

                    if (cur.obj instanceof Switch)
                    {
                        //net.pushJunction(cur);
                        cur.obj.routeThrough(cur.pin, net, level + 1);
                        //net.popJunction();
                    }

                    net.appendEndpoint(cur);
                }
                return false;
            }

            return true;
        }

        var origin;
        if (level == 0)
            origin = this.origin;
        else
            origin = this.pathByG[gPt.x+'G'+gPt.y];
if (typeof origin == 'undefined') console.log('SHITTY UNDEFINED ORIGIN', level, gPt, this);
        if (this.originType == 'dest' || this.originType == 'both')
        {
            var prev = origin;
            var cur = prev.prev;
            while (cur)
            {
                if (!handleNode(prev, cur, cur.dirNext))
                    break;

                prev = cur;
                cur = cur.prev;
            }
            net.clearPathStack();
        }
        if (this.originType == 'source' || this.originType == 'both')
        {
            var prev = origin;
            var cur = prev.next;
            while (cur)
            {
                if (!handleNode(prev, cur, prev.dirNext)) break;

                prev = cur;
                cur = cur.next;
            }
            net.clearPathStack();
        }

        if (level == 0)
            net.optimize();

        return net;
    }

    draw(ctx, level=0)
    {
        if (level > 300)
        {
            console.log('too much recursion');
            return;
        }
        if (this.path.length == 0)
            return;

        if (level == 0)
            ctx.beginPath();

        var prev = this.origin;
        var cur = prev.next;
        while (cur)
        {
            ctx.moveTo(prev.screenPt.x, prev.screenPt.y);
            ctx.lineTo(cur.screenPt.x, cur.screenPt.y);

            if (cur.type == 'junction')
                cur.obj.draw(ctx, level+1);

            prev = cur;
            cur = cur.next;
        }

        if (level == 0)
            ctx.stroke();
    }
}

// class representing a net -- source, destinations, and interconnects
// closely related to Path in that it is produced by Path.traceFrom()

var netColor = 120;

class Net
{
    constructor(origin)
    {
        var src = origin.obj;

        this.sourcePoint = origin.gPt;
        this.sourceObj = src;
        this.sourcePin = src.describePin(origin.pin);

        this.pathData = []; // visual path data
        this.netList = []; // net list, including interconnections
        this.destList = []; // list of just the destinations

        this.lastElem = origin;
        this.elemStack = [];

        this.lastPoint = origin.gPt;
        this.pointStack = [];
        this.pointTraced = {};

        this.visited = {};

        this.color = 'hsl(60 100% 83.3%)';
        this.color = 'hsl('+netColor+' 100% 83.3%)';
        netColor = (netColor + 33) % 360;
    }

    checkVisited(gPt)
    {
        let key = gPt.x+'G'+gPt.y;
        if (typeof this.visited[key] != 'undefined') return true;
        //this.visited[key] = true;
        return false;
    }

    pushJunction(elem)
    {
        this.elemStack.push(this.lastElem);
        this.lastElem = elem;
        //console.log('pushJunction()', elem);
    }

    popJunction()
    {
        this.clearPathStack();
        this.lastElem = this.elemStack.pop();
        //console.log('popJunction()');
        //this.clearPathStack();
        //console.log('popJunction(), new lastPoint is ', this.lastPoint);
    }

    // add point to the stack
    // the stack is committed to the actual path data upon encountering an active PIP or endpoint
    appendPoint(gPt)
    {
        this.pointStack.push(this.lastPoint);
        this.lastPoint = gPt;
        //console.log('appendPoint', gPt);
    }

    clearPathStack()
    {
        //console.log('clearPathStack()');
        while (this.lastPoint.x != this.lastElem.gPt.x ||
            this.lastPoint.y != this.lastElem.gPt.y)
        {
            this.lastPoint = this.pointStack.pop();
            //console.log('pop', this.lastPoint);
        }
    }

    commitPath()
    {
        var prev = this.sourcePoint;

        this.pointStack.push(this.lastPoint);
        for (var i = 0; i < this.pointStack.length; i++)
        {
            let pt = this.pointStack[i];
            let key = pt.x+'G'+pt.y;
            //console.log('trying to commit point '+key);
            if (typeof this.pointTraced[key] == 'undefined' ||
                this.pointTraced[key].indexOf(prev.x+'G'+prev.y) == -1)
            {
                //console.log('point '+key+' is getting committed');
                let from = {x: prev.x, y: prev.y};
                let to = {x: pt.x, y: pt.y};
                this.pathData.push({from: from, to: to});
                //this.pointTraced[key] = true;

                if (typeof this.pointTraced[key] == 'undefined')
                    this.pointTraced[key] = [];
                this.pointTraced[key].push(prev.x+'G'+prev.y);
            }

            prev = pt;
        }
        this.pointStack.pop();
    }

    appendPip(gPt)
    {
        this.commitPath();
        this.netList.push({type:'pip', x:gPt.x, y:gPt.y});

        let key = gPt.x+'G'+gPt.y;
        this.visited[key] = true;
    }

    appendEndpoint(elem)
    {
        this.commitPath();

        var obj = elem.obj;
        var pin = elem.obj.describePin(elem.pin);

        this.netList.push({type:'endpoint', x:elem.gPt.x, y:elem.gPt.y, obj:elem.obj, pin:pin});
        if (!(elem.obj instanceof Switch))
            this.destList.push({obj:elem.obj, pin:pin});
    }

    optimize()
    {
        // merge path items that are in the same direction
        // TODO

        /*var newdata = [];

        function dir(a, b)
        {
            if (a.x > b.x && a.y == b.y) return 'left';
            if (a.x < b.x && a.y == b.y) return 'right';
            if (a.x == b.x && a.y > b.y) return 'bottom';
            if (a.x == b.x && a.y < b.y) return 'top';
            return 'diagonal??';
        }

        var cur = this.pathData[0];
        var curdir = dir(cur.from, cur.to);
        for (var i = 1; i < this.pathData.length; i++)
        {
            let next = this.pathData[i];
            if (cur.from.x == cur.to.x && cur.from.y == cur.to.y)
            {
                cur = next;
                curdir = dir(cur.from, cur.to);
                continue;
            }

            let commit = false;
            if (cur.to.x != next.from.x || cur.to.y != next.from.y)
                commit = true;
            else
            {
                //
            }
        }*/
    }

    draw(ctx)
    {
        ctx.strokeStyle = this.color;

        ctx.beginPath();

        this.pathData.forEach((p) =>
        {
            let from = getSCoords(p.from);
            let to = getSCoords(p.to);
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
        });

        ctx.stroke();

        this.netList.forEach((n) =>
        {
            if (n.type != 'pip') return;

            let coord = getSCoords(n);
            ctx.strokeRect(coord.x-1, coord.y-1, 2, 2);
        });
    }
}
