
// view settings

var viewSettings = {
    showAllPips: false,
    debug: false,
};

function changeViewSettings(id, val)
{
    viewSettings[id] = val;
}

const SCALE = 2;

// coord lists

// from G coords to screen coords
var rowGtoS = [];
var colGtoS = [];

// From row name to [internal Y coordinate (G), screen Y coordinate]
var rowInfo = {};

// From column name to [internal X coordinate, screen X coordinate]
var colInfo = {};

var rowFromG = {}; // Look up the row name from the G coordinate
var colFromG = {}; // Look up the column name from the G coordinate

var rowFromS = {}; // Look up the row name from the Screen coordinate
var colFromS = {}; // Look up the column name from the Screen coordinate

function initNames()
{
    var fam = curBitstream.family;

    var cmaxG = 66 + (26 * (fam.cols-1));
    var rmaxG = 61 + (30 * (fam.rows-1));

    rowGtoS = [];
    colGtoS = [];

    var s = 4;
    for (var g = 0; g <= cmaxG; g++)
    {
        colGtoS[g] = s;
        s += 4;
    }

    s = 264 + ((fam.rows-1) * 120);
    for (var g = 0; g <= rmaxG; g++)
    {
        rowGtoS[g] = s;
        if (g == 2 || g == (rmaxG-3))
            s -= 12;
        else
            s -= 4;
    }

    colInfo = {};
    rowInfo = {};
    rowFromG = {};
    colFromG = {};
    rowFromS = {};
    colFromS = {};

    {
        var name = letters[0];
        var g = 0;

        colInfo['col.' + name + '.local.12'] = g++;
        colInfo['col.' + name + '.local.13'] = g; g+=11;
        colInfo['col.' + name + '.local.1'] = g++;
        colInfo['col.' + name + '.local.2'] = g++;
        colInfo['col.' + name + '.local.3'] = g++;
        colInfo['col.' + name + '.local.4'] = g++;
        colInfo['col.' + name + '.local.5'] = g++;
        colInfo['col.' + name + '.local.6'] = g++;
        colInfo['col.' + name + '.local.7'] = g++;
        colInfo['col.' + name + '.long.1'] = g++;
        colInfo['col.' + name + '.long.2'] = g++;
        colInfo['col.' + name + '.local.9'] = g++;
        colInfo['col.' + name + '.local.10'] = g++;
        colInfo['col.' + name + '.local.11'] = g; g+=2;
        colInfo['col.' + name + '.long.3'] = g++;
        colInfo['col.' + name + '.long.4'] = g++;
        colInfo['col.' + name + '.long.5'] = g++;
        colInfo['col.' + name + '.long.6'] = g;
    }

    for (var i = 1; i < fam.cols; i++)
    {
        var name = letters[i];
        var g = 43 + ((i-1) * 26);

        if (i != 1 && i != (fam.cols-1))
            colInfo['col.' + name + '.local.6'] = g;
        g++;
        colInfo['col.' + name + '.local.1'] = g++;
        colInfo['col.' + name + '.local.2'] = g++;
        colInfo['col.' + name + '.local.3'] = g++;
        colInfo['col.' + name + '.local.4'] = g++;
        colInfo['col.' + name + '.local.5'] = g; g+=2;
        colInfo['col.' + name + '.local.8'] = g; g+=3;
        colInfo['col.' + name + '.long.0'] = g; g+=2;
        colInfo['col.' + name + '.long.1'] = g++;
        colInfo['col.' + name + '.long.2'] = g++;
        colInfo['col.' + name + '.long.3'] = g++;
        colInfo['col.' + name + '.long.4'] = g;
    }

    {
        var name = letters[fam.cols];
        var g = 45 + ((fam.cols-1) * 26);

        colInfo['col.' + name + '.local.10'] = g; g+=3;
        colInfo['col.' + name + '.local.9'] = g++;
        colInfo['col.' + name + '.long.1'] = g++;
        colInfo['col.' + name + '.long.2'] = g++;
        colInfo['col.' + name + '.local.8'] = g++;
        colInfo['col.' + name + '.local.1'] = g++;
        colInfo['col.' + name + '.local.2'] = g++;
        colInfo['col.' + name + '.local.3'] = g++;
        colInfo['col.' + name + '.local.4'] = g++;
        colInfo['col.' + name + '.local.5'] = g; g+=9;
        colInfo['col.' + name + '.local.6'] = g++;
        colInfo['col.' + name + '.local.7'] = g;
    }

    {
        var name = letters[0];
        var g = rmaxG;

        rowInfo['row.' + name + '.local.11'] = g--;
        rowInfo['row.' + name + '.local.10'] = g; g-=4;
        rowInfo['row.' + name + '.local.1'] = g--;
        rowInfo['row.' + name + '.local.2'] = g--;
        rowInfo['row.' + name + '.local.3'] = g--;
        rowInfo['row.' + name + '.local.4'] = g--;
        rowInfo['row.' + name + '.local.5'] = g--;
        rowInfo['row.' + name + '.local.6'] = g--;
        rowInfo['row.' + name + '.long.1'] = g--;
        rowInfo['row.' + name + '.long.2'] = g--;
        rowInfo['row.' + name + '.local.7'] = g; g-=6;
        rowInfo['row.' + name + '.local.9'] = g; g-=2;
        rowInfo['row.' + name + '.local.8'] = g; g-=3;
        rowInfo['row.' + name + '.long.3'] = g;
    }

    for (var i = 1; i < fam.rows; i++)
    {
        var name = letters[i];
        var g = 53 + ((fam.rows-1-i) * 30);

        rowInfo['row.' + name + '.long.1'] = g--;
        rowInfo['row.' + name + '.local.0'] = g--;
        rowInfo['row.' + name + '.local.6'] = g--;
        rowInfo['row.' + name + '.local.1'] = g--;
        rowInfo['row.' + name + '.local.2'] = g--;
        rowInfo['row.' + name + '.local.3'] = g--;
        rowInfo['row.' + name + '.local.4'] = g--;
        rowInfo['row.' + name + '.local.5'] = g; g-=2;
        rowInfo['row.' + name + '.long.2'] = g;
    }

    {
        var name = letters[fam.rows];
        var g = 27;

        rowInfo['row.' + name + '.local.10'] = g; g-=3;
        rowInfo['row.' + name + '.long.1'] = g; g-=4;
        rowInfo['row.' + name + '.local.11'] = g; g-=3;
        rowInfo['row.' + name + '.local.9'] = g; g-=3;
        rowInfo['row.' + name + '.long.2'] = g--;
        rowInfo['row.' + name + '.long.3'] = g--;
        rowInfo['row.' + name + '.local.0'] = g--;
        rowInfo['row.' + name + '.local.8'] = g--;
        rowInfo['row.' + name + '.local.1'] = g--;
        rowInfo['row.' + name + '.local.2'] = g--;
        rowInfo['row.' + name + '.local.3'] = g--;
        rowInfo['row.' + name + '.local.4'] = g--;
        rowInfo['row.' + name + '.local.5'] = g; g-=5;
        rowInfo['row.' + name + '.local.6'] = g--;
        rowInfo['row.' + name + '.local.7'] = g;
    }

    // The e.g. DE.B entries
    for (let col = 0; col < fam.cols; col++)
    {
        for (let row = 0; row < fam.rows; row++)
        {
            const fullname = letters[row] + letters[col];

            const coloff = col * 26;
            const rowoff = (fam.rows - 1 - row) * 30;

            if (col == 0)
                colInfo[fullname] = 35;
            else
                colInfo[fullname] = coloff + 34;

            rowInfo[fullname] = rowoff + 35;
        }
    }

    // IOB entries
    // the pads are assigned clockwise from the leftmost top pad
    var pad = 1;

    for (var i = 0; i < fam.cols*2; i++)
    {
        var col = i>>1;
        var side = i&1;
        var fullname = 'PAD'+pad;

        var base;
        if (col == 0)
            base = 29 + (5*side);
        else if (col == (fam.cols-1))
            base = 32 + (11*side);
        else
            base = 31 + (7*side);
        base += (26 * col);

        colInfo[fullname] = base;
        rowInfo[fullname] = rmaxG - 2;

        pad++;
    }

    for (var i = 0; i < fam.rows*2; i++)
    {
        var row = i>>1;
        var side = i&1;
        var fullname = 'PAD'+pad;

        var base;
        if (row == 0)
            base = 49 - (15*side);
        else if (row == (fam.rows-1))
            base = 43 - (21*side);
        else
            base = 43 - (9*side);
        base += (30 * (fam.rows-1-row));

        colInfo[fullname] = cmaxG - 7;
        rowInfo[fullname] = base;

        pad++;
    }

    for (var i = fam.cols*2-1; i >= 0; i--)
    {
        var col = i>>1;
        var side = i&1;
        var fullname = 'PAD'+pad;

        var base;
        if (col == 0)
            base = 29 + (5*side);
        else if (col == (fam.cols-1))
            base = 32 + (6*side);
        else
            base = 31 + (7*side);
        base += (26 * col);

        colInfo[fullname] = base;
        rowInfo[fullname] = 3;

        pad++;
    }

    for (var i = fam.rows*2-1; i >= 0; i--)
    {
        var row = i>>1;
        var side = i&1;
        var fullname = 'PAD'+pad;

        var base;
        if (row == 0)
            base = 50 - (15*side);
        else if (row == (fam.rows-1))
            base = 43 - (21*side);
        else
            base = 43 - (8*side);
        base += (30 * (fam.rows-1-row));

        colInfo[fullname] = 2;
        rowInfo[fullname] = base;

        pad++;
    }

    //console.log((pad-1)+' pads assigned');

    // pull-ups
    for (var i = 0; i <= fam.rows; i++)
    {
        var tileL = letters[i] + letters[0];
        var tileR = letters[i] + letters[fam.cols];

        if (i == 0)
        {
            colInfo['PU.'+tileL+'.1'] = 2;
            rowInfo['PU.'+tileL+'.1'] = rowInfo['row.'+letters[i]+'.long.3'] + 1;
            colInfo['PU.'+tileR+'.1'] = cmaxG - 7;
            rowInfo['PU.'+tileR+'.1'] = rowInfo['row.'+letters[i]+'.long.3'] + 1;
        }
        else
        {
            colInfo['PU.'+tileL+'.1'] = 2;
            rowInfo['PU.'+tileL+'.1'] = rowInfo['row.'+letters[i]+'.long.1'] + 1;
            colInfo['PU.'+tileR+'.1'] = cmaxG - 7;
            rowInfo['PU.'+tileR+'.1'] = rowInfo['row.'+letters[i]+'.long.1'] + 1;
            if (i != fam.rows)
            {
                colInfo['PU.' + tileL + '.2'] = 2;
                rowInfo['PU.' + tileL + '.2'] = rowInfo['row.' + letters[i] + '.long.2'] + 1;
                colInfo['PU.' + tileR + '.2'] = cmaxG - 7;
                rowInfo['PU.' + tileR + '.2'] = rowInfo['row.' + letters[i] + '.long.2'] + 1;
            }
        }
    }

    // tristate buffers
    for (let col = 0; col <= fam.cols; col++)
    {
        for (let row = 0; row <= fam.rows; row++)
        {
            const fullname = letters[row] + letters[col];

            const coloff = col * 26;
            const rowoff = (fam.rows - 1 - row) * 30;

            if (col == 0)
            {
                if (row == fam.rows)
                {
                    colInfo['TBUF.'+fullname+'.1'] = 31;
                }
                else
                {
                    colInfo['TBUF.'+fullname+'.1'] = 9;
                    if (row != 0)
                        colInfo['TBUF.'+fullname+'.2'] = 9;
                }
            }
            else if (col == 1)
            {
                if (row == 0)
                    colInfo['TBUF.'+fullname+'.1'] = 35;
                else if (row == fam.rows)
                    colInfo['TBUF.'+fullname+'.1'] = 42;
                else
                {
                    colInfo['TBUF.' + fullname + '.1'] = 39;
                    colInfo['TBUF.' + fullname + '.2'] = 39;
                }
            }
            else if (col == fam.cols)
            {
                if (row == 0)
                    colInfo['TBUF.'+fullname+'.1'] = coloff + 17;
                else if (row == fam.rows)
                    colInfo['TBUF.'+fullname+'.1'] = coloff + 19;
                else
                {
                    colInfo['TBUF.' + fullname + '.1'] = coloff + 15;
                    colInfo['TBUF.' + fullname + '.2'] = coloff + 15;
                }
            }
            else
            {
                if (row == 0 || row == fam.rows)
                    colInfo['TBUF.'+fullname+'.1'] = coloff + 16;
                else
                {
                    colInfo['TBUF.' + fullname + '.1'] = coloff + 15;
                    colInfo['TBUF.' + fullname + '.2'] = coloff + 15;
                }
            }

            if (row == 0)
            {
                rowInfo['TBUF.'+fullname+'.1'] = rowInfo['row.' + letters[row] + '.long.3'] + 1;
            }
            else if (row == fam.rows)
            {
                rowInfo['TBUF.'+fullname+'.1'] = rowInfo['row.' + letters[row] + '.long.1'] + (col==fam.cols ? 2:-1);
            }
            else
            {
                rowInfo['TBUF.'+fullname+'.1'] = rowInfo['row.' + letters[row] + '.long.1'] + 1;
                rowInfo['TBUF.'+fullname+'.2'] = rowInfo['row.' + letters[row] + '.long.2'] - 1;
            }
        }
    }

    colInfo['GCLK'] = 24;
    rowInfo['GCLK'] = rmaxG - 13;
    colInfo['ACLK'] = cmaxG - 23;
    rowInfo['ACLK'] = 20;
    colInfo['OSC'] = cmaxG - 24;
    rowInfo['OSC'] = 26;

  // Make reverse tables
  Object.entries(rowInfo).forEach(([key, val]) => rowFromG[val[0]] = key);
  Object.entries(colInfo).forEach(([key, val]) => colFromG[val[0]] = key);
  Object.entries(rowInfo).forEach(([key, val]) => rowFromS[val[1]] = key);
  Object.entries(colInfo).forEach(([key, val]) => colFromS[val[1]] = key);
}

function getGCoords(name)
{
    name = name.split(':');
    var cname, rname;

    if (name.length == 1)
    {
        cname = name[0];
        rname = name[0];
    }
    else
    {
        cname = name[0];
        rname = name[1];
    }

    if (isNaN(cname)) cname = colInfo[cname];
    else              cname = parseInt(cname);
    if (isNaN(rname)) rname = rowInfo[rname];
    else              rname = parseInt(rname);

    if (typeof cname == 'undefined' || typeof rname == 'undefined')
        return undefined;

    return {x: cname, y: rname};
}

function getSCoords(name)
{
    var gc;
    if (typeof name == 'string')
        gc = getGCoords(name);
    else
        gc = name;

    if (typeof gc == 'undefined')
        return undefined;

    return {x: colGtoS[gc.x], y: rowGtoS[gc.y]};
}

  function fillText(ctx, text, x, y) {
    ctx.fillText(text, x + 0.5, y + 0.5);
  }

  function vtext(ctx, text, x, y) {
    for (var i = 0 ; i < text.length; i++) {
      fillText(ctx, text[i], x, y + 8 * i);
    }
  }


function drawTextBox(ctx, text, x, y, w, h)
{
    ctx.strokeRect(x, y, w, h);

    let lines = text.split('\n');
    let ty = y+7;
    lines.forEach((l) =>
    {
        ctx.fillText(l, x+1, ty, w-2);
        ty += 10;
    });
}

function drawBackground(ctx)
{
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset

    var fam = curBitstream.family;

    var w = 272 + ((fam.cols-1) * 104);
    var h = 268 + ((fam.rows-1) * 120);
    var cx = 188 + (((fam.cols/2)-1) * 104);
    var cy = 168 + (((fam.rows/2)-1) * 120);

    var HEIGHT = h * SCALE;
    var WIDTH = w * SCALE;

    ctx.canvas.height = HEIGHT;
    ctx.canvas.width = WIDTH;
    $("#container").css('height', HEIGHT + 'px');
    $("#container").css('width', WIDTH + 'px');
    $("#info").css('margin-left', WIDTH + 'px');
    $("#info3").css('margin-left', WIDTH + 'px');
    $("#info3").css('clear', 'none');

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.translate(0.5, 0.5); // Prevent antialiasing
    ctx.scale(SCALE, SCALE);
    ctx.lineWidth = 1;
    ctx.lineCap = 'butt';

    // draw fixed elements

    ctx.strokeStyle = '#aaa';
    ctx.fillStyle = '#aaa';
    ctx.font = '8px Arial';

    drawTextBox(ctx, 'PWR\nDN', 12, 12, 20, 20);
    drawTextBox(ctx, 'VCC', 12, cy, 20, 20);
    drawTextBox(ctx, 'M1R\nD', 12, h-68, 20, 20);
    drawTextBox(ctx, 'M0R', 12, h-24, 20, 12);

    drawTextBox(ctx, 'GND', cx, 12, 20, 12);
    drawTextBox(ctx, 'GND', cx, h-24, 20, 12);

    drawTextBox(ctx, 'CCL\nK', w-32, 12, 20, 20);
    drawTextBox(ctx, 'VCC', w-32, cy, 20, 20);
    drawTextBox(ctx, 'DPG\nM', w-32, h-64, 20, 20);
    drawTextBox(ctx, 'RST', w-52, h-24, 20, 12);

    // draw background for programmable elements

    decoders.forEach(d => d.renderBackground(ctx));
}

function drawLayout(ctx)
{
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset

    var fam = curBitstream.family;

    var w = 272 + ((fam.cols-1) * 104);
    var h = 268 + ((fam.rows-1) * 120);
    var cx = 188 + (((fam.cols/2)-1) * 104);
    var cy = 168 + (((fam.rows/2)-1) * 120);

    var HEIGHT = h * SCALE;
    var WIDTH = w * SCALE;

    ctx.canvas.height = HEIGHT;
    ctx.canvas.width = WIDTH;

    ctx.fillStyle = '#000';
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.translate(0.5, 0.5); // Prevent antialiasing
    ctx.scale(SCALE, SCALE);
    ctx.lineWidth = 1;
    ctx.lineCap = 'butt';

    // draw programmable elements

    decoders.forEach(d => d.render(ctx));
}


// Processes a click on the Layout image
function layoutMouse(x, y)
{
    // TODO
}

function layoutClick(x, y, btn)
{
  removePopups();
  x = Math.floor(x / SCALE);
  y = Math.floor(y / SCALE);
  let col;
  let row;
  Object.entries(colInfo).forEach(function([k, v]) {
    if (Math.abs(v - x) < 3) {
      col = k;
    }
  });
  Object.entries(rowInfo).forEach(function([k, v]) {
    if (Math.abs(v - y) < 3) {
      row = k;
    }
  });
  if (row == undefined || col == undefined) {
    $("#info0").html("");
  } else if (debug) {
    const gcoord = col + "G" + row;
    /*let pip = "";
    if (IobDecoders.gToName[gcoord]) {
      pip = IobDecoders.gToName[gcoord];
    }
    $("#info0").html(col + " " + row + " " + colv[0] + "G" + rowv[0] + "; " + colv[1] + "," + rowv[1] + " " + pip);
    console.log(col, row, colv[0] + "G" + rowv[0] + "; " + colv[1] + "," + rowv[1] + " " + pip);
    //console.log(iobDecoders.getFromPin(18));*/
  }

    let clb = clbDecoders.getFromXY(x, y);
    if (clb) {
        console.log(clb);
        if (btn != 0)
            clbDrawPopup(clb, x, y);
        else
        {
            //
        }
        //console.log(clb.info());
        return;
    }
  let iob = iobDecoders.getFromXY(x, y);
  if (iob) {
    console.log(iob);
    console.log(pipDecoder);
    if (btn != 0)
      iobDrawPopup(iob, x, y);
    else
    {
        //
    }
    //console.log(iob.info());
    return;
  }
}

function removePopups() {
  clbRemovePopup();
  iobRemovePopup();
}
