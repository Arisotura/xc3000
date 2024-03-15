
class TriBufDecoders
{
    constructor()
    {
        this.tribufs = {};
        this.tribufsFromG = {};

        this.lineNets = {};

        var fam = curBitstream.family;
        for (let i = 0; i <= fam.rows; i++)
        {
            for (let j = 0; j <= fam.cols; j++)
            {
                var name = 'TBUF.' + letters[i] + letters[j] + '.1';
                var tb = new TriBuf(i, j, name);
                this.tribufs[name] = tb;

                if (i != 0 && i != fam.rows)
                {
                    name = 'TBUF.' + letters[i] + letters[j] + '.2';
                    tb = new TriBuf(i, j, name);
                    this.tribufs[name] = tb;
                }
            }
        }
    }

    decode()
    {
        Object.entries(this.tribufs).forEach(([k, s]) => s.decode());
    }

    traceFromOutputs()
    {
        this.lineNets = {};
        Object.entries(this.tribufs).forEach(([k, s]) => s.traceFromOutputs());
    }

    addNetToLine(net, line)
    {
        if (net.isEmpty()) return net;

        var orignet = this.lineNets[line];
        if (!orignet)
            this.lineNets[line] = net;
        else
            this.lineNets[line].merge(net);

        return this.lineNets[line];
    }

    getFromG(name) {
        return this.tribufsFromG[name];
    }

    get(name) {
        return this.tribufs[name];
    }

    renderBackground(ctx)
    {
        Object.entries(this.tribufs).forEach(([name, obj]) => obj.renderBackground(ctx));
    }

    render(ctx)
    {
        Object.entries(this.tribufs).forEach(([name, obj]) => obj.render(ctx));
        Object.entries(this.lineNets).forEach(([line, net]) => net.draw(ctx));
    }
}


// a tri-state buffer
class TriBuf
{
    constructor(row, col, name)
    {
        // TBUF.xx.y
        this.row = row;
        this.col = col;
        this.name = name;
        this.tile = name[5] + name[6];
        this.num = parseInt(name[8], 10);

        this.line = 'row.'+this.tile[0]+'.long.'+(this.row==0 ? 3:this.num);

        // G coords point to the output pin of the buffer
        this.gPt = getGCoords(this.name);
        this.screenPt = getSCoords(this.gPt);
        this.screenPt.x -= 2;
        if (this.num == 2)
        {
            this.xdir = 0;
            this.ydir = 1; // bottom to top
        }
        else if (this.row == curBitstream.family.rows)
        {
            this.xdir = (this.col == 0) ? 1 : 0;
            this.ydir = (this.col == curBitstream.family.cols) ? 0 : 1; // bottom to top
        }
        else if (this.num == 1)
        {
            this.xdir = 0; // I/Os extending towards right
            this.ydir = 0; // top to bottom
        }
        if (this.ydir == 0) this.screenPt.y -= 4;
        this.W = 4;
        this.H = 4;

        this.enabled = false;

        this.generateTribufPips();
    }

    genCoords(name)
    {
        name = name.replaceAll('**', this.tile)
            .replaceAll('col.*', 'col.'+this.tile[1])
            .replaceAll('row.*', 'row.'+this.tile[0]);

        return name;
    }

    generateTribufPips()
    {
        var ipips = [], tpips = [], opips = [];

        var xoff = this.xdir ? -1 : 1;
        var yoff = this.ydir ? -1 : 1;
        this.oPath = new Path(this, 'O', 'source', {x: this.gPt.x, y: this.gPt.y}, 'V');
        this.iPath = new Path(this, 'I', 'dest', {x: this.gPt.x, y: this.gPt.y + yoff}, 'V');
        this.tPath = new Path(this, 'T', 'dest', {x: this.gPt.x + xoff, y: this.gPt.y + yoff}, 'H');

        opips.push(this.line+':0');

        if (curBitstream.family.extraInter)
        {
            if (this.col == 0)
            {
                if (this.num == 1 && this.row == 0)
                    ipips.push('T:+1', ['+0', '+6:1']);
                else if (this.num == 1 && this.row == curBitstream.family.rows)
                    ipips.push('T:-1', '-14:1');
                else if (this.num == 1)
                    ipips.push('+8:1', 'T:+3');
                else
                    ipips.push('T:-1', ['+0', '-2:1']);
            }
            else if (this.col == 1)
            {
                if (this.row == 0)
                    ipips.push('T:+1', '+6:1');
                else if (this.row == curBitstream.family.rows)
                    ipips.push(['-1', '-1:1'], 'T:+0');
                else
                {
                    if (this.ydir) ipips.push('T:-1', '+2:1');
                    else           ipips.push('T:+1', '+2:1');
                }
            }
            else if (this.col != curBitstream.family.cols)
            {
                if (this.row == 0)
                    ipips.push(['+1', 'T:-4', '-2:1'], 'T:+0');
                else if (this.row == curBitstream.family.rows)
                    ipips.push(['-1', '-2:1'], 'T:+0');
                else
                {
                    if (this.ydir) ipips.push(['-1', 'T:-3', '-4:1'], 'T:+0');
                    else           ipips.push('T:+1', ['+0', 'T:+1', '-1:1']);
                }
            }
            else
                ipips.push(this.ydir ? 'T:-1' : 'T:+1');
        }
        else
        {
            if (this.col == 0 && this.num == 1 && this.row != 0 && this.row != curBitstream.family.rows)
                ipips.push('T:+11');
            else
                ipips.push(this.ydir ? 'T:-1' : 'T:+1');
        }
        if (this.row == 0 || this.num == 2)
            ipips.push('col.*.local.2:0');
        else
            ipips.push('col.*.local.4:0');

        if (this.col == curBitstream.family.cols)
            tpips.push('col.*.long.1:1');
        else if (this.col == 0 && this.xdir == 1)
            tpips.push('col.*.long.2:1');
        if (this.row == 0 || this.num == 2)
            tpips.push('col.*.local.5:0');
        else
            tpips.push('col.*.local.1:0');
        if (this.col == 0 && this.xdir == 0)
            tpips.push('col.*.long.2:1');
        else if (this.col != 0 && this.col != curBitstream.family.cols)
            tpips.push('col.*.long.1:1');

        this.oPath.appendPipList(opips, this.genCoords.bind(this));
        this.iPath.appendPipList(ipips, this.genCoords.bind(this));
        this.tPath.appendPipList(tpips, this.genCoords.bind(this));
    }

    decode()
    {
        // T inputs: #0 on local lines, #1 on long lines

        this.enabled = false;

        var row, num;
        if (this.row == 0 || this.num == 2)
        {
            row = this.row;
            num = 0;
        }
        else
        {
            row = this.row - 1;
            num = 1;
        }

        var offset = getTileOffset(this.col, row);

        var enable, tsel, isel;
        if (!num)
        {
            if (this.col == curBitstream.family.cols)
            {
                enable = curBitstream.data[offset.y + 2][offset.x + 1];
                tsel = curBitstream.data[offset.y + 2][offset.x + 2];
                isel = 1;
            }
            else
            {
                enable = curBitstream.data[offset.y + 2][offset.x + 1];
                tsel = curBitstream.data[offset.y + 2][offset.x + 4];
                isel = curBitstream.data[offset.y + 2][offset.x + 3];
            }
        }
        else
        {
            if (this.col == curBitstream.family.cols)
            {
                enable = curBitstream.data[offset.y + 5][offset.x + 3];
                tsel = curBitstream.data[offset.y + 5][offset.x + 2];
                isel = 1;
            }
            else
            {
                enable = curBitstream.data[offset.y + 2][offset.x + 11];
                tsel = curBitstream.data[offset.y + 2][offset.x + 8];
                isel = curBitstream.data[offset.y + 2][offset.x + 13];
            }
        }

        if (!curBitstream.family.extraInter)
            isel = 1;

        if (!num || this.col==0)
            tsel = tsel?0:1;

        if (enable == 0)
        {
            this.oPath.setPipStatus(0, 1);
            this.iPath.setPipStatus(isel?0:1, 1);
            this.tPath.setPipStatus(tsel, 1);
            this.enabled = true;
        }

        var pins = ['o', 'i', 't'];
        pins.forEach((pin) => self[pin+'Net'] = null);
    }

    describePin(pin)
    {
        return this.name + '.' + pin;
    }

    pinEnabled(pin)
    {
        return this.enabled;
    }

    signalConnection(pin)
    {
    }

    traceFromOutputs()
    {
        var net = this.oPath.traceFrom();
        this.oNet = tribufDecoders.addNetToLine(net, this.line);
    }

    renderBackground(ctx)
    {
        ctx.beginPath();
        if (this.ydir == 1)
        {
            ctx.moveTo(this.screenPt.x, this.screenPt.y+4);
            ctx.lineTo(this.screenPt.x+4, this.screenPt.y+4);
            ctx.lineTo(this.screenPt.x+2, this.screenPt.y);
            ctx.lineTo(this.screenPt.x, this.screenPt.y+4);
        }
        else
        {
            ctx.moveTo(this.screenPt.x, this.screenPt.y);
            ctx.lineTo(this.screenPt.x+4, this.screenPt.y);
            ctx.lineTo(this.screenPt.x+2, this.screenPt.y+4);
            ctx.lineTo(this.screenPt.x, this.screenPt.y);
        }
        ctx.moveTo(this.screenPt.x+2, this.screenPt.y);
        ctx.lineTo(this.screenPt.x+2, this.screenPt.y-2);
        ctx.moveTo(this.screenPt.x+2, this.screenPt.y+4);
        ctx.lineTo(this.screenPt.x+2, this.screenPt.y+6);
        if (this.xdir == 1)
        {
            ctx.moveTo(this.screenPt.x, this.screenPt.y+this.ydir*4);
            ctx.lineTo(this.screenPt.x-2, this.screenPt.y+this.ydir*4);
        }
        else
        {
            ctx.moveTo(this.screenPt.x+4, this.screenPt.y+this.ydir*4);
            ctx.lineTo(this.screenPt.x+6, this.screenPt.y+this.ydir*4);
        }
        ctx.stroke();

        if (viewSettings.showAllPips)
        {
            this.oPath.draw(ctx);
            this.iPath.draw(ctx);
            this.tPath.draw(ctx);
        }
    }

    render(ctx)
    {
    }

    isInside(x, y) {
        return x >= this.screenPt.x && x < this.screenPt.x + this.W && y >= this.screenPt.y && y < this.screenPt.y + this.H;
    }

    info() {
        return "TODO";
    }
}
