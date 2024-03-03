
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
            {
                if (row == fam.rows)
                    vbidi = 0;
                else
                    vbidi = [3, 0, 5][row % 3];
            }
            else
                vbidi = [1, 0, 3][(row - col + 99) % 3];
        }

        if (hbidi) pips.push('bidiH:col.*.local.'+(col==0?(row==0||row==fam.rows?6:7):8)+':row.*.local.'+hbidi);
        if (vbidi) pips.push('bidiV:col.*.local.'+vbidi+':row.*.local.'+(row==fam.rows?11:0));

        if (row == (fam.rows/2))
        {
            if (col == 0)
                pips.push('bidiV:col.*.long.1:row.*.local.6', 'bidiV:col.*.long.3:row.*.local.6', 'bidiV:col.*.long.4:row.*.local.6');
            else if (col == fam.cols)
                pips.push('bidiV:col.*.long.2:row.*.local.6');
            else if (!fam.noMidBuffers)
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

    generateLongLines()
    {
        var fam = curBitstream.family;
        var c = fam.cols, r = fam.rows;

        var cmaxG = 66 + (26 * (c-1));
        var rmaxG = 61 + (30 * (r-1));

        var vlines = [], vlines2 = [], hlines = [];
        this.vLines = []; this.hLines = [];

        vlines.push('col.A.long.1', 'col.A.long.2', 'col.A.long.3', 'col.A.long.4', 'col.A.long.5');
        for (var i = 1; i < c; i++)
            vlines.push('col.'+letters[i]+'.long.1', 'col.'+letters[i]+'.long.2', 'col.'+letters[i]+'.long.3');
        vlines.push('col.'+letters[c]+'.long.1', 'col.'+letters[c]+'.long.2');

        vlines2.push('col.A.long.6');
        for (var i = 1; i < c; i++)
            vlines2.push('col.'+letters[i]+'.long.0');

        hlines.push('row.A.long.1', 'row.A.long.2', 'row.A.long.3');
        for (var i = 1; i < r; i++)
            hlines.push('row.'+letters[i]+'.long.1', 'row.'+letters[i]+'.long.2');
        hlines.push('row.'+letters[r]+'.long.1', 'row.'+letters[r]+'.long.2', 'row.'+letters[r]+'.long.3');

        vlines.forEach((coord) =>
        {
            var x = colInfo[coord];
            var gStart = {x:x, y:3};
            var gEnd = {x:x, y:rmaxG-3};

            var path = new Path(null, null, 'both', gStart, 'V');
            this.addPipsToPath(gStart, gEnd, path);
            this.vLines[coord] = path;
        });

        vlines2.forEach((coord) =>
        {
            var x = colInfo[coord];
            var gStart = {x:x, y:5};
            var gEnd = {x:x, y:rmaxG-20};

            var path = new Path(null, null, 'both', gStart, 'V');
            this.addPipsToPath(gStart, gEnd, path);
            this.vLines[coord] = path;
        });

        hlines.forEach((coord) =>
        {
            var y = rowInfo[coord];
            var gStart = {x:2, y:y};
            var gEnd = {x:cmaxG-2, y:y};

            var path = new Path(null, null, 'both', gStart, 'H');
            this.addPipsToPath(gStart, gEnd, path);
            this.hLines[coord] = path;
        });
    }

    decode()
    {
        // TODO
    }

    createPip(gPt, type)
    {
        // PIP TYPE AND STATUS
        // H->V  : bit0=active
        // V->H  : bit0=active
        // ND    : bit0=H->V bit1=V->H
        // bidiH : bit0=left->right bit1=right->left
        // bidiV : bit0=bottom->top bit1=top->bottom

        var key = gPt.x+'G'+gPt.y;
        this.entries[key] = {
            gPt: gPt,
            screenPt: getSCoords(gPt),
            type: type,
            status: 0,
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
        return pip;
    }

    // add all PIPs within the given segment to the given path
    addPipsToPath(start, end, path)
    {
        var gStart = (typeof start == 'string') ? getGCoords(start) : start;
        var gEnd = (typeof end == 'string') ? getGCoords(end) : end;

        if (gStart.y == gEnd.y && gStart.x < gEnd.x)
        {
            for (var x = gStart.x; x <= gEnd.x; x++)
            {
                var key = x+'G'+gStart.y;
                var pip = this.entries[key];
                if (typeof pip != 'undefined')
                    path.appendPip(pip.gPt.x, pip.type);
            }
        }
        else if (gStart.y == gEnd.y && gStart.x > gEnd.x)
        {
            for (var x = gStart.x; x >= gEnd.x; x--)
            {
                var key = x+'G'+gStart.y;
                var pip = this.entries[key];
                if (typeof pip != 'undefined')
                    path.appendPip(pip.gPt.x, pip.type);
            }
        }
        else if (gStart.x == gEnd.x && gStart.y < gEnd.y)
        {
            for (var y = gStart.y; y <= gEnd.y; y++)
            {
                var key = gStart.x+'G'+y;
                var pip = this.entries[key];
                if (typeof pip != 'undefined')
                    path.appendPip(pip.gPt.y, pip.type);
            }
        }
        else if (gStart.x == gEnd.x && gStart.y > gEnd.y)
        {
            for (var y = gStart.y; y >= gEnd.y; y--)
            {
                var key = gStart.x+'G'+y;
                var pip = this.entries[key];
                if (typeof pip != 'undefined')
                    path.appendPip(pip.gPt.y, pip.type);
            }
        }
        else
        {
            console.log('bad segment');
        }
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

    renderBackground(ctx)
    {
        Object.entries(this.entries).forEach(([gpt,pip]) =>
        {
            // DEBUG
            //if (pip.type=='bidiH' || pip.type=='bidiV')
            //    ctx.strokeStyle = '#f00';
            //else
                ctx.strokeStyle = '#aaa';

            ctx.strokeRect(pip.screenPt.x-1, pip.screenPt.y-1, 2, 2);
        });

        if (false)
        {
            ctx.strokeStyle = '#ffa';
            Object.entries(this.vLines).forEach(([key,path]) => path.draw(ctx));
            Object.entries(this.hLines).forEach(([key,path]) => path.draw(ctx));
            ctx.strokeStyle = '#aaa';
        }
    }

    render(ctx)
    {
        // DEBUG VIEW
        Object.entries(this.entries).forEach(([gpt,pip]) =>
        {
            if (!pip.status) return;
            ctx.fillStyle = ['', '#f00', '#0f0', '#ff0'][pip.status];
            ctx.fillRect(pip.screenPt.x-2, pip.screenPt.y-2, 3, 3);
        });
    }
}
