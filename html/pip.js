
class PipDecoder {
    constructor() {
        this.entries = {};
    }

    startDecode() {
        //this.entries = {};
    }

    registerPip(gPt, type, path, dir)
    {
        var key = gPt.x+'G'+gPt.y;
        if (typeof this.entries[key] == 'undefined')
        {
            this.entries[key] = {
                gPt: gPt,
                screenPt: getSCoords(gPt),
                type: type,
                paths: []
            };
        }

        var pip = this.entries[key];
        if (pip.type != type)
        {
            console.log('wrong PIP type for '+key+': '+type+'/'+pip.type);
            return;
        }

        pip.paths[dir] = path;
    }

    getPath(gPt, dir)
    {
        var key = gPt.x+'G'+gPt.y;
        var pip = this.entries[key];
        if (typeof pip == 'undefined')
        {
            console.log('unknown PIP '+key);
        }

        return pip.paths[dir];
    }

    /*add(str, bit) {
        this.entries[str] = bit;
    }*/

    //decode() {}

    renderBackground(ctx)
    {
        Object.entries(this.entries).forEach(([gpt,pip]) =>
        {
            ctx.strokeRect(pip.screenPt.x-1, pip.screenPt.y-1, 2, 2);
        });
    }
}
