
class PipDecoder
{
    constructor() {
        this.entries = {};
        this.pipData = {};

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

        // the pattern for bidi PIPs starts at the bottom right corner
        var bidi_pos = ((fam.cols-col) - (fam.rows-row) + 99) % 3;
        var hbidi, vbidi;

        if (col == fam.cols && (row == 0 || row == fam.rows))
        {
            hbidi = 0;
            vbidi = 0;
        }
        else if (col == fam.cols && row == 1)
        {
            hbidi = 0;
            vbidi = [0, 0, 3][bidi_pos];
        }
        else if (col == fam.cols)
        {
            hbidi = 0;
            vbidi = [0, 5, 3][bidi_pos];
        }
        else if (row == fam.rows && col == 0)
        {
            hbidi = [1, 3, 5][bidi_pos];
            vbidi = [0, 0, 5][bidi_pos];
        }
        else if (row == fam.rows)
        {
            hbidi = [1, 3, 5][bidi_pos];
            vbidi = [1, 0, 3][bidi_pos];
        }
        else if (row == 0)
        {
            hbidi = [3, 1, 5][bidi_pos];
            vbidi = 0;
        }
        else if (col == 0)
        {
            hbidi = [5, 3, 1][bidi_pos];
            vbidi = [3, 0, 5][bidi_pos];
        }
        else
        {
            hbidi = [5, 3, 1][bidi_pos];
            vbidi = [1, 0, 3][bidi_pos];
        }

        var hpos = '', vpos = '';

        if (col == fam.cols)
            vpos = ':7:5:7:6';
        else if (col == 0)
            vpos = {0:'', 3:':-5:1:-5:2', 5:':-5:13:-5:12'}[vbidi];
        else
            vpos = {0:'', 1:':-5:1:-5:2', 3:':-5:13:-5:12'}[vbidi];

        if (row == fam.rows)
            hpos = {0:'', 1:':0:15:0:16', 3:':0:15:0:16', 5:':0:1:0:4'}[hbidi];
        else
            hpos = {0:'', 1:':3:3:3:4', 3:':3:21:3:20', 5:':3:21:3:20'}[hbidi];

        if (hbidi) pips.push('bidiH:col.*.local.'+(col==0?(row==0||row==fam.rows?6:7):8)+':row.*.local.'+hbidi+hpos);
        if (vbidi) pips.push('bidiV:col.*.local.'+vbidi+':row.*.local.'+(row==fam.rows&&col!=0?11:0)+vpos);

        if (row == (fam.rows/2))
        {
            if (fam.noMidBuffers)
            {
                if (col == 0)
                    pips.push('splitV:col.*.long.1:row.*.local.6:4:-7');
                else if (col == fam.cols)
                    pips.push('splitV:col.*.long.2:row.*.local.6:7:0');
            }
            else
            {
                if (col == 0)
                    pips.push('splitV:col.*.long.1:row.*.local.6:8:-1', 'splitV:col.*.long.3:row.*.local.6:8:0', 'splitV:col.*.long.4:row.*.local.6:8:21');
                else if (col == fam.cols)
                    pips.push('splitV:col.*.long.2:row.*.local.6:8:13');
                else
                    pips.push('splitV:col.*.long.1:row.*.local.6:8:0', 'splitV:col.*.long.2:row.*.local.6:8:21');
            }
        }

        if (col == (fam.cols/2))
        {
            if (row == 0)
                pips.push('splitH:col.*.local.6:row.*.long.1:-1:5');
            else if (row == fam.rows)
                pips.push('splitH:col.*.local.6:row.*.long.3:3:5');
        }

        if (row == 0 && col == 0)
        {
            pips.push('ND:col.*.local.1:row.*.local.1:2:10:2:10', 'ND:col.*.local.2:row.*.local.2:0:10:0:10',
                'ND:col.*.local.3:row.*.local.3:1:18:1:18', 'ND:col.*.local.4:row.*.local.4:1:19:1:19', 'ND:col.*.local.5:row.*.local.5:3:18:3:18',
                'ND:col.*.long.1:row.*.long.1:0:7:0:8', 'ND:col.*.long.2:row.*.long.2:-1:17:0:15',
                'ND:col.*.long.3:row.*.local.2:4:8:2:7', 'ND:col.*.long.4:row.*.local.3:4:13:2:12', 'ND:col.*.long.5:row.*.local.4:0:19:0:18',
                'ND:col.*.long.3:row.*.long.1:-2:4:-1:3', 'ND:col.*.long.4:row.*.long.2:-1:16:-2:13', 'ND:col.*.long.5:row.*.long.2:0:13:-2:17',
                'H->V:col.*.local.1:row.*.long.3:4:0', 'V->H:col.*.local.2:row.*.long.3:2:4:TBUF:2:1', 'ND:col.*.long.1:row.*.long.3:5:-2:4:-1');
        }
        else if (row == 0 && col == fam.cols)
        {
            pips.push('ND:col.*.local.5:row.*.local.1:2:7:2:7', 'ND:col.*.local.4:row.*.local.2:2:9:2:9',
                'ND:col.*.local.3:row.*.local.3:3:8:3:8', 'ND:col.*.local.2:row.*.local.4:2:4:2:4', 'ND:col.*.local.1:row.*.local.5:2:5:2:5',
                'ND:col.*.long.2:row.*.long.1:1:1:1:2', 'ND:col.*.long.1:row.*.long.2:3:3:3:4',
                'H->V:col.*.local.1:row.*.long.3:4:2', 'V->H:col.*.local.2:row.*.long.3:2:2:TBUF:2:1', 'ND:col.*.long.2:row.*.long.3:3:1:3:2');
        }
        else if (row == 0)
        {
            pips.push('ND:col.*.local.1:row.*.long.1:0:9:0:8', 'ND:col.*.local.4:row.*.long.2:-1:17:0:15',
                'ND:col.*.long.1:row.*.local.2:4:8:2:7', 'ND:col.*.long.2:row.*.local.3:4:13:2:12', 'ND:col.*.long.3:row.*.local.4:0:19:0:18',
                'ND:col.*.long.1:row.*.long.1:-2:4:-1:3', 'ND:col.*.long.2:row.*.long.2:-1:16:-2:13', 'ND:col.*.long.3:row.*.long.2:0:13:-2:17',
                'H->V:col.*.local.1:row.*.long.3:4:0', 'V->H:col.*.local.2:row.*.long.3:2:4:TBUF:2:1');
        }
        else if (row == fam.rows && col == 0)
        {
            pips.push('ND:col.*.local.1:row.*.local.5:1:5:1:5', 'ND:col.*.local.2:row.*.local.4:1:4:1:4',
                'ND:col.*.local.3:row.*.local.3:1:13:1:13', 'ND:col.*.local.4:row.*.local.2:0:17:0:17', 'ND:col.*.local.5:row.*.local.1:1:20:1:20',
                'ND:col.*.long.1:row.*.long.3:2:-1:1:-1', 'ND:col.*.long.2:row.*.long.2:2:14:1:17',
                'ND:col.*.long.3:row.*.local.4:0:6:0:5', 'ND:col.*.long.4:row.*.local.3:0:11:0:12', 'ND:col.*.long.5:row.*.local.2:2:19:2:18',
                'ND:col.*.long.3:row.*.long.3:4:4:3:3', 'ND:col.*.long.4:row.*.long.2:3:16:4:13', 'ND:col.*.long.5:row.*.long.2:3:17:4:17',
                'H->V:col.*.local.3:row.*.long.1:-4:10', 'V->H:col.*.local.4:row.*.long.1:-6:8:TBUF:-6:11', 'ND:col.*.long.2:row.*.long.1:-2:-2:-2:-3');
        }
        else if (row == fam.rows && col == fam.cols)
        {
            pips.push('ND:col.*.local.5:row.*.local.5:0:11:0:11', 'ND:col.*.local.4:row.*.local.4:1:8:1:8',
                'ND:col.*.local.3:row.*.local.3:0:3:0:3', 'ND:col.*.local.2:row.*.local.2:0:2:0:2', 'ND:col.*.local.1:row.*.local.1:0:0:0:0',
                'ND:col.*.long.2:row.*.long.3:1:3:2:3', 'ND:col.*.long.1:row.*.long.2:1:4:2:4',
                'H->V:col.*.local.3:row.*.long.1:-3:8', 'V->H:col.*.local.4:row.*.long.1:-3:2:TBUF:-3:3', 'ND:col.*.long.1:row.*.long.1:-5:1:-5:2');
        }
        else if (row == fam.rows)
        {
            pips.push('ND:col.*.local.1:row.*.long.3:2:9:2:8', 'ND:col.*.local.4:row.*.long.2:2:13:2:15',
                'ND:col.*.long.1:row.*.local.4:0:6:0:5', 'ND:col.*.long.2:row.*.local.3:0:11:0:12', 'ND:col.*.long.3:row.*.local.2:2:19:2:18',
                'ND:col.*.long.1:row.*.long.3:4:4:3:3', 'ND:col.*.long.2:row.*.long.2:3:16:4:13', 'ND:col.*.long.3:row.*.long.2:3:17:4:17',
                'H->V:col.*.local.3:row.*.long.1:-4:10', 'V->H:col.*.local.4:row.*.long.1:-6:8:TBUF:-6:11');
        }
        else if (col == 0)
        {
            pips.push('H->V:col.*.local.3:row.*.long.1:-4:10', 'V->H:col.*.local.4:row.*.long.1:-6:8:TBUF:-6:11',
                'ND:col.*.long.2:row.*.long.1:-2:-2:-2:-3', 'ND:col.*.long.1:row.*.local.1:3:-4:2:-5',
                'ND:col.*.long.2:row.*.local.4:3:-2:3:-1', 'ND:col.*.long.1:row.*.long.2:5:-2:4:-1',
                'H->V:col.*.local.1:row.*.long.2:4:0', 'V->H:col.*.local.2:row.*.long.2:2:4:TBUF:2:1',
                'ND:col.*.long.3:row.*.local.2:4:8:2:7', 'ND:col.*.long.4:row.*.local.3:4:13:2:12');
        }
        else if (col == fam.cols)
        {
            pips.push('H->V:col.*.local.3:row.*.long.1:-3:8', 'V->H:col.*.local.4:row.*.long.1:-3:2:TBUF:-3:3',
                'ND:col.*.long.1:row.*.long.1:-3:1:-2:0', 'ND:col.*.long.2:row.*.local.1:3:0:2:0',
                'ND:col.*.long.1:row.*.local.4:3:3:2:3', 'ND:col.*.long.2:row.*.long.2:3:1:3:2',
                'H->V:col.*.local.1:row.*.long.2:4:2', 'V->H:col.*.local.2:row.*.long.2:2:2:TBUF:2:1');
        }
        else
        {
            pips.push('H->V:col.*.local.3:row.*.long.1:-4:10', 'V->H:col.*.local.4:row.*.long.1:-6:8:TBUF:-6:11',
                'H->V:col.*.local.1:row.*.long.2:4:0', 'V->H:col.*.local.2:row.*.long.2:2:4:TBUF:2:1',
                'ND:col.*.long.1:row.*.local.2:4:8:2:7', 'ND:col.*.long.2:row.*.local.3:4:13:2:12');
        }

        pips.forEach((p) =>
        {
            p = p.replace('col.*', 'col.'+letters[col])
                .replace('row.*', 'row.'+letters[row]);

            var info = p.split(':');
            var gPt = getGCoords(info.slice(1, 3).join(':'));

            this.createPip(gPt, info[0]);

            var key = gPt.x+'G'+gPt.y;
            var pipdata = info.slice(3);
            pipdata.splice(0, 0, col, row);
            this.pipData[key] = pipdata;
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
        Object.entries(this.pipData).forEach(([key, data]) =>
        {
            var pip = this.entries[key];
            var dy = parseInt(data[2]);
            var dx = parseInt(data[3]);
            var o = getTileOffset(data[0], data[1]);
            var otop = getTileOffset(data[0], data[1]-1);

            function readbit(y, x)
            {
                if (y < 0 && data[1] > 0) y += otop.y + 8;
                else                      y += o.y;
                x += o.x;
                return curBitstream.data[y][x];
            }

            switch (pip.type)
            {
                case 'H->V':
                case 'V->H':
                    var b0 = readbit(dy, dx);
                    if (data[4] == 'TBUF')
                    {
                        // PIP can only be enabled if the neighboring tristate buffer is disabled
                        var dy2 = parseInt(data[5]);
                        var dx2 = parseInt(data[6]);
                        var tri = readbit(dy2, dx2);
                        if (!tri) b0 = 1;
                    }
                    pip.status = (b0 ? 0:1);
                    break;

                case 'ND':
                case 'bidiH':
                case 'bidiV':
                    var dy2 = parseInt(data[4]);
                    var dx2 = parseInt(data[5]);
                    var b0 = readbit(dy, dx);
                    var b1 = readbit(dy2, dx2);
                    pip.status = (b0 ? 0:1) | (b1 ? 0:2);
                    break;

                case 'splitH':
                case 'splitV':
                    // bits for splitters are inverted
                    var b0 = readbit(dy, dx);
                    pip.status = b0;
                    break;
            }
        });
    }

    createPip(gPt, type)
    {
        // PIP TYPE AND STATUS
        // H->V   : bit0=active
        // V->H   : bit0=active
        // ND     : bit0=H->V bit1=V->H
        // bidiH  : bit0=left->right bit1=right->left
        // bidiV  : bit0=bottom->top bit1=top->bottom
        // splitH : bit0=active
        // splitV : bit0=active

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
        if (viewSettings.showAllPips)
        {
            Object.entries(this.entries).forEach(([gpt, pip]) =>
            {
                // DEBUG
                //if (pip.type=='bidiH' || pip.type=='bidiV')
                //    ctx.strokeStyle = '#f00';
                //else
                ctx.strokeStyle = '#aaa';

                ctx.strokeRect(pip.screenPt.x - 1, pip.screenPt.y - 1, 2, 2);
            });
        }

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
        if (viewSettings.debug)
        {
            // DEBUG VIEW
            Object.entries(this.entries).forEach(([gpt, pip]) =>
            {
                if (!pip.status) return;
                ctx.fillStyle = ['', '#f00', '#0f0', '#ff0'][pip.status];
                ctx.fillRect(pip.screenPt.x - 2, pip.screenPt.y - 2, 3, 3);
            });
        }
    }
}
