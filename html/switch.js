
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
                const sw = new Switch(name);
                this.switches[name] = sw;
            }
        }
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
    constructor(name)
    {
        this.name = name;
        this.tilename = name[0] + name[1];
        this.num = parseInt(name[5], 10);
        this.pins = {}; // Dictionary holding names of pins

        // The switch's upper left wires are local.1
        var row = rowInfo['row.' + this.tilename[0] + '.local.1'];
        var col = colInfo['col.' + this.tilename[1] + '.local.1'];

        this.gPt = {x:col-1, y:row+1};
        this.screenPt = getSCoords(this.gPt);
        this.W = 24;
        this.H = 24;
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
            ctx.moveTo(this.screenPt.x+(i*4), this.screenPt.y);
            ctx.lineTo(this.screenPt.x+(i*4), this.screenPt.y-2);
            ctx.moveTo(this.screenPt.x+(i*4), this.screenPt.y+this.H);
            ctx.lineTo(this.screenPt.x+(i*4), this.screenPt.y+this.H+2);
            ctx.moveTo(this.screenPt.x, this.screenPt.y+(i*4));
            ctx.lineTo(this.screenPt.x-2, this.screenPt.y+(i*4));
            ctx.moveTo(this.screenPt.x+this.W, this.screenPt.y+(i*4));
            ctx.lineTo(this.screenPt.x+this.W+2, this.screenPt.y+(i*4));
        }
        ctx.stroke();
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
