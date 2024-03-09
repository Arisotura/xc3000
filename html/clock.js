
class ClockDecoders
{
    constructor()
    {
        this.clocks = {};
        this.clocksFromG = {};
        this.clockLines = {};

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
            'T:+0', 'row.A.local.2:3', 'row.A.local.10:4', 'T:+0', '+1:5'
        ];
        path.appendPipList(pips, this.genCoords.bind(this));
        pipDecoder.addPipsToPath('col.A.local.11:row.A.local.10', this.genCoords('col.*.local.1:row.A.local.10'), path);
        this.clockLines['topleft'] = path;

        path = new Path(null, null, 'dest', this.genCoords('col.*.local.9:row.A.local.3'), 'V');
        pips = ['row.A.local.3:3', 'row.A.local.5:2', 'T:row.A.local.7',
            'col.*.long.1:1', 'col.*.local.5:0', 'T:+1', 'T:+2', 'T:+9', 'row.A.local.11:4', 'T:+0', '-8:5'
        ];
        path.appendPipList(pips, this.genCoords.bind(this));
        pipDecoder.addPipsToPath(this.genCoords('col.*.local.1:row.A.local.11'), 'col.A.long.6:row.A.local.11', path);
        this.clockLines['topright'] = path;

        // bottom side

        path = new Path(null, null, 'dest', this.genCoords('col.A.local.1:row.*.local.9'), 'H');
        pips = ['col.A.local.1:0', 'T:col.A.local.7', ['+0', 'col.A.long.2:1'],
            'row.*.local.1:2', 'row.*.local.3:3', 'row.*.local.7:4',
            ['+0', '-7:5'], 'T:+0'
        ];
        path.appendPipList(pips, this.genCoords.bind(this));
        pipDecoder.addPipsToPath(this.genCoords('col.A.local.7:row.*.local.7'), this.genCoords('col.*.local.1:row.*.local.7'), path);
        this.clockLines['bottomleft'] = path;

        path = new Path(null, null, 'dest', this.genCoords('col.*.local.10:row.*.long.2'), 'V');
        pips = ['row.*.long.2:3', ['row.*.local.8', 'col.*.local.1:2', 'col.*.local.2:1'],
            'row.*.local.4:0', 'row.*.local.6:4',
            ['+0', '+2:5'], 'T:+0'
        ];
        path.appendPipList(pips, this.genCoords.bind(this));
        pipDecoder.addPipsToPath(this.genCoords('col.*.local.1:row.*.local.6'), this.genCoords('col.A.local.7:row.*.local.6'), path);
        this.clockLines['bottomright'] = path;

        // left side

        path = new Path(null, null, 'dest', 'col.A.local.3:row.A.local.7', 'H');
        pips = ['col.A.local.3:0', 'col.A.local.5:1', 'T:col.A.local.7', 'row.A.long.2:2',
            'row.A.local.1:3', 'T:+5', 'col.A.local.12:4', 'T:+0', 'row.A.local.6:5'
        ];
        path.appendPipList(pips, this.genCoords.bind(this));
        pipDecoder.addPipsToPath('col.A.local.12:row.A.local.6', this.genCoords('col.A.local.12:row.*.local.5'), path);
        this.clockLines['leftupper'] = path;

        path = new Path(null, null, 'dest', this.genCoords('col.A.local.10:row.*.local.2'), 'V');
        pips = ['row.*.local.2:3', 'row.*.local.1:2', 'T:row.*.local.10', 'col.A.long.2:1', 'col.A.local.2:0', 'col.A.local.13:4'];
        path.appendPipList(pips, this.genCoords.bind(this));
        path2 = path.appendJunction('+0');
        pipDecoder.addPipsToPath(this.genCoords('col.A.local.13:row.*.local.10'), this.genCoords('col.A.local.13:row.*.local.5'), path2);
        path2.appendPip('4:5');
        path.appendTurn('+0');
        pipDecoder.addPipsToPath(this.genCoords('col.A.local.13:row.*.local.10'), 'col.A.local.13:row.A.long.2', path);
        this.clockLines['leftlower'] = path;

        // right side

        path = new Path(null, null, 'dest', this.genCoords('col.*.long.1:row.A.local.9'), 'H');
        pips = ['col.*.long.1:0', ['col.*.local.8', 'row.A.local.5:1', 'row.A.local.4:2'],
            'col.*.local.4:3', 'T:+2', 'T:-2', 'col.*.local.6:4',
        ];
        path.appendPipList(pips, this.genCoords.bind(this));
        path2 = path.appendJunction('+0');
        path2.appendPip('+1:5');
        pipDecoder.addPipsToPath(this.genCoords('col.*.local.6:row.A.local.8'), this.genCoords('col.*.local.6:row.A.local.5'), path2);
        path.appendTurn('+0');
        pipDecoder.addPipsToPath(this.genCoords('col.*.local.6:row.A.local.8'), this.genCoords('col.*.local.6:row.*.local.1'), path);
        this.clockLines['rightupper'] = path;

        path = new Path(null, null, 'dest', this.genCoords('col.*.local.3:row.*.local.9'), 'H');
        pips = ['col.*.local.3:3', 'col.*.local.1:2', 'T:col.*.local.9',
            'row.*.long.2:1', 'row.*.local.5:0', 'T:row.*.local.7', 'col.*.local.7:4', 'T:+0',
            '+4:5'
        ];
        path.appendPipList(pips, this.genCoords.bind(this));
        pipDecoder.addPipsToPath(this.genCoords('col.*.local.7:row.*.local.5'), this.genCoords('col.*.local.7:row.A.local.5'), path);
        this.clockLines['rightlower'] = path;
    }

    decode()
    {
        Object.entries(this.clocks).forEach(([name, obj]) => obj.decode());

        // decode input muxes for clock lines
        // the muxes are split in two parts:
        // first bit determines whether the clock is flipped
        // second bit determines whether the direct input (PIP #5) or the mux branch (PIP #4) is used
        // then 4 final bits that determine which input of the branch is active

        var o = getTileOffset(curBitstream.family.cols, curBitstream.family.rows);

        var inputmux = {0x5:0, 0x3:1, 0x6:2, 0xF:3};
        var inputbits = {};
        inputbits['topleft'] = [3+2, 4,  3+2, 5,  3+3, 7+1,  3, 7+1,  3+3, 7+4,  3+3, 7+7];
        inputbits['topright'] = [3+3, o.x+5,  3+3, o.x+4,  3+3, o.x+6,  3+4, o.x+8,  3+4, o.x+6,  3+3, o.x+9];
        inputbits['bottomleft'] = [o.y+3, 6,  o.y+3, 1,  o.y+3, 2,  o.y+3, 3,  o.y+3, 4,  o.y+3, 5];
        inputbits['bottomright'] = [o.y+4, o.x+2,  o.y+3, o.x+4,  o.y+3, o.x+6,  o.y+3, o.x+7,  o.y+3, o.x+5,  o.y+3, o.x+8];
        inputbits['leftupper'] = [3+2, 0,  3+2, 3,  3+2, 7+1,  3+2, 7+3,  3+3, 7+3,  3+3, 7+6];
        inputbits['leftlower'] = [o.y, 0,  o.y, 1,  o.y, 2,  o.y, 3,  o.y, 4,  o.y, 5];
        inputbits['rightupper'] = [3+3, o.x+12,  3+3, o.x+11,  3+4, o.x+10,  3+3, o.x+8,  3+3, o.x+7,  3+3, o.x+10];
        inputbits['rightlower'] = [o.y, o.x+13,  o.y, o.x+12,  o.y, o.x+8,  o.y, o.x+7,  o.y, o.x+9,  o.y, o.x+10];

        Object.entries(inputbits).forEach(([k,v]) =>
        {
            var ibits = inputbits[k];
            var bits = 0;
            for (var i = 0; i < ibits.length; i+=2)
            {
                var bit = curBitstream.data[ibits[i]][ibits[i+1]];
                bits |= (bit << (i>>1));
            }

            var muxval = inputmux[bits >> 2];
            if (typeof muxval != 'undefined')
                this.clockLines[k].setPipStatus(muxval, 1);
            else
                console.log('clock line '+k+': bad mux '+bits.toString(2));

            this.clockLines[k].setPipStatus((bits&0x2) ? 5:4, 1);
            iobDecoders.setClockInvert(k, bits&0x1);
        });
    }

    getFromG(name) {
        return this.clocksFromG[name];
    }

    get(name) {
        return this.clocks[name];
    }

    renderBackground(ctx)
    {
        Object.entries(this.clocks).forEach(([name, obj]) => obj.renderBackground(ctx));

        if (viewSettings.showAllPips)
        {
            Object.entries(this.clockLines).forEach(([key, line]) => line.draw(ctx));
        }
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
            var kbranch = ['-3', 'col.A.long.6:0', ['+3', 'T:+7', '-1']];
            for (var i = 1; i < curBitstream.family.cols; i++)
                kbranch.push('col.'+letters[i]+'.long.0:'+i);
            kbranch.push('+17', 'col.*.local.6');

            opips.push(['+9', 'T:-16', ['-6', 'col.A.local.12'], '-7', kbranch, 'T:5', 'T:+3', 'row.*.local.7'],
                'row.A.local.10');

            ipips.push('-1:4', ['-1', '+8:5', 'T:+2', 'row.A.long.2:6', 'row.A.local.2:7'],
                '-3:3', ['-4', 'col.A.long.1:1', 'col.A.local.4:0'], 'row.A.long.3:2');
        }
        else if (this.name == 'ACLK')
        {
            opips.push(['4', ['+4', 'row.*.local.6'],
                ['+11', '+14',  'row.A.local.11'], 'col.*.local.7'], 'T:+0', '-4');
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

    decode()
    {
        var outputbits = [];
        var inputbits, inputmux;

        if (this.name == 'GCLK')
        {
            for (var i = 0; i < curBitstream.family.cols; i++)
            {
                var o = getTileOffset(i, 0);
                outputbits.push(3+1, o.x+4);
            }

            inputbits = [3+2, 7,  3+3, 7,  3+3, 7+2,  3+3, 7+5,  3+3, 7+8,  3+3, 7+9,  3+4, 7,  3+5, 3];
            inputmux = {0xDD:0, 0xDE:1, 0x9F:2, 0x7F:3, 0xD7:4, 0xCF:5, 0xDB:6, 0xFF:7};
        }
        else if (this.name == 'ACLK')
        {
            for (var i = 0; i < curBitstream.family.cols; i++)
            {
                var o = getTileOffset(i, curBitstream.family.rows);
                outputbits.push(o.y+3, o.x+4);
            }

            var o = getTileOffset(curBitstream.family.cols, curBitstream.family.rows);

            inputbits = [o.y+1, o.x+12,  o.y+2, o.x+6,  o.y+2, o.x+7,  o.y+2, o.x+8,  o.y+2, o.x+9,  o.y+2, o.x+10,  o.y+2, o.x+11,  o.y+3, o.x+9,  o.y+3, o.x+10];
            inputmux = {0x1FE:0, 0x19F:1, 0x13F:2, 0x1BB:3, 0x0BF:4, 0x1AF:5, 0x1B7:6, 0x1BD:7, 0x1FF:8};
        }

        for (var i = 0; i < outputbits.length; i+=2)
        {
            var bit = curBitstream.data[outputbits[i]][outputbits[i+1]];
            if (!bit)
                this.oPath.setPipStatus(i>>1, 1);
        }

        var bits = 0;
        for (var i = 0; i < inputbits.length; i+=2)
        {
            var bit = curBitstream.data[inputbits[i]][inputbits[i+1]];
            bits |= (bit << (i>>1));
        }

        var mux = inputmux[bits];
        if (typeof mux == 'undefined')
        {
            console.log(this.name+': bad mux I=' + bits);
            return;
        }

        // enable the corresponding PIP
        this.iPath.setPipStatus(mux, 1);
    }

    describePin(pin)
    {
        return this.name + '.' + pin;
    }

    signalConnection()
    {
        // TODO
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

        if (viewSettings.showAllPips)
        {
            this.oPath.draw(ctx);
            this.iPath.draw(ctx);
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

    decode()
    {
        var offset = getTileOffset(curBitstream.family.cols, curBitstream.family.rows);

        var x0 = curBitstream.data[offset.y+1][offset.x+9];
        var x1 = curBitstream.data[offset.y+1][offset.x+10];

        if (!x0) this.oPath.setPipStatus(0, 1);
        if (!x1) this.oPath.setPipStatus(1, 1);
    }

    describePin(pin)
    {
        return this.name + '.' + pin;
    }

    signalConnection()
    {
        // TODO
    }

    renderBackground(ctx)
    {
        ctx.strokeRect(this.screenPt.x, this.screenPt.y, this.W, this.H);
        ctx.beginPath();
        ctx.moveTo(this.screenPt.x+4, this.screenPt.y+12);
        ctx.lineTo(this.screenPt.x+4, this.screenPt.y+14);
        ctx.stroke();

        if (viewSettings.showAllPips)
        {
            this.oPath.draw(ctx);
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
