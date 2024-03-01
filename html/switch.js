
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

    startDecode() {
        //Object.entries(this.switches).forEach(([k, s]) => s.startDecode());
    }

    getFromG(name) {
        return this.switchesFromG[name];
    }

    get(name) {
        return this.switches[name];
    }

    decode() {}

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
 * Name is e.g. HA.8.1
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

    startDecode() {
        //
    }

    /**
     * Processes an entry from the configuration.
     */
    add(pin1, pin2) {
        assert(pin1 > 0 && pin1 <= 8, 'Bad switch pin ' + pin1);
        assert(pin2 > 0 && pin2 <= 8, 'Bad switch pin ' + pin2);
        //if (this.name=='IK.8.2') console.log("SW "+this.name+" WIRE "+pin1+"->"+pin2);
        this.wires.push([pin1, pin2]);
        this.connect[pin1] = true;
        this.connect[pin2] = true;
    }

    /**
     * Draws the internal wire between pin1 and pin2.
     */
    drawWires(ctx) {
        ctx.beginPath();
        const self = this;
        ctx.strokeStyle = 'yellow';
        this.wires.forEach(function([pin1, pin2]) {
            var coord1 = self.pinCoord(pin1);
            var coord2 = self.pinCoord(pin2);
            ctx.moveTo(coord1[0], coord1[1]);
            ctx.lineTo(coord2[0], coord2[1]);
        });
        ctx.stroke();
    }

    renderBackground(ctx)
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

        if (false)
        {
            ctx.strokeStyle = '#ffa';
            Object.entries(this.paths).forEach(([key,path]) => path.draw(ctx));
            ctx.strokeStyle = '#aaa';
        }
    }

    render(ctx) {
        //this.drawWires(ctx);
    }

    // Helper to remove pins from switches along edges.
    /*
    skip(pin) {
      return ((this.tile.type == TILE.top && (pin == 0 || pin == 1)) || (this.tile.type == TILE.bottom && (pin == 4 || pin == 5)) ||
          (this.tile.type == TILE.left && (pin == 6 || pin == 7)) || (this.tile.type == TILE.right && (pin == 2 || pin == 3)));
    }
    */

    isInside(x, y) {
        return x >= this.screenPt.x && x < this.screenPt.x + this.W && y >= this.screenPt.y && y < this.screenPt.y + this.H;
    }

    info() {
        return "Switch " + this.name + " " + this.state + " " + this.wires;
    }
}
