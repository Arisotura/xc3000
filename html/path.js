
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

        if (originObj.type == 'junction')
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

    parseCoords(name)
    {
        var ret;
        if (typeof name == 'string')
            name = name.split(':');

        if (Array.isArray(name))
        {
            if (name[0] == '~' && this.lastElem)
            {
                name = name.split(':');
                ret = {};
                ret.x = this.lastElem.gPt.x + parseInt(name[1]);
                ret.y = this.lastElem.gPt.y + parseInt(name[2]);
            }
            else
                ret = getGCoords(name);
        }
        else
            ret = name;

        if (typeof ret == 'undefined')
            console.log('incorrect coords '+name);

        return ret;
    }

    parsePoint(name)
    {
        var ret = {};

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

    /*checkTurn(gPt)
    {
        // append a turn if we can't get to the requested point in a straight line
        var turnpt;
        if (this.curDir == 'H' && gPt.y != this.lastElem.gPt.y)
        {
            turnpt = {x: gPt.x, y: this.lastElem.gPt.y};
        }
        else if (this.curDir == 'V' && gPt.x != this.lastElem.gPt.x)
        {
            turnpt = {x: this.lastElem.gPt.x, y: gPt.y};
        }
        else
            return;

        this.appendTurn(turnpt);
    }*/

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

        // align the given point to the current path line
        /*if (this.curDir == 'H')
        {
            gPt.y = this.lastElem.gPt.y;
        }
        else
        {
            gPt.x = this.lastElem.gPt.x;
        }*/

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
        //this.checkTurn(gPt);

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
