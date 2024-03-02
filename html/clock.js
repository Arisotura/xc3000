
class ClockDecoders
{
    constructor()
    {
        this.clocks = {};
        this.clocksFromG = {};
        this.clockLines = [];

        this.clocks['GCLK'] = new ClockBuf('GCLK');
        this.clocks['ACLK'] = new ClockBuf('ACLK');
        this.clocks['OSC'] = new ClockOsc('OSC');

        this.generateClockLines();
    }

    genCoords(name)
    {
        name = name.replaceAll('col.*', 'col.'+letters[curBitstream.family.cols])
            .replaceAll('row.*', 'row.'+letters[curBitstream.family.rows]);

        return name;
    }

    generateClockLines()
    {
        var path, path2, pips;

        // top side

        path = new Path(null, null, 'dest', 'col.A.local.4:row.A.local.6', 'H');
        pips = ['col.A.local.4:0', 'col.A.local.5:1', ['col.A.local.11', 'row.A.long.2:2'],
            'T:+0', 'row.A.local.2:3', 'row.A.local.10:4', 'T:+0'
        ];
        path.appendPipList(pips, this.genCoords.bind(this));
        pipDecoder.addPipsToPath('col.A.local.11:row.A.local.10', this.genCoords('col.*.local.1:row.A.local.10'), path);
        this.clockLines.push(path);

        path = new Path(null, null, 'dest', this.genCoords('col.*.local.9:row.A.local.3'), 'V');
        pips = ['row.A.local.3:0', 'row.A.local.5:1', 'T:row.A.local.7',
            'col.*.long.1:2', 'col.*.local.5:3', 'T:+1', 'T:+2', 'T:+9', 'row.A.local.11:4', 'T:+0', '-8:5'
        ];
        path.appendPipList(pips, this.genCoords.bind(this));
        pipDecoder.addPipsToPath(this.genCoords('col.*.local.1:row.A.local.11'), 'col.A.long.6:row.A.local.11', path);
        this.clockLines.push(path);

        // bottom side

        path = new Path(null, null, 'dest', this.genCoords('col.A.local.1:row.*.local.9'), 'H');
        pips = ['col.A.local.1:0', 'T:col.A.local.7', ['+0', 'col.A.long.2:1'],
            'row.*.local.1:2', 'row.*.local.3:3', 'row.*.local.7:4'
        ];
        if (!curBitstream.family.swapBottomClk)
            pips.push(['+0', '-7:5']);
        pips.push('T:+0');
        path.appendPipList(pips, this.genCoords.bind(this));
        pipDecoder.addPipsToPath(this.genCoords('col.A.local.7:row.*.local.7'), this.genCoords('col.*.local.1:row.*.local.7'), path);
        this.clockLines.push(path);

        path = new Path(null, null, 'dest', this.genCoords('col.*.local.10:row.*.long.2'), 'V');
        pips = ['row.*.long.2:0', ['row.*.local.8', 'col.*.local.1:1', 'col.*.local.2:2'],
            'row.*.local.4:3', 'row.*.local.6:4'
        ];
        if (!curBitstream.family.swapBottomClk)
            pips.push(['+0', '+2:5']);
        pips.push('T:+0');
        path.appendPipList(pips, this.genCoords.bind(this));
        pipDecoder.addPipsToPath(this.genCoords('col.*.local.1:row.*.local.6'), this.genCoords('col.A.local.7:row.*.local.6'), path);
        this.clockLines.push(path);

        // left side

        path = new Path(null, null, 'dest', 'col.A.local.3:row.A.local.7', 'H');
        pips = ['col.A.local.3:0', 'col.A.local.5:1', 'T:col.A.local.7', 'row.A.long.2:2',
            'row.A.local.1:3', 'T:+5', 'col.A.local.12:4', 'T:+0', 'row.A.local.6:5'
        ];
        path.appendPipList(pips, this.genCoords.bind(this));
        pipDecoder.addPipsToPath('col.A.local.12:row.A.local.6', this.genCoords('col.A.local.12:row.*.local.5'), path);
        this.clockLines.push(path);

        path = new Path(null, null, 'dest', this.genCoords('col.A.local.10:row.*.local.2'), 'V');
        pips = ['row.*.local.2:0', 'row.*.local.1:1', 'T:row.*.local.10', 'col.A.long.2:2', 'col.A.local.2:3', 'col.A.local.13:4'];
        path.appendPipList(pips, this.genCoords.bind(this));
        path2 = path.appendJunction('+0');
        pipDecoder.addPipsToPath(this.genCoords('col.A.local.13:row.*.local.10'), this.genCoords('col.A.local.13:row.*.local.5'), path2);
        path.appendTurn('+0');
        pipDecoder.addPipsToPath(this.genCoords('col.A.local.13:row.*.local.10'), 'col.A.local.13:row.A.long.2', path);
        this.clockLines.push(path);

        // right side

        path = new Path(null, null, 'dest', this.genCoords('col.*.long.1:row.A.local.9'), 'H');
        pips = ['col.*.long.1:0', ['col.*.local.8', 'row.A.local.5:1', 'row.A.local.4:2'],
            'col.*.local.4:3', 'T:+2', 'T:-2', 'col.*.local.6:4'
        ];
        path.appendPipList(pips, this.genCoords.bind(this));
        path2 = path.appendJunction('+0');
        pipDecoder.addPipsToPath(this.genCoords('col.*.local.6:row.A.local.8'), this.genCoords('col.*.local.6:row.A.local.5'), path2);
        path.appendTurn('+0');
        pipDecoder.addPipsToPath(this.genCoords('col.*.local.6:row.A.local.8'), this.genCoords('col.*.local.6:row.*.local.1'), path);
        this.clockLines.push(path);

        path = new Path(null, null, 'dest', this.genCoords('col.*.local.3:row.*.local.9'), 'H');
        pips = ['col.*.local.3:0', 'col.*.local.1:1', 'T:col.*.local.9',
            'row.*.long.2:2', 'row.*.local.5:3', 'T:row.*.local.7', 'col.*.local.7:4', 'T:+0',
            '+4:5'
        ];
        path.appendPipList(pips, this.genCoords.bind(this));
        pipDecoder.addPipsToPath(this.genCoords('col.*.local.7:row.*.local.5'), this.genCoords('col.*.local.7:row.A.local.5'), path);
        this.clockLines.push(path);
    }

    startDecode() {
        //Object.entries(this.tribufs).forEach(([k, s]) => s.startDecode());
    }

    getFromG(name) {
        return this.clocksFromG[name];
    }

    get(name) {
        return this.clocks[name];
    }

    decode() {}

    renderBackground(ctx)
    {
        Object.entries(this.clocks).forEach(([name, obj]) => obj.renderBackground(ctx));
        this.clockLines.forEach((line) => line.draw(ctx));
    }

    render(ctx)
    {
        Object.entries(this.clocks).forEach(([name, obj]) => obj.render(ctx));
    }
}


// a clock buffer
class ClockBuf
{
    constructor(name)
    {
        this.name = name;

        // G coords point to the output pin of the buffer
        this.gPt = getGCoords(this.name);
        this.screenPt = getSCoords(this.gPt);
        this.screenPt.x -= 4;
        if (this.name == 'GCLK')
        {
            this.tile = 'AA';
            this.ydir = 1; // bottom to top
        }
        else if (this.name == 'ACLK')
        {
            this.tile = letters[curBitstream.family.rows] + letters[curBitstream.family.cols];
            this.ydir = 0; // top to bottom
        }
        if (this.ydir == 0) this.screenPt.y -= 4;
        this.W = 8;
        this.H = 4;

        this.generateClockPips();
    }

    genCoords(name)
    {
        name = name.replaceAll('col.*', 'col.'+letters[curBitstream.family.cols])
            .replaceAll('row.*', 'row.'+letters[curBitstream.family.rows]);

        return name;
    }

    generateClockPips()
    {
        var ipips = [], opips = [];

        var yoff = this.ydir ? -1 : 1;
        this.oPath = new Path(this, 'O', 'source', {x: this.gPt.x, y: this.gPt.y}, 'V');
        this.iPath = new Path(this, 'I', 'dest', {x: this.gPt.x, y: this.gPt.y + yoff}, 'V');

        if (this.name == 'GCLK')
        {
            var kbranch = ['-3', 'col.A.long.6:2'];
            for (var i = 1; i < curBitstream.family.cols; i++)
                kbranch.push('col.'+letters[i]+'.long.0:'+(i+2));
            kbranch.push('+17', 'col.K.local.6:1');

            opips.push(['+9', 'T:-16', ['-6', 'col.A.local.12'], '-7', kbranch, 'T:5', 'T:+3',
                    curBitstream.family.swapBottomClk?'row.*.local.6':'row.*.local.7'],
                'row.A.local.10:0');

            ipips.push('-1:4', ['-1', '+8:5', 'T:+2', 'row.A.long.2:6', 'row.A.local.2:7'],
                '-3:3', ['-4', 'col.A.long.1:1', 'col.A.local.4:0'], 'row.A.long.3:2');
        }
        else if (this.name == 'ACLK')
        {
            opips.push(['4', ['+4', curBitstream.family.swapBottomClk?'row.*.local.7':'row.*.local.6'],
                ['+11', '+14',  'row.A.local.11'], 'col.K.local.7'], 'T:+0', '-4');
            for (var i = curBitstream.family.cols-1; i >= 1; i--)
                opips.push('col.'+letters[i]+'.long.3:'+i);
            opips.push('-27', 'col.A.long.5:0', 'col.A.local.13');

            ipips.push(['+2', '-1:4', '-1:5'], 'T:+0',
                ['+2', '-3:6', 'T:-3', 'T:-1', 'row.*.long.2:7', 'row.*.local.2:8'],
                'col.*.long.2:3', 'col.*.local.4:2', 'T:+2', 'row.*.long.1:1', '+10:0');
        }

        this.oPath.appendPipList(opips, this.genCoords.bind(this));
        this.iPath.appendPipList(ipips, this.genCoords.bind(this));
    }

    startDecode() {
        //
    }

    renderBackground(ctx)
    {
        ctx.beginPath();
        if (this.ydir == 1)
        {
            ctx.moveTo(this.screenPt.x, this.screenPt.y+4);
            ctx.lineTo(this.screenPt.x+8, this.screenPt.y+4);
            ctx.lineTo(this.screenPt.x+4, this.screenPt.y);
            ctx.lineTo(this.screenPt.x, this.screenPt.y+4);
        }
        else
        {
            ctx.moveTo(this.screenPt.x, this.screenPt.y);
            ctx.lineTo(this.screenPt.x+8, this.screenPt.y);
            ctx.lineTo(this.screenPt.x+4, this.screenPt.y+4);
            ctx.lineTo(this.screenPt.x, this.screenPt.y);
        }
        ctx.moveTo(this.screenPt.x+4, this.screenPt.y);
        ctx.lineTo(this.screenPt.x+4, this.screenPt.y-2);
        ctx.moveTo(this.screenPt.x+4, this.screenPt.y+4);
        ctx.lineTo(this.screenPt.x+4, this.screenPt.y+6);
        ctx.stroke();

        this.oPath.draw(ctx);
        this.iPath.draw(ctx);
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


// the clock oscillator
class ClockOsc
{
    constructor(name)
    {
        this.name = name;
        this.tile = letters[curBitstream.family.rows] + letters[curBitstream.family.cols];

        // G coords point to the output pin of the buffer
        this.gPt = getGCoords(this.name);
        this.screenPt = getSCoords(this.gPt);
        this.screenPt.x -= 4;
        this.screenPt.y -= 12;
        this.W = 8;
        this.H = 12;

        this.generateClockPips();
    }

    genCoords(name)
    {
        name = name.replaceAll('col.*', 'col.'+letters[curBitstream.family.cols])
            .replaceAll('row.*', 'row.'+letters[curBitstream.family.rows]);

        return name;
    }

    generateClockPips()
    {
        var opips = [];

        var yoff = this.ydir ? -1 : 1;
        this.oPath = new Path(this, 'O', 'source', {x: this.gPt.x, y: this.gPt.y}, 'V');

        opips.push(['-1', ['+4', 'row.*.local.4:1'], 'col.*.local.4:0'], '-2');

        this.oPath.appendPipList(opips, this.genCoords.bind(this));
    }

    startDecode() {
        //
    }

    renderBackground(ctx)
    {
        ctx.strokeRect(this.screenPt.x, this.screenPt.y, this.W, this.H);
        ctx.beginPath();
        ctx.moveTo(this.screenPt.x+4, this.screenPt.y+12);
        ctx.lineTo(this.screenPt.x+4, this.screenPt.y+14);
        ctx.stroke();

        this.oPath.draw(ctx);
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
