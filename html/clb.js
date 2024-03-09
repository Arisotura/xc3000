
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
  }

  reset() {
    Object.entries(this.clbDecoders).forEach(([k, c]) => c.reset());
  }

  get(tile) {
    return this.clbDecoders[tile];
  }

  getFromXY(x, y) {
    for (const clb of Object.entries(this.clbDecoders)) {
      if (clb[1].isInside(x, y)) {
        return clb[1];
      }
    }
    return undefined;
  }

  decode() {
    Object.entries(this.clbDecoders).forEach(([k, c]) => c.decode());
  }

  traceFromOutputs() {
    //Object.entries(this.clbDecoders).forEach(([k, c]) => c.traceFromOutputs());
    //this.clbDecoders['AC'].traceFromOutputs(); // TEST
    this.clbDecoders['CC'].traceFromOutputs(); // TEST
  }

  renderBackground(ctx) {
    Object.entries(this.clbDecoders).forEach(([tile, obj]) => obj.renderBackground(ctx));
  }

  render(ctx) {
    Object.entries(this.clbDecoders).forEach(([tile, obj]) => obj.render(ctx));
  }
}

class ClbDecoder {
  constructor(col, row, tile) { // tile is e.g. AB
    this.col = col;
    this.row = row;
    this.tile = tile;

    this.gPt = getGCoords(tile);
    this.screenPt = getSCoords(this.gPt);
    this.W = 20;
    this.H = 32;

    //console.log(this);

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

    this.xEnable = false;
    this.yEnable = false;
    this.fgMux = false;
    this.lut = {'F':0, 'G':0};
    this.lutInput = {'F':['A','B','C','D'], 'G':['A','B','C','D']};
    this.dataInput = {'X':'F', 'Y':'G'};
    this.output = {'X':'F', 'Y':'G'};
    this.diEnable = false;
    this.ecEnable = false;
    this.rdEnable = false;
    this.kEnable = false;
    this.kInvert = false;

    this.lutEquation = {'F':'0', 'G':'0'};
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

        var ecbranch = ['-4', 'T:-4'];
        if (curBitstream.family.extraInter)
          ecbranch.push('col.*.long.4:4');
        ecbranch.push('col.*.long.3:3', 'col.*.local.3:2');
        ecpips.push('T:+3', 'T:+1', 'T:+6',
            ecbranch,
            'T:-5', 'row.*.local.5:1', 'row.*.local.2:0');
      }
      else
      {
        apips.push('row.*.long.3:3',
            ['+5', 'col.*.local.3:5', 'col.*.local.1:4'],
            '+1:0', 'row.*.local.3:2', 'row.*.local.1:1');

        var ecbranch = ['+5'];
        if (curBitstream.family.extraInter)
          ecbranch.push('col.*.long.2:4');
        ecbranch.push('col.*.long.1:3', 'col.*.local.3:2');
        ecpips.push(ecbranch);
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
          ['-1', 'row.*.local.5:1', 'row.*.local.2:0']);
      if (curBitstream.family.extraInter)
        ecpips.push(this.col==0?'col.*.long.4:4':'col.*.long.2:4');
      ecpips.push(this.col==0?'col.*.long.3:3':'col.*.long.1:3', 'col.*.local.3:2');

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
      if (curBitstream.family.extraInter)
      {
        if (this.row == 0) xpips.push(['+1', 'row.*.long.3:4', '+3', 'T:+2', '-12']);
        else               xpips.push(['+1', 'T:+6', 'T:-1', 'T:+1', ['-9', 'row.*.long.2:4'], '-2']);
      }
      else
      {
        if (this.row == 0) xpips.push(['+1', 'T:+9', '-12']);
        else               xpips.push(['+1', 'T:+6', 'T:-1', 'T:+1', '-11']);
      }
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
      if (curBitstream.family.extraInter)
      {
        if (this.row == 0) xpips.push(['+1', 'row.*.long.3:4', 'T:+1', '-2', 'T:-15', 'T:-2', 'T:-16', '-5']);
        else               xpips.push(['+1', 'T:+4', '-2', ['-5', 'row.*.long.2:4'], 'T:-10', 'T:-1', 'T:-16', '-5']);
      }
      else
      {
        if (this.row == 0) xpips.push(['+1', 'T:+5', 'T:-17', 'T:-2', 'T:-16', '-5']);
        else               xpips.push(['+1', 'T:+4', 'T:-17', 'T:-1', 'T:-16', '-5']);
      }
      xpips.push('col.+.local.1:0', 'col.+.local.4:1');
      if (this.row == maxrow) xpips.push('T:+3', '-1', 'T:row.+.local.8', (this.col==maxcol-1?'T:+8':'T:+12'), 'row.+.local.1:2', 'row.+.local.5:3');
      else                    xpips.push('T:+11', '-1', 'row.+.local.1:2', 'row.+.local.5:3');
    }

    if (this.col == 0)
    {
      if (curBitstream.family.extraInter)
      {
        if (this.row == maxrow) ypips.push(['+1', 'row.+.long.1:4', '-3', '-2']);
        else                    ypips.push(['+1', '-4', 'row.+.long.1:4', 'T:-1', '-3']);
      }
      else
      {
        if (this.row == maxrow) ypips.push(['+1', '-11']);
        else                    ypips.push(['+1', 'T:-8', '-3']);
      }
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
      if (curBitstream.family.extraInter)
      {
        if (this.row == maxrow) ypips.push(['+1', 'row.+.long.1:4', '-3', '-2']);
        else                    ypips.push(['+1', '-3', 'T:-1', ['+0', 'row.+.long.1:4'], '-3']);
      }
      else
      {
        if (this.row == maxrow) ypips.push(['+1', '-11']);
        else                    ypips.push(['+1', 'T:-4', '-3']);
      }
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
    var fam = curBitstream.family;
    var offset = getTileOffset(this.col, this.row);
    const self = this;

    var inputbits = {
      'A': [4,7, 5,5, 5,6, 5,7],
      'EC': [2,6, 3,6, 3,7, 4,6],
      'DI': [3,10, 3,11, 3,14, 4,14],
      'B': [4,1, 4,4, 5,2, 5,3, 5,4],
      'C': [4,15, 5,14, 5,15, 5,16, 5,17],
      'K': [2,5, 3,5, 3,8, 3,9],
      'E': [5,0, 5,1],
      'D': [4,20, 4,21, 5,20, 5,21],
      'RD': [5,18, 5,19]
    };

    var inputmux = {
      'A': {0x2:0, 0x5:1, 0xA:2, 0xB:2, 0x1:3, 0x6:4, 0xF:5},
      'EC': {0xA:0, 0x9:1, 0xF:2, 0x3:3, 0xD:4},
      'DI': {0xB:0, 0xA:0, 0xF:1, 0x9:2, 0x3:3},
      'B': {0x1B:0, 0x0D:1, 0x0E:2, 0x03:3, 0x07:4, 0x09:5, 0x1F:6, 0x0A:7},
      'C': {0x1F:0, 0x0E:1, 0x0D:2, 0x09:3, 0x03:4, 0x0A:5, 0x07:6, 0x1B:7},
      'K': {0xB:0, 0x3:0, 0x6:1, 0x5:2, 0xF:3},
      'E': {0x2:0, 0x3:1, 0x0:2, 0x1:3},
      'D': {0x6:0, 0x5:1, 0x1:2, 0x2:3, 0xF:4, 0xB:5},
      'RD': {0x2:0, 0x1:1, 0x3:2, 0x0:3}
    };

    Object.entries(inputbits).forEach(([key, val]) =>
    {
      var bits = 0;
      for (var i = 0; i < val.length; i+=2)
      {
        var bit = curBitstream.data[offset.y+val[i]][offset.x+val[i+1]];
        bits |= (bit << (i>>1));
      }

      var mux = inputmux[key][bits];
      if (typeof mux == 'undefined')
      {
        console.log('bad mux ' + key + '=' + bits);
        return;
      }

      // enable the corresponding PIP
      this[key.toLowerCase()+'Path'].setPipStatus(mux, 1);
    });

    var outputbits = {'X':[], 'Y':[]};
    if (this.col == fam.cols-1)
    {
      // right edge, output PIPs are different

      var offset1 = getTileOffset(this.col+1, this.row);

      outputbits['X'].push(offset1.y+4, offset1.x+0);
      outputbits['X'].push(offset1.y+4, offset1.x+8);
      outputbits['X'].push(offset1.y+4, offset1.x+9);

      outputbits['Y'].push(offset1.y+4, offset1.x+4);
      outputbits['Y'].push(offset1.y+4, offset1.x+6);
      outputbits['Y'].push(offset1.y+4, offset1.x+10);
    }
    else
    {
      // middle

      var offset1 = getTileOffset(this.col+1, this.row);
      var offset2 = getTileOffset(this.col+1, this.row+1);

      outputbits['X'].push(offset1.y+3, offset1.x+0);
      outputbits['X'].push(offset1.y+3, offset1.x+16);
      if (this.row == fam.rows-1)
      {
        outputbits['X'].push(offset2.y+0, offset2.x+13);
        outputbits['X'].push(offset2.y+0, offset2.x+7);
      }
      else
      {
        outputbits['X'].push(offset2.y+4, offset2.x+18);
        outputbits['X'].push(offset2.y+3, offset2.x+19);
      }

      outputbits['Y'].push(offset1.y+4, offset1.x+3);
      outputbits['Y'].push(offset1.y+4, offset1.x+12);
      outputbits['Y'].push(offset1.y+3, offset1.x+17);
      outputbits['Y'].push(offset1.y+3, offset1.x+18);
    }

    Object.entries(outputbits).forEach(([key, val]) =>
    {
      for (var i = 0; i < val.length; i+=2)
      {
        var bit = curBitstream.data[val[i]][val[i+1]];
        if (!bit)
          this[key.toLowerCase()+'Path'].setPipStatus(i>>1, 1);
      }
    });

    if (fam.extraInter && this.col != fam.cols-1)
    {
      // extra interconnects for X and Y
      // these can only be enabled if the neighboring tristate buffers are disabled
      // the last column also doesn't have them

      var offset1 = getTileOffset(this.col+1, this.row);

      var tb2enable = curBitstream.data[offset1.y+2][offset1.x+1];
      var xinput = curBitstream.data[offset1.y+2][offset1.x+3];
      var tb1enable = curBitstream.data[offset1.y+2][offset1.x+11];
      var yinput = curBitstream.data[offset1.y+2][offset1.x+13];

      if (tb2enable==1 && xinput==0)
        this.xPath.setPipStatus(4, 1);
      if (tb1enable==1 && yinput==0)
        this.yPath.setPipStatus(4, 1);
    }

    this.fgMux = curBitstream.data[offset.y+7][offset.x+11] == 1;

    this.lut['F'] = 0; this.lut['G'] = 0;
    var bitorder = [3, 2, 0, 1, 5, 4, 6, 7];
    for (var i = 0; i < 8; i++)
    {
      var b = curBitstream.data[offset.y+6][offset.x+i];
      this.lut['F'] |= (b << bitorder[i]);
      b = curBitstream.data[offset.y+6][offset.x+21-i];
      this.lut['G'] |= (b << bitorder[i]);
    }
    bitorder = [10, 11, 9, 8, 12, 13, 15, 14];
    for (var i = 0; i < 8; i++)
    {
      var b = curBitstream.data[offset.y+7][offset.x+i];
      this.lut['F'] |= (b << bitorder[i]);
      b = curBitstream.data[offset.y+7][offset.x+21-i];
      this.lut['G'] |= (b << bitorder[i]);
    }

    // the bits in the bitstream are inverted
    this.lut['F'] ^= 0xFFFF;
    this.lut['G'] ^= 0xFFFF;

    var mux = curBitstream.data[offset.y+6][offset.x+9] | (curBitstream.data[offset.y+7][offset.x+9] << 1);
    this.lutInput['F'][1] = ['', 'B', 'QX', 'QY'][mux];
    mux = curBitstream.data[offset.y+5][offset.x+8] | (curBitstream.data[offset.y+6][offset.x+8] << 1);
    this.lutInput['F'][2] = ['', 'QX', 'C', 'QY'][mux];
    mux = curBitstream.data[offset.y+6][offset.x+12] | (curBitstream.data[offset.y+7][offset.x+12] << 1);
    this.lutInput['G'][1] = ['', 'B', 'QX', 'QY'][mux];
    mux = curBitstream.data[offset.y+5][offset.x+13] | (curBitstream.data[offset.y+6][offset.x+13] << 1);
    this.lutInput['G'][2] = ['', 'QX', 'C', 'QY'][mux];

    if (this.fgMux)
    {
      this.lutInput['F'][3] = 'D';
      this.lutInput['G'][3] = 'D';
    }
    else
    {
      mux = curBitstream.data[offset.y+7][offset.x+8];
      this.lutInput['F'][3] = ['D', 'E'][mux];
      mux = curBitstream.data[offset.y+7][offset.x+13];
      this.lutInput['G'][3] = ['D', 'E'][mux];
    }

    mux = curBitstream.data[offset.y+5][offset.x+9] | (curBitstream.data[offset.y+5][offset.x+10] << 1);
    this.dataInput['X'] = ['G', 'DI', '', 'F'][mux];
    mux = curBitstream.data[offset.y+5][offset.x+11] | (curBitstream.data[offset.y+5][offset.x+12] << 1);
    this.dataInput['Y'] = ['F', 'DI', '', 'G'][mux];

    mux = curBitstream.data[offset.y+4][offset.x+2] | (curBitstream.data[offset.y+4][offset.x+5] << 1);
    this.output['X'] = ['F', '', '', 'QX'][mux];
    mux = curBitstream.data[offset.y+4][offset.x+16] | (curBitstream.data[offset.y+4][offset.x+19] << 1);
    this.output['Y'] = ['G', '', '', 'QY'][mux];

    this.ecEnable = curBitstream.data[offset.y+4][offset.x+9] == 0;
    this.rdEnable = curBitstream.data[offset.y+4][offset.x+17] == 0;
    this.kInvert = curBitstream.data[offset.y+4][offset.x+11] == 1;

    // check which inputs are used

    function chkinput(lut, inp)
    {
      var mask = [0x5555, 0x3333, 0x0F0F, 0x00FF][inp];
      return ((lut & mask) != ((lut >> (1<<inp)) & mask));
    }

    this.inputUsed = {'F':[], 'G':[]};
    for (var i = 0; i < 4; i++)
    {
      this.inputUsed['F'][i] = chkinput(this.lut['F'], i);
      this.inputUsed['G'][i] = chkinput(this.lut['G'], i);
    }

    this.aEnable = this.inputUsed['F'][0] || this.inputUsed['G'][0];
    this.bEnable = false;
    if (this.lutInput['F'][1] == 'B') this.bEnable ||= this.inputUsed['F'][1];
    if (this.lutInput['G'][1] == 'B') this.bEnable ||= this.inputUsed['G'][1];
    this.cEnable = false;
    if (this.lutInput['F'][2] == 'C') this.cEnable ||= this.inputUsed['F'][2];
    if (this.lutInput['G'][2] == 'C') this.cEnable ||= this.inputUsed['G'][2];

    if (this.fgMux)
    {
      this.dEnable = this.inputUsed['F'][3] || this.inputUsed['G'][3];
      this.eEnable = true;
    }
    else
    {
      this.dEnable = false;
      if (this.lutInput['F'][3] == 'D') this.dEnable ||= this.inputUsed['F'][3];
      if (this.lutInput['G'][3] == 'D') this.dEnable ||= this.inputUsed['G'][3];
      this.eEnable = false;
      if (this.lutInput['F'][3] == 'E') this.eEnable ||= this.inputUsed['F'][3];
      if (this.lutInput['G'][3] == 'E') this.eEnable ||= this.inputUsed['G'][3];
    }

    this.dataUsed = {};
    this.dataUsed['X'] = (this.output['X'] == 'QX') ||
        (this.lutInput['F'][1] == 'QX' && this.inputUsed['F'][1]) ||
        (this.lutInput['F'][2] == 'QX' && this.inputUsed['F'][2]) ||
        (this.lutInput['G'][1] == 'QX' && this.inputUsed['G'][1]) ||
        (this.lutInput['G'][2] == 'QX' && this.inputUsed['G'][2]);
    this.dataUsed['Y'] = (this.output['Y'] == 'QY') ||
        (this.lutInput['F'][1] == 'QY' && this.inputUsed['F'][1]) ||
        (this.lutInput['F'][2] == 'QY' && this.inputUsed['F'][2]) ||
        (this.lutInput['G'][1] == 'QY' && this.inputUsed['G'][1]) ||
        (this.lutInput['G'][2] == 'QY' && this.inputUsed['G'][2]);

    var dataenable = this.dataUsed['X'] || this.dataUsed['Y'];
    this.diEnable = dataenable && ((this.dataInput['X'] == 'DI') || (this.dataInput['Y'] == 'DI'));
    this.ecEnable &&= dataenable;
    this.rdEnable &&= dataenable;
    this.kEnable = dataenable;

    this.lutEquation['F'] = formula4(this.lut['F'], this.lutInput['F']);
    this.lutEquation['G'] = formula4(this.lut['G'], this.lutInput['G']);

    //console.log(this);
    //console.log(this.tile, this.fgMux, 'F', this.lutEquation['F'], 'G', this.lutEquation['G']);
  }

  describePin(pin)
  {
    return this.tile + '.' + pin;
  }

  pinEnabled(pin)
  {return true;
    return this[pin.toLowerCase() + 'Enable'];
  }

  signalConnection(pin)
  {
    switch (pin)
    {
      case 'X': this.xEnable = true; break;
      case 'Y': this.yEnable = true; break;
    }
  }

  traceFromOutputs()
  {
    // TEST
    //var net = this.yPath.traceFrom();
    var net = this.xPath.traceFrom();
    console.log(net);
    this.test = net;
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

    if (viewSettings.showAllPips)
    {
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
  }

  render(ctx)
  {
    if (typeof this.test != 'undefined')
      this.test.draw(ctx);
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

ClbDecoders.gToName = {};
ClbDecoders.tileToG = {};


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
  popup.height = 350;
  $('#container').append(popup);
  const context = popup.getContext('2d');
  context.resetTransform();
  context.translate(0.5, 0.5); // Prevent aliasing
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "black";
  context.fillRect(0, 0, canvas.width, canvas.height);
  //const info = clb.clbInternal;
  /*if (debug) {
    context.font = "20px arial";
    context.fillStyle = "red";
    context.fillText("s" + clb.clbInternal.configSet + " r" + clb.clbInternal.configRes + " c" + clb.clbInternal.configClk + " q" + clb.clbInternal.configQ, 20, 20);
  }*/
  context.strokeStyle = "#888";

  if (clb.fgMux)
  {
    if (clb.lutInput['F'][1] == clb.lutInput['G'][1] && clb.lutInput['F'][2] == clb.lutInput['G'][2])
      drawClbF(clb, context);
    else
      drawClbFGM(clb, context);
  }
  else
    drawClbFG(clb, context);

  drawClbOutput(clb, context);
}

// The F base is the configuration with one 4-input CLB called "F".
function drawClbF(info, context) {
  context.strokeStyle = "white";
  context.fillStyle = "white";
  context.font = "12px arial";
  var eq = '~E*(' + info.lutEquation['F'] + ') + E*(' + info.lutEquation['G']+')';
  context.fillText("F = " + eq, 21, 325);
  context.font = "20px arial";

  var fUsed = (info.xEnable && info.output['X'] == 'F') ||
      (info.dataUsed['X'] && info.dataInput['X'] == 'F') ||
      (info.dataUsed['Y'] && info.dataInput['Y'] == 'F');
  var gUsed = (info.yEnable && info.output['Y'] == 'G') ||
      (info.dataUsed['X'] && info.dataInput['X'] == 'G') ||
      (info.dataUsed['Y'] && info.dataInput['Y'] == 'G');

  if (fUsed || gUsed)
  {
    context.fillStyle = "yellow";
    context.strokeStyle = "white";
    context.strokeRect(38, 40, 30, 100);
    context.fillText("F", 51, 67);

    context.strokeStyle = "yellow";
    context.beginPath();
    if (fUsed)
    {
      context.moveTo(68, 60);
      context.lineTo(130, 60);
    }
    if (gUsed)
    {
      context.moveTo(68, 60);
      context.lineTo(130, 60);
      context.lineTo(130, 180);
      context.lineTo(140, 180);
    }
    context.stroke();

    // input labels
    var y = 40+17;
    context.fillStyle = "white";
    for (var i = 0; i < 4; i++)
    {
      if (!info.inputUsed['F'][i] && !info.inputUsed['G'][i]) continue;

      var label = info.lutInput['F'][i];
      if (label == 'QX')
      {
        context.beginPath();
        context.moveTo(38, y-7);
        context.lineTo(10, y-7);
        context.lineTo(10, 10);
        context.stroke();
      }
      else if (label == 'QY')
      {
        context.beginPath();
        context.moveTo(38, y-7);
        context.lineTo(20, y-7);
        context.lineTo(20, 310);
        context.stroke();
      }
      else
        context.fillText(label, 21, y);

      y += 20;
    }
    context.fillText('E', 21, y);
  }
}

// The FG base is the configuration with two 4-input CLBs called "F" and "G".
function drawClbFG(info, context) {
  context.strokeStyle = "white";
  context.fillStyle = "white";
  context.font = "12px arial";
  context.fillText("F = " + info.lutEquation['F'], 21, 325);
  context.fillText("G = " + info.lutEquation['G'], 21, 340);
  context.font = "20px arial";

  var fUsed = (info.xEnable && info.output['X'] == 'F') ||
      (info.dataUsed['X'] && info.dataInput['X'] == 'F') ||
      (info.dataUsed['Y'] && info.dataInput['Y'] == 'F');
  var gUsed = (info.yEnable && info.output['Y'] == 'G') ||
      (info.dataUsed['X'] && info.dataInput['X'] == 'G') ||
      (info.dataUsed['Y'] && info.dataInput['Y'] == 'G');

  if (fUsed)
  {
    context.fillStyle = "yellow";
    context.strokeStyle = "white";
    context.strokeRect(38, 40, 30, 80);
    context.fillText("F", 51, 67);

    context.strokeStyle = "yellow";
    context.beginPath();
    context.moveTo(68, 60);
    context.lineTo(130, 60);
    context.stroke();

    // input labels
    var y = 40+17;
    context.fillStyle = "white";
    for (var i = 0; i < 4; i++)
    {
      if (!info.inputUsed['F'][i]) continue;

      var label = info.lutInput['F'][i];
      if (label == 'QX')
      {
        context.beginPath();
        context.moveTo(38, y-7);
        context.lineTo(10, y-7);
        context.lineTo(10, 10);
        context.stroke();
      }
      else if (label == 'QY')
      {
        context.beginPath();
        context.moveTo(38, y-7);
        context.lineTo(20, y-7);
        context.lineTo(20, 310);
        context.stroke();
      }
      else
        context.fillText(label, 21, y);

      y += 20;
    }
  }

  if (gUsed)
  {
    context.fillStyle = "yellow";
    context.strokeStyle = "white";
    context.strokeRect(38, 160, 30, 80);
    context.fillText("G", 51, 187);

    context.strokeStyle = "yellow";
    context.beginPath();
    context.moveTo(68, 180);
    context.lineTo(140, 180);
    context.stroke();

    // input labels
    var y = 160+17;
    context.fillStyle = "white";
    for (var i = 0; i < 4; i++)
    {
      if (!info.inputUsed['G'][i]) continue;

      var label = info.lutInput['G'][i];
      if (label == 'QX')
      {
        context.beginPath();
        context.moveTo(38, y-7);
        context.lineTo(10, y-7);
        context.lineTo(10, 10);
        context.stroke();
      }
      else if (label == 'QY')
      {
        context.beginPath();
        context.moveTo(38, y-7);
        context.lineTo(20, y-7);
        context.lineTo(20, 310);
        context.stroke();
      }
      else
        context.fillText(label, 21, y);

      y += 20;
    }
  }
}

// The FGM base is the configuration with two 4-input CLBs called "F" and "G", with a multiplexer "M" selecting between them
function drawClbFGM(info, context)
{
  context.strokeStyle = "white";
  context.fillStyle = "white";
  context.font = "12px arial";
  var eq = '~E*(' + info.lutEquation['F'] + ') + E*(' + info.lutEquation['G']+')';
  context.fillText("M = " + eq, 21, 325);
  //context.fillText("F = " + info.lutEquation['F'], 21, 325);
  //context.fillText("G = " + info.lutEquation['G'], 21, 340);
  context.font = "20px arial";

  var fUsed = (info.xEnable && info.output['X'] == 'F') ||
      (info.dataUsed['X'] && info.dataInput['X'] == 'F') ||
      (info.dataUsed['Y'] && info.dataInput['Y'] == 'F');
  var gUsed = (info.yEnable && info.output['Y'] == 'G') ||
      (info.dataUsed['X'] && info.dataInput['X'] == 'G') ||
      (info.dataUsed['Y'] && info.dataInput['Y'] == 'G');

  if (fUsed || gUsed)
  {
    context.fillStyle = "yellow";
    context.strokeStyle = "white";
    context.strokeRect(38, 40, 30, 80);
    context.fillText("F", 51, 67);

    context.strokeStyle = "yellow";
    context.beginPath();
    context.moveTo(68, 60);
    context.lineTo(80, 60);
    context.stroke();

    // input labels
    var y = 40+17;
    context.fillStyle = "white";
    for (var i = 0; i < 4; i++)
    {
      if (!info.inputUsed['F'][i]) continue;

      var label = info.lutInput['F'][i];
      if (label == 'QX')
      {
        context.beginPath();
        context.moveTo(38, y-7);
        context.lineTo(10, y-7);
        context.lineTo(10, 10);
        context.stroke();
      }
      else if (label == 'QY')
      {
        context.beginPath();
        context.moveTo(38, y-7);
        context.lineTo(20, y-7);
        context.lineTo(20, 310);
        context.stroke();
      }
      else
        context.fillText(label, 21, y);

      y += 20;
    }

    context.fillStyle = "yellow";
    context.strokeStyle = "white";
    context.strokeRect(38, 160, 30, 80);
    context.fillText("G", 51, 187);

    context.strokeStyle = "yellow";
    context.beginPath();
    context.moveTo(68, 180);
    context.lineTo(80, 180);
    context.stroke();

    // input labels
    var y = 160+17;
    context.fillStyle = "white";
    for (var i = 0; i < 4; i++)
    {
      if (!info.inputUsed['G'][i]) continue;

      var label = info.lutInput['G'][i];
      if (label == 'QX')
      {
        context.beginPath();
        context.moveTo(38, y-7);
        context.lineTo(10, y-7);
        context.lineTo(10, 10);
        context.stroke();
      }
      else if (label == 'QY')
      {
        context.beginPath();
        context.moveTo(38, y-7);
        context.lineTo(20, y-7);
        context.lineTo(20, 310);
        context.stroke();
      }
      else
        context.fillText(label, 21, y);

      y += 20;
    }

    context.fillStyle = "yellow";
    context.strokeStyle = "white";
    context.strokeRect(80, 40, 30, 160);
    context.fillText("M", 90, 67);

    context.fillStyle = "white";
    context.strokeStyle = "yellow";
    context.beginPath();
    context.moveTo(95, 200);
    context.lineTo(95, 290);
    context.stroke();
    context.fillText('E', 87, 303);

    context.strokeStyle = "yellow";
    context.beginPath();
    if (fUsed)
    {
      context.moveTo(110, 60);
      context.lineTo(130, 60);
    }
    if (gUsed)
    {
      context.moveTo(110, 60);
      context.lineTo(130, 60);
      context.lineTo(130, 180);
      context.lineTo(140, 180);
    }
    context.stroke();
  }
}

// draw the flip-flops and outputs of the CLB
// F: X=130 Y=60  G: X=140 Y=180
function drawClbOutput(info, context)
{
  context.font = "20px arial";
  context.strokeStyle = 'yellow';
  context.fillStyle = 'white';

  if (info.xEnable)
  {
    context.beginPath();
    context.moveTo(250, 60);
    context.lineTo(270, 60);
    context.stroke();
    context.fillText('X', 272, 69);

    if (info.output['X'] == 'F')
    {
      context.beginPath();
      context.moveTo(130, 60);
      context.lineTo(250, 60);
      context.stroke();
    }
    else if (info.output['X'] == 'QX' && info.dataUsed['X'])
    {
      context.beginPath();
      context.moveTo(230, 110);
      context.lineTo(250, 110);
      context.lineTo(250, 60);
      context.stroke();
    }
  }
  if (info.yEnable)
  {
    context.beginPath();
    context.moveTo(250, 180);
    context.lineTo(270, 180);
    context.stroke();
    context.fillText('Y', 272, 189);

    if (info.output['Y'] == 'G')
    {
      context.beginPath();
      context.moveTo(140, 180);
      context.lineTo(250, 180);
      context.stroke();
    }
    else if (info.output['Y'] == 'QY' && info.dataUsed['Y'])
    {
      context.beginPath();
      context.moveTo(230, 230);
      context.lineTo(250, 230);
      context.lineTo(250, 180);
      context.stroke();
    }
  }

  if (info.diEnable)
    context.fillText('DI', 135, 27);
  if (info.ecEnable)
    context.fillText('EC', 165, 27);
  if (info.rdEnable)
    context.fillText('RD', 170, 303);
  if (info.kEnable)
    context.fillText('K', 150, 303);

  if (info.dataUsed['X'])
  {
    context.strokeStyle = "white";
    context.fillStyle = "yellow";
    context.strokeRect(190, 80, 40, 60);
    context.fillText('QX', 195, 113, 35);
    context.beginPath();
    context.moveTo(190, 140); // clock triangle
    context.lineTo(190 + 7, 140 - 7); // clock triangle
    context.lineTo(190, 140 - 14); // clock triangle
    context.stroke();
    context.fillStyle = "yellow";
    context.strokeStyle = "yellow";

    if (info.diEnable && (info.dataInput['X'] == 'DI'))
    {
      context.beginPath();
      context.moveTo(190, 110);
      context.lineTo(150, 110);
      context.lineTo(150, 30);
      context.stroke();
    }
    else if (info.dataInput['X'] == 'F')
    {
      context.beginPath();
      context.moveTo(190, 110);
      context.lineTo(130, 110);
      context.lineTo(130, 60);
      context.stroke();
    }
    else if (info.dataInput['X'] == 'G')
    {
      context.beginPath();
      context.moveTo(190, 110);
      context.lineTo(130, 110);
      context.lineTo(130, 180);
      context.stroke();
    }

    if (info.ecEnable)
    {
      context.beginPath();
      context.moveTo(190, 87);
      context.lineTo(170, 87);
      context.lineTo(170, 30);
      context.stroke();
    }
    if (info.rdEnable)
    {
      context.beginPath();
      context.moveTo(210, 140);
      context.lineTo(210, 150);
      context.lineTo(180, 150);
      context.lineTo(180, 290);
      context.stroke();
    }
    if (info.kEnable)
    {
      context.beginPath();
      context.moveTo(190-(info.kInvert?6:0), 133);
      context.lineTo(160, 133);
      context.lineTo(160, 290);
      context.stroke();
      if (info.kInvert)
      {
        context.beginPath();
        context.arc(190-3, 133, 3, 0, 2 * Math.PI);
        context.stroke();
      }
    }

    if ((info.lutInput['F'][1] == 'QX' && info.inputUsed['F'][1]) ||
        (info.lutInput['F'][2] == 'QX' && info.inputUsed['F'][2]) ||
        (info.lutInput['G'][1] == 'QX' && info.inputUsed['G'][1]) ||
        (info.lutInput['G'][2] == 'QX' && info.inputUsed['G'][2]))
    {
      context.beginPath();
      context.moveTo(230, 110);
      context.lineTo(250, 110);
      context.lineTo(250, 10);
      context.lineTo(10, 10);
      context.stroke();
    }
  }

  if (info.dataUsed['Y'])
  {
    context.strokeStyle = "white";
    context.fillStyle = "yellow";
    context.strokeRect(190, 200, 40, 60);
    context.fillText('QY', 195, 233, 35);
    context.beginPath();
    context.moveTo(190, 260); // clock triangle
    context.lineTo(190 + 7, 260 - 7); // clock triangle
    context.lineTo(190, 260 - 14); // clock triangle
    context.stroke();
    context.strokeStyle = "yellow";
    context.fillStyle = "yellow";

    if (info.diEnable && (info.dataInput['Y'] == 'DI'))
    {
      context.beginPath();
      context.moveTo(190, 230);
      context.lineTo(150, 230);
      context.lineTo(150, 30);
      context.stroke();
    }
    else if (info.dataInput['Y'] == 'F')
    {
      context.beginPath();
      context.moveTo(190, 230);
      context.lineTo(140, 230);
      context.lineTo(140, 60);
      context.stroke();
    }
    else if (info.dataInput['Y'] == 'G')
    {
      context.beginPath();
      context.moveTo(190, 230);
      context.lineTo(140, 230);
      context.lineTo(140, 180);
      context.stroke();
    }

    if (info.ecEnable)
    {
      context.beginPath();
      context.moveTo(190, 207);
      context.lineTo(170, 207);
      context.lineTo(170, 30);
      context.stroke();
    }
    if (info.rdEnable)
    {
      context.beginPath();
      context.moveTo(210, 260);
      context.lineTo(210, 270);
      context.lineTo(180, 270);
      context.lineTo(180, 290);
      context.stroke();
    }
    if (info.kEnable)
    {
      context.beginPath();
      context.moveTo(190-(info.kInvert?6:0), 253);
      context.lineTo(160, 253);
      context.lineTo(160, 290);
      context.stroke();
      if (info.kInvert)
      {
        context.beginPath();
        context.arc(190-3, 253, 3, 0, 2 * Math.PI);
        context.stroke();
      }
    }

    if ((info.lutInput['F'][1] == 'QY' && info.inputUsed['F'][1]) ||
        (info.lutInput['F'][2] == 'QY' && info.inputUsed['F'][2]) ||
        (info.lutInput['G'][1] == 'QY' && info.inputUsed['G'][1]) ||
        (info.lutInput['G'][2] == 'QY' && info.inputUsed['G'][2]))
    {
      context.beginPath();
      context.moveTo(230, 230);
      context.lineTo(250, 230);
      context.lineTo(250, 310);
      context.lineTo(20, 310);
      context.stroke();
    }
  }
}

function clbRemovePopup() {
  if (popup) {
    popup.remove();
    popup = undefined;
  }
}
