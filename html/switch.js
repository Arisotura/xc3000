
class SwitchDecoders
{
    constructor()
    {
        this.switches = {};
        this.switchesFromG = {};

        var fam = curBitstream.family;
        for (let i = 0; i <= fam.rows; i++)
        {
            for (let j = 0; j <= fam.cols; j++)
            {
                if ((i == 0) && (j == 0 || j == fam.cols)) continue; // Top corners
                if ((i == fam.rows) && (j == 0 || j == fam.cols)) continue; // Bottom corners

                const name = letters[i] + letters[j] + '.20.1';
                const sw = new Switch(i, j, name);
                this.switches[name] = sw;
            }
        }
    }

    generateLocalLines()
    {
        Object.entries(this.switches).forEach(([name, obj]) => obj.generateLocalLines());
    }

    decode()
    {
        Object.entries(this.switches).forEach(([k, s]) => s.decode());
    }

    getFromG(name) {
        return this.switchesFromG[name];
    }

    get(name) {
        return this.switches[name];
    }


    renderBackground(ctx)
    {
        Object.entries(this.switches).forEach(([name, obj]) => obj.renderBackground(ctx));
    }

    render(ctx)
    {
        Object.entries(this.switches).forEach(([name, obj]) => obj.render(ctx));
    }
}


/**
 * A switch matrix.
 * Name is e.g. HA.20.1
 * Coordinates: screenPt is the upper left corner of the box. gPt is the coordinate of the upper left corner.
 *
 */
class Switch
{
    constructor(row, col, name)
    {
        this.row = row;
        this.col = col;
        this.name = name;
        this.tilename = name[0] + name[1];
        this.num = parseInt(name[6], 10);

        // The switch's upper left wires are local.1
        var row = rowInfo['row.' + this.tilename[0] + '.local.1'];
        var col = colInfo['col.' + this.tilename[1] + '.local.1'];

        this.gPt = {x:col-1, y:row+1};
        this.screenPt = getSCoords(this.gPt);
        this.W = 24;
        this.H = 24;

        this.wires = [];
        this.destList = [];
    }

    getPinCoords(pin)
    {
        var pinx = [0,
            1, 2, 3, 4, 5,
            6, 6, 6, 6, 6,
            5, 4, 3, 2, 1,
            0, 0, 0, 0, 0
        ];
        var piny = [0,
            0, 0, 0, 0, 0,
            1, 2, 3, 4, 5,
            6, 6, 6, 6, 6,
            5, 4, 3, 2, 1
        ];

        var ret = {
            x: this.gPt.x + pinx[pin],
            y: this.gPt.y - piny[pin]
        };
        return ret;
    }

    connectPath(pin, path)
    {
        var coord = this.getPinCoords(pin);
        path.terminate(this, pin, path.curDir=='H' ? coord.x : coord.y);
        this.paths[pin] = path;
    }

    generateLocalLines()
    {
        var pinsfacing = [0,
            15, 14, 13, 12, 11,
            20, 19, 18, 17, 16,
            5, 4, 3, 2, 1,
            10, 9, 8, 7, 6
        ];
        var fam = curBitstream.family;
        var nrows = fam.rows;
        var ncols = fam.cols;

        this.paths = [];

        if (this.row != 0)
        {
            // connect to switch above

            if (this.col == 0 && this.row == 1)
            {
                for (var i = 1; i <= 5; i++)
                {
                    var pl = i;
                    var pr = pinsfacing[pl];
                    var gStart = this.getPinCoords(pl);
                    var gEnd = getGCoords('col.'+letters[0]+'.local.'+i+':row.'+letters[0]+'.local.'+i);

                    var path = new Path(this, pl, 'both', gStart, 'V');
                    pipDecoder.addPipsToPath(gStart, gEnd, path);
                    this.paths[pl] = path;
                }
            }
            else if (this.col == ncols && this.row == 1)
            {
                for (var i = 1; i <= 5; i++)
                {
                    var pl = i;
                    var pr = pinsfacing[pl];
                    var gStart = this.getPinCoords(pl);
                    var gEnd = getGCoords('col.'+letters[ncols]+'.local.'+i+':row.'+letters[0]+'.local.'+(6-i));

                    var path = new Path(this, pl, 'both', gStart, 'V');
                    pipDecoder.addPipsToPath(gStart, gEnd, path);
                    this.paths[pl] = path;
                }
            }
            else
            {
                var remote = switchDecoders.get(letters[this.row - 1] + letters[this.col] + '.20.' + this.num);
                for (var i = 1; i <= 5; i++)
                {
                    var pl = i;
                    var pr = pinsfacing[pl];
                    var gStart = this.getPinCoords(pl);
                    var gEnd = remote.getPinCoords(pr);

                    var path = new Path(this, pl, 'both', gStart, 'V');
                    pipDecoder.addPipsToPath(gStart, gEnd, path);
                    remote.connectPath(pr, path);
                    this.paths[pl] = path;
                }
            }
        }

        if (this.col != 0)
        {
            // connect to switch left

            if (this.row == 0 && this.col == 1)
            {
                for (var i = 1; i <= 5; i++)
                {
                    var pl = 15 + i;
                    var pr = pinsfacing[pl];
                    var gStart = this.getPinCoords(pl);
                    var gEnd = getGCoords('col.'+letters[0]+'.local.'+(6-i)+':row.'+letters[0]+'.local.'+(6-i));

                    var path = new Path(this, pl, 'both', gStart, 'H');
                    pipDecoder.addPipsToPath(gStart, gEnd, path);
                    this.paths[pl] = path;
                }
            }
            else if (this.row == nrows && this.col == 1)
            {
                for (var i = 1; i <= 5; i++)
                {
                    var pl = 15 + i;
                    var pr = pinsfacing[pl];
                    var gStart = this.getPinCoords(pl);
                    var gEnd = getGCoords('col.'+letters[0]+'.local.'+i+':row.'+letters[nrows]+'.local.'+(6-i));

                    var path = new Path(this, pl, 'both', gStart, 'H');
                    pipDecoder.addPipsToPath(gStart, gEnd, path);
                    this.paths[pl] = path;
                }
            }
            else
            {
                var remote = switchDecoders.get(letters[this.row] + letters[this.col - 1] + '.20.' + this.num);
                for (var i = 1; i <= 5; i++)
                {
                    var pl = 15 + i;
                    var pr = pinsfacing[pl];
                    var gStart = this.getPinCoords(pl);
                    var gEnd = remote.getPinCoords(pr);

                    var path = new Path(this, pl, 'both', gStart, 'H');
                    pipDecoder.addPipsToPath(gStart, gEnd, path);
                    remote.connectPath(pr, path);
                    this.paths[pl] = path;
                }
            }
        }

        // connect below/right if needed

        if (this.col == 0 && this.row == nrows-1)
        {
            for (var i = 1; i <= 5; i++)
            {
                var pl = 10 + i;
                var pr = pinsfacing[pl];
                var gStart = this.getPinCoords(pl);
                var gEnd = getGCoords('col.'+letters[0]+'.local.'+(6-i)+':row.'+letters[nrows]+'.local.'+i);

                var path = new Path(this, pl, 'both', gStart, 'V');
                pipDecoder.addPipsToPath(gStart, gEnd, path);
                this.paths[pl] = path;
            }
        }
        else if (this.col == ncols && this.row == nrows-1)
        {
            for (var i = 1; i <= 5; i++)
            {
                var pl = 10 + i;
                var pr = pinsfacing[pl];
                var gStart = this.getPinCoords(pl);
                var gEnd = getGCoords('col.'+letters[ncols]+'.local.'+(6-i)+':row.'+letters[nrows]+'.local.'+(6-i));

                var path = new Path(this, pl, 'both', gStart, 'V');
                pipDecoder.addPipsToPath(gStart, gEnd, path);
                this.paths[pl] = path;
            }
        }

        if (this.row == 0 && this.col == ncols-1)
        {
            for (var i = 1; i <= 5; i++)
            {
                var pl = 5 + i;
                var pr = pinsfacing[pl];
                var gStart = this.getPinCoords(pl);
                var gEnd = getGCoords('col.'+letters[ncols]+'.local.'+(6-i)+':row.'+letters[0]+'.local.'+i);

                var path = new Path(this, pl, 'both', gStart, 'H');
                pipDecoder.addPipsToPath(gStart, gEnd, path);
                this.paths[pl] = path;
            }
        }
        else if (this.row == nrows && this.col == ncols-1)
        {
            for (var i = 1; i <= 5; i++)
            {
                var pl = 5 + i;
                var pr = pinsfacing[pl];
                var gStart = this.getPinCoords(pl);
                var gEnd = getGCoords('col.'+letters[ncols]+'.local.'+i+':row.'+letters[nrows]+'.local.'+i);

                var path = new Path(this, pl, 'both', gStart, 'H');
                pipDecoder.addPipsToPath(gStart, gEnd, path);
                this.paths[pl] = path;
            }
        }
    }

    decode()
    {
        var fam = curBitstream.family;
        var offset = getTileOffset(this.col, this.row);
        var swbits;

        this.wires = [];
        this.destList = [];
        for (var i = 1; i <= 20; i++)
            this.destList[i] = [];

        if (this.row == 0)
        {
            // top
            swbits = [
                [-1,19, 9,16], [0,0, 6,19], [0,1, 14,19], [0,3, 15,20], [0,4, 6,14], [0,5, 14,20], [0,12, 8,18], [0,14, 13,18],
                [0,16, 9,13], [0,17, 9,18], [0,20, 11,16], [0,21, 10,16], [1,0, 15,19], [1,1, 6,15], [1,2, 7,19], [1,3, 7,14],
                [1,4, 7,20], [1,5, 6,20], [1,7, 6,11], [1,8, 11,20], [1,9, 7,18], [1,13, 12,18], [1,14, 8,13], [1,15, 12,17],
                [1,16, 8,17], [1,17, 9,17], [1,20, 10,11], [1,21, 10,17], [2,0, 7,15], [2,9, 8,19], [2,15, 13,17], [2,16, 8,12],
                [2,17, 9,12]
            ];
        }
        else if (this.row == fam.rows)
        {
            // bottom
            swbits = [
                [0,0, 1,9], [0,8, 4,8], [0,9, 8,17], [0,14, 3,19], [0,17, 4,7], [1,0, 1,17], [1,1, 1,10], [1,2, 9,17],
                [1,3, 2,9], [1,4, 9,16], [1,5, 10,16], [1,7, 5,10], [1,8, 5,16], [1,9, 9,18], [1,13, 4,18], [1,14, 3,8],
                [1,15, 4,19], [1,16, 8,19], [1,17, 7,19], [1,20, 5,6], [1,21, 6,19], [2,0, 10,17], [2,1, 2,17], [2,3, 1,16],
                [2,4, 2,10], [2,5, 2,16], [2,12, 8,18], [2,14, 3,18], [2,16, 3,7], [2,17, 7,18], [2,20, 5,20], [2,21, 6,20],
                [3,19, 7,20]
            ];
        }
        else if (this.col == 0)
        {
            // left
            swbits = [
                [0,0, 6,15], [0,1, 1,6], [0,2, 6,14], [0,3, 7,15], [0,4, 1,7], [0,5, 2,7], [0,6, 7,14], [0,7, 2,14],
                [0,8, 1,14], [0,9, 2,15], [0,10, 1,15], [0,11, 10,15], [0,12, 1,10], [0,13, 2,13], [0,14, 3,13], [0,15, 3,12],
                [0,16, 3,8], [0,17, 4,13], [0,18, 8,12], [0,19, 9,12], [0,20, 4,12], [0,21, 4,9], [1,16, 3,9], [1,17, 9,13],
                [1,18, 8,13], [1,20, 4,8], [1,21, 4,11], [2,0, 2,6], [2,16, 3,14], [2,17, 5,12], [2,19, 5,10], [2,20, 5,11],
                [2,21, 10,11]
            ];
        }
        else if (this.col == fam.cols)
        {
            // right
            swbits = [
                [0,0, 15,20], [0,1, 2,15], [0,2, 1,15], [0,3, 1,19], [0,4, 1,14], [0,5, 3,14], [0,6, 2,14], [0,7, 2,13],
                [0,8, 13,17], [0,9, 3,13], [0,10, 3,17], [0,11, 3,12], [0,12, 12,17], [0,13, 4,12], [1,0, 15,19], [1,1, 15,16],
                [1,2, 1,16], [1,3, 1,20], [1,4, 14,20], [1,5, 14,19], [1,6, 2,19], [1,7, 2,20], [1,8, 13,18], [1,9, 4,13],
                [1,10, 3,18], [1,11, 12,18], [1,12, 5,12], [1,13, 4,17], [2,7, 11,16], [2,8, 5,16], [2,9, 5,11], [2,10, 4,11],
                [2,13, 4,18]
            ];
        }
        else
        {
            // middle
            swbits = [
                [0,0, 2,20], [0,1, 1,20], [0,2, 1,14], [0,3, 2,15], [0,4, 7,20], [0,5, 7,15], [0,6, 7,19], [0,7, 15,19],
                [0,8, 2,14], [0,9, 7,18], [0,10, 8,19], [0,11, 3,8], [0,12, 13,18], [0,13, 4,13], [0,14, 9,13], [0,15, 4,18],
                [0,16, 4,8], [0,17, 4,12], [0,18, 9,17], [0,19, 12,17], [0,20, 10,11], [0,21, 10,17], [1,0, 15,20], [1,1, 1,15],
                [1,2, 6,20], [1,3, 2,6], [1,4, 6,14], [1,5, 1,19], [1,6, 6,19], [1,7, 14,19], [1,8, 2,7], [1,9, 2,13],
                [1,10, 3,14], [1,11, 8,18], [1,12, 13,17], [1,13, 3,13], [1,14, 3,17], [1,15, 3,12], [1,16, 8,17], [1,17, 9,18],
                [1,18, 9,12], [1,19, 8,12], [1,20, 4,11], [1,21, 10,16], [2,0, 1,6], [2,9, 7,14], [2,10, 3,18], [2,15, 5,12],
                [2,16, 5,10], [2,17, 5,11], [2,18, 4,9], [2,19, 11,16], [2,20, 9,16], [2,21, 5,16]
            ];
        }

        const self = this;
        swbits.forEach((b) =>
        {
            var bit = curBitstream.data[offset.y+b[0]][offset.x+b[1]];
            if (!bit)
            {
                self.wires.push([b[2], b[3]]);
                self.destList[b[2]].push(b[3]);
                self.destList[b[3]].push(b[2]);
            }
        });
    }

    describePin(pin)
    {
        return this.name + '.' + pin;
    }

    pinEnabled(pin)
    {
        //return (typeof this.connected[pin] != 'undefined');
        return this.destList[pin].length != 0;
    }

    signalConnection()
    {
    }

    _routeThrough(pin, net, level)
    {
        var chk = [pin];
        var done = [];
console.log('Switch.routeThrough() start', pin);
        var inpath = this.paths[pin];
        console.log(this.paths);
        var inPt = this.getPinCoords(pin);
        net.pushJunction(inpath.pathByG[inPt.x+'G'+inPt.y]);

        for (var i = 0; i < this.wires.length; i++) done[i] = false;

        for (var it = 0; it < 300; it++)
        {
            var chknext = [];
            for (var i = 0; i < this.wires.length; i++)
            {
                if (done[i]) continue;
                var w = this.wires[i];

                if (chk.indexOf(w[0]) != -1)
                {
                    done[i] = true;
                    chknext.push(w[1]);

                    let gPt = this.getPinCoords(w[1]);
                    let path = this.paths[w[1]];
                    console.log('POPO starting from pin '+w[0], path, gPt, path.pathByG[gPt.x+'G'+gPt.y]);

                    net.pushJunction(path.pathByG[gPt.x+'G'+gPt.y]);
                    net.appendPoint(gPt);
                    net.appendEndpoint(path.pathByG[gPt.x+'G'+gPt.y]);
                    path.traceFrom(gPt, net, level+1);
                    net.popJunction();
                }
                if (chk.indexOf(w[1]) != -1)
                {
                    done[i] = true;
                    chknext.push(w[0]);

                    let gPt = this.getPinCoords(w[0]);
                    let path = this.paths[w[0]];
                    console.log('starting from pin '+w[0], path, gPt, path.pathByG[gPt.x+'G'+gPt.y]);
                    net.pushJunction(path.pathByG[gPt.x+'G'+gPt.y]);
                    net.appendPoint(gPt);
                    net.appendEndpoint(path.pathByG[gPt.x+'G'+gPt.y]);
                    path.traceFrom(gPt, net, level+1);
                    net.popJunction();
                }
            }
            if (chknext.length == 0) break;
            chk = chknext;
        }
        net.popJunction();
        console.log('Switch.routeThrough() done');
    }

    routeThrough(pin, net, level, visited=null)
    {
        if (level > 300)
        {
            console.log('too much recursion');
            return 0;
        }

        var numdest = 0;

        if (!visited) visited = {};
        visited[pin] = true;

        var inpath = this.paths[pin];
        var inPt = this.getPinCoords(pin);
        var inElem = inpath.pathByG[inPt.x+'G'+inPt.y];
        //net.pushJunction(inpath.pathByG[inPt.x+'G'+inPt.y]);

        console.log('Switch.routeThrough', this.name, pin, inPt);

        var self = this;
        this.destList[pin].forEach((dest) =>
        {
            if (visited[dest]) return;
            visited[dest] = true;

            let gPt = this.getPinCoords(dest);
            let path = this.paths[dest];
            let startElem = path.pathByG[gPt.x+'G'+gPt.y];
console.log('routing from '+self.name+' '+pin+' to '+dest, gPt);
            net.beginBranch(inPt);
            net.appendEndpoint(startElem);
            //net.pushJunction(startElem);
            //net.appendPoint(gPt);
            //net.appendEndpoint(startElem);
            //path.traceFrom(gPt, net, level+1);
            //net.pushJunction(inElem);
            //net.appendPoint(gPt);

            //net.pushJunction(startElem);
            var nd = path.traceFrom(gPt, net, level+1);
            //net.popJunction();
console.log(' -- path dest: '+nd);
            if (this.destList[dest].length != 0)
                nd += self.routeThrough(dest, net, level + 1, visited);
            console.log(' -- reroute dest: '+nd);
            //if (nd)
                //net.appendEndpoint(startElem);

            numdest += nd;
            //net.popJunction();
            net.finishBranch();
        });
console.log('Switch.routeThrough() -> '+numdest);
        //net.popJunction();
        return numdest;
    }

    /**
     * Draws the internal wire between pin1 and pin2.
     */
    drawWires(ctx)
    {
        ctx.beginPath();
        const self = this;
        ctx.strokeStyle = '#ffa';
        this.wires.forEach(function([pin1, pin2])
        {
            var coord1 = self.getPinCoords(pin1);
            var coord2 = self.getPinCoords(pin2);
            coord1 = getSCoords(coord1);
            coord2 = getSCoords(coord2);
            ctx.moveTo(coord1.x, coord1.y);
            ctx.lineTo(coord2.x, coord2.y);
        });
        ctx.stroke();
    }

    renderBackground(ctx)
    {
        if (viewSettings.showAllPips)
        {
            ctx.strokeRect(this.screenPt.x, this.screenPt.y, this.W, this.H);

            ctx.beginPath();
            for (var i = 1; i <= 5; i++)
            {
                if (this.row != 0)
                {
                    ctx.moveTo(this.screenPt.x + (i * 4), this.screenPt.y);
                    ctx.lineTo(this.screenPt.x + (i * 4), this.screenPt.y - 2);
                }
                if (this.row != curBitstream.family.rows)
                {
                    ctx.moveTo(this.screenPt.x + (i * 4), this.screenPt.y + this.H);
                    ctx.lineTo(this.screenPt.x + (i * 4), this.screenPt.y + this.H + 2);
                }
                if (this.col != 0)
                {
                    ctx.moveTo(this.screenPt.x, this.screenPt.y + (i * 4));
                    ctx.lineTo(this.screenPt.x - 2, this.screenPt.y + (i * 4));
                }
                if (this.col != curBitstream.family.cols)
                {
                    ctx.moveTo(this.screenPt.x + this.W, this.screenPt.y + (i * 4));
                    ctx.lineTo(this.screenPt.x + this.W + 2, this.screenPt.y + (i * 4));
                }
            }
            ctx.stroke();
        }

        if (false)
        {
            ctx.strokeStyle = '#ffa';
            Object.entries(this.paths).forEach(([key,path]) => path.draw(ctx));
            ctx.strokeStyle = '#aaa';
        }
    }

    render(ctx)
    {
        if (viewSettings.debug)
        {
            this.drawWires(ctx);
        }
    }

    isInside(x, y) {
        return x >= this.screenPt.x && x < this.screenPt.x + this.W && y >= this.screenPt.y && y < this.screenPt.y + this.H;
    }

    info() {
        return "Switch " + this.name + " " + this.state + " " + this.wires;
    }
}
