class ClbDecoder {
  constructor(col, row, tile) { // tile is e.g. AB
    this.col = col;
    this.row = row;
    this.tile = tile;

    this.gPt = getGCoords(tile);
    this.screenPt = getSCoords(this.gPt);
    this.W = 20;
    this.H = 32;

    console.log(this);

    // determine neighboring tiles
    this.tileLeft = (col == 0) ? null : letters[row]+letters[col-1];
    this.tileRight = (col == curBitstream.family.cols-1) ? null : letters[row]+letters[col+1];
    this.tileTop = (row == 0) ? null : letters[row-1]+letters[col];
    this.tileBottom = (row == curBitstream.family.rows-1) ? null : letters[row+1]+letters[col];

    this.generateClbPips();
    /*let xCenter = colInfo[this.tile[1]];
    let yCenter = rowInfo[this.tile[0]];
    this.W = 20;
    this.H = 32;
    this.screenPt = [xCenter - this.W / 2, yCenter - this.H / 2 - 1];
    this.clbInternal = new ClbInternal(tile);

    this.levels = {A:0, B:0, C:0, D:0, Q:0, K:0, F:0, G:0, X:0, Y:0};
    //this.dirty = {A:false, B:false, C:false, D:false, K:false};*/
  }

  reset()
  {
    this.levels = {A:0, B:0, C:0, D:0, Q:0, K:0, F:0, G:0, X:0, Y:0};
    this.clbInternal.reset();
  }

  setLevel(name, val)
  {
    //console.log('CLB '+this.tile+' SET LEVEL '+name+'='+val);
    if (val != this.levels[name])
    {
      //if (this.tile == 'JJ') console.log('CLB '+this.tile+' SET LEVEL '+name+'='+val);
      this.levels[name] = val;
      //this.dirty[name] = true;
    }
  }

  update()
  {
    /*this.dirty['A'] = false;
    this.dirty['B'] = false;
    this.dirty['C'] = false;
    this.dirty['D'] = false;
    this.dirty['K'] = false;*/

    this.clbInternal.compute(this.levels);
    
    var levels = this.levels;
    this.destList.forEach(function(dest)
    {
      propagateLevel(dest, levels['X']);
    });
    this.destList2.forEach(function(dest)
    {
      propagateLevel(dest, levels['Y']);
    });
  }

  genCoords(name)
  {
    name = name.replaceAll('**', this.tile)
        /*.replaceAll('-*', letters[this.row-1]+this.tile[1])
        .replaceAll('*-', this.tile[0]+letters[this.col-1])
        .replaceAll('+*', letters[this.row+1]+this.tile[1])
        .replaceAll('*+', this.tile[0]+letters[this.col+1])*/
        .replaceAll('col.*', 'col.'+this.tile[1])
        .replaceAll('col.+', 'col.'+letters[this.col+1])
        .replaceAll('row.*', 'row.'+this.tile[0])
        .replaceAll('row.+', 'row.'+letters[this.row+1]);

    return name;
  }

  generateClbPips()
  {
    var maxcol = curBitstream.family.cols-1;
    var maxrow = curBitstream.family.rows-1;

    var apips = [], ecpips = [],
        dipips = [], bpips = [], cpips = [], kpips = [], epips = [],
        dpips = [], rdpips = [],
        xpips = [], ypips = [];

    this.aPath = new Path(this, 'A', 'dest', {x: this.gPt.x + 3, y: this.gPt.y}, 'V');
    this.ecPath = new Path(this, 'EC', 'dest', {x: this.gPt.x + 1, y: this.gPt.y}, 'V');
    this.diPath = new Path(this, 'DI', 'dest', {x: this.gPt.x, y: this.gPt.y - 1}, 'H');
    this.bPath = new Path(this, 'B', 'dest', {x: this.gPt.x, y: this.gPt.y - 3}, 'H');
    this.cPath = new Path(this, 'C', 'dest', {x: this.gPt.x, y: this.gPt.y - 4}, 'H');
    this.kPath = new Path(this, 'K', 'dest', {x: this.gPt.x, y: this.gPt.y - 6}, 'H');
    this.ePath = new Path(this, 'E', 'dest', {x: this.gPt.x, y: this.gPt.y - 7}, 'H');
    this.dPath = new Path(this, 'D', 'dest', {x: this.gPt.x + 1, y: this.gPt.y - 8}, 'V');
    this.rdPath = new Path(this, 'RD', 'dest', {x: this.gPt.x + 2, y: this.gPt.y - 8}, 'V');
    this.xPath = new Path(this, 'X', 'source', {x: this.gPt.x + 5, y: this.gPt.y - 2}, 'H');
    this.yPath = new Path(this, 'Y', 'source', {x: this.gPt.x + 5, y: this.gPt.y - 5}, 'H');

    if (this.row == 0)
    {
      if (this.col == 0)
      {
        apips.push('row.*.long.3:3', 'T:+6', '-6:0',
            ['-3', 'row.*.local.3:2', 'row.*.local.1:1'],
            'col.*.local.3:5', 'col.*.local.1:4');

        ecpips.push('T:+3', 'T:+1', 'T:+6',
            ['-4', 'T:-4', 'col.*.long.3:3', 'col.*.local.3:2'],
            'T:-5', 'row.*.local.5:1', 'row.*.local.2:0');
      }
      else
      {
        apips.push('row.*.long.3:3',
            ['+5', 'col.*.local.3:5', 'col.*.local.1:4'],
            '+1:0', 'row.*.local.3:2', 'row.*.local.1:1');

        ecpips.push(['+5', 'col.*.long.1:3', 'col.*.local.3:2']);
        if (this.col == maxcol)
          ecpips.push('T:+0', 'T:+1', 'T:+7', 'T:-9');
        else
          ecpips.push('T:+7', 'T:-8');
        ecpips.push('row.*.local.5:1', 'row.*.local.2:0');
      }

      dipips.push([this.col==0?'-14':'-8', 'row.*.long.2:3', 'row.*.local.5:2'],
          'col.*.local.4:1', 'col.*.local.1:0');

      bpips.push(this.col==0?'-3:4':'-2:4', this.col==0?'col.*.long.3:3':'col.*.long.1:3',
          [this.col==0?'-3':'-1', 'row.*.local.4:5', 'row.*.local.2:6', 'row.*.local.1:7'],
          'col.*.local.5:2', 'col.*.local.3:1', 'col.*.local.1:0');
    }
    else
    {
      apips.push([this.col==0?'+8':'+5', 'col.*.local.3:5', 'col.*.local.1:4'],
          'row.*.long.2:3', 'row.*.local.3:2', 'row.*.local.1:1', this.col==0?'+2:0':'+6:0');

      dipips.push([this.col==0?'-14':'-8', 'row.*.local.5:2', 'row.*.long.1:3'],
          'col.*.local.4:1', 'col.*.local.1:0');

      ecpips.push('T:+6',
          ['-1', 'row.*.local.5:1', 'row.*.local.2:0'],
          this.col==0?'col.*.long.3:3':'col.*.long.1:3', 'col.*.local.3:2');

      if (this.col == 0)
      {
        bpips.push('-3:4', 'col.*.long.3:3',
            ['-3', 'row.*.local.4:5', 'row.*.local.2:6', 'row.*.local.1:7'],
            'col.*.local.5:2', 'col.*.local.3:1', 'col.*.local.1:0');
      }
      else
      {
        if (this.row == maxrow)
          bpips.push('col.*.long.1:3',
              ['-1', 'T:+7', 'T:+11', 'row.*.local.4:5', 'row.*.local.2:6', 'row.*.local.1:7'],
              'col.*.local.8:4', 'col.*.local.5:2', 'col.*.local.3:1', 'col.*.local.1:0');
        else
          bpips.push('-2:4', 'col.*.long.1:3',
              ['-1', 'T:+7', 'T:+11', 'row.*.local.4:5', 'row.*.local.2:6', 'row.*.local.1:7'],
              'col.*.local.5:2', 'col.*.local.3:1', 'col.*.local.1:0');
      }
    }

    if (this.row == maxrow)
    {
      cpips.push(this.col==0?'-2:4':'-1:4', this.col==0?'col.*.long.4:3':'col.*.long.2:3',
          [this.col==0?'-3':'-5', 'row.+.local.1:7', 'row.+.local.3:6', 'row.+.local.5:5'],
          'col.*.local.5:2', 'col.*.local.4:1', 'col.*.local.2:0');

      if (this.col == 0)
      {
        kpips.push('col.*.long.6:1', 'col.*.long.5:2', ['-3', 'row.+.local.2:3'], 'col.*.local.2:0');
        epips.push(['-2', 'T:-11', 'T:-4', 'row.+.local.5:3'], 'col.*.long.4:2', 'col.*.local.5:1', 'col.*.local.3:0');

        dpips.push('T:-2',
            ['-2', 'row.+.long.1:2', 'row.+.local.2:5', 'row.+.local.4:4'],
            '-2:3', 'col.*.local.4:1', 'col.*.local.2:0');

        rdpips.push('T:-1', 'col.*.long.3:1',
            ['-4', 'row.+.long.2:3', 'row.+.local.3:2'],
            'col.*.local.4:0');
      }
      else
      {
        kpips.push('col.*.long.3:2', ['-3', 'row.+.local.2:3'], 'col.*.long.0:1', 'col.*.local.2:0');
        epips.push('col.*.long.2:2', ['-3', 'row.+.local.5:3'], 'col.*.local.5:1', 'col.*.local.3:0');

        dpips.push('T:-2', '-1:3',
            ['-8', 'row.+.long.1:2', 'row.+.local.2:5', 'row.+.local.4:4'],
            'col.*.local.4:1', 'col.*.local.2:0');

        rdpips.push(['-1', 'T:+1', 'row.+.long.2:3', 'row.+.local.3:2'],
            'T:+0', 'col.*.long.1:1', 'col.*.local.4:0');
      }
    }
    else
    {
      cpips.push(this.col==0?'-2:4':'-1:4', this.col==0?'col.*.long.4:3':'col.*.long.2:3',
          [this.col==0?'-3':'-2', 'row.+.local.1:5', 'row.+.local.3:6', 'row.+.local.5:7'],
          'col.*.local.5:2', 'col.*.local.4:1', 'col.*.local.2:0');

      if (this.col == 0)
      {
        kpips.push('col.*.long.6:1', 'col.*.long.5:2', ['-3', 'row.+.local.4:3'], 'col.*.local.2:0');
        epips.push(['-3', 'row.+.local.1:3'], 'col.*.long.4:2', 'col.*.local.5:1', 'col.*.local.3:0');

        dpips.push(['-3', 'col.*.local.4:1', 'col.*.local.2:0'],
            'row.+.long.1:2', 'row.+.local.6:3', 'row.+.local.2:4', 'row.+.local.4:5');
      }
      else
      {
        kpips.push(['-1', 'row.+.local.4:3'], 'col.*.long.3:2', 'col.*.long.0:1', 'col.*.local.2:0');
        epips.push('col.*.long.2:2', ['-5', 'row.+.local.1:3'], 'col.*.local.5:1', 'col.*.local.3:0');

        dpips.push(['-1', 'T:-12', 'T:+1', 'col.*.local.4:1', 'col.*.local.2:0'],
            'row.+.long.1:2', 'row.+.local.6:3', 'row.+.local.2:4', 'row.+.local.4:5');
      }

      rdpips.push([this.col==0?'-1':'-3', this.col==0?'col.*.long.3:1':'col.*.long.1:1', 'col.*.local.4:0'],
          'row.+.local.3:2', 'row.+.long.2:3');
    }

    if (this.col == 0)
    {
      if (this.row == 0) xpips.push(['+1', 'T:+9', '-12']);
      else               xpips.push(['+1', 'T:+6', 'T:-1', 'T:+1', '-11']);
      xpips.push('col.+.local.1:0', 'col.+.local.4:1');
      if (this.row == maxrow) xpips.push('T:+3', '-1', 'T:row.+.local.8', 'T:+12', 'row.+.local.1:2', 'row.+.local.5:3');
      else                    xpips.push('T:+11', '-1', 'row.+.local.1:2', 'row.+.local.5:3');
    }
    else if (this.col == maxcol)
    {
      if (this.row == 0) xpips.push(['+1', 'T:+5', 'T:-17', 'T:-2', 'T:-16', '-5']);
      else               xpips.push(['+1', 'T:+4', 'T:-17', 'T:-1', 'T:-16', '-5']);
      xpips.push(this.row==maxrow?'+7':'col.+.local.8',
          'col.+.local.1:0', 'col.+.local.4:1', 'col.+.local.5:2');
    }
    else
    {
      if (this.row == 0) xpips.push(['+1', 'T:+5', 'T:-17', 'T:-2', 'T:-16', '-5']);
      else               xpips.push(['+1', 'T:+4', 'T:-17', 'T:-1', 'T:-16', '-5']);
      xpips.push('col.+.local.1:0', 'col.+.local.4:1');
      if (this.row == maxrow) xpips.push('T:+3', '-1', 'T:row.+.local.8', (this.col==maxcol-1?'T:+8':'T:+12'), 'row.+.local.1:2', 'row.+.local.5:3');
      else                    xpips.push('T:+11', '-1', 'row.+.local.1:2', 'row.+.local.5:3');
    }

    if (this.col == 0)
    {
      if (this.row == maxrow) ypips.push(['+1', '-11']);
      else                    ypips.push(['+1', 'T:-8', '-3']);
      if (this.row == 0) ypips.push(['+1', '+16']);
      else               ypips.push(['+1', 'T:+10', 'T:-1', 'T:+11', '-5']);
      ypips.push('col.+.local.2:0', 'col.+.local.3:1', 'col.+.local.5:2');
      if (this.row == maxrow) ypips.push('T:+1', 'T:+5', 'T:+2', 'row.*.local.4:3');
      else                    ypips.push('T:+3', 'row.*.local.4:3');
    }
    else if (this.col == maxcol)
    {
      if (this.row == maxrow) ypips.push(['+1', '-13']);
      else                    ypips.push(['+1', 'T:-4', '-3']);
      if (this.row == 0) ypips.push(['+1', 'T:+18', '+3'], ['+7', '+13']);
      else               ypips.push(['+1', 'T:+9', 'T:-1', 'T:+12', '-5'], ['+7', '+7']);
      ypips.push('col.+.local.2:0', 'col.+.local.3:1', 'col.+.local.5:2');
    }
    else
    {
      if (this.row == maxrow) ypips.push(['+1', '-11']);
      else                    ypips.push(['+1', 'T:-4', '-3']);
      if (this.row == 0) ypips.push(['+1', '+16']);
      else               ypips.push(['+1', 'T:+9', 'T:-1', 'T:+12', '-5']);
      ypips.push('col.+.local.2:0', 'col.+.local.3:1', 'col.+.local.5:2');
      if (this.row == maxrow) ypips.push('T:+1', 'T:+5', 'T:+2', 'row.*.local.4:3');
      else                    ypips.push('T:+3', 'row.*.local.4:3');
    }

    this.aPath.appendPipList(apips, this.genCoords.bind(this));
    this.ecPath.appendPipList(ecpips, this.genCoords.bind(this));
    this.diPath.appendPipList(dipips, this.genCoords.bind(this));
    this.bPath.appendPipList(bpips, this.genCoords.bind(this));
    this.cPath.appendPipList(cpips, this.genCoords.bind(this));
    this.kPath.appendPipList(kpips, this.genCoords.bind(this));
    this.ePath.appendPipList(epips, this.genCoords.bind(this));
    this.dPath.appendPipList(dpips, this.genCoords.bind(this));
    this.rdPath.appendPipList(rdpips, this.genCoords.bind(this));
    this.xPath.appendPipList(xpips, this.genCoords.bind(this));
    this.yPath.appendPipList(ypips, this.genCoords.bind(this));
  }

  // Decoded the received data
  decode()
  {
    //this.clbInternal.decode(bitstreamTable);
  }

  renderBackground(ctx)
  {
    // TODO: select different color if CLB is used
    ctx.strokeStyle = '#aaa';
    ctx.fillStyle = '#aaa';
    ctx.font = '8px Arial';

    drawTextBox(ctx, this.tile, this.screenPt.x, this.screenPt.y, this.W, this.H);

    // draw connect lines for the CLB inputs/outputs
    ctx.beginPath();
    ctx.moveTo(this.screenPt.x+4, this.screenPt.y);
    ctx.lineTo(this.screenPt.x+4, this.screenPt.y-2);
    ctx.moveTo(this.screenPt.x+12, this.screenPt.y);
    ctx.lineTo(this.screenPt.x+12, this.screenPt.y-2);
    ctx.moveTo(this.screenPt.x+20, this.screenPt.y+8);
    ctx.lineTo(this.screenPt.x+22, this.screenPt.y+8);
    ctx.moveTo(this.screenPt.x+20, this.screenPt.y+20);
    ctx.lineTo(this.screenPt.x+22, this.screenPt.y+20);
    ctx.moveTo(this.screenPt.x+8, this.screenPt.y+32);
    ctx.lineTo(this.screenPt.x+8, this.screenPt.y+34);
    ctx.moveTo(this.screenPt.x+4, this.screenPt.y+32);
    ctx.lineTo(this.screenPt.x+4, this.screenPt.y+34);
    ctx.moveTo(this.screenPt.x, this.screenPt.y+28);
    ctx.lineTo(this.screenPt.x-2, this.screenPt.y+28);
    ctx.moveTo(this.screenPt.x, this.screenPt.y+24);
    ctx.lineTo(this.screenPt.x-2, this.screenPt.y+24);
    ctx.moveTo(this.screenPt.x, this.screenPt.y+16);
    ctx.lineTo(this.screenPt.x-2, this.screenPt.y+16);
    ctx.moveTo(this.screenPt.x, this.screenPt.y+12);
    ctx.lineTo(this.screenPt.x-2, this.screenPt.y+12);
    ctx.moveTo(this.screenPt.x, this.screenPt.y+4);
    ctx.lineTo(this.screenPt.x-2, this.screenPt.y+4);
    ctx.stroke();

    this.aPath.draw(ctx);
    this.ecPath.draw(ctx);
    this.diPath.draw(ctx);
    this.bPath.draw(ctx);
    this.cPath.draw(ctx);
    this.kPath.draw(ctx);
    this.ePath.draw(ctx);
    this.dPath.draw(ctx);
    this.rdPath.draw(ctx);
    this.xPath.draw(ctx);
    this.yPath.draw(ctx);
  }

  render(ctx)
  {
    //
  }

  info() {
    let result = [];
    result.push(this.clbInternal.describe());
    return "CLB: " + this.tile + " " + result.join(" ");
  }

  isInside(x, y) {
    return x >= this.screenPt.x && x < this.screenPt.x + this.W && y >= this.screenPt.y && y < this.screenPt.y + this.H;
  }
}

class ClbDecoders {
  constructor() {
    this.clbDecoders = {};
    var fam = curBitstream.family;
    for (let i = 0; i < fam.rows; i++) {
      for (let j = 0; j < fam.cols; j++) {
        let tile = letters[i] + letters[j];
        this.clbDecoders[tile] = new ClbDecoder(j, i, tile);
      }
    }
    // These are in the config as CLBs.
    //this.clbDecoders["CLK.AA.I"] = new ClkDecoder("CLK.AA.I");
    //this.clbDecoders["CLK.KK.I"] = new ClkDecoder("CLK.KK.I");
  }

  reset() {
    Object.entries(this.clbDecoders).forEach(([k, c]) => c.reset());
  }

  get(tile) {
    return this.clbDecoders[tile];
  }

  decode() {
    Object.entries(this.clbDecoders).forEach(([k, c]) => c.decode());
  }

  routeFromOutputs() {
    Object.entries(this.clbDecoders).forEach(([k, c]) => c.routeFromOutputs());
  }

  renderBackground(ctx) {
    Object.entries(this.clbDecoders).forEach(([tile, obj]) => obj.renderBackground(ctx));
  }

  render(ctx) {
    Object.entries(this.clbDecoders).forEach(([tile, obj]) => obj.render(ctx));
  }
}

ClbDecoders.gToName = {};
ClbDecoders.tileToG = {};

const XXXmuxB = [
["col.X.local.2:==.B", "CLK.AA.O:==.B", "1"],
["col.X.long.1:==.B", "col.X.long.2:==.B", "2"],
["col.X.local.5:==.B", "col.X.local.4:==.B", "3"],
["=-.X:==.B", "col.X.local.1:==.B", "4"],
["-=.X:==.B", "col.X.local.3:==.B", "!5"],
"0"];

// Indices into the bitmamp
var tileToBitmapX = {A: 3, B: 21, C: 39, D: 57, E: 77, F: 95, G: 113, H: 133, I: 151, J: 169, K: 187};
var tileToBitmapY = {A: 1, B: 9, C: 17, D: 25, E: 34, F: 42, G: 50, H: 59, I: 67, J: 75, K: 83};

class ClbInternal {
    // bitPt is the index into the config bitmap
    constructor(name) {
      this.bitPt = [tileToBitmapX[name[1]], tileToBitmapY[name[0]]];
      this.name = name; // temp

      this.stoClock = 0;
    }

    reset()
    {
      this.stoClock = 0;
    }

    /**
     * Decode this CLB from the bitstreamTable.
     */
    decode(bitstreamTable) {
      this.bitTypes = []; // Fill this in as we go
      var x = this.bitPt[0];
      var y = this.bitPt[1];
      var nf = 0;
      for (var bitnum = 0; bitnum < 8; bitnum++) {
        var bit = bitstreamTable[x + bitnum][y + 7];
        this.bitTypes.push([x + bitnum, y + 7, BITTYPE.lut]);
        if (bit) {
          nf |= 1 << [1, 0, 2, 3, 5, 4, 6, 7][bitnum]; // Ordering of LUT is irregular
        }
      }
      this.configNf = nf;
      var fin1 = bitstreamTable[x + 7][y + 6] ? 'A' : 'B';
      var fin2 = bitstreamTable[x + 6][y + 6] ? 'B' : 'C';
      var fin3 = 'Q';
      if (bitstreamTable[x + 1][y + 6]) {
        fin3 = 'C';
      } else if ( bitstreamTable[x + 0][y + 6]) {
        fin3 = 'D';
      }
      this.bitTypes.push([x + 7, y + 6, BITTYPE.clb], [x + 6, y + 6, BITTYPE.clb], [x + 1, y + 6, BITTYPE.clb], [x + 0, y + 6, BITTYPE.clb]);

      var ng = 0;
      for (var bitnum = 0; bitnum < 8; bitnum++) {
        bit = bitstreamTable[x + bitnum + 10][y + 7];
        this.bitTypes.push([x + bitnum + 10, y + 7, BITTYPE.lut]);
        if (bit) {
          ng |= 1 << [7, 6, 4, 5, 3, 2, 0, 1][bitnum]; // Ordering of LUT is irregular
        }
      }
      this.configNg = ng;
      var gin1 = bitstreamTable[x + 11][y + 6] ? 'A' : 'B';
      var gin2 = bitstreamTable[x + 12][y + 6] ? 'B' : 'C';
      this.bitTypes.push([x + 11, y + 6, BITTYPE.clb], [x + 12, y + 6, BITTYPE.clb]);
      var gin3 = 'Q';
      if ( bitstreamTable[x + 16][y + 6]) {
        gin3 = 'C';
      } else if ( bitstreamTable[x + 17][y + 6]) {
        gin3 = 'D';
      }

      var str;
      var fname = 'F'; // The F output used internally; renamed to M for Base FGM.
      var gname = 'G';
      this.bitTypes.push([x + 9, y + 7, BITTYPE.clb]);
      if (bitstreamTable[x + 9][y + 7] != 1) {
        if (fin1 == gin1 && fin2 == gin2 && fin3 == gin3) {
          this.configBase = 'F';
          this.configF = fin1 + ':B:' + fin2 + ':' + fin3;
          this.configG = '';
          gname = 'F'; // NO G
          // F,G combined
          this.configFormulaF = formula4((nf << 8) | ng, fin1, fin2, fin3, 'B');
          str = 'F = ' + this.configFormulaF;
        } else {
          // MUX
          this.configBase = 'FGM';
          this.configF = fin1 + ':' + fin2 + ':' + fin3;
          this.configG = gin1 + ':' + gin2 + ':' + gin3;
          fname = 'M';
          gname = 'M';
          this.configFormulaF = formula3(nf, fin1, fin2, fin3);
          this.configFormulaG = formula3(ng, gin1, gin2, gin3);
          str = 'F = B*(' + this.configFormulaF +
            ') + ~B*(' + this.configFormulaG + ')';
        }
      } else {
        // F, G separate
        this.configBase = 'FG';
        this.configF = fin1 + ':' + fin2 + ':' + fin3;
        this.configG = gin1 + ':' + gin2 + ':' + gin3;
        this.configFormulaF = formula3(nf, fin1, fin2, fin3);
        this.configFormulaG = formula3(ng, gin1, gin2, gin3);
        str = 'F = ' + this.configFormulaF;
        str += '<br/>G = ' + this.configFormulaG;
      }

      // Select one of four values based on two index bits
      function choose4(bit1, bit0, [val0, val1, val2, val3]) {
        if (bit1) {
          return bit0 ? val3 : val2;
        } else {
          return bit0 ? val1 : val0;
          }
        }
      
      // Decode X input
      this.configX = choose4(bitstreamTable[x + 11][y + 5], bitstreamTable[x + 10][y + 5], ['Q', fname, gname, 'UNDEF']);
      this.bitTypes.push([x + 11, y + 5, BITTYPE.clb], [x + 10, y + 5, BITTYPE.clb]);
      this.configY = choose4(bitstreamTable[x + 13][y + 5], bitstreamTable[x + 12][y + 5], ['Q', gname, fname, 'UNDEF']);
      this.bitTypes.push([x + 13, y + 5, BITTYPE.clb], [x + 12, y + 5, BITTYPE.clb]);
      this.configQ = bitstreamTable[x + 9][y + 5] ? 'LATCH': 'FF';
      this.bitTypes.push([x + 9, y + 5, BITTYPE.clb]);

      // Figure out flip flop type and clock source. This seems a bit messed up.
      let clkInvert = bitstreamTable[x + 5][y + 4]; // Invert flag
      this.bitTypes.push([x + 5, y + 4, BITTYPE.clb]);
      if (bitstreamTable[x + 9][y + 5]) {
        clkInvert = !clkInvert; // LATCH flips the clock
      }
      if (bitstreamTable[x + 6][y + 4] == 0) {
        // No clock
        this.configClk = '';
      } else {
        if (bitstreamTable[x + 4][y + 4] == 1) {
          this.configClk = 'C';
        } else {
          // K or G inverted. This seems like a bug in XACT?
          // Assume not inverted?
          /*if (clkInvert) {
            clkInvert = 0;
            this.configClk = gname;
          } else {
            this.configClk = 'K';
          }*/
          //console.log(this.name, 'CLOCK K OR G', clkInvert);
          // I have seen CLBs with K or NOT K used here, and G=0
          // so it would make sense for it to always be K
          this.configClk = 'K';
          clkInvert = !clkInvert;
        }
      }
      this.bitTypes.push([x + 6, y + 4, BITTYPE.clb]);
      this.bitTypes.push([x + 4, y + 4, BITTYPE.clb]);
      if (clkInvert) { // Add NOT, maybe with colon separator.
        if (this.configClk != '') {
          this.configClk += ':NOT';
        } else {
          this.configClk += 'NOT';
        }
      }

      this.configSet = choose4(bitstreamTable[x + 3][y + 5], bitstreamTable[x + 2][y + 5], ['A', '', fname, 'BOTH?']);
      this.bitTypes.push([x + 3, y + 5, BITTYPE.clb], [x + 2, y + 5, BITTYPE.clb]);
      this.configRes = choose4(bitstreamTable[x + 1][y + 5], bitstreamTable[x + 0][y + 5], ['', 'G?', 'D', gname]);
      //this.configRes = choose4(bitstreamTable[x + 1][y + 5], bitstreamTable[x + 0][y + 5], ['', gname, 'D', 'wat?']);
      this.bitTypes.push([x + 1, y + 5, BITTYPE.clb], [x + 0, y + 5, BITTYPE.clb]);
      this.configString = 'X:' + this.configX + ' Y:' + this.configY + ' F:' + this.configF + ' G:' + this.configG + ' Q:' + this.configQ +
          ' SET:' + this.configSet + ' RES:' + this.configRes + ' CLK:' + this.configClk;

      //console.log(this.name+' -> '+this.configSet+' / '+this.configRes);
    }

    logic(lut, b0, b1, b2, b3)
    {
      var idx = b0 | (b1 << 1) | (b2 << 2) | (b3 << 3);
      return (lut >> idx) & 1;
    }

    compute(levels)
    {
      // 1. logic tables

      if (this.configBase == 'F')
      {
        var inF = this.configF.split(':');
        var lutF = (this.configNf << 8) | this.configNg;
        levels['F'] = this.logic(lutF, levels[inF[0]], levels[inF[2]], levels[inF[3]], levels['B']);
        levels['G'] = levels['F'];
      }
      else if (this.configBase == 'FG')
      {
        var inF = this.configF.split(':');
        var lutF = this.configNf;
        levels['F'] = this.logic(lutF, levels[inF[0]], levels[inF[1]], levels[inF[2]], 0);

        var inG = this.configG.split(':');
        var lutG = this.configNg;
        levels['G'] = this.logic(lutG, levels[inG[0]], levels[inG[1]], levels[inG[2]], 0);
      }
      else if (this.configBase == 'FGM')
      {
        var in_, lut;
        if (levels['B'])
        {
          in_ = this.configF.split(':');
          lut = this.configNf;
        }
        else
        {
          in_ = this.configG.split(':');
          lut = this.configNg;
        }

        levels['F'] = this.logic(lut, levels[in_[0]], levels[in_[1]], levels[in_[2]], 0);
        levels['G'] = levels['F'];
        levels['M'] = levels['F'];
      }

      // 2. storage

      var clk = this.configClk.split(':');
      var hasclk = (this.configClk && (this.configClk != 'NOT'));

      if (this.configRes && levels[this.configRes])
      {
        levels['Q'] = 0;
      }
      else if (this.configSet && levels[this.configSet])
      {
        levels['Q'] = 1;
      }
      else if (hasclk)
      {
        var trig = false;

        if (this.configQ == 'FF')
        {
          // level triggered
          if (clk[1] == 'NOT')
            trig = (levels[clk[0]] == 0);
          else
            trig = (levels[clk[0]] == 1);
        }
        else if (this.configQ == 'LATCH')
        {
          // edge triggered
          if (clk[1] == 'NOT')
            trig = ((this.stoClock == 1) && (levels[clk[0]] == 0));
          else
            trig = ((this.stoClock == 0) && (levels[clk[0]] == 1));
        }

        if (trig) levels['Q'] = levels['F'];
      }

      if (hasclk)
        this.stoClock = levels[clk[0]];
      else
        this.stoClock = 0;

      // 3. output

      levels['X'] = levels[this.configX];
      levels['Y'] = levels[this.configY];
    }

    config() {
      return this.configString;
    }

    describe() {
      return this.configString;
    }

    shortInfo() {
      if (!this.configBase) {
        return "";
      } else {
        return (this.configBase + ":" + this.configX + ':' + this.configY + ':' + this.configSet + ":" + this.configRes + ":" + this.configClk + this.configNf + ":" + this.configNg).
          replaceAll("UNDEF", "");
      }
    }

    /**
     * Returns the function of each (known) bit in the bitstreamTable.
     *
     * Format: [[x, y, type], ...]
     */
    getBitTypes() {
      return this.bitTypes;
    }
  }

let popup = undefined;
function clbDrawPopup(clb, x, y) {
  popup = $("<canvas/>", {class: "popup"}).css("left", x * SCALE).css("top", y * SCALE)[0];
  popup.width = 300;
  popup.height = 300;
  $('#container').append(popup);
  const context = popup.getContext('2d');
  context.resetTransform();
  context.translate(0.5, 0.5); // Prevent aliasing
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "black";
  context.fillRect(0, 0, canvas.width, canvas.height);
  const info = clb.clbInternal;
  if (debug) {
    context.font = "20px arial";
    context.fillStyle = "red";
    context.fillText("s" + clb.clbInternal.configSet + " r" + clb.clbInternal.configRes + " c" + clb.clbInternal.configClk + " q" + clb.clbInternal.configQ, 20, 20);
  }
  context.strokeStyle = "#888";
  if (info.configBase == 'F') {
    drawClbF(info, context);
  } else if (info.configBase == 'FG') {
    drawClbFG(info, context);
  } else if (info.configBase == 'FGM') {
    drawClbFGM(info, context);
  } else {
    throw("Bad config base" + info.configBase);
  }
}

// The F base is the configuration with one 4-input CLB called "F".
function drawClbF(info, context) {
  context.strokeStyle = "white";
  context.fillStyle = "white";
  context.font = "10px arial";
  context.fillText("F = " + info.configFormulaF, 21, 250);
  context.font = "20px arial";
  context.beginPath();
  context.rect(38, 48, 29, 108); // F box
  context.rect(120, 82, 29, 76); // Q box
  context.stroke();
  // Inputs to F
  context.fillText(info.configF[0], 21, 63);
  context.fillText(info.configF[2], 21, 95);
  context.fillText(info.configF[4], 21, 127);
  context.fillText(info.configF[6], 21, 159);

  // Labels of F and Q boxes
  context.strokeStyle = "yellow";
  context.fillStyle = "yellow";
  context.fillText("F", 51, 96);
  context.fillText("Q", 130, 126);

  context.beginPath();
  // Line from F to Q
  context.moveTo(67, 87);
  context.lineTo(119, 87);

  // Set connection
  if (!info.configSet) {
    // No connection
  } else if (info.configSet == "A") {
    // Line from A to Q set
    context.fillText("A", 135, 36);
    context.moveTo(141, 40);
    context.lineTo(141, 82);
  } else if (info.configSet == "F") {
    // Line from F to Q set
    context.moveTo(141, 54);
    context.lineTo(141, 82);
  } else {
    throw("Bad set " + info.configSet);
  }
  context.stroke();context.beginPath()

  // Reset connection
  if (!info.configRes) {
    // No connection
  } else if (info.configRes == "D") {
    // Line from D to Q res
    context.fillText("D", 138, 214);
    context.moveTo(141, 198);
    context.lineTo(141, 158);
  } else if (info.configRes == "F") {
    // Line from F to Q res
    context.moveTo(77, 87);
    context.lineTo(77, 182);
    context.lineTo(141, 182);
    context.lineTo(141, 158);
  } else {
    throw("Bad reset " + info.configRes);
  }

  // Clock connection
  if (!info.configClk || info.configClk == "NOT") {
    // No connection
  } else {
    if (info.configClk[0] == "C" || info.configClk[0] == "K") {
      // Line from C or K to clock
      context.fillText(info.configClk[0], 90, 214);
      context.moveTo(94, 197);
      context.lineTo(94, 150);
      context.lineTo(119-6, 150);
    } else if (info.configClk[0] == "F") {
      // Line from F to clock
      context.moveTo(77, 87);
      context.lineTo(77, 150);
      context.lineTo(119-6, 150);
    } else {
       throw("Bad clock " + info.configClk);
    }
    // Inverter bubble or line on Q input
    if (info.configClk.indexOf("NOT") >= 0) {
      context.stroke();
      context.beginPath();
      context.arc(119-3, 150, 3, 0, 2 * Math.PI);
    } else {
      context.lineTo(119, 150);
    }
  }

  // Mark Q with either an E or a clock input triangle

  if (info.configQ == "LATCH") {
    context.fillStyle = "red";
    context.fillText("E", 120, 151);
  } else if (info.configQ == "FF") {
    context.moveTo(120, 158);
    context.lineTo(127, 151);
    context.lineTo(120, 144);
  }

  // X connection
  if (!info.configX || info.configX == "UNDEF") {
    // No connection
  } else if (info.configX == "F") {
    // Line from F to X
    context.moveTo(77, 87);
    context.lineTo(77, 54);
    context.lineTo(188, 54);
    context.lineTo(188, 87);
    context.lineTo(197, 87);
    context.fillText("X", 197, 96);
  } else if (info.configX == "Q") {
    // Line from Q to X
    context.moveTo(148, 118);
    context.lineTo(174, 118);
    context.lineTo(174, 87);
    context.lineTo(197, 87);
    context.fillText("X", 197, 96);
  } else {
    throw("Bad X " + info.configX);
  }

  // Y output
  if (!info.configY || info.configY == "UNDEF") {
    // No output
  } else if (info.configY == "F") {
    context.moveTo(77, 87);
    context.lineTo(77, 54);
    context.lineTo(188, 54);
    context.lineTo(188, 151);
    context.lineTo(195, 151);
    context.fillText("Y", 197, 159);
  } else if (info.configY == "Q") {
    context.moveTo(148, 118);
    context.lineTo(174, 118);
    context.lineTo(174, 151);
    context.lineTo(197, 151);
    context.fillText("Y", 197, 159);
  } else {
     throw("Bad Y " + info.configY);
  }
  context.stroke();
}

// The FG base is the configuration with two 3-input CLBs called "F" and "G".
function drawClbFG(info, context) {
  context.strokeStyle = "white";
  context.fillStyle = "white";
  context.font = "10px arial";
  context.fillText("F = " + info.configFormulaF, 21, 250);
  context.fillText("G = " + info.configFormulaG, 21, 270);
  context.font = "20px arial";
  context.beginPath();
  context.rect(38, 48, 29, 76);
  context.rect(38, 144, 29, 76);
  context.rect(102, 82, 29, 76);
  context.stroke();
  context.fillText(info.configF[0], 21, 63);
  context.fillText(info.configF[2], 21, 95);
  context.fillText(info.configF[4], 21, 127);
  context.fillText(info.configG[0], 21, 159);
  context.fillText(info.configG[2], 21, 191);
  context.fillText(info.configG[4], 21, 223);

  // Labels of F, G, and Q boxes
  context.strokeStyle = "yellow";
  context.fillStyle = "yellow";
  context.fillText("F", 51, 96);
  context.fillText("G", 49, 191);
  context.fillText("Q", 113, 126);

  context.beginPath();
  // Line from F to Q
  context.moveTo(67, 87);
  context.lineTo(102, 87);

  // Set connection
  if (!info.configSet) {
    // No connection
  } else if (info.configSet == "A") {
    // Line from A to Q set
    context.fillText("A", 118, 36);
    context.moveTo(124, 40);
    context.lineTo(124, 82);
  } else if (info.configSet == "F") {
    // Line from F to Q set
    context.moveTo(77, 87);
    context.lineTo(77, 54);
    context.lineTo(124, 54);
    context.lineTo(124, 82);
  } else {
    throw("Bad set " + info.configSet);
  }

  // Reset connection
  if (!info.configRes) {
    // No connection
  } else if (info.configRes == "D") {
    // Line from D to Q res
    context.fillText("D", 118, 216);
    context.moveTo(124, 198);
    context.lineTo(124, 158);
  } else if (info.configRes == "G") {
    // Line from G to Q res
    context.moveTo(67, 182);
    context.lineTo(124, 182);
    context.lineTo(124, 158);
  } else {
    throw("Bad reset " + info.configRes);
  }

  // Clock connection
  if (!info.configClk || info.configClk == "NOT") {
    // No connection
  } else {
    if (info.configClk[0] == "C" || info.configClk[0] == "K") {
      // Line from C or K to clock
      context.fillText(info.configClk[0], 72, 216);
      context.moveTo(77, 197);
      context.lineTo(77, 150);
      context.lineTo(102-6, 150);
    } else if (info.configClk[0] == "G") {
      // Line from G to clock
      context.moveTo(67, 182);
      context.lineTo(77, 182);
      context.lineTo(77, 150);
      context.lineTo(102-6, 150);
    } else {
       throw("Bad clock " + info.configClk);
    }
    // Inverter bubble or line on Q input
    if (info.configClk.indexOf("NOT") >= 0) {
      context.stroke();
      context.beginPath();
      context.arc(102-3, 150, 3, 0, 2 * Math.PI);
    } else {
      context.lineTo(102, 150);
    }
  }

  // Mark Q with either an E or a clock input triangle
  if (info.configQ == "LATCH") {
    context.fillStyle = "red";
    context.fillText("E", 103, 151);
  } else if (info.configQ == "FF") {
    context.moveTo(102, 158);
    context.lineTo(109, 151);
    context.lineTo(102, 144);
  }

  // X connection
  if (!info.configX || info.configX == "UNDEF") {
    // No connection
  } else if (info.configX == "F") {
    // Line from F to X
    context.moveTo(77, 87);
    context.lineTo(77, 54);
    context.lineTo(173, 54);
    context.lineTo(173, 87);
    context.lineTo(196, 87);
    context.fillText("X", 196, 96);
  } else if (info.configX == "G") {
    // Line from G to X
    context.moveTo(67, 182);
    context.lineTo(188, 182);
    context.lineTo(188, 87);
    context.lineTo(196, 87);
    context.fillText("X", 196, 96);
  } else if (info.configX == "Q") {
    // Line from Q to X
    context.moveTo(131, 118);
    context.lineTo(157, 118);
    context.lineTo(157, 87);
    context.lineTo(196, 87);
    context.fillText("X", 196, 96);
  } else {
    throw("Bad X " + info.configX);
  }

  // Y connection
  if (!info.configY || info.configY == "UNDEF") {
    // No output
  } else if (info.configY == "F") {
    context.moveTo(77, 87);
    context.lineTo(77, 54);
    context.lineTo(173, 54);
    context.lineTo(173, 151);
    context.lineTo(196, 151);
    context.fillText("Y", 196, 158);
  } else if (info.configY == "G") {
    // Line from G to Y
    context.moveTo(67, 182);
    context.lineTo(188, 182);
    context.lineTo(188, 151);
    context.lineTo(196, 151);
    context.fillText("Y", 196, 158);
  } else if (info.configY == "Q") {
    context.moveTo(131, 118);
    context.lineTo(157, 118);
    context.lineTo(157, 151);
    context.lineTo(196, 151);
    context.fillText("Y", 196, 158);
  } else {
     throw("Bad Y " + info.configY);
  }
  context.stroke();
}

// The FGM base is the configuration with two 3-input CLBs called "F" and "G", with a multiplexer "M" selecting between them
function drawClbFGM(info, context) {
  context.strokeStyle = "white";
  context.fillStyle = "white";
  context.font = "10px arial";
  context.fillText("F = " + info.configFormulaF, 21, 250);
  context.fillText("G = " + info.configFormulaG, 21, 270);
  context.font = "20px arial";
  context.beginPath();
  context.rect(38, 48, 29, 76);
  context.rect(38, 144, 29, 76);
  context.rect(70, 82, 29, 107);
  context.rect(152, 82, 29, 76);
  context.stroke();
  context.fillText(info.configF[0], 21, 63);
  context.fillText(info.configF[2], 21, 95);
  context.fillText(info.configF[4], 21, 127);
  context.fillText(info.configG[0], 21, 159);
  context.fillText(info.configG[2], 21, 191);
  context.fillText(info.configG[4], 21, 223);

  // Labels of F, G, and Q boxes
  context.strokeStyle = "yellow";
  context.fillStyle = "yellow";
  context.fillText("B", 85, 38);
  context.fillText("F", 51, 96);
  context.fillText("G", 51, 191);
  context.fillText("M", 81, 126);
  context.fillText("Q", 161, 126);

  context.beginPath();
  // Line from F to M
  context.moveTo(67, 87);
  context.lineTo(70, 87);
  // Line from G to M
  context.moveTo(67, 181);
  context.lineTo(70, 181);
  // Line from M to Q
  context.moveTo(99, 118);
  context.lineTo(152, 118);
  // Line from B to M
  context.moveTo(93, 40);
  context.lineTo(93, 82);



  // Set connection
  if (!info.configSet) {
    // No connection
  } else if (info.configSet == "A") {
    // Line from A to Q set
    context.fillText("A", 166, 36);
    context.moveTo(172, 40);
    context.lineTo(172, 82);
  } else if (info.configSet == "M") {
    // Line from M to Q set
    context.moveTo(108, 118);
    context.moveTo(108, 54);
    context.moveTo(172, 54);
    context.lineTo(172, 82);
  } else {
    throw("Bad set " + info.configSet);
  }

  // Reset connection
  if (!info.configRes) {
    // No connection
  } else if (info.configRes == "D") {
    // Line from D to Q res
    context.fillText("D", 165, 216);
    context.moveTo(172, 198);
    context.lineTo(172, 158);
  } else if (info.configRes == "M") {
    // Line from M to Q res
    context.moveTo(108, 118);
    context.lineTo(108, 182);
    context.lineTo(172, 182);
    context.lineTo(172, 158);
  } else {
    throw("Bad reset " + info.configRes);
  }

  // Clock connection
  if (!info.configClk || info.configClk == "NOT") {
    // No connection
  } else {
    if (info.configClk[0] == "C" || info.configClk[0] == "K") {
      // Line from C or K to clock
      context.fillText(info.configClk[0], 118, 211);
      context.moveTo(125, 197);
      context.lineTo(125, 150);
      context.lineTo(150-6, 150);
    } else if (info.configClk[0] == "M") {
      // Line from M to clock
      context.moveTo(108, 118);
      context.lineTo(108, 182);
      context.lineTo(125, 182);
      context.lineTo(125, 150);
      context.lineTo(150-6, 150);
    } else {
       throw("Bad clock " + info.configClk);
    }
    // Inverter bubble or line on Q input
    if (info.configClk.indexOf("NOT") >= 0) {
      context.stroke();
      context.beginPath();
      context.arc(150-3, 150, 3, 0, 2 * Math.PI);
    } else {
      context.lineTo(150, 150);
    }
  }

  // Mark Q with either an E or a clock input triangle

  if (info.configQ == "LATCH") {
    context.fillStyle = "red";
    context.fillText("E", 151, 151);
  } else if (info.configQ == "FF") {
    context.moveTo(150, 158);
    context.lineTo(157, 151);
    context.lineTo(150, 144);
  }

  // X connection
  if (!info.configX || info.configX == "UNDEF") {
    // No connection
  } else if (info.configX == "M") {
    // Line from M to X
    context.moveTo(108, 118);
    context.lineTo(108, 54);
    context.lineTo(220, 54);
    context.lineTo(220, 87);
    context.lineTo(229, 87);
    context.fillText("X", 229, 91);
  } else if (info.configX == "Q") {
    // Line from Q to X
    context.moveTo(181, 118);
    context.lineTo(205, 118);
    context.lineTo(205, 87);
    context.lineTo(229, 87);
    context.fillText("X", 229, 91);
  } else {
    throw("Bad X " + info.configX);
  }

  // Y output
  if (!info.configY || info.configY == "UNDEF") {
    // No output
  } else if (info.configY == "M") {
    context.moveTo(208, 87);
    context.lineTo(208, 54);
    context.lineTo(220, 54);
    context.lineTo(220, 151);
    context.lineTo(229, 151);
    context.fillText("Y", 229, 160);
  } else if (info.configY == "Q") {
    context.moveTo(181, 118);
    context.lineTo(205, 118);
    context.lineTo(205, 151);
    context.lineTo(229, 151);
    context.fillText("Y", 229, 160);
  } else {
     throw("Bad Y " + info.configY);
  }
  context.stroke();
}

function clbRemovePopup() {
  if (popup) {
    popup.remove();
    popup = undefined;
  }
}
