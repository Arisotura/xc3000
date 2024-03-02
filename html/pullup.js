
class PullUpDecoders
{
    constructor()
    {
        this.pullups = {};
        this.pullupsFromG = {};

        var fam = curBitstream.family;
        for (let i = 0; i <= fam.rows; i++)
        {
            for (let j = 0; j <= fam.cols; j++)
            {
                var name = 'PU.' + letters[i] + letters[j] + '.1';
                var tb = new PullUp(i, j, name);
                this.pullups[name] = tb;

                if (i != 0 && i != fam.rows)
                {
                    name = 'PU.' + letters[i] + letters[j] + '.2';
                    tb = new PullUp(i, j, name);
                    this.pullups[name] = tb;
                }
            }
        }
    }

    decode()
    {
        Object.entries(this.pullups).forEach(([k, s]) => s.decode());
    }

    getFromG(name) {
        return this.pullupsFromG[name];
    }

    get(name) {
        return this.pullups[name];
    }

    renderBackground(ctx)
    {
        Object.entries(this.pullups).forEach(([name, obj]) => obj.renderBackground(ctx));
    }

    render(ctx)
    {
        Object.entries(this.pullups).forEach(([name, obj]) => obj.render(ctx));
    }
}


// a tri-state buffer
class PullUp
{
    constructor(row, col, name)
    {
        // PU.xx.y
        this.row = row;
        this.col = col;
        this.name = name;
        this.tile = name[3] + name[4];
        this.num = parseInt(name[6], 10);

        // G coords point to the output pin of the pullup
        this.gPt = getGCoords(this.name);
        this.screenPt = getSCoords(this.gPt);
        this.screenPt.y -= 4;
        this.W = 4;
        this.H = 4;

        this.generatePullupPips();
    }

    genCoords(name)
    {
        name = name.replaceAll('**', this.tile)
            .replaceAll('col.*', 'col.'+this.tile[1])
            .replaceAll('row.*', 'row.'+this.tile[0]);

        return name;
    }

    generatePullupPips()
    {
        var opips = [];

        this.oPath = new Path(this, 'O', 'source', {x: this.gPt.x, y: this.gPt.y}, 'V');

        opips.push('row.*.long.'+(this.row==0 ? 3:this.num)+':0');

        this.oPath.appendPipList(opips, this.genCoords.bind(this));
    }

    decode()
    {
        // TODO
    }

    renderBackground(ctx)
    {
        ctx.strokeRect(this.screenPt.x, this.screenPt.y, this.W, this.H);
        ctx.beginPath();
        ctx.moveTo(this.screenPt.x, this.screenPt.y+4);
        ctx.lineTo(this.screenPt.x, this.screenPt.y+6);
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
