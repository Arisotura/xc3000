
class PipDecoder {
    constructor() {
        this.entries = {};

        var fam = curBitstream.family;
        for (let i = 0; i <= fam.rows; i++)
        {
            for (let j = 0; j <= fam.cols; j++)
            {
                this.generateTilePips(i, j);
            }
        }
    }

    generateTilePips(row, col)
    {
        var fam = curBitstream.family;
        var pips = [];

        // generate stand-alone PIPs, they will later be added to line paths

        // BIDI
        // 3 5 1 3 5 1 ..
        // 3 5 1 3 5 1
        // 1 3 5 1 3 5
        // 5 1 3 5 1 3
        // 3 5 1 3 5 1
        // ..
        // 3 1 5 3 1 5

        // vertical
        // _ 1 3 .. _
        // 5 _ 1 .. 5
        // 3 3 _ .. 3
        // _ 1 3 .. _
        // 5 _ 1 .. 5
        // 3 3 _ .. 3

        // 5 1 3
        // 3 5 1
        // 1 3 5

        // 1 3 _ 1
        // _ 1 3 _
        // 3 _ 1 3
        // 1 3 _ 1

        var hbidi = 0, vbidi = 0;

        if (col != fam.cols)
        {
            if (row == 0)
                hbidi = [3, 5, 1][col % 3];
            else if (row == fam.rows)
                hbidi = [3, 1, 5][col % 3];
            else
                hbidi = [5, 1, 3][(col - row + 99) % 3];
        }

        if (row != 0)
        {
            if (col == 0 || col == fam.cols)
                vbidi = [3, 0, 5][row % 3];
            else
                vbidi = [1, 0, 3][(row - col + 99) % 3];
        }

        if (hbidi) pips.push('bidiH:col.*.local.'+(col==0?(row==0||row==fam.rows?6:7):8)+':row.*.local.'+hbidi);
        if (vbidi) pips.push('bidiV:col.*.local.'+vbidi+':row.*.local.'+(row==fam.rows?11:0));

        if (row == (fam.rows/2) && !fam.noMidBuffers)
        {
            if (col == 0)
                pips.push('bidiV:col.*.long.1:row.*.local.6', 'bidiV:col.*.long.3:row.*.local.6', 'bidiV:col.*.long.4:row.*.local.6');
            else if (col == fam.cols)
                pips.push('bidiV:col.*.long.2:row.*.local.6');
            else
                pips.push('bidiV:col.*.long.1:row.*.local.6', 'bidiV:col.*.long.2:row.*.local.6');
        }

        if (col == (fam.cols/2))
        {
            if (row == 0)
                pips.push('bidiH:col.*.local.6:row.*.long.1');
            else if (row == fam.rows)
                pips.push('bidiH:col.*.local.6:row.*.long.3');
        }

        if (row == 0 && col == 0)
        {
            pips.push('ND:col.*.local.1:row.*.local.1', 'ND:col.*.local.2:row.*.local.2',
                'ND:col.*.local.3:row.*.local.3', 'ND:col.*.local.4:row.*.local.4', 'ND:col.*.local.5:row.*.local.5',
                'ND:col.*.long.1:row.*.long.1', 'ND:col.*.long.2:row.*.long.2',
                'ND:col.*.long.3:row.*.local.2', 'ND:col.*.long.4:row.*.local.3', 'ND:col.*.long.5:row.*.local.4',
                'ND:col.*.long.3:row.*.long.1', 'ND:col.*.long.4:row.*.long.2', 'ND:col.*.long.5:row.*.long.2',
                'H->V:col.*.local.1:row.*.long.3', 'V->H:col.*.local.2:row.*.long.3', 'ND:col.*.long.1:row.*.long.3');
        }
        else if (row == 0 && col == fam.cols)
        {
            pips.push('ND:col.*.local.5:row.*.local.1', 'ND:col.*.local.4:row.*.local.2',
                'ND:col.*.local.3:row.*.local.3', 'ND:col.*.local.2:row.*.local.4', 'ND:col.*.local.1:row.*.local.5',
                'ND:col.*.long.2:row.*.long.1', 'ND:col.*.long.1:row.*.long.2',
                'H->V:col.*.local.1:row.*.long.3', 'V->H:col.*.local.2:row.*.long.3', 'ND:col.*.long.2:row.*.long.3');
        }
        else if (row == 0)
        {
            pips.push('ND:col.*.local.1:row.*.long.1', 'ND:col.*.local.4:row.*.long.2',
                'ND:col.*.long.1:row.*.local.2', 'ND:col.*.long.2:row.*.local.3', 'ND:col.*.long.3:row.*.local.4',
                'ND:col.*.long.1:row.*.long.1', 'ND:col.*.long.2:row.*.long.2', 'ND:col.*.long.3:row.*.long.2',
                'H->V:col.*.local.1:row.*.long.3', 'V->H:col.*.local.2:row.*.long.3');
        }
        else if (row == fam.rows && col == 0)
        {
            pips.push('ND:col.*.local.1:row.*.local.5', 'ND:col.*.local.2:row.*.local.4',
                'ND:col.*.local.3:row.*.local.3', 'ND:col.*.local.4:row.*.local.2', 'ND:col.*.local.5:row.*.local.1',
                'ND:col.*.long.1:row.*.long.3', 'ND:col.*.long.2:row.*.long.2',
                'ND:col.*.long.3:row.*.local.4', 'ND:col.*.long.4:row.*.local.3', 'ND:col.*.long.5:row.*.local.2',
                'ND:col.*.long.3:row.*.long.3', 'ND:col.*.long.4:row.*.long.2', 'ND:col.*.long.5:row.*.long.2',
                'H->V:col.*.local.3:row.*.long.1', 'V->H:col.*.local.4:row.*.long.1', 'ND:col.*.long.2:row.*.long.1');
        }
        else if (row == fam.rows && col == fam.cols)
        {
            pips.push('ND:col.*.local.5:row.*.local.5', 'ND:col.*.local.4:row.*.local.4',
                'ND:col.*.local.3:row.*.local.3', 'ND:col.*.local.2:row.*.local.2', 'ND:col.*.local.1:row.*.local.1',
                'ND:col.*.long.2:row.*.long.3', 'ND:col.*.long.1:row.*.long.2',
                'H->V:col.*.local.3:row.*.long.1', 'V->H:col.*.local.4:row.*.long.1', 'ND:col.*.long.1:row.*.long.1');
        }
        else if (row == fam.rows)
        {
            pips.push('ND:col.*.local.1:row.*.long.3', 'ND:col.*.local.4:row.*.long.2',
                'ND:col.*.long.1:row.*.local.4', 'ND:col.*.long.2:row.*.local.3', 'ND:col.*.long.3:row.*.local.2',
                'ND:col.*.long.1:row.*.long.3', 'ND:col.*.long.2:row.*.long.2', 'ND:col.*.long.3:row.*.long.2',
                'H->V:col.*.local.3:row.*.long.1', 'V->H:col.*.local.4:row.*.long.1');
        }
        else if (col == 0)
        {
            pips.push('H->V:col.*.local.3:row.*.long.1', 'V->H:col.*.local.4:row.*.long.1',
                'ND:col.*.long.2:row.*.long.1', 'ND:col.*.long.1:row.*.local.1',
                'ND:col.*.long.2:row.*.local.4', 'ND:col.*.long.1:row.*.long.2',
                'H->V:col.*.local.1:row.*.long.2', 'V->H:col.*.local.2:row.*.long.2',
                'ND:col.*.long.3:row.*.local.2', 'ND:col.*.long.4:row.*.local.3');
        }
        else if (col == fam.cols)
        {
            pips.push('H->V:col.*.local.3:row.*.long.1', 'V->H:col.*.local.4:row.*.long.1',
                'ND:col.*.long.1:row.*.long.1', 'ND:col.*.long.2:row.*.local.1',
                'ND:col.*.long.1:row.*.local.4', 'ND:col.*.long.2:row.*.long.2',
                'H->V:col.*.local.1:row.*.long.2', 'V->H:col.*.local.2:row.*.long.2');
        }
        else
        {
            pips.push('H->V:col.*.local.3:row.*.long.1', 'V->H:col.*.local.4:row.*.long.1',
                'H->V:col.*.local.1:row.*.long.2', 'V->H:col.*.local.2:row.*.long.2',
                'ND:col.*.long.1:row.*.local.2', 'ND:col.*.long.2:row.*.local.3');
        }

        pips.forEach((p) =>
        {
            p = p.replace('col.*', 'col.'+letters[col])
                .replace('row.*', 'row.'+letters[row]);

            var info = p.split(':');
            var gPt = getGCoords(info.slice(1).join(':'));

            this.createPip(gPt, info[0]);
        });
    }

    startDecode() {
        //this.entries = {};
    }

    createPip(gPt, type)
    {
        var key = gPt.x+'G'+gPt.y;
        this.entries[key] = {
            gPt: gPt,
            screenPt: getSCoords(gPt),
            type: type,
            paths: []
        };
    }

    registerPip(gPt, type, path, dir)
    {
        var key = gPt.x+'G'+gPt.y;
        if (typeof this.entries[key] == 'undefined')
        {
            this.createPip(gPt, type);
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
            // DEBUG
            if (pip.type=='bidiH' || pip.type=='bidiV')
                ctx.strokeStyle = '#f00';
            else
                ctx.strokeStyle = '#aaa';

            ctx.strokeRect(pip.screenPt.x-1, pip.screenPt.y-1, 2, 2);
        });
    }
}
