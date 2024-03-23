
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

    disableAllPips()
    {
        this.pathById.forEach((elem) =>
        {
            elem.obj.status = 0;
        });
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
            if (cur.type == 'pip')
            {
                if (net.checkVisited(cur.gPt))
                {
                    return false;
                }

                let pip = cur.obj;

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

                            net.appendPip(cur.gPt);
                            otherpath.traceFrom(cur.gPt, net, level + 1);
                        }
                        break;
                    }

                    case 'ND':
                    {
                        let mask = (dir == 'H') ? 1 : 2;
                        if (pip.status & mask)
                        {
                            let otherpath = pip.paths[dir == 'H' ? 'V' : 'H'].path;

                            net.appendPip(cur.gPt);
                            otherpath.traceFrom(cur.gPt, net, level + 1);
                        }
                        break;
                    }
                }
            }
            else if (cur.type == 'junction')
            {
                let junc = cur.obj;

                net.appendPoint(cur.gPt);
                junc.traceFrom(cur.gPt, net, level+1);
            }
            else if (cur.type == 'endpoint')
            {
                if (!cur.obj) return false;

                if (cur.obj.type == 'junction')
                {
                    let junc = cur.obj.path;

                    net.appendPoint(cur.gPt);
                    junc.traceFrom(cur.gPt, net, level+1);
                }
                else
                {
                    if (!cur.obj.pinEnabled(cur.pin)) return false;

                    net.appendEndpoint(cur);

                    if (cur.obj instanceof Switch)
                        cur.obj.routeThrough(cur.pin, net, level + 1);
                }
                return false;
            }
            else
            {
                net.appendPoint(cur.gPt);
            }

            return true;
        }

        var origin;
        if (level == 0)
            origin = this.origin;
        else
            origin = this.pathByG[gPt.x+'G'+gPt.y];

        if (this.originType == 'dest' || this.originType == 'both')
        {
            net.beginBranch(origin.gPt);

            var prev = origin;
            var cur = prev.prev;
            while (cur)
            {
                if (!handleNode(prev, cur, prev.dirPrev))
                    break;

                prev = cur;
                cur = cur.prev;
            }

            net.finishBranch();
        }
        if (this.originType == 'source' || this.originType == 'both')
        {
            net.beginBranch(origin.gPt);

            var prev = origin;
            var cur = prev.next;
            while (cur)
            {
                if (!handleNode(prev, cur, prev.dirNext)) break;

                prev = cur;
                cur = cur.next;
            }

            net.finishBranch();
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

        this.sourceList = [];
        this.sourceList.push({x:origin.gPt.x, y:origin.gPt.y, obj:src, pin:origin.pin});

        this.pathData = []; // visual path data
        this.netList = []; // net list, including interconnections
        this.destList = []; // list of just the destinations

        this.curBranch = {x:origin.gPt.x, y:origin.gPt.y, numDest:0};
        this.branchStack = [];
        this.elemStack = [];
        this.visited = {};

        //this.color = 'hsl(60 100% 83.3%)';
        //this.color = 'hsl('+netColor+' 100% 83.3%)';
        this.color = 'hsl('+netColor+' 100% 50%)';
        netColor = (netColor + 42) % 360;

        this.appendPoint(origin.gPt);
    }

    isEmpty()
    {
        return this.destList.length == 0;
    }

    checkVisited(gPt)
    {
        let key = gPt.x+'G'+gPt.y;
        if (typeof this.visited[key] != 'undefined') return true;
        return false;
    }

    beginBranch(gPt)
    {
        this.branchStack.push(this.curBranch);
        this.curBranch = {x:gPt.x, y:gPt.y, numDest:0, lastNumDest:0};
    }

    appendPoint(gPt)
    {
        this.elemStack.push({type:'point', x:gPt.x, y:gPt.y, keep:false});
    }

    appendPip(gPt)
    {
        this.elemStack.push({type:'pip', x:gPt.x, y:gPt.y, keep:false});

        let key = gPt.x+'G'+gPt.y;
        this.visited[key] = true;
    }

    appendEndpoint(elem)
    {
        var obj = elem.obj;
        var pin = elem.pin;

        this.elemStack.push({type:'endpoint', x:elem.gPt.x, y:elem.gPt.y, obj:obj, pin:pin, keep:true});
        if (!(elem.obj instanceof Switch))
            this.curBranch.numDest++;
    }

    finishBranch()
    {
        var numdest = this.curBranch.numDest;
        var parentnum = this.branchStack[this.branchStack.length-1].numDest;

        if (numdest)
        {
            // this branch reached one or more endpoints: commit it

            let keep = false;

            let cur;
            while (cur = this.elemStack.pop())
            {
                if (cur.x == this.curBranch.x && cur.y == this.curBranch.y)
                {
                    cur.keep = true;
                    this.elemStack.push(cur);
                    break;
                }

                if (cur.keep)
                    keep = true;

                if (keep)
                {
                    let prev = this.elemStack[this.elemStack.length - 1];

                    let from = {x: cur.x, y: cur.y};
                    let to = {x: prev.x, y: prev.y};
                    this.pathData.push({from: from, to: to});

                    if (cur.type != 'point')
                    {
                        this.netList.push(cur);

                        if (cur.type == 'endpoint')
                        {
                            if (!(cur.obj instanceof Switch))
                                this.destList.push({obj: cur.obj, pin: cur.pin});
                        }
                    }
                }
            }
        }
        else
        {
            // this branch went nowhere: delete it

            let cur;
            while (cur = this.elemStack.pop())
            {
                if (cur.x == this.curBranch.x && cur.y == this.curBranch.y)
                {
                    this.elemStack.push(cur);
                    break;
                }
            }
        }

        this.curBranch = this.branchStack.pop();
        this.curBranch.numDest += numdest;
    }

    // connect to the destinations
    connectToDests()
    {
        const self = this;
        this.destList.forEach((elem) =>
        {
            elem.obj.connectNet(elem.pin, self);
        });
    }

    // merge another net with this net
    merge(other)
    {
        if (other.isEmpty()) return;

        var sourceindex = {};
        this.sourceList.forEach((elem) =>
        {
            let key = elem.obj.describePin(elem.pin);
            sourceindex[key] = true;
        });

        var pathindex = {};
        this.pathData.forEach((elem) =>
        {
            let key = elem.from.x+':'+elem.from.y+'/'+elem.to.x+':'+elem.to.y;
            pathindex[key] = true;
            key = elem.to.x+':'+elem.to.y+'/'+elem.from.x+':'+elem.from.y;
            pathindex[key] = true;
        });

        var netindex = {};
        this.netList.forEach((elem) =>
        {
            let key = elem.type+':'+elem.x+':'+elem.y;
            netindex[key] = true;
        });

        var destindex = {};
        this.destList.forEach((elem) =>
        {
            let key = elem.obj.describePin(elem.pin);
            destindex[key] = true;
        });

        other.sourceList.forEach((elem) =>
        {
            let key = elem.obj.describePin(elem.pin);
            if (sourceindex[key]) return;

            this.sourceList.push(elem);
        });

        other.pathData.forEach((elem) =>
        {
            let key = elem.from.x+':'+elem.from.y+'/'+elem.to.x+':'+elem.to.y;
            if (pathindex[key]) return;

            this.pathData.push(elem);
        });

        other.netList.forEach((elem) =>
        {
            let key = elem.type+':'+elem.x+':'+elem.y;
            if (netindex[key]) return;

            this.netList.push(elem);
        });

        other.destList.forEach((elem) =>
        {
            let key = elem.obj.describePin(elem.pin);
            if (destindex[key]) return;

            this.destList.push(elem);
        });
    }

    optimize()
    {
        if (this.destList.length == 0)
        {
            // net doesn't connect to anything
            this.netList = [];
            this.pathData = [];
            return;
        }

        // merge path items that are in the same direction

        var newdata = [];

        function dir(it)
        {
            if (it.from.x > it.to.x && it.from.y == it.to.y) return 'left';
            if (it.from.x < it.to.x && it.from.y == it.to.y) return 'right';
            if (it.from.x == it.to.x && it.from.y > it.to.y) return 'bottom';
            if (it.from.x == it.to.x && it.from.y < it.to.y) return 'top';
            return 'diagonal';
        }

        for (var i = 0; i < this.pathData.length;)
        {
            let cur = this.pathData[i++];
            let curdir = dir(cur);

            let newitem = {from: cur.from, to: cur.to};

            if (curdir != 'diagonal')
            {
                for (var j = i; j < this.pathData.length; j++)
                {
                    let next = this.pathData[j];
                    let nextdir = dir(next);

                    if (nextdir == 'diagonal') break;
                    if (next.from.x != cur.to.x || next.from.y != cur.to.y) break;
                    if (nextdir != curdir) break;

                    newitem.to = next.to;
                    i++;
                }
            }

            newdata.push(newitem);
        }

        this.pathData = newdata;
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

    // propagate a level through the net
    propagate(val)
    {
        val = calcLevel(val);

        this.destList.forEach((elem) =>
        {
            elem.obj.setLevel(elem.pin, val);
        });
    }
}
