/*
 * Code for an IOB (I/O block), an I/O pin.
 * There is an Iob for each IOB. IobDecoders is a wrapper around all the Iob objects.
 */


class IobDecoders {
  constructor() {
    this.iobs = {};
    this.iobsFromPin = {};
    var self = this;

      function createIOBs(p, num, styles, rev)
      {
          for (var j = 0; j < num; j++)
          {
              var i = rev ? (num-1-j) : j;

              var pad = 'PAD'+p;
              var pin = curPackage[pad];
              if (!pin) pin = pad; // last-ditch

              var tile = i>>1;
              var style = styles[i&1];

              const iob = new Iob(pin, tile, style, pad);
              self.iobs[pad] = iob;
              self.iobsFromPin[pin] = iob;

              p++;
          }

          return p;
      }

      var fam = curBitstream.family;
      var p = 1;
      p = createIOBs(p, fam.cols*2, ['topleft','topright'], false);
      p = createIOBs(p, fam.rows*2, ['rightupper','rightlower'], false);
      p = createIOBs(p, fam.cols*2, ['bottomleft','bottomright'], true);
      p = createIOBs(p, fam.rows*2, ['leftupper','leftlower'], true);

      //console.log(this.iobs);
  }

    onChangePackage()
    {
        Object.entries(this.iobs).forEach(([name, obj]) => obj.setPinName(curPackage[obj.pad]));
    }

  reset() {
    const self = this;
    pads.forEach(function([pin, tile, style, pad]) {
      self.iobs[pad].reset();
    });
  }

  update()
  {
    const self = this;
    var updates = 0;
    pads.forEach(function([pin, tile, style, pad]) {
      //console.log("IOB PAD "+pad+" STARTDECODE");
      var iob = self.iobs[pad];
      if (iob.dirty)
      {
        iob.update();
        updates++;
      }
    });
    return updates;
  }

  decode()
  {
      Object.entries(this.iobs).forEach(([name, obj]) => obj.decode());
  }

  setClockInvert(line, val)
  {
      // the IK/OK invert option is configured for the entire clock line

      var s1, s2, num;
      switch (line)
      {
          case 'topleft':
          case 'topright':
              s1 = 'topleft';
              s2 = 'topright';
              num = (line=='topleft') ? 0:1;
              break;

          case 'bottomleft':
          case 'bottomright':
              s1 = 'bottomleft';
              s2 = 'bottomright';
              if (curBitstream.family.swapBottomClk)
                  num = (line=='bottomleft') ? 0:1;
              else
                  num = (line=='bottomleft') ? 1:0;
              break;

          case 'leftupper':
          case 'leftlower':
              s1 = 'leftupper';
              s2 = 'leftlower';
              num = (line=='leftupper') ? 1:0;
              break;

          case 'rightupper':
          case 'rightlower':
              s1 = 'rightupper';
              s2 = 'rightlower';
              num = (line=='rightupper') ? 0:1;
              break;
      }

      Object.entries(this.iobs).forEach(([name, obj]) =>
      {
          if (obj.style != s1 && obj.style != s2) return;
          obj.setClockInvert(num, val);
      });
  }

    traceFromOutputs()
    {
        Object.entries(this.iobs).forEach(([name, obj]) => obj.traceFromOutputs());
    }

  getFromPin(pin) {
    return this.iobsFromPin[pin];
  }

  getFromXY(x, y) {
    for (const iob of Object.entries(this.iobs)) {
      if (iob[1].isInside(x, y)) {
        return iob[1];
      }
    }
    return undefined;
  }

    renderBackground(ctx)
    {
        Object.entries(this.iobs).forEach(([name, obj]) => obj.renderBackground(ctx));
    }

  render(ctx)
  {
    Object.entries(this.iobs).forEach(([name, obj]) => obj.render(ctx));
  }
}
IobDecoders.gToName = {};
IobDecoders.nameToG = {};

/**
 * An I/O block.
 * Each I/O block is associated with its neighboring tile.
 * Some complications: I/O blocks are different on the top, bottom, left, and right.
 * There are typically two I/O blocks per tile, so the bits are different for these two. They are also drawn differently.
 * Tile AA has 3 I/O blocks. Tile EA has 1 I/O block; one is omitted.
 * 
 */
class Iob
{
    constructor(pin, tile, style, pad)
    {
        this.pin = pin;
        this.style = style;
        this.pad = pad;

        this.gPt = getGCoords(pad);
        this.screenPt = getSCoords(this.gPt);

        //console.log(this);

        // point to the CLB this IOB might have direct connections to
        if (style == 'topleft' || style == 'topright')
        {
            this.W = 20;
            this.H = 12;
            this.row = 0;
            this.col = tile;
        }
        else if (style == 'bottomleft' || style == 'bottomright')
        {
            this.W = 20;
            this.H = 12;
            this.row = curBitstream.family.rows;
            this.col = tile;
        }
        else if (style == 'leftupper' || style == 'leftlower')
        {
            this.W = 20;
            this.H = 28;
            this.row = tile;
            this.col = 0;
        }
        else if (style == 'rightupper' || style == 'rightlower')
        {
            this.W = 20;
            this.H = 28;
            this.row = tile;
            this.col = curBitstream.family.cols;
        }
        this.tile = letters[this.row] + letters[this.col];

        if (style == 'leftupper' && this.row == 0)
            this.clkin = 'TCLKIN';
        else if (style == 'rightupper' && this.row == curBitstream.family.rows-1)
            this.clkin = 'BCLKIN';
        else
            this.clkin = null;

        this.generateIobPips();

        this.ikSel = 0;
        this.okSel = 0;

        this.ikEnable = false;
        this.okEnable = false;
        this.ikInvert = [false, false];
        this.okInvert = [false, false];
        this.oEnable = false;
        this.oInvert = false;
        this.oLatch = false;
        this.oFast = false;
        this.iLatch = false; // latch or FF
        this.iPullup = false;
        this.tEnable = false;
        this.tInvert = false;
        this.iEnable = false;
        this.qEnable = false;
        this.clkiEnable = false;

        this.input = 2;
        this.levels = {I: 1, O: 0, T: 0};
        this.dirty = true;
    }

    setPinName(pin)
    {
        this.pin = pin;
    }

    reset()
    {
        this.input = 2;
        this.levels = {I: 1, O: 0, T: 0};
        this.dirty = true;
    }

    setLevel(name, val)
    {
        //console.log('IO '+this.pin+'.'+name+' = '+val+' (in='+this.input+')');

        if (name == 'I')
        {
            this.input = val;

            if (this.input == 2)
            {
                var o = this.getOutput();
                if (o == 2)
                    val = 1; // input pull-up
                else
                    val = o;
            }
        }

        if (val != this.levels[name])
        {
            this.levels[name] = val;
            if (name == 'I') this.dirty = true;
            else
            {
                // loop back output into input if output is active
                this.setLevel('I', this.input);
            }
        }
    }

    getOutput()
    {
        if (this.tmode == 'ON')
        {
            // simple output
            return this.levels['O'];
        } else if (this.tmode == 'TRI')
        {
            // tri-state
            // CHECKME.
            if (this.levels['T'])
                return 2;
            else
                return this.levels['O'];
        } else
        {
            //console.log('reading output of non-output IOB '+this.pin);
            return 2;
        }
    }

    update()
    {
        if (!this.dirty) return;
        this.dirty = false;

        var levels = this.levels;
        this.destList.forEach(function (dest)
        {
            propagateLevel(dest, levels['I']);
        });
    }

    setClockInvert(num, val)
    {
        // IK: 0=normal 1=inverted
        // OK: 1=normal 0=inverted
        this.ikInvert[num] = val==1;
        this.okInvert[num] = val==0;
    }

    genCoords(name)
    {
        name = name.replaceAll('PAD*', this.pad)
            .replaceAll('**', this.tile)
            .replaceAll('col.*', 'col.'+this.tile[1])
            .replaceAll('col.+', 'col.'+letters[this.col+1])
            .replaceAll('row.*', 'row.'+this.tile[0])
            .replaceAll('row.+', 'row.'+letters[this.row+1]);

        return name;
    }

    generateIobPips()
    {
        var maxcol = curBitstream.family.cols-1;
        var maxrow = curBitstream.family.rows-1;

        var okpips = [], ikpips = [],
            opips = [], qpips = [], ipips = [], tpips = [];

        if (this.style == 'topleft' || this.style == 'topright')
        {
            this.okPath = new Path(this, 'OK', 'dest', {x: this.gPt.x + 1, y: this.gPt.y}, 'V');
            this.ikPath = new Path(this, 'IK', 'dest', {x: this.gPt.x + 3, y: this.gPt.y}, 'V');
            this.oPath = new Path(this, 'O', 'dest', {x: this.gPt.x + 1, y: this.gPt.y - 1}, 'V');
            this.qPath = new Path(this, 'Q', 'source', {x: this.gPt.x + 2, y: this.gPt.y - 1}, 'V');
            this.iPath = new Path(this, 'I', 'source', {x: this.gPt.x + 3, y: this.gPt.y - 1}, 'V');
            this.tPath = new Path(this, 'T', 'dest', {x: this.gPt.x + 4, y: this.gPt.y - 1}, 'V');

            okpips.push('row.*.local.10:0', 'row.*.local.11:1');
            ikpips.push('row.*.local.10:0', 'row.*.local.11:1');
        }
        else if (this.style == 'bottomleft' || this.style == 'bottomright')
        {
            this.okPath = new Path(this, 'OK', 'dest', {x: this.gPt.x + 1, y: this.gPt.y - 1}, 'V');
            this.ikPath = new Path(this, 'IK', 'dest', {x: this.gPt.x + 3, y: this.gPt.y - 1}, 'V');
            this.oPath = new Path(this, 'O', 'dest', {x: this.gPt.x + 1, y: this.gPt.y}, 'V');
            this.qPath = new Path(this, 'Q', 'source', {x: this.gPt.x + 2, y: this.gPt.y}, 'V');
            this.iPath = new Path(this, 'I', 'source', {x: this.gPt.x + 3, y: this.gPt.y}, 'V');
            this.tPath = new Path(this, 'T', 'dest', {x: this.gPt.x + 4, y: this.gPt.y}, 'V');

            okpips.push('row.*.local.6:0', 'row.*.local.7:1');
            ikpips.push('row.*.local.6:0', 'row.*.local.7:1');
        }
        else if (this.style == 'leftupper' || this.style == 'leftlower')
        {
            var ybase = this.gPt.y - ((this.style == 'leftlower') ? 0 : 2);
            this.okPath = new Path(this, 'OK', 'dest', {x: this.gPt.x, y: ybase - 3}, 'H');
            this.ikPath = new Path(this, 'IK', 'dest', {x: this.gPt.x, y: ybase - 1}, 'H');
            this.oPath = new Path(this, 'O', 'dest', {x: this.gPt.x + 5, y: ybase - 4}, 'H');
            this.qPath = new Path(this, 'Q', 'source', {x: this.gPt.x + 5, y: ybase - 3}, 'H');
            this.iPath = new Path(this, 'I', 'source', {x: this.gPt.x + 5, y: ybase - 2}, 'H');
            this.tPath = new Path(this, 'T', 'dest', {x: this.gPt.x + 5, y: ybase - 1}, 'H');

            okpips.push('col.*.local.13:0', 'col.*.local.12:1');
            ikpips.push('col.*.local.13:0', 'col.*.local.12:1');

            if (this.clkin == 'TCLKIN')
            {
                this.ciPath = new Path(this, 'CLKI', 'source', {x: this.gPt.x + 5, y: ybase - 6}, 'H');
                this.ciPath.appendPip('+17:0');
            }
        }
        else if (this.style == 'rightupper' || this.style == 'rightlower')
        {
            var ybase = this.gPt.y - ((this.style == 'rightlower') ? 0 : 2);
            this.okPath = new Path(this, 'OK', 'dest', {x: this.gPt.x + 5, y: ybase - 3}, 'H');
            this.ikPath = new Path(this, 'IK', 'dest', {x: this.gPt.x + 5, y: ybase - 1}, 'H');
            this.oPath = new Path(this, 'O', 'dest', {x: this.gPt.x, y: ybase - 4}, 'H');
            this.qPath = new Path(this, 'Q', 'source', {x: this.gPt.x, y: ybase - 3}, 'H');
            this.iPath = new Path(this, 'I', 'source', {x: this.gPt.x, y: ybase - 2}, 'H');
            this.tPath = new Path(this, 'T', 'dest', {x: this.gPt.x, y: ybase - 1}, 'H');

            okpips.push('col.*.local.6:0', 'col.*.local.7:1');
            ikpips.push('col.*.local.6:0', 'col.*.local.7:1');

            if (this.clkin == 'BCLKIN')
            {
                this.ciPath = new Path(this, 'CLKI', 'source', {x: this.gPt.x, y: ybase - 7}, 'H');
                this.ciPath.appendPip('-2:0');
            }
        }

        if (this.style == 'topleft')
        {
            opips.push('row.*.local.2:0', 'row.*.local.4:1');
            if (this.col == 0)
                opips.push(['-2', 'col.*.long.5:4', 'col.*.long.3:5'],
                    'row.*.long.1:2', '-2:3');
            else
                opips.push('row.*.long.1:2',
                    'T:-5', 'col.*.long.3:3', 'col.*.long.1:4',
                    'col.*.local.5:5', 'col.*.local.4:6', 'col.*.local.1:7');

            qpips.push('row.*.local.1:0', 'row.*.local.3:1');
            if (this.col != 0)
                qpips.push('T:-10', 'col.*.local.5:2', 'col.*.local.2:3');

            ipips.push('row.*.local.2:0', 'row.*.local.4:1');
            if (this.col == 0)
                ipips.push('row.*.local.5:2', '-7', '-2');
            else
                ipips.push(['-10', this.col==maxcol?'+2':'+3'],
                    'T:+0', 'col.*.local.4:2', 'col.*.local.1:3');

            tpips.push('row.*.local.2:0', 'row.*.local.4:1', 'row.*.long.1:2', 'row.*.long.2:3');
        }
        else if (this.style == 'topright')
        {
            opips.push('row.*.local.1:0', 'row.*.local.3:1', 'row.*.local.5:2', 'row.*.long.1:3');
            if (this.col == maxcol)
                opips.push('-2:4', '-7:5');
            else
                opips.push('T:-4', this.col==0?'+7:4':'+2:4',
                    'col.+.local.2:5', 'col.+.local.3:6', 'col.+.long.2:7');

            qpips.push('row.*.local.2:0', 'row.*.local.4:1');
            if (this.col != maxcol)
                qpips.push('T:-6', 'col.+.local.1:2', 'col.+.local.4:3');

            ipips.push('row.*.local.1:0', 'row.*.local.3:1');
            if (this.col == maxcol)
                ipips.push('row.*.local.5:2');
            else
                ipips.push('T:-6', 'col.+.local.2:2', 'col.+.local.5:3');

            tpips.push('row.*.local.1:0', 'row.*.local.3:1', 'row.*.long.1:2', 'row.*.long.2:3');
        }
        else if (this.style == 'bottomleft')
        {
            if (this.col == 0)
                opips.push('+1:0', 'row.*.local.4:1', 'row.*.local.2:2', 'row.*.long.3:3',
                    'T:+7', 'col.*.long.5:4', 'col.*.long.3:5');
            else
                opips.push('row.*.local.4:0', 'row.*.local.2:1',
                    ['+3', 'col.*.long.3:3', 'col.*.long.1:4',
                    'col.*.local.5:5', 'col.*.local.4:6', 'col.*.local.1:7'],
                    'row.*.long.3:2');

            qpips.push('row.*.local.5:0', 'row.*.local.3:1');
            if (this.col != 0)
                qpips.push('T:+7', 'col.*.local.2:2', 'col.*.local.5:3');

            ipips.push('row.*.local.4:0', 'row.*.local.2:1');
            if (this.col == 0)
                ipips.push('row.*.local.1:2', '+15');
            else
                ipips.push('T:+7', [this.col==maxcol?'-1':'+0', '+9'],
                    'col.*.local.1:2', 'col.*.local.4:3');

            tpips.push('row.*.local.4:0', 'row.*.local.2:1', 'row.*.long.3:2', 'row.*.long.2:3');
        }
        else if (this.style == 'bottomright')
        {
            if (this.col == maxcol)
                opips.push('+1:0', 'row.*.local.5:1', 'row.*.local.3:2', 'row.*.local.1:3', 'row.*.long.3:4',
                    'T:+4', '+1:5');
            else
                opips.push('row.*.local.5:0', 'row.*.local.3:1', 'row.*.local.1:2', 'row.*.long.3:3',
                    'T:+6', this.col==0?'+6:4':'+1:4', 'col.+.local.2:5', 'col.+.local.3:6', 'col.+.long.2:7');

            qpips.push('row.*.local.4:0', 'row.*.local.2:1');
            if (this.col != maxcol)
                qpips.push('T:+9', 'col.+.local.1:2', 'col.+.local.4:3');

            ipips.push('row.*.local.5:0', 'row.*.local.3:1');
            if (this.col == maxcol)
                ipips.push('row.*.local.1:2', '+13');
            else
                ipips.push('T:+9', 'col.+.local.2:2', 'col.+.local.5:3');

            tpips.push('row.*.local.5:0', 'row.*.local.3:1', 'row.*.long.3:2', 'row.*.long.2:3');
        }
        else if (this.style == 'leftupper')
        {
            if (this.row == 0)
                opips.push('+1:0', 'col.*.local.1:1', 'col.*.local.4:2',
                    ['+2', 'row.*.long.3:5'], 'col.*.long.1:3', 'col.*.long.4:4');
            else
                opips.push('col.*.local.1:0', 'col.*.local.4:1', 'col.*.long.1:2',
                    'T:+15', 'row.*.long.2:3', 'row.*.local.5:4', 'row.*.local.3:5', 'row.*.local.1:6');

            qpips.push('col.*.local.2:0', 'col.*.local.5:1');
            if (this.row != 0)
                qpips.push('T:+17', 'row.*.local.4:2', 'row.*.local.2:3');

            if (curBitstream.family.extraInter)
            {
                ipips.push('+2');
                if (this.row != 0)
                    ipips.push(['+2', 'row.*.long.2:4']);
            }

            if (this.row == 0)
            {
                ipips.push('col.*.local.1:0', 'col.*.local.3:1', 'col.*.local.4:2');

                if (curBitstream.family.extraInter)
                    ipips.push(['+3', 'row.*.long.3:4'], '+6', 'T:+6', 'T:-7', 'T:+2', '-7');
                else
                    ipips.push('+9', 'T:+6', 'T:-7', 'T:+2', '-7');
            }
            else
                ipips.push('col.*.local.1:0', 'col.*.local.4:1',
                    ['+17', '-7'], 'T:+0', 'row.*.local.5:2', 'row.*.local.3:3');

            tpips.push('col.*.local.1:0', 'col.*.local.4:1', 'col.*.long.1:2', 'col.*.long.2:3');
        }
        else if (this.style == 'leftlower')
        {
            if (this.row != maxrow)
            {
                opips.push('T:+3', 'T:-4');
                qpips.push('T:+4', 'T:-2');
                tpips.push('T:+3', 'T:+1');
            }
            else
                tpips.push('T:+4', 'T:+2');

            opips.push('col.*.local.2:0', 'col.*.local.3:1', 'col.*.local.5:2', 'col.*.long.1:3');
            if (this.row == maxrow)
                opips.push('col.*.long.4:6', 'T:+3', 'row.+.long.1:5', '+16:4');
            else
                opips.push(['+10', this.row==0?'+15:4':'+13:4'],
                    'T:+0', 'row.+.long.1:5', 'row.+.local.2:6', 'row.+.local.4:7');

            qpips.push('col.*.local.1:0', 'col.*.local.4:1');
            if (this.row != maxrow)
                qpips.push('T:+15', 'row.+.local.3:2', 'row.+.local.5:3');

            if (curBitstream.family.extraInter && this.row != maxrow)
                ipips.push('+2');

            if (this.row == maxrow)
            {
                ipips.push('col.*.local.2:0', 'col.*.local.3:1', 'col.*.local.5:2');
                if (curBitstream.family.extraInter)
                    ipips.push('T:+1', '+1', 'row.+.long.1:4');
            }
            else
            {
                ipips.push('col.*.local.2:0', 'col.*.local.5:1');
                if (curBitstream.family.extraInter)
                    ipips.push(['+1', 'row.+.long.1:4'], 'T:+14', 'row.+.local.2:2', 'row.+.local.4:3');
                else
                    ipips.push('T:+15', 'row.+.local.2:2', 'row.+.local.4:3');
            }

            tpips.push('col.*.local.2:0', 'col.*.local.3:1', 'col.*.long.1:2', 'col.*.long.2:3');
        }
        else if (this.style == 'rightupper')
        {
            opips.push('col.*.local.4:0', 'col.*.local.1:1', 'col.*.long.2:2', '-2:3');
            if (this.row == 0)
                opips.push('T:-2', 'row.*.long.3:4');
            else
                opips.push('T:-5', 'row.*.long.2:4', 'row.*.local.5:5', 'row.*.local.3:6', 'row.*.local.1:7');

            qpips.push('col.*.local.5:0', 'col.*.local.2:1');
            if (this.row != 0)
                qpips.push('T:-9', 'row.*.local.4:2', 'row.*.local.2:3');

            if (this.row == 0)
                ipips.push('col.*.local.4:0', 'col.*.local.3:1', 'col.*.local.1:2',
                    'T:-7', 'T:-9', 'T:-12', '-5');
            else
                ipips.push('col.*.local.4:0', 'col.*.local.1:1',
                    ['-7', 'T:-3', 'T:-12', '-5'],
                    'T:+0', 'row.*.local.5:2', 'row.*.local.3:3');

            tpips.push('col.*.local.4:0', 'col.*.local.1:1', 'col.*.long.2:2', 'col.*.long.1:3');
        }
        else if (this.style == 'rightlower')
        {
            if (this.row != maxrow)
            {
                opips.push('T:-2', 'T:-1');
                tpips.push('T:-2', 'T:+1');

                opips.push('col.*.local.5:0', 'col.*.local.3:1', 'col.*.local.2:2',
                    ['-2', '+4:3'], 'col.*.long.2:4',
                    'T:-2', 'row.+.long.1:5', 'row.+.local.2:6', 'row.+.local.4:7');
            }
            else
                opips.push('-1:0', 'col.*.local.5:1', 'col.*.local.3:2', 'col.*.local.2:3', 'col.*.long.2:4',
                    'T:-3', 'row.+.long.1:5', '+9:6')

            qpips.push('col.*.local.4:0', 'col.*.local.1:1');
            if (this.row != maxrow)
                qpips.push('T:-5', 'row.+.local.3:2', 'row.+.local.5:3');

            if (this.row == maxrow)
                ipips.push('col.*.local.5:0', 'col.*.local.3:1', 'col.*.local.2:2', '-8');
            else
                ipips.push('col.*.local.5:0', 'col.*.local.2:1',
                    'T:-7', 'row.+.local.2:2', 'row.+.local.4:3');

            tpips.push('col.*.local.5:0', 'col.*.local.3:1', 'col.*.long.2:2', 'col.*.long.1:3');
        }

        this.okPath.appendPipList(okpips, this.genCoords.bind(this));
        this.ikPath.appendPipList(ikpips, this.genCoords.bind(this));
        this.oPath.appendPipList(opips, this.genCoords.bind(this));
        this.qPath.appendPipList(qpips, this.genCoords.bind(this));
        this.iPath.appendPipList(ipips, this.genCoords.bind(this));
        this.tPath.appendPipList(tpips, this.genCoords.bind(this));
    }

    renderBackground(ctx)
    {
        // TODO: select different color if IOB is used
        ctx.strokeStyle = '#aaa';
        ctx.fillStyle = '#aaa';
        ctx.font = '8px Arial';

        drawTextBox(ctx, this.pin, this.screenPt.x, this.screenPt.y, this.W, this.H);

        if (this.clkin == 'TCLKIN')
            drawTextBox(ctx, 'TCL', this.screenPt.x, this.screenPt.y+this.H, this.W, 12);
        else if (this.clkin == 'BCLKIN')
            drawTextBox(ctx, 'BCL', this.screenPt.x, this.screenPt.y+this.H, this.W, 16);

        // draw connect lines for the CLB inputs/outputs
        ctx.beginPath();
        if (this.style == 'topleft' || this.style == 'topright' ||
            this.style == 'bottomleft' || this.style == 'bottomright')
        {
            var base1 = (this.row==0) ? (this.screenPt.y-2) : (this.screenPt.y+12);
            var base2 = (this.row==0) ? (this.screenPt.y+12) : (this.screenPt.y-2);

            ctx.moveTo(this.screenPt.x + 4, base1);
            ctx.lineTo(this.screenPt.x + 4, base1 + 2);
            ctx.moveTo(this.screenPt.x + 12, base1);
            ctx.lineTo(this.screenPt.x + 12, base1 + 2);
            ctx.moveTo(this.screenPt.x + 16, base2);
            ctx.lineTo(this.screenPt.x + 16, base2 + 2);
            ctx.moveTo(this.screenPt.x + 12, base2);
            ctx.lineTo(this.screenPt.x + 12, base2 + 2);
            ctx.moveTo(this.screenPt.x + 8, base2);
            ctx.lineTo(this.screenPt.x + 8, base2 + 2);
            ctx.moveTo(this.screenPt.x + 4, base2);
            ctx.lineTo(this.screenPt.x + 4, base2 + 2);
        }
        else if (this.style == 'leftupper' || this.style == 'leftlower' ||
            this.style == 'rightupper' || this.style == 'rightlower')
        {
            var base1 = (this.col==0) ? (this.screenPt.x-2) : (this.screenPt.x+20);
            var base2 = (this.col==0) ? (this.screenPt.x+20) : (this.screenPt.x-2);
            var base3 = (this.style == 'leftupper' || this.style == 'rightupper') ? (this.screenPt.y+8) : this.screenPt.y;

            ctx.moveTo(base1, base3 + 4);
            ctx.lineTo(base1 + 2, base3 + 4);
            ctx.moveTo(base1, base3 + 12);
            ctx.lineTo(base1 + 2, base3 + 12);
            ctx.moveTo(base2, base3 + 16);
            ctx.lineTo(base2 + 2, base3 + 16);
            ctx.moveTo(base2, base3 + 12);
            ctx.lineTo(base2 + 2, base3 + 12);
            ctx.moveTo(base2, base3 + 8);
            ctx.lineTo(base2 + 2, base3 + 8);
            ctx.moveTo(base2, base3 + 4);
            ctx.lineTo(base2 + 2, base3 + 4);

            if (this.clkin == 'TCLKIN')
            {
                ctx.moveTo(base2, base3 + 24);
                ctx.lineTo(base2 + 2, base3 + 24);
            }
            else if (this.clkin == 'BCLKIN')
            {
                ctx.moveTo(base2, base3 + 28);
                ctx.lineTo(base2 + 2, base3 + 28);
            }
        }
        ctx.stroke();

        if (viewSettings.showAllPips)
        {
            this.okPath.draw(ctx);
            this.ikPath.draw(ctx);
            this.oPath.draw(ctx);
            this.qPath.draw(ctx);
            this.iPath.draw(ctx);
            this.tPath.draw(ctx);
            if (this.ciPath) this.ciPath.draw(ctx);
        }
    }

    render(ctx)
    {
        if (this.iNet) this.iNet.draw(ctx);
        if (this.qNet) this.qNet.draw(ctx);
    }

    decode()
    {
        var fam = curBitstream.family;
        var offset = getTileOffset(this.col, this.row);
        const self = this;

        var inputbits = {};
        var inputmux = {};
        var outputbits = {};

        if (this.style == 'topleft')
        {
            inputbits['OK'] = [3, offset.x+5];
            inputmux['OK'] = {0x0:0, 0x1:1};
            inputbits['IK'] = [3, offset.x+7];
            inputmux['IK'] = {0x1:0, 0x0:1};

            if (this.col == 0)
            {
                inputbits['O'] = [3, offset.x+0,  3+1, offset.x+0,  3+1, offset.x+1,  3+1, offset.x+2];
                inputmux['O'] = {0xF:0, 0xE:1, 0x4:2, 0x2:3, 0x3:4, 0x5:5};

                outputbits['Q'] = [3+4, offset.x+18,  3+4, offset.x+19];
                outputbits['I'] = [3+3, offset.x+12,  3+3, offset.x+21,  3+4, offset.x+17];
            }
            else
            {
                inputbits['O'] = [3, offset.x+0,  3, offset.x+1,  3+1, offset.x+0,  3+1, offset.x+1,  3+1, offset.x+2];
                inputmux['O'] = {0x0D:0, 0x0B:1, 0x0A:2, 0x07:3, 0x0C:4, 0x1E:5, 0x06:6, 0x1F:7};

                outputbits['Q'] = [3+4, offset.x+21,  3+4, offset.x+18,  3+3, offset.x+10,  3+4, offset.x+10];
                outputbits['I'] = [3+2, offset.x+6,  3+3, offset.x+19,  3+3, offset.x+12,  3+3, offset.x+6];
            }

            inputbits['T'] = [3, offset.x+8,  3+1, offset.x+8];
            inputmux['T'] = {0x3:0, 0x2:1, 0x1:2, 0x0:3};

            this.oEnable = curBitstream.data[3][offset.x+8] == 0;
            this.oLatch = curBitstream.data[3][offset.x+3] == 0;
            this.oInvert = curBitstream.data[3][offset.x+2] == 0;
            this.oFast = curBitstream.data[3][offset.x+6] == 1;
            this.tEnable = curBitstream.data[3+1][offset.x+10] == 1;
            this.tInvert = curBitstream.data[3+1][offset.x+9] == 1;
            this.iLatch = curBitstream.data[3][offset.x+9] == 1;
            this.iPullup = curBitstream.data[3+1][offset.x+8] == 0;
        }
        else if (this.style == 'topright')
        {
            var offset1 = getTileOffset(this.col+1, this.row);

            inputbits['OK'] = [3, offset.x+16];
            inputmux['OK'] = {0x0:0, 0x1:1};
            inputbits['IK'] = [3, offset.x+14];
            inputmux['IK'] = {0x1:0, 0x0:1};

            if (this.col == fam.cols-1)
            {
                inputbits['O'] = [3, offset.x+20,  3, offset.x+21,  3+1, offset.x+18,  3+1, offset.x+20,  3+1, offset.x+21];
                inputmux['O'] = {0x0C:0, 0x1D:1, 0x09:2, 0x0B:3, 0x0E:4, 0x07:5};

                outputbits['Q'] = [3+2, offset.x+7,  3+3, offset.x+18];
                outputbits['I'] = [3+4, offset.x+20,  3+4, offset.x+19,  3+3, offset1.x+3];
            }
            else
            {
                inputbits['O'] = [3, offset.x+20,  3, offset.x+21,  3+1, offset.x+18,  3+1, offset.x+20,  3+1, offset.x+21];
                inputmux['O'] = {0x0C:0, 0x1D:1, 0x09:2, 0x0B:3, 0x0E:4, 0x07:5, 0x1F:6, 0x05:7};

                if (this.col == 0)
                {
                    outputbits['Q'] = [3+3, offset.x+13,  3+2, offset.x+21];
                    outputbits['I'] = [3+4, offset.x+21,  3+4, offset.x+20,  3+2, offset1.x+10,  3+2, offset1.x+11];
                }
                else
                {
                    outputbits['Q'] = [3+2, offset.x+7,  3+3, offset.x+18,  3+2, offset1.x+2,  3+3, offset1.x+11];
                    outputbits['I'] = [3+4, offset.x+20,  3+4, offset.x+19,  3+2, offset1.x+10,  3+2, offset1.x+11];
                }
            }

            inputbits['T'] = [3, offset.x+11,  3+1, offset.x+12];
            inputmux['T'] = {0x3:0, 0x2:1, 0x1:2, 0x0:3};

            this.oEnable = curBitstream.data[3][offset.x+11] == 0;
            this.oLatch = curBitstream.data[3][offset.x+18] == 0;
            this.oInvert = curBitstream.data[3][offset.x+19] == 0;
            this.oFast = curBitstream.data[3][offset.x+15] == 1;
            this.tEnable = curBitstream.data[3+1][offset.x+14] == 1;
            this.tInvert = curBitstream.data[3+1][offset.x+13] == 1;
            this.iLatch = curBitstream.data[3][offset.x+12] == 1;
            this.iPullup = curBitstream.data[3+1][offset.x+12] == 0;
        }
        else if (this.style == 'bottomleft')
        {
            inputbits['OK'] = [offset.y+4, offset.x+5];
            inputmux['OK'] = fam.swapBottomClk ? {0x1:0, 0x0:1} : {0x0:0, 0x1:1};
            inputbits['IK'] = [offset.y+4, offset.x+7];
            inputmux['IK'] = fam.swapBottomClk ? {0x0:0, 0x1:1} : {0x1:0, 0x0:1};

            if (this.col == 0)
            {
                inputbits['O'] = [offset.y+3, offset.x,  offset.y+3, offset.x+1,  offset.y+3, offset.x+2,  offset.y+4, offset.x];
                inputmux['O'] = {0x1:0, 0xF:1, 0x7:2, 0x2:3, 0x9:4, 0xA:5};

                outputbits['Q'] = [offset.y, offset.x+21,  offset.y, offset.x+18];
                outputbits['I'] = [offset.y+2, offset.x+6,  offset.y+1, offset.x+19,  offset.y+2, offset.x+21];
            }
            else
            {
                inputbits['O'] = [offset.y+3, offset.x,  offset.y+3, offset.x+1,  offset.y+3, offset.x+2,  offset.y+4, offset.x,  offset.y+4, offset.x+1];
                inputmux['O'] = {0x0B:0, 0x1A:1, 0x12:2, 0x19:3, 0x03:4, 0x17:5, 0x11:6, 0x1F:7};

                outputbits['Q'] = [offset.y, offset.x+21,  offset.y, offset.x+18,  offset.y, offset.x+10,  offset.y+1, offset.x+10];
                outputbits['I'] = [offset.y+2, offset.x+6,  offset.y+1, offset.x+19,  offset.y+1, offset.x+6,  offset.y+1, offset.x+12];
            }

            inputbits['T'] = [offset.y+4, offset.x+8,  offset.y+3, offset.x+8];
            inputmux['T'] = {0x3:0, 0x2:1, 0x1:2, 0x0:3};

            this.oEnable = curBitstream.data[offset.y+4][offset.x+8] == 0;
            this.oLatch = curBitstream.data[offset.y+4][offset.x+3] == 0;
            this.oInvert = curBitstream.data[offset.y+4][offset.x+2] == 0;
            this.oFast = curBitstream.data[offset.y+4][offset.x+6] == 1;
            this.tEnable = curBitstream.data[offset.y+3][offset.x+10] == 1;
            this.tInvert = curBitstream.data[offset.y+3][offset.x+9] == 1;
            this.iLatch = curBitstream.data[offset.y+4][offset.x+9] == 1;
            this.iPullup = curBitstream.data[offset.y+3][offset.x+8] == 0;
        }
        else if (this.style == 'bottomright')
        {
            var offset1 = getTileOffset(this.col+1, this.row);

            inputbits['OK'] = [offset.y+4, offset.x+16];
            inputmux['OK'] = fam.swapBottomClk ? {0x1:0, 0x0:1} : {0x0:0, 0x1:1};
            inputbits['IK'] = [offset.y+4, offset.x+14];
            inputmux['IK'] = fam.swapBottomClk ? {0x0:0, 0x1:1} : {0x1:0, 0x0:1};

            if (this.col == fam.cols-1)
            {
                inputbits['O'] = [offset.y+3, offset.x+18,  offset.y+3, offset.x+20,  offset.y+3, offset.x+21,  offset.y+4, offset.x+20,  offset.y+4, offset.x+21];
                inputmux['O'] = {0x09:0, 0x03:1, 0x0F:2, 0x0A:3, 0x1A:4, 0x13:5};

                outputbits['Q'] = [offset.y+2, offset.x+7,  offset.y+1, offset.x+18];
                outputbits['I'] = [offset.y, offset.x+20,  offset.y, offset.x+19,  offset1.y, offset1.x+1];
            }
            else
            {
                inputbits['O'] = [offset.y+3, offset.x+18,  offset.y+3, offset.x+20,  offset.y+3, offset.x+21,  offset.y+4, offset.x+20,  offset.y+4, offset.x+21];
                inputmux['O'] = {0x03:0, 0x0F:1, 0x0A:2, 0x1A:3, 0x13:4, 0x19:5, 0x1F:6, 0x09:7};

                outputbits['Q'] = [offset.y+2, offset.x+7,  offset.y+1, offset.x+18,  offset1.y+2, offset1.x+2,  offset1.y+1, offset1.x+11];
                outputbits['I'] = [offset.y, offset.x+20,  offset.y, offset.x+19,  offset1.y+2, offset1.x+10,  offset1.y+2, offset1.x+11];
            }

            inputbits['T'] = [offset.y+4, offset.x+11,  offset.y+3, offset.x+12];
            inputmux['T'] = {0x3:0, 0x2:1, 0x1:2, 0x0:3};

            this.oEnable = curBitstream.data[offset.y+4][offset.x+11] == 0;
            this.oLatch = curBitstream.data[offset.y+4][offset.x+18] == 0;
            this.oInvert = curBitstream.data[offset.y+4][offset.x+19] == 0;
            this.oFast = curBitstream.data[offset.y+4][offset.x+15] == 1;
            this.tEnable = curBitstream.data[offset.y+3][offset.x+14] == 1;
            this.tInvert = curBitstream.data[offset.y+3][offset.x+13] == 1;
            this.iLatch = curBitstream.data[offset.y+4][offset.x+12] == 1;
            this.iPullup = curBitstream.data[offset.y+3][offset.x+12] == 0;
        }
        else if (this.style == 'leftupper')
        {
            if (this.row == 0) inputbits['OK'] = [offset.y+2, 2];
            else               inputbits['OK'] = [offset.y, 0];
            inputmux['OK'] = {0x0:0, 0x1:1};
            inputbits['IK'] = [offset.y+4, 1];
            inputmux['IK'] = {0x1:0, 0x0:1};

            if (this.row == 0)
            {
                inputbits['O'] = [offset.y, 2,  offset.y+1, 1,  offset.y+1, 3,  offset.y+1, 4];
                inputmux['O'] = {0x4:0, 0xD:1, 0xF:2, 0x1:3, 0x6:4, 0x3:5};

                outputbits['Q'] = [offset.y+1, offset.x+10,  offset.y+1, offset.x+11];
                outputbits['I'] = [offset.y, offset.x+2,  offset.y+1, offset.x+17,  offset.y, offset.x+17];
            }
            else
            {
                inputbits['O'] = [offset.y, 0,  offset.y, 2,  offset.y, 4,  offset.y, 5,  offset.y, 6];
                inputmux['O'] = {0x0A:0, 0x1F:1, 0x0D:2, 0x07:3, 0x0B:4, 0x06:5, 0x0C:6};

                outputbits['Q'] = [offset.y+2, offset.x+15,  offset.y+2, offset.x+10,  offset.y+2, 5,  offset.y+2, 4];
                outputbits['I'] = [offset.y+2, offset.x+9,  offset.y+2, offset.x+18,  offset.y+3, offset.x+17,  offset.y+4, offset.x+18];
            }

            inputbits['T'] = [offset.y+5, 2,  offset.y+4, 3];
            inputmux['T'] = {0x2:0, 0x3:1, 0x0:2, 0x1:3};

            if (fam.extraInter)
            {
                // extra input interconnect
                // can only be enabled if the neighboring tristate buffer is disabled

                var tbenable = curBitstream.data[offset.y+2][offset.x+1];
                var input = curBitstream.data[offset.y+2][offset.x+3];
                if (tbenable==1 && input==0)
                    this.iPath.setPipStatus(4, 1);
            }

            // topmost IOB is slightly different
            if (this.row == 0)
                this.oFast = curBitstream.data[offset.y+1][2] == 1;
            else
                this.oFast = curBitstream.data[offset.y][3] == 1;
            this.oEnable = curBitstream.data[offset.y+5][2] == 0;
            this.oLatch = curBitstream.data[offset.y+2][1] == 0;
            this.oInvert = curBitstream.data[offset.y+2][0] == 0;
            this.tEnable = curBitstream.data[offset.y+4][5] == 1;
            this.tInvert = curBitstream.data[offset.y+4][4] == 1;
            this.iLatch = curBitstream.data[offset.y+4][2] == 1;
            this.iPullup = curBitstream.data[offset.y+4][3] == 0;
        }
        else if (this.style == 'leftlower')
        {
            var offset1 = getTileOffset(this.col, this.row+1);

            inputbits['OK'] = [offset.y+6, 0];
            inputmux['OK'] = {0x0:0, 0x1:1};
            inputbits['IK'] = [offset.y+5, 1];
            inputmux['IK'] = {0x1:0, 0x0:1};

            if (this.row == fam.rows-1)
            {
                inputbits['O'] = [offset.y+5, 4,  offset.y+5, 6,  offset.y+7, 3,  offset.y+7, 5,  offset.y+7, 6];
                inputmux['O'] = {0x0E:0, 0x1F:1, 0x05:2, 0x0B:3, 0x0D:4, 0x06:5, 0x03:6};

                outputbits['Q'] = [offset.y+3, offset.x,  offset.y+3, offset.x+16];
                outputbits['I'] = [offset.y+4, offset.x+3,  offset1.y, 6,  offset.y+2, 6];
            }
            else
            {
                inputbits['O'] = [offset.y+5, 4,  offset.y+5, 6,  offset.y+7, 3,  offset.y+7, 5,  offset.y+7, 6];
                inputmux['O'] = {0x0E:0, 0x1F:1, 0x05:2, 0x0B:3, 0x0D:4, 0x06:5, 0x03:6, 0x17:7};

                outputbits['Q'] = [offset.y+3, offset.x,  offset.y+3, offset.x+16,  offset1.y+3, offset1.x+18,  offset1.y+3, offset1.x+19];
                outputbits['I'] = [offset.y+4, offset.x+3,  offset.y+2, 6,  offset1.y+2, 3,  offset1.y+3, 4];
            }

            inputbits['T'] = [offset.y+7, 1,  offset.y+6, 2];
            inputmux['T'] = {0x2:0, 0x3:1, 0x0:2, 0x1:3};

            if (fam.extraInter)
            {
                // extra input interconnect
                // can only be enabled if the neighboring tristate buffer is disabled

                var tbenable = curBitstream.data[offset.y+2][offset.x+11];
                var input = curBitstream.data[offset.y+2][offset.x+13];
                if (tbenable==1 && input==0)
                    this.iPath.setPipStatus(4, 1);
            }

            this.oEnable = curBitstream.data[offset.y+7][1] == 0;
            this.oLatch = curBitstream.data[offset.y+7][0] == 0;
            this.oInvert = curBitstream.data[offset.y+7][2] == 0;
            this.oFast = curBitstream.data[offset.y+6][1] == 1;
            this.tEnable = curBitstream.data[offset.y+7][4] == 1;
            this.tInvert = curBitstream.data[offset.y+6][3] == 1;
            this.iLatch = curBitstream.data[offset.y+5][3] == 1;
            this.iPullup = curBitstream.data[offset.y+6][2] == 0;
        }
        else if (this.style == 'rightupper')
        {
            inputbits['OK'] = [offset.y+4, offset.x+11];
            inputmux['OK'] = {0x0:0, 0x1:1};
            inputbits['IK'] = [offset.y+5, offset.x+12];
            inputmux['IK'] = {0x1:0, 0x0:1};

            if (this.row == 0)
            {
                inputbits['O'] = [offset.y+2, offset.x+11,  offset.y+2, offset.x+12,  offset.y+3, offset.x+11,  offset.y+3, offset.x+12,  offset.y+3, offset.x+13];
                inputmux['O'] = {0x19:0, 0x0F:1, 0x05:2, 0x15:3, 0x09:4};

                outputbits['Q'] = [offset.y+5, offset.x+9,  offset.y+5, offset.x+4];
                outputbits['I'] = [offset.y+4, offset.x+7,  offset.y+3, offset.x+7,  offset.y+4, offset.x+1];
            }
            else
            {
                inputbits['O'] = [offset.y+2, offset.x+11,  offset.y+2, offset.x+12,  offset.y+3, offset.x+11,  offset.y+3, offset.x+12,  offset.y+3, offset.x+13];
                inputmux['O'] = {0x19:0, 0x0F:1, 0x05:2, 0x15:3, 0x09:4, 0x1C:5, 0x0C:6, 0x1F:7};

                outputbits['Q'] = [offset.y+5, offset.x+9,  offset.y+5, offset.x+4,  offset.y+2, offset.x+5,  offset.y+2, offset.x+6];
                outputbits['I'] = [offset.y+4, offset.x+7,  offset.y+4, offset.x+1,  offset.y+3, offset.x+10,  offset.y+3, offset.x+7];
            }

            inputbits['T'] = [offset.y+5, offset.x+5,  offset.y+4, offset.x+5];
            inputmux['T'] = {0x2:0, 0x3:1, 0x0:2, 0x1:3};

            this.oEnable = curBitstream.data[offset.y+5][offset.x+5] == 0;
            this.oLatch = curBitstream.data[offset.y+4][offset.x+12] == 0;
            this.oInvert = curBitstream.data[offset.y+4][offset.x+13] == 0;
            this.oFast = curBitstream.data[offset.y+5][offset.x+11] == 1;
            this.tEnable = curBitstream.data[offset.y+5][offset.x+7] == 1;
            this.tInvert = curBitstream.data[offset.y+5][offset.x+6] == 1;
            this.iLatch = curBitstream.data[offset.y+5][offset.x+10] == 1;
            this.iPullup = curBitstream.data[offset.y+4][offset.x+5] == 0;
        }
        else if (this.style == 'rightlower')
        {
            var offset1 = getTileOffset(this.col, this.row+1);

            inputbits['OK'] = [offset.y+6, offset.x+11];
            inputmux['OK'] = {0x0:0, 0x1:1};
            inputbits['IK'] = [offset.y+6, offset.x+13];
            inputmux['IK'] = {0x1:0, 0x0:1};

            if (this.row == fam.rows-1)
            {
                inputbits['O'] = [offset.y+6, offset.x+5,  offset.y+7, offset.x+4,  offset.y+7, offset.x+7,  offset.y+7, offset.x+8,  offset.y+7, offset.x+9];
                inputmux['O'] = {0x0D:0, 0x0A:1, 0x1E:2, 0x06:3, 0x0B:4, 0x07:5, 0x0C:6};

                outputbits['Q'] = [offset.y+6, offset.x+9,  offset.y+6, offset.x+4];
                outputbits['I'] = [offset.y+6, offset.x+10,  offset1.y, offset1.x+4,  offset.y+6, offset.x+6];
            }
            else
            {
                inputbits['O'] = [offset.y+6, offset.x+5,  offset.y+7, offset.x+4,  offset.y+7, offset.x+7,  offset.y+7, offset.x+8,  offset.y+7, offset.x+9];
                inputmux['O'] = {0x0A:0, 0x1E:1, 0x06:2, 0x0C:3, 0x0B:4, 0x07:5, 0x1F:6, 0x0D:7};

                outputbits['Q'] = [offset.y+6, offset.x+9,  offset.y+6, offset.x+4,  offset1.y+3, offset1.x+8,  offset1.y+3, offset1.x+9];
                outputbits['I'] = [offset.y+6, offset.x+10,  offset.y+6, offset.x+6,  offset1.y+3, offset1.x+5,  offset1.y+3, offset1.x+4];
            }

            inputbits['T'] = [offset.y+6, offset.x+2,  offset.y+6, offset.x+1];
            inputmux['T'] = {0x2:0, 0x3:1, 0x0:2, 0x1:3};

            this.oEnable = curBitstream.data[offset.y+6][offset.x+2] == 0;
            this.oLatch = curBitstream.data[offset.y+7][offset.x+11] == 0;
            this.oInvert = curBitstream.data[offset.y+7][offset.x+12] == 0;
            this.oFast = curBitstream.data[offset.y+6][offset.x+12] == 1;
            this.tEnable = curBitstream.data[offset.y+6][offset.x+3] == 1;
            this.tInvert = curBitstream.data[offset.y+7][offset.x+3] == 1;
            this.iLatch = curBitstream.data[offset.y+5][offset.x+13] == 1;
            this.iPullup = curBitstream.data[offset.y+6][offset.x+1] == 0;
        }

        this.okEnable = this.oEnable && this.oLatch;

        Object.entries(inputbits).forEach(([key, val]) =>
        {
            //if (!this[key.toLowerCase() + 'Enable']) return;

            var bits = 0;
            for (var i = 0; i < val.length; i+=2)
            {
                var bit = curBitstream.data[val[i]][val[i+1]];
                bits |= (bit << (i>>1));
            }

            var mux = inputmux[key][bits];
            if (typeof mux == 'undefined')
            {
                console.log(this.pin+': bad mux ' + key + '=' + bits);
                return;
            }

            // enable the corresponding PIP
            this[key.toLowerCase() + 'Path'].setPipStatus(mux, 1);

            if (key == 'IK') this.ikSel = mux;
            if (key == 'OK') this.okSel = mux;
        });

        Object.entries(outputbits).forEach(([key, val]) =>
        {
            for (var i = 0; i < val.length; i+=2)
            {
                var bit = curBitstream.data[val[i]][val[i+1]];
                if (!bit)
                    this[key.toLowerCase() + 'Path'].setPipStatus(i >> 1, 1);
            }
        });

        var inputs = ['o', 't', 'ik', 'ok'];
        inputs.forEach((inp) =>
        {
            if (!self[inp+'Enable'])
                self[inp+'Path'].disableAllPips();
        });

        var pins = ['o', 't', 'ik', 'ok', 'i', 'q'];
        pins.forEach((pin) => self[pin+'Net'] = null);
    }

    describePin(pin)
    {
        if (pin == 'CLKI') return this.clkin + '.I';
        return this.pad + '.' + pin;
    }

    pinEnabled(pin)
    {
        return this[pin.toLowerCase() + 'Enable'];
    }

    signalConnection(pin)
    {
        switch (pin)
        {
            case 'Q':
                this.qEnable = true;
                this.ikEnable = true;
                break;

            case 'I':
                this.iEnable = true;
                break;

            case 'CLKI':
                this.clkiEnable = true;
                break;
        }
    }

    traceFromOutputs()
    {
        if (this.iEnable) this.iNet = this.iPath.traceFrom();
        if (this.qEnable) this.qNet = this.qPath.traceFrom();
        if (this.pad=='PAD20') console.log(this.iNet);
    }

    isInside(x, y)
    {
        return x >= this.screenPt.x && x < this.screenPt.x + this.W && y >= this.screenPt.y && y <= this.screenPt.y + this.H;
    }

    info()
    {
        // return "IOB " + this.pin + " " + this.tile + " " + this.style + " " + this.pips + this.data.join(", ");
        return "o" + this.muxo + " t" + this.muxt + " k" + this.muxk + " " + (this.latch ? "Q" : "PAD") + " " + this.tmode;
    }
}

// Draw the representation of an IOB for the popup
let iobPopup = undefined;
function iobDrawPopup(iob, x, y)
{
    /*console.log('IK', iob.ikEnable, iob.ikInvert, iob.ikSel,
        'OK', iob.okEnable, iob.okInvert, iob.okSel,
        'O', iob.oEnable, iob.oInvert, iob.oLatch,
        'I', iob.iEnable, iob.iLatch, iob.iPullup,
        'T', iob.tEnable, iob.tInvert,
        'Q', iob.qEnable);*/
  iobPopup = $("<canvas/>", {class: "popup"}).css("left", x * SCALE).css("top", y * SCALE)[0];
  iobPopup.width = 300;
  iobPopup.height = 300;
  $('#container').append(iobPopup);
  const context = iobPopup.getContext('2d');
  context.resetTransform();
  context.translate(0.5, 0.5); // Prevent aliasing
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "black";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.translate(0, -60); // Adjust top of box
  context.font = "20px arial";
  context.fillStyle = "red";

  context.strokeStyle = "white";
  context.fillStyle = "white";
  context.font = "20px arial";
  context.beginPath();
  context.rect(9, 131, 60, 70); // pad box
  context.stroke();
  context.fillStyle = "yellow";
  context.fillText("PAD", 16, 177);

  if (!iob.oEnable && iob.iPullup)
  {
      context.strokeStyle = "yellow";
      context.beginPath();
      context.moveTo(69, 170);
      context.lineTo(79, 170);
      context.lineTo(79, 120);
      for (var i = 0; i < 4; i++)
      {
          context.lineTo(79-4, 120-4-(8*i));
          context.lineTo(79+4, 120-8-(8*i));
      }
      context.lineTo(79, 84);
      context.lineTo(79, 80);
      context.stroke();
      context.fillStyle = "white";
      context.fillText("Vcc", 60, 78);
  }

  if (iob.iEnable || iob.qEnable) {
    // draw input buffer
    context.strokeStyle = "white";
      context.beginPath();
    context.moveTo(86, 188);
    context.lineTo(86 + 14, 188 + 14);
    context.lineTo(86, 188 + 28);
    context.lineTo(86, 188);
    context.stroke();

    context.strokeStyle = "yellow";
      context.beginPath();
    context.moveTo(69, 170);
    context.lineTo(79, 170);
    context.lineTo(79, 188 + 14);
    context.lineTo(86, 188 + 14);
    context.stroke();

    if (iob.iEnable)
    {
      // Input line
        context.beginPath();
      context.moveTo(86 + 14, 188 + 14);
      context.lineTo(167, 188 + 14);
      context.stroke();
      context.fillStyle = "white";
      context.fillText("I", 172, 210);
    }
    if (iob.qEnable)
    {
      // Input flip flop
        context.beginPath();
      context.moveTo(86 + 14, 188 + 14);
      context.lineTo(111, 188 + 14);
      context.lineTo(111, 235);
      context.lineTo(121, 235);
      if (iob.ikInvert[iob.ikSel])
      {
          context.moveTo(105, 299);
          context.lineTo(115, 299);
          context.stroke();
          context.beginPath();
          context.arc(118, 299, 3, 0, 2 * Math.PI);
      }
      else
      {
          context.moveTo(105, 299);
          context.lineTo(121, 299);
      }
      context.moveTo(151, 267);
      context.lineTo(167, 267);
      context.rect(121, 229, 29, 76);
      context.stroke();
      if (!iob.iLatch)
      {
          context.beginPath();
          context.moveTo(121, 229 + 76); // clock triangle
          context.lineTo(121 + 7, 229 + 76 - 7); // clock triangle
          context.lineTo(121, 229 + 76 - 14); // clock triangle
          context.stroke();
      }
      else
      {
          context.fillStyle = "red";
          context.fillText("E", 122, 229 + 76 - 7);
      }
      context.fillStyle = "white";
      context.fillText("IK", 85, 307);
      context.fillText("Q", 172, 270);
      context.fillStyle = "yellow";
      context.fillText("IQ", 128, 263);
    }
  }

  if (iob.oEnable)
  {
    // draw output buffer
    context.strokeStyle = "white";
      context.beginPath();
    context.moveTo(118, 125);
    context.lineTo(118 - 14, 125 + 14);
    context.lineTo(118, 125 + 28);
    context.lineTo(118, 125);
    if (iob.oInvert && !iob.oLatch)
    {
        context.stroke();
        context.beginPath();
        context.arc(118-14-3, 125+14, 3, 0, 2 * Math.PI);
    }
    context.stroke();

    context.strokeStyle = "yellow";
    context.beginPath();
    context.moveTo(69, 170);
    context.lineTo(79, 170);
    context.lineTo(79, 125 + 14);
    context.lineTo(118 - 14 - (iob.oInvert&&!iob.oLatch?6:0), 125 + 14);

    context.moveTo(118, 125 + 14);
    context.lineTo(135, 125 + 14);
    context.stroke();
    if (!iob.oLatch)
    {
        context.fillStyle = "white";
        context.fillText("O", 138, 148);
    }
    else
    {
        context.beginPath();
        context.rect(135, 105, 29, 76);
        context.moveTo(135+29, 105 + 76); // clock triangle
        context.lineTo(135+29-7, 105 + 76 - 7); // clock triangle
        context.lineTo(135+29, 105 + 76 - 14); // clock triangle
        if (iob.oInvert)
        {
            context.stroke();
            context.beginPath();
            context.arc(135+32, 125+14, 3, 0, 2 * Math.PI);
        }
        context.moveTo(135+29+(iob.oInvert?6:0), 125 + 14);
        context.lineTo(180, 125 + 14);
        context.stroke();
        context.fillStyle = "white";
        context.fillText("O", 183, 148);

        if (iob.okInvert[iob.okSel])
        {
            context.beginPath();
            context.moveTo(180, 105+76-7);
            context.lineTo(135+29+6, 105+76-7);
            context.stroke();
            context.beginPath();
            context.arc(135+32, 105+76-7, 3, 0, 2 * Math.PI);
            context.stroke();
        }
        else
        {
            context.beginPath();
            context.moveTo(180, 105+76-7);
            context.lineTo(135+29, 105+76-7);
            context.stroke();
        }
        context.fillStyle = "white";
        context.fillText("OK", 183, 105+78);
        context.fillStyle = "yellow";
        context.fillText("OQ", 135, 125+14);
    }

    if (iob.tEnable)
    {
        context.beginPath();
      context.moveTo(118 - 7, 125 + 7 - (iob.tInvert?6:0));
      context.lineTo(118 - 7, 74);
      context.lineTo(135, 74);
      context.stroke();
      context.fillStyle = "white";
      context.fillText("T", 138, 84);
        if (iob.tInvert)
        {
            context.beginPath();
            context.arc(118 - 7, 125 + 4, 3, 0, 2 * Math.PI);
            context.stroke();
        }
    }
  }

}

function iobRemovePopup() {
  if (iobPopup) {
    iobPopup.remove();
    iobPopup = undefined;
  }
}
