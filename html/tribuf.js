
class TriBufDecoders
{
    constructor()
    {
        this.tribufs = {};
        this.tribufsFromG = {};

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
        console.log(this.tribufs);
    }

    startDecode() {
        //Object.entries(this.tribufs).forEach(([k, s]) => s.startDecode());
    }

    getFromG(name) {
        return this.tribufsFromG[name];
    }

    get(name) {
        return this.tribufs[name];
    }

    decode() {}

    renderBackground(ctx)
    {
        Object.entries(this.tribufs).forEach(([name, obj]) => obj.renderBackground(ctx));
    }

    render(ctx)
    {
        Object.entries(this.tribufs).forEach(([name, obj]) => obj.render(ctx));
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

        this.generateTribufPips();
    }

    genCoords(name)
    {
        name = name.replaceAll('**', this.tile)
            .replaceAll('col.*', 'col.'+this.tile[1])
            .replaceAll('col.+', 'col.'+letters[this.col+1])
            .replaceAll('row.*', 'row.'+this.tile[0])
            .replaceAll('row.+', 'row.'+letters[this.row+1]);

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

        opips.push('row.*.long.'+(this.row==0 ? 3:this.num)+':0');

        if (this.col == 0 && this.num == 1 && this.row != 0 && this.row != curBitstream.family.rows)
            ipips.push('T:+11');
        else
            ipips.push(this.ydir ? 'T:-1' : 'T:+1');
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

    startDecode() {
        //
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

        this.oPath.draw(ctx);
        this.iPath.draw(ctx);
        this.tPath.draw(ctx);
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
