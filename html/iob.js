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

      console.log(this.iobs);
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

  startDecode() {
    /*const self = this;
    pads.forEach(function([pin, tile, style, pad]) {
      //console.log("IOB PAD "+pad+" STARTDECODE");
      self.iobs[pad].startDecode();
    });*/
  }

  decode() {
    /*const self = this;
    pads.forEach(function([pin, tile, style, pad]) {
      self.iobs[pad].decode();
    });*/
  }

  routeFromInput() {
    /*const self = this;
    pads.forEach(function([pin, tile, style, pad]) {
      self.iobs[pad].routeFromInput();
    });*/
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

        // point to the CLB this IOB might have direct connections to
        if (style == 'topleft' || style == 'topright')
        {
            this.W = 20;
            this.H = 12;
            this.row = 0;
            this.col = tile;
        } else if (style == 'bottomleft' || style == 'bottomright')
        {
            this.W = 20;
            this.H = 12;
            this.row = curBitstream.family.rows - 1;
            this.col = tile;
        } else if (style == 'leftupper' || style == 'leftlower')
        {
            this.W = 20;
            this.H = 28;
            this.row = tile;
            this.col = 0;
        } else if (style == 'rightupper' || style == 'rightlower')
        {
            this.W = 20;
            this.H = 28;
            this.row = tile;
            this.col = curBitstream.family.cols - 1;
        }
        this.tile = letters[this.row] + letters[this.col];

        this.generateIobPips();

        this.input = 2;
        this.levels = {I: 1, O: 0, T: 0};
        this.dirty = true;
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

    startDecode()
    {
        this.data = [];
        this.muxo = 0; // Mux bits converted to binary
        this.muxk = 0;
        this.muxt = 0;
        this.latch = 0; // Pad/latch (Q) bit. Note that the PAD state is not visible in the bitstream.
        this.label = "";
        this.tmode = ""; // Or ON or TRI
    }

    genCoords(name)
    {
        var ret;

        name = name.replaceAll('PAD*', this.pad)
            .replaceAll('**', this.tile)
            .replaceAll('col.*', 'col.'+this.tile[1])
            .replaceAll('row.*', 'row.'+this.tile[0]);

        return name;
    }

    generateIobPips()
    {
        var tmp;

        if (this.style == 'topleft' || this.style == 'topright')
        {
            var okpips = ['row.*.local.10:PAD*.OK', 'row.*.local.11:PAD*.OK'];
            var ikpips = ['row.*.local.10:PAD*.IK', 'row.*.local.11:PAD*.IK'];

            this.okPath = new Path(this, 'OK', 'dest', {x: this.gPt.x + 1, y: this.gPt.y}, 'V');
            this.okPath.appendPipList(okpips, this.genCoords.bind(this));
            this.ikPath = new Path(this, 'IK', 'dest', {x: this.gPt.x + 3, y: this.gPt.y}, 'V');
            this.ikPath.appendPipList(ikpips, this.genCoords.bind(this));
        }

        if (this.style == 'topleft')
        {
            var opips = ['row.*.local.2:PAD*.O', 'row.*.local.4:PAD*.O'];
            if (this.col == 0)
                opips.push(['col.*.long.5:PAD*.O', 'col.*.long.3:PAD*.O'],
                    'row.*.long.1:PAD*.O'); // , 'PAD*.O:GCLK.O'); // TODO
            else
                opips.push('row.*.long.1:PAD*.O',
                    'col.*.long.3:PAD*.O', 'col.*.long.1:PAD*.O',
                    'col.*.local.5:PAD*.O', 'col.*.local.4:PAD*.O', 'col.*.local.1:PAD*.O');

            var qpips = ['row.*.local.1:PAD*.Q', 'row.*.local.3:PAD*.Q'];
            if (this.col != 0)
                qpips.push('col.*.local.5:PAD*.Q', 'col.*.local.2:PAD*.Q');

            var ipips = ['row.*.local.2:PAD*.I', 'row.*.local.4:PAD*.I'];
            if (this.col == 0)
            {
                //
            }
            else
                ipips.push(['**.A:PAD*.I'], 'col.*.local.4:PAD*.I', 'col.*.local.1:PAD*.I');

            var tpips = ['row.*.local.2:PAD*.T', 'row.*.local.4:PAD*.T', 'row.*.long.1:PAD*.T', 'row.*.long.2:PAD*.T'];

            this.oPath = new Path(this, 'O', 'dest', {x: this.gPt.x + 1, y: this.gPt.y - 1}, 'V');
            this.oPath.appendPipList(opips, this.genCoords.bind(this));

            this.qPath = new Path(this, 'Q', 'source', {x: this.gPt.x + 2, y: this.gPt.y - 1}, 'V');
            this.qPath.appendPipList(qpips, this.genCoords.bind(this));

            this.iPath = new Path(this, 'I', 'source', {x: this.gPt.x + 3, y: this.gPt.y - 1}, 'V');
            this.iPath.appendPipList(ipips, this.genCoords.bind(this));

            this.tPath = new Path(this, 'T', 'dest', {x: this.gPt.x + 4, y: this.gPt.y - 1}, 'V');
            this.tPath.appendPipList(tpips, this.genCoords.bind(this));
        }
    }

    renderBackground(ctx)
    {
        // TODO: select different color if CLB is used
        ctx.strokeStyle = '#aaa';
        ctx.fillStyle = '#aaa';
        ctx.font = '8px Arial';

        drawTextBox(ctx, this.pin, this.screenPt.x, this.screenPt.y, this.W, this.H);

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
        }
        ctx.stroke();

        if (this.style=='topleft'){
            this.okPath.draw(ctx);
            this.ikPath.draw(ctx);
        this.oPath.draw(ctx);
        this.qPath.draw(ctx);
        this.iPath.draw(ctx);
        this.tPath.draw(ctx);}
    }

    render(ctx)
    {
        //
    }

    add(str, bit)
    {
        if (str == ".I PAD/Latched")
        {
            this.latch = bit;
        } else if (str == "")
        {
            this.muxt |= (bit << 0);
        } else
        {
            let m = str.match(/\.([OKT]) MuxBit: (\d+)/);
            if (m)
            {
                if (m[1] == 'K')
                {
                    this.muxk |= (bit << parseInt(m[2]));
                } else if (m[1] == 'O')
                {
                    this.muxo |= (bit << parseInt(m[2]));
                } else if (m[1] == 'T')
                {
                    this.muxt |= (bit << parseInt(m[2]));
                } else
                {
                    alert('Bad mux ' + str);
                }
            } else
            {
                alert('Bad mux2 ' + str);
            }
        }
        this.data.push(str + " " + bit);
    }

    /*
     * Finish the IOB decoding.
     */
    decode()
    {
        //this.generateIobPips(this.pin, this.tile, this.style, this.pad);
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
function iobDrawPopup(iob, x, y) {
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

  if (iob.latch || true /* PAD */) {
    // draw input buffer
    context.strokeStyle = "white";
    context.moveTo(86, 188);
    context.lineTo(86 + 14, 188 + 14);
    context.lineTo(86, 188 + 28);
    context.lineTo(86, 188);
    context.stroke();

    context.strokeStyle = "yellow";
    context.moveTo(69, 170);
    context.lineTo(79, 170);
    context.lineTo(79, 188 + 14);
    context.lineTo(86, 188 + 14);

    if (!iob.latch) {
      // Input line
      context.moveTo(86 + 14, 188 + 14);
      context.lineTo(167, 188 + 14);
      context.fillStyle = "white";
      context.fillText("I", 172, 210);
    } else {
      // Input flip flop
      context.moveTo(86 + 14, 188 + 14);
      context.lineTo(111, 188 + 14);
      context.lineTo(111, 235);
      context.lineTo(121, 235);
      context.moveTo(105, 299);
      context.lineTo(121, 299);
      context.moveTo(151, 267);
      context.lineTo(167, 267);
      context.rect(121, 229, 29, 76);
      context.moveTo(121, 229 + 76); // clock triangle
      context.lineTo(121 + 7, 229 + 76 - 7); // clock triangle
      context.lineTo(121, 229 + 76 - 14); // clock triangle
      context.fillStyle = "white";
      context.fillText("I", 172, 210);
      context.fillText("K", 88, 307);
      context.fillStyle = "yellow";
      context.fillText("Q", 132, 263);
    }
  }

  if (iob.tmode == "ON" || iob.tmode == "TRI") {
    // draw output buffer
    context.strokeStyle = "white";
    context.moveTo(118, 125);
    context.lineTo(118 - 14, 125 + 14);
    context.lineTo(118, 125 + 28);
    context.lineTo(118, 125);
    context.stroke();

    context.strokeStyle = "yellow";
    context.moveTo(69, 170);
    context.lineTo(79, 170);
    context.lineTo(79, 125 + 14);
    context.lineTo(118 - 14, 125 + 14);

    context.moveTo(118, 125 + 14);
    context.lineTo(135, 125 + 14);
    context.fillStyle = "white";
    context.fillText("O", 138, 148);
  }

  if (iob.tmode == "TRI") {
    context.moveTo(118 - 7, 125 + 7);
    context.lineTo(118 - 7, 74);
    context.lineTo(135, 74);
    context.fillStyle = "white";
    context.fillText("T", 138, 84);
  }

  context.stroke();

}

function iobRemovePopup() {
  if (iobPopup) {
    iobPopup.remove();
    iobPopup = undefined;
  }
}
