
class ClockDecoders
{
    constructor()
    {
        this.clocks = {};
        this.clocksFromG = {};

        this.clocks['GCLK'] = new ClockBuf('GCLK');
        this.clocks['ACLK'] = new ClockBuf('ACLK');
        this.clocks['OSC'] = new ClockOsc('OSC');
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
        name = name.replaceAll('**', this.tile)
            .replaceAll('col.*', 'col.'+this.tile[1])
            .replaceAll('row.*', 'row.'+this.tile[0]);

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
            ipips.push('-1:4', ['-1', '+8:5', 'T:+2', 'row.*.long.2:6', 'row.*.local.2:7'],
                '-3:3', ['-4', 'col.*.long.1:1', 'col.*.local.4:0'], 'row.*.long.3:2');
        }
        else if (this.name == 'ACLK')
        {
            ipips.push(['+2', '-1:4', '-1:5'], 'T:+0',
                ['+2', '-3:6', 'T:-3', 'T:-1', 'row.*.long.2:7', 'row.*.local.2:8'],
                'col.*.long.2:3', 'col.*.local.4:2', 'T:+2', 'row.*.long.1:1', '+10:0');
        }

        /*opips.push('row.*.long.'+(this.row==0 ? 3:this.num)+':0');

        if (this.col == 0 && this.num == 1 && this.row != 0 && this.row != curBitstream.family.rows)
            ipips.push('T:+11');
        else
            ipips.push(this.ydir ? 'T:-1' : 'T:+1');
        if (this.row == 0 || this.num == 2)
            ipips.push('col.*.local.2:0');
        else
            ipips.push('col.*.local.4:0');*/

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
        name = name.replaceAll('**', this.tile)
            .replaceAll('col.*', 'col.'+this.tile[1])
            .replaceAll('row.*', 'row.'+this.tile[0]);

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
