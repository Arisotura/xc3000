/*
 * Code for an IOB (I/O block), an I/O pin.
 * There is an Iob for each IOB. IobDecoders is a wrapper around all the Iob objects.
 */

/*
 * LCA configuration for PAD:
 * Config I:PAD BUF:
 * or I: or I:Q, BUF:TRI or BUF:ON
 */

// This table holds some configuration data for each pad.
// The pads have a different layout on each of the four sides of the chip (top, left, right, bottom).
// Moreover, there are two types of pads on each side. For example, on the top, alternating pads have wires going to the left or to the right.
// These are indicated as "topleft" or "topright".
// Each pad also has an associated CLB; there are (usually) two pads per CLB.
// Finally, each pad has a pin number that is different from the pin number.
   const pads = [
    ["P11", "AA", "topleft", "PAD1"],
    ["P10", "AB", "topright", "PAD2"],
    ["P9", "AB", "topleft", "PAD3"],
    ["P8", "AC", "topright", "PAD4"],
    ["P7", "AC", "topleft", "PAD5"],
    ["P6", "AD", "topright", "PAD6"],
    ["P5", "AD", "topleft", "PAD7"],
    ["P4", "AE", "topright", "PAD8"],
    ["P3", "AE", "topleft", "PAD9"],
    ["P2", "AF", "topright", "PAD10"],
    ["P84", "AF", "topleft", "PAD11"],
    ["P83", "AG", "topright", "PAD12"],
    ["P82", "AG", "topleft", "PAD13"],
    ["P81", "AH", "topright", "PAD14"],
    ["P80", "AH", "topleft", "PAD15"],
    ["P79", "AI", "topright", "PAD16"],
    ["P78", "AI", "topleft", "PAD17"],
    ["P77", "AJ", "topright", "PAD18"],
    ["P76", "AJ", "topleft", "PAD19"],
    ["P75", "AK", "topright", "PAD20"],

    ["P73", "BK", "rightlower", "PAD21"],
    ["P72", "BK", "rightupper", "PAD22"],
    ["P71", "CK", "rightlower", "PAD23"],
    ["P70", "CK", "rightupper", "PAD24"],
    ["P69", "DK", "rightlower", "PAD25"],
    ["P68", "DK", "rightupper", "PAD26"],
    ["P67", "EK", "rightlower", "PAD27"],
    ["P66", "EK", "rightupper", "PAD28"],
    ["P65", "FK", "rightlower", "PAD29"],
    ["P63", "GK", "rightlower", "PAD30"],
    ["P62", "GK", "rightupper", "PAD31"],
    ["P61", "HK", "rightlower", "PAD32"],
    ["P60", "HK", "rightupper", "PAD33"],
    ["P59", "IK", "rightlower", "PAD34"],
    ["P58", "IK", "rightupper", "PAD35"],
    ["P57", "JK", "rightlower", "PAD36"],
    ["P56", "JK", "rightupper", "PAD37"],

    ["P53", "KK", "bottomright", "PAD38"],
    ["P52", "KJ", "bottomleft", "PAD39"],
    ["P51", "KJ", "bottomright", "PAD40"],
    ["P50", "KI", "bottomleft", "PAD41"],
    ["P49", "KI", "bottomright", "PAD42"],
    ["P48", "KH", "bottomleft", "PAD43"],
    ["P47", "KH", "bottomright", "PAD44"],
    ["P46", "KG", "bottomleft", "PAD45"],
    ["P45", "KG", "bottomright", "PAD46"],
    ["P44", "KF", "bottomleft", "PAD47"],
    ["P42", "KF", "bottomright", "PAD48"],
    ["P41", "KE", "bottomleft", "PAD49"],
    ["P40", "KE", "bottomright", "PAD50"],
    ["P39", "KD", "bottomleft", "PAD51"],
    ["P38", "KD", "bottomright", "PAD52"],
    ["P37", "KC", "bottomleft", "PAD53"],
    ["P36", "KC", "bottomright", "PAD54"],
    ["P35", "KB", "bottomleft", "PAD55"],
    ["P34", "KB", "bottomright", "PAD56"],
    ["P33", "KA", "bottomleft", "PAD57"],

    ["P30", "JA", "leftupper", "PAD58"],
    ["P29", "JA", "leftlower", "PAD59"],
    ["P28", "IA", "leftupper", "PAD60"],
    ["P27", "IA", "leftlower", "PAD61"],
    ["P26", "HA", "leftupper", "PAD62"],
    ["P25", "HA", "leftlower", "PAD63"],
    ["P24", "GA", "leftupper", "PAD64"],
    ["P23", "GA", "leftlower", "PAD65"],
    ["P21", "FA", "leftlower", "PAD66"],
    ["P20", "EA", "leftupper", "PAD67"],
    ["P19", "EA", "leftlower", "PAD68"],
    ["P18", "DA", "leftupper", "PAD69"],
    ["P17", "DA", "leftlower", "PAD70"],
    ["P16", "CA", "leftupper", "PAD71"],
    ["P15", "CA", "leftlower", "PAD72"],
    ["P14", "BA", "leftupper", "PAD73"],
    ["P13", "BA", "leftlower", "PAD74"],
    ];

class IobDecoders {
  constructor() {
    this.iobs = {};
    this.iobsFromPin = {};
    const self = this;
    pads.forEach(function([pin, tile, style, pad]) {
      const iob = new Iob(pin, tile, style, pad);
      self.iobs[pad] = iob;
      self.iobsFromPin[pin] = iob;
    });
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
    const self = this;
    pads.forEach(function([pin, tile, style, pad]) {
      //console.log("IOB PAD "+pad+" STARTDECODE");
      self.iobs[pad].startDecode();
    });
  }

  decode() {
    const self = this;
    pads.forEach(function([pin, tile, style, pad]) {
      self.iobs[pad].decode();
    });
  }

  routeFromInput() {
    const self = this;
    pads.forEach(function([pin, tile, style, pad]) {
      self.iobs[pad].routeFromInput();
    });
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

  render(ctx) {
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
class Iob {
  constructor(pin, tile, style, pad) {
    this.pin = pin;
    this.tile = tile;
    this.style = style;
    this.pad = pad;

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
    }
    else if (this.tmode == 'TRI')
    {
      // tri-state
      // CHECKME.
      if (this.levels['T'])
        return 2;
      else
        return this.levels['O'];
    }
    else
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
    this.destList.forEach(function(dest)
    {
      propagateLevel(dest, levels['I']);
    });
  }

  startDecode() {
    this.data = [];
    this.muxo = 0; // Mux bits converted to binary
    this.muxk = 0;
    this.muxt = 0;
    this.latch = 0; // Pad/latch (Q) bit. Note that the PAD state is not visible in the bitstream.
    this.label = "";
    this.tmode = ""; // Or ON or TRI
  }

  /**
   * Create the specified pip.
   * The name row and column are substituted into the pip.
   * Returns G coordinate, screen X coordinate, screen Y
   * Also fills in IobDecoders.gToName and IobDecoders.nameToG
   *
   * The goal of all this is to generate the pips as conveniently as possible, taking advantage of patterns rather than
   * making a giant hard-coded list. There are many complications that make this difficult.
   * The idea is we define the location of each pip by its column and row.
   * To take advantage of repeating tiles, we put a ? in the location, which is replaced with the current
   * row or column from the tile.
   *
   * One complication is the pip's name is e.g. "row.A.local.4:PAD12.I". Either the row or the column is
   * discarded and the pad name is put at the end, depending on if the pip is on a vertical or horizontal line.
   * We indicate this with the first character of the name (| or -) so we know whether to use the column or row.
   * Another complication is some pips put the pad first such as "PAD46.I:HA.B", "PAD17.O:AH.X", "PAD1.O:CLK.AA.O".
   * Confusingly, HB.C:PAD43.I, HF.X:PAD34.O, HE.D:PAD37.I, AA.A:PAD1.I, AF.A:PAD11.I.
   * The pattern is not entirely clear, but seems to depend on if the pad is on the same side as clb bin. It seems that:
   * xx.A has the pad first along the top edge
   * xx.B has the pad first along the top edge (but also P24 which doesn't quite fit)
   * xx.D has the pad first along the bottom edge
   * xx.D has the pad always second.
   * xx.X has the pad first along the right edge
   * xx.Y has the pad first along the right edge
   * For these, we give up on trying to generate the name here. The caller gives the output name as the last two parts of the name.
   */
  static processIobPip(pip, name, pad) {
    let dir;
    let parts;
    if (pip[0] == '-' || pip[0] == '|') {
      dir = pip[0];
      parts = pip.substring(1).split(":");
    } else {
      parts = pip.split(":");
      if (parts.length != 4) {
        throw "Bad name, no direction " + pip;
      }
      dir = 'hardcoded';
    }
    let pipname;
    parts[0] = parts[0].replace('?', name[1]);
    parts[1] = parts[1].replace('?', name[0]);
    if (dir == '|') {
      // parts[0] = parts[0].replace('col.?', 'col.' + name[1]);
      pipname = parts[1] + ':' + pad;
    } else if (dir == '-') {
      // parts[1] = parts[1].replace('row.?', 'row.' + name[0]);
      pipname = parts[0] + ':' + pad;
    } else {
      // Hardcoded name
      pipname = parts[2] + ":" + parts[3];
    }
    let col = colInfo[parts[0]];
    let row = rowInfo[parts[1]];
    if (col == undefined) {
      console.log('Bad Iob', name, pip, 'col', parts[0], "->", col, ";", parts[1], "->", row);
      return [];
    }
    if (row == undefined) {
      console.log('Bad Iob', name, pip, 'col', parts[0], "->", col, ";", parts[1], "->", row);
      return [];
    }
    let gCoord = col[0] + "G" + row[0];
    IobDecoders.gToName[gCoord] = pipname;
    IobDecoders.nameToG[pipname] = gCoord;
    return [gCoord, col[1], row[1], pipname, false];
  }

  /**
   * This code renders the pips associated with a particular pad.
   * This code hard-wires the pip coordinates for a class of pad, using a special syntax.
   * For example, a pip may be at the intersection of wires col.?.x and row.A.local.1, where ? is replaced with the pad's column letter.
   * The code then looks at the bitstream data, decodes the mux, and determines which pips to highlight.
   * (Non-muxed pips, i.e. for the input, are handled separately in the generic pip code.)
   * Also initializes x0, y0, W, H.
   *
   * This is kind of a mess of special cases.
   * First, IOBs are different on the top, bottom, left, and right.
   * Next, each side has two types of IOBs: on the top and bottom, alternating IOBs have "arms" that go left or right.
   * On the left and right, alternating IOBs have "arms" that go upper or lower.
   * Next, the corners are special cases as far as layout.
   * Finally, the clock .K mux are defined only for IOBs P9, P27, P59, and P24.
   * (The IOBs associated with the clock mux are arbitrarily defined by the XC2064-def.txt file and are not defined that way in the LCA files.
   * In particular P9.K is nowhere near P9. It would probably be better to pull those out of the IOBs and make them independent muxes.)
   */
  generateIobPips(pin, tile, direction, pad) {
      let kin = [];
      let k = [];
      let o = [];
      let i = [];
      let t = [];
      let kmux = undefined;
      let omux = undefined;
      let tmux = undefined;
      let xoff = 0;
      let yoff = 0;
      this.label = "";
      if (direction == "topleft" && tile == 'AA') {
        // This corner IOB is a special case.
        this.W = 20;
        this.H = 12;
        xoff = -8;
        yoff = 4;
        kin = ["|col.?.io3:row.A.local.0"];
        o = ["col.?.io3:CLK.AA.O:" + pad + ".O" + ":CLK.AA.O"];
        o.push( "|col.?.io3:row.A.long.2", "|col.?.io3:row.A.local.2", "|col.?.io3:row.A.local.4", "-col.A.long.3:row.?.local.5",
              "-col.A.local.3:row.?.local.5", "-col.A.local.1:row.?.local.5", "-col.A.long.2:row.?.local.5");
        i = ["|col.?.x:row.A.local.1", "|col.?.x:row.A.local.3", "|col.?.x:row.A.long.3",
          "-col.A.io2:row.?.io5", "-col.A.long.4:row.?.io5",
          "-col.A.local.4:row.?.io5", "-col.A.local.2:row.?.io5",
          "-col.A.long.2:row.?.io5" ];
        i.push("col.?.clb:row.A.io2:" + tile + ".A:" + pad + ".I"); // special case
        i.push("col.A.x:AA.B:" + tile + ".B:" + pad + ".I"); // special case
        t = [ "|col.?.clbl1:row.A.long.2", "|col.?.clbl1:row.A.local.1", "|col.?.clbl1:row.A.local.3", "|col.?.clbl1:row.A.long.3"];
        if (this.muxt & 1) {
          this.tmode = "TRI";
          tmux = {3: 0, 1: 1, 7: 2, 5: 3}[this.muxt];
        } else if (this.muxt == 4) {
          this.tmode = "";
        } else if (this.muxt == 6) {
          this.tmode = "ON";
        } else {
          assert(false, "Unexpected muxt " + this.muxt);
        }
        // tree of muxes: bit 16 low selects inputs 0, 7; bit 8 low selects 1, 5; bit 4 low selects 2, 4;
        // bit 2 *high* selects 3, 6. Bit 1 selects one of the pair.
        omux = {12: 0, 20: 1, 25: 2, 30: 3, 24: 4, 21: 5, 31: 6, 13: 7}[this.muxo];
      } else if (direction == "topleft") {
        // Left-facing IOB along the top
        this.W = 20;
        this.H = 12;
        xoff = -8;
        yoff = 4;
        kin = ["|col.?.x:row.A.local.0"];
        o = ["|col.?.x:row.A.long.2", "|col.?.x:row.A.local.2", "|col.?.x:row.A.local.4",
              "-col.?.long.1:row.A.io3", "-col.?.local.3:row.A.io3", "-col.?.local.1:row.A.io3"];
        i = ["|col.?.clbl2:row.A.local.1", "|col.?.clbl2:row.A.local.3", "|col.?.clbl2:row.A.long.3",
              "-col.?.long.2:row.A.io4", "-col.?.local.5:row.A.io4", "-col.?.local.4:row.A.io4",
              "-col.?.local.2:row.A.io4"];
        i.push("col.?.clb:row.A.io2:A" + tile[1] + ".A:" + pad + ".I"); // special case
        i.push("col.?.x:AJ.X:" + pad + ".I:" + tile + ".B");
        t = [ "|col.?.clbl1:row.A.long.2", "|col.?.clbl1:row.A.local.1", "|col.?.clbl1:row.A.local.3", "|col.?.clbl1:row.A.long.3"];
        if (this.muxt & 1) {
          this.tmode = "TRI";
          tmux = {3: 0, 1: 1, 7: 2, 5: 3}[this.muxt];
        } else if (this.muxt == 4) {
          this.tmode = "";
        } else if (this.muxt == 6) {
          this.tmode = "ON";
        } else {
          console.log(this);
          assert(false, "Unexpected muxt " + this.muxt);
        }
        // Standard mux: 2-bit active high, other bits active low, 1-bit toggles.
        omux = {4: 0, 9: 1, 14: 2, 8: 3, 5: 4, 15: 5}[this.muxo];
      } else if (direction == "topright" && tile == "AK") {
        // Special-case
        this.W = 20;
        this.H = 12;
        xoff = -3;
        yoff = 4;
        kin = ["|col.?.clbw1:row.A.local.0"];
        o = [ "|col.?.clbw1:row.A.local.1", "|col.?.clbw1:row.A.local.3", "|col.?.clbw1:row.A.long.3",
              "-col.J.clbr3:row.?.io3:AJ.X:" + pad + ".O",
              "-col.K.long.1:row.?.io3", "-col.K.local.1:row.?.io3", "-col.K.local.3:row.?.io3", "-col.K.long.3:row.?.io3",];
        i = [ "|col.?.clbw2:row.A.long.2", "|col.?.clbw2:row.A.local.2", "|col.?.clbw2:row.A.local.4",
              "-col.K.long.2:row.?.io2", "-col.K.local.2:row.?.io2", "-col.K.local.4:row.?.io2", "-col.K.long.3:row.?.io2"];
        t = [ "|col.?.clbw3:row.A.long.2", "|col.?.clbw3:row.A.local.1", "|col.?.clbw3:row.A.local.3", "|col.?.clbw3:row.A.long.3",];
        if (this.muxt & 1) {
          this.tmode = "TRI";
          tmux = {3: 0, 1: 1, 7: 2, 5: 3}[this.muxt];
        } else if (this.muxt == 6) {
          this.tmode = "";
        } else if (this.muxt == 4) {
          this.tmode = "ON";
        } else {
          assert(false, "Unexpected muxt " + this.muxt);
        }
        omux = {13: 0, 10: 1, 11: 2, 12: 3, 30: 4, 6: 5, 7: 6, 31: 7}[this.muxo];
      } else if (direction == "topright") {
        // Right-facing IOB along the top
        this.W = 20;
        this.H = 12;
        xoff = -3;
        yoff = 4;
        kin = ["|col.?.clbw1:row.A.local.0"];
        o = [ "|col.?.clbw1:row.A.local.1", "|col.?.clbw1:row.A.local.3", "|col.?.clbw1:row.A.long.3",
              "-col.?.clbw3:row.A.io2", "-col.?.local.2:row.A.io2", "-col.?.local.4:row.A.io2", "-col.?.local.5:row.A.io2",
              "-col.?.long.2:row.A.io2"];
        i = [ "|col.?.clbw2:row.A.long.2", "|col.?.clbw2:row.A.local.2", "|col.?.clbw2:row.A.local.4",
"-col.?.local.1:row.A.local.5", "-col.?.local.3:row.A.local.5", "-col.?.long.1:row.A.local.5",];
        t = [ "|col.?.clbw3:row.A.long.2", "|col.?.clbw3:row.A.local.1", "|col.?.clbw3:row.A.local.3", "|col.?.clbw3:row.A.long.3",];
        if (this.muxt & 1) {
          this.tmode = "TRI";
          tmux = {3: 0, 1: 1, 7: 2, 5: 3}[this.muxt];
        } else if (this.muxt == 6) {
          this.tmode = "";
        } else if (this.muxt == 4) {
          this.tmode = "ON";
        } else {
          console.log(this);
          assert(false, "Unexpected muxt " + this.muxt);
        }
        // Standard mux with 16-bit active-one, others active-zero, 1-bit the toggle.
        omux = {13: 0, 10: 1, 11: 2, 12: 3, 30: 4, 6: 5, 7: 6, 31: 7}[this.muxo];
      } else if (direction == "rightlower") {
        this.W = 12;
        this.H = 26;
        xoff = -16;
        yoff = -12;
        kin = [ "-col.K.local.5:row.?.io1"];
        t = [ "-col.K.long.3:row.?.io1", "-col.K.local.4:row.?.io1", "-col.K.local.2:row.?.io1", "-col.K.long.2:row.?.io1"];
        i = [ "-col.K.long.3:row.?.io2", "-col.K.local.3:row.?.io2", "-col.K.local.1:row.?.io2", "-col.K.long.1:row.?.io2",
          "|col.K.io1:row.?.local.3", "|col.K.io1:row.?.local.5"];
        o = [ "-col.K.local.4:row.?.io3", "-col.K.local.2:row.?.io3", "-col.K.long.2:row.?.io3",
"|col.K.io2:row.?.local.1", "|col.K.io2:row.?.local.4", "|col.K.io2:row.?.long.1",];
        // Annoying special case. The X and Y connections are to e.g. AH while everything else is in the BH tile.
        let prevRow = String.fromCharCode(tile.charCodeAt(0) - 1);
        o.push("col.K.io2:" + prevRow + "H.B:" + pad + ".O:" + prevRow + "H.X");
        o.push("col.K.io2:" + prevRow + "H.Y:" + pad + ".O:" + prevRow + "H.Y");
        if (this.muxt & 1) {
          this.tmode = "TRI";
          tmux = {3: 0, 5: 1, 1: 2, 7: 3}[this.muxt];
        } else if (this.muxt == 6) {
          this.tmode = "";
        } else if (this.muxt == 4) {
          this.tmode = "ON";
        } else {
          assert(false, "Unexpected muxt " + this.muxt);
        }
        // Standard mux: 2-bit active high, other bits active low, 1-bit toggles.
        omux = {6: 0, 30: 1, 20: 2, 21: 3, 19: 4, 18: 5, 7: 6, 31: 7}[this.muxo];
      } else if (direction == "rightupper") {
        this.W = 12;
        this.H = 26;
        xoff = -16;
        yoff = -12
        kin = [ "-col.K.local.5:row.?.io4"];
        t = [ "-col.K.long.3:row.?.io4", "-col.K.local.4:row.?.io4", "-col.K.local.2:row.?.io4", "-col.K.long.2:row.?.io4",];
        i = [ "-col.K.local.4:row.?.io5", "-col.K.local.2:row.?.io5", "-col.K.long.2:row.?.io5",
           "|col.K.io3:row.?.long.1", "|col.K.io3:row.?.local.4", "|col.K.io3:row.?.local.1",];
        o = [ "-col.K.long.3:row.?.io6", "-col.K.local.3:row.?.io6", "-col.K.local.1:row.?.io6", "-col.K.long.1:row.?.io6",
          "|col.K.local.0:row.?.local.5", "|col.K.local.0:row.?.local.3", "col.K.local.0:?H.B:|col.K.local.0:?H.X", "|col.K.local.0:?H.Y"]
        if (this.muxt & 1) {
          this.tmode = "TRI";
          tmux = {5: 0, 3: 1, 7: 2, 1: 3}[this.muxt];
        } else if (this.muxt == 6) {
          this.tmode = "";
        } else if (this.muxt == 4) {
          this.tmode = "ON";
        } else {
          assert(false, "Unexpected muxt " + this.muxt);
        }
        // Standard mux: 2-bit active high, other bits active low, 1-bit toggles.
        omux = {31: 0, 25: 1, 21: 2, 13: 3, 12: 4, 24: 5, 20: 6, 30: 7}[this.muxo];
      } else if (direction == "bottomright" && tile == "KK") { // P43
        this.W = 20;
        this.H = 12;
        xoff = -4;
        yoff = -16
        kin = [ "|col.?.clbw1:row.K.local.5"];
        o = [ "|col.?.clbw1:row.K.clk", "|col.?.clbw1:row.K.local.4", "|col.?.clbw1:row.K.local.2", "|col.?.clbw1:row.K.long.1",
              "-col.?.long.2:row.K.io2", "-col.?.local.2:row.K.io2", "-col.?.local.4:row.K.io2", "-col.?.long.3:row.K.io2",]
        o.push("col.?.clbw3:row.K.io2:JJ.X:PAD30.O");
        i = [ "|col.?.clbw2:row.K.long.2", "|col.?.clbw2:row.K.local.3", "|col.?.clbw2:row.K.local.1",
            "-col.?.io1:row.K.io3:CLK.KK.O:PAD30.I",
            "-col.?.long.1:row.K.io3", "-col.?.local.1:row.K.io3", "-col.?.local.3:row.K.io3", "-col.?.long.3:row.K.io3",];
        t = [ "|col.?.clbw3:row.K.long.2", "|col.?.clbw3:row.K.local.4", "|col.?.clbw3:row.K.local.2", "|col.?.clbw3:row.K.long.1",];
        if (this.muxt & 1) {
          this.tmode = "TRI";
          tmux = {3: 0, 1: 1, 7: 2, 5: 3}[this.muxt];
        } else if (this.muxt == 6) {
          this.tmode = "";
        } else if (this.muxt == 4) {
          this.tmode = "ON";
        } else {
          assert(false, "Unexpected muxt " + this.muxt);
        }
        // Standard mux: 2-bit active high, other bits active low, 1-bit toggles.
        omux = {14: 0, 45: 1, 42: 2, 43: 3, 39: 4, 62: 5, 38: 6, 63: 7, 44: 8}[this.muxo];
      } else if (direction == "bottomright") {
        this.W = 20;
        this.H = 12;
        xoff = -4;
        yoff = -16
        kin = [ "|col.?.clbw1:row.K.local.5"];
        o = [ "|col.?.clbw1:row.K.local.4", "|col.?.clbw1:row.K.local.2", "|col.?.clbw1:row.K.long.1",
            "-col.?.local.2:row.K.io3", "-col.?.local.4:row.K.io3", "-col.?.local.5:row.K.io3", "-col.?.long.2:row.K.io3",];
        let prevRow = String.fromCharCode(tile.charCodeAt(0) - 1);
        let prevCol = String.fromCharCode(tile.charCodeAt(1) - 1);
        o.push("col.?.clbw3:row.K.io3:" + prevRow + prevCol + ".X:" +pad + ".O"); // Hardwire this tricky case
"",
        i = [ "|col.?.clbw2:row.K.long.2", "|col.?.clbw2:row.K.local.3", "|col.?.clbw2:row.K.local.1",
        "-col.?.local.1:row.K.io4", "-col.?.local.3:row.K.io4", "-col.?.long.1:row.K.io4",];
"",
        t = [ "|col.?.clbw3:row.K.long.2", "|col.?.clbw3:row.K.local.4", "|col.?.clbw3:row.K.local.2", "|col.?.clbw3:row.K.long.1",];
        if (this.muxt & 1) {
          this.tmode = "TRI";
          tmux = {3: 0, 1: 1, 7: 2, 5: 3}[this.muxt];
        } else if (this.muxt == 6) {
          this.tmode = "";
        } else if (this.muxt == 4) {
          this.tmode = "ON";
        } else {
          assert(false, "Unexpected muxt " + this.muxt);
        }
        // Standard mux: 2-bit active high, other bits active low, 1-bit toggles.
        omux = {13: 0, 10: 1, 11: 2, 30: 3, 6: 4, 7: 5, 31: 6, 12: 7}[this.muxo];
      } else if (direction == "bottomleft" && tile == "KA") { // P27
        this.W = 20;
        this.H = 12;
        xoff = -8;
        yoff = -16
        kin = [ "|col.?.io3:row.K.local.5",];
        o = [ "|col.?.io3:row.K.long.2", "|col.?.io3:row.K.local.3", "|col.?.io3:row.K.local.1",
          "-col.A.long.3:row.?.io2",
          "-col.A.local.3:row.?.io2", "-col.A.local.1:row.?.io2", "-col.A.long.2:row.?.io2",];
        i = [ "|col.?.x:row.K.local.4", "|col.?.x:row.K.local.2", "|col.?.x:row.K.long.1",
          "-col.A.long.4:row.?.io1", "-col.A.local.4:row.?.io1", "-col.A.local.2:row.?.io1", "-col.A.long.2:row.?.io1",];
        i.push("col.?.clb:row.K.io2:H" + tile[1] + ".D:" + pad + ".I"); // special case
        i.push("col.?.x:JJ.C:H" + tile[1] + ".C:" + pad + ".I"); // special case
        // i.push("col.?.clb:row.K.io2"); // special case
        t = [ "|col.?.clbl1:row.K.long.2", "|col.?.clbl1:row.K.local.4", "|col.?.clbl1:row.K.local.2", "|col.?.clbl1:row.K.long.1",];
        if (this.muxt & 1) {
          this.tmode = "TRI";
          tmux = {3: 0, 1: 1, 7: 2, 5: 3}[this.muxt];
        } else if (this.muxt == 4) {
          this.tmode = "";
        } else if (this.muxt == 6) {
          this.tmode = "ON";
        } else {
          assert(false, "Unexpected muxt " + this.muxt);
        }
        // Standard mux: 2-bit active high, other bits active low, 1-bit toggles.
        omux = {20: 0, 25: 1, 30: 2, 24: 3, 21: 4, 31: 5, 12: 6}[this.muxo];
      } else if (direction == "bottomleft") {
        this.W = 20;
        this.H = 12;
        xoff = -8;
        yoff = -16
        kin = [ "|col.?.x:row.K.local.5",];
        o = [ "|col.?.x:row.K.long.2", "|col.?.x:row.K.local.3", "|col.?.x:row.K.local.1",
          "-col.?.long.1:row.K.io2", "-col.?.local.3:row.K.io2", "-col.?.local.1:row.K.io2",
        ];
        i = [ "|col.?.clbl2:row.K.local.4", "|col.?.clbl2:row.K.local.2", "|col.?.clbl2:row.K.long.1",
        "-col.?.long.2:row.K.io1", "-col.?.local.5:row.K.io1", "-col.?.local.4:row.K.io1", "-col.?.local.2:row.K.io1",
        "-H?.D:row.K.io2"];
        i.push("?H.D:row.K.io2:H" + tile[1] + ".D:" + pad + ".I"); // special case
        i.push("col.?.x:JJ.C:H" + tile[1] + ".C:" + pad + ".I"); // special case
        t = [ "|col.?.clbl1:row.K.long.2", "|col.?.clbl1:row.K.local.4", "|col.?.clbl1:row.K.local.2", "|col.?.clbl1:row.K.long.1",];
        if (this.muxt & 1) {
          this.tmode = "TRI";
          tmux = {3: 0, 1: 1, 7: 2, 5: 3}[this.muxt];
        } else if (this.muxt == 4) {
          this.tmode = "";
        } else if (this.muxt == 6) {
          this.tmode = "ON";
        } else {
          assert(false, "Unexpected muxt " + this.muxt);
        }
        // Standard mux: 2-bit active high, other bits active low, 1-bit toggles.
        omux = {4: 0, 9: 1, 14: 2, 8: 3, 5: 4, 15: 5}[this.muxo];
      } else if (direction == "leftupper") {
        this.W = 12;
        this.H = 26;
        xoff = 4;
        yoff = -12;
        kin = [ "-col.A.local.0:row.?.io4",];
        t = [ "-col.A.long.2:row.?.io4", "-col.A.local.1:row.?.io4", "-col.A.local.3:row.?.io4", "-col.A.long.3:row.?.io4",];
        i = [ "-col.A.long.2:row.?.io5", "-col.A.local.1:row.?.io5", "-col.A.local.3:row.?.io5", "-col.A.long.3:row.?.io5",
        "|col.A.local.5:row.?.local.5",];
        o = [ "-col.A.local.2:row.?.io6", "-col.A.local.4:row.?.io6", "-col.A.long.4:row.?.io6",
          "|col.A.io1:row.?.long.1", "|col.A.io1:row.?.local.4", "|col.A.io1:row.?.local.1",];
        if (tile == "JA") {
          // P24 special case
          i.push("col.A.io3:JA.B:" + pad + ".I:JA.B");
        }
        if (!(this.muxt & 1)) {
          this.tmode = "TRI";
          tmux = {6: 0, 0: 1, 4: 2, 2: 3}[this.muxt];
        } else if (this.muxt == 5) {
          this.tmode = "";
        } else if (this.muxt == 7) {
          this.tmode = "ON";
        } else {
          assert(false, "Unexpected muxt " + this.muxt);
        }
        // Standard mux: 2-bit active high, other bits active low, 1-bit toggles.
        omux = {4: 0, 8: 1, 14: 2, 5: 3, 9: 4, 15: 5}[this.muxo];
      } else if (direction == "leftlower") { 
        this.W = 12;
        this.H = 26;
        xoff = 4;
        yoff = -12;
        kin = [ "-col.A.local.0:row.?.io1",];
        t = [ "-col.A.long.2:row.?.io1", "-col.A.local.1:row.?.io1", "-col.A.local.3:row.?.io1", "-col.A.long.3:row.?.io1",];
        i = [ "-col.A.local.2:row.?.io2", "-col.A.local.4:row.?.io2", "-col.A.long.4:row.?.io2", "-col.A.io2:row.?.io2",
          "|col.A.io3:row.?.local.4", "|col.A.io3:row.?.long.1",];
        o = [ "-col.A.long.2:row.?.io3", "-col.A.local.1:row.?.io3", "-col.A.local.3:row.?.io3", "-col.A.long.3:row.?.io3",
          "|col.A.io2:row.?.local.3", "|col.A.io2:row.?.local.5"];
        // Annoying special case to deal with connection to above tile.
        let prevRow = String.fromCharCode(tile.charCodeAt(0) - 1);
        i.push("col.A.io3:" + prevRow + "A.B:" + pad + ".I:" + prevRow + "A.B");
        if (!(this.muxt & 1)) {
          this.tmode = "TRI";
          tmux = {6: 0, 0: 1, 4: 2, 2: 3}[this.muxt];
        } else if (this.muxt == 5) {
          this.tmode = "";
        } else if (this.muxt == 7) {
          this.tmode = "ON";
        } else {
          assert(false, "Unexpected muxt " + this.muxt);
        }
        // Standard mux: 2-bit active high, other bits active low, 1-bit toggles.
        omux = {5: 0, 3: 1, 15: 2, 4: 3, 2: 4, 14:5}[this.muxo];
      } else { 
        return;
      }

      // Handle the four clock muxes, one for each side. The pips are in the top right and bottom left.
      if (pin == "P11") {
        k = ["|col.K.local.0:CLK.AA.O", "|col.K.local.0:row.A.local.1", "|col.K.local.0:row.A.local.2",
             "|col.K.local.0:row.A.local.3", "|col.K.local.0:row.A.local.4",
             "|col.K.local.0:row.A.long.3" ]; // The clock pips in the upper right, an unexpected location for this IOB.
        kmux = {4: 0, 8: 1, 15: 2, 14: 3, 9: 4, 5: 5}[this.muxk]; // K input selected
      } else if (pin == "P30") {
        k = ["|col.A.local.1:row.K.local.0", "|col.A.local.2:row.K.local.0", "|col.A.local.3:row.K.local.0",
             "|col.A.local.4:row.K.local.0", "|col.A.long.3:row.K.local.0",
             "|col.A.clk:row.K.local.0" ];
        kmux = {4: 1, 2: 5, 15: 4, 14: 3, 9: 0, 5: 2}[this.muxk]; // K input selected
      } else if (pin == "P33") {
        k = ["|col.A.local.5:row.K.io4", "|col.A.local.5:row.K.long.1", "|col.A.local.5:row.K.local.1",
             "|col.A.local.5:row.K.local.2", "|col.A.local.5:row.K.local.3",
             "|col.A.local.5:row.K.local.4" ];
        kmux = {4: 2, 8: 4, 15: 5, 14: 0, 2: 1, 3: 3}[this.muxk]; // K input selected
      } else if (pin == "P73") {
        k = ["|col.K.io3:row.A.local.5", "|col.K.long.2:row.A.local.5", "|col.K.local.1:row.A.local.5",
             "|col.K.local.2:row.A.local.5", "|col.K.local.3:row.A.local.5",
             "|col.K.local.4:row.A.local.5" ];
        kmux = {4: 0, 8: 1, 15: 4, 14: 3, 9: 2, 5: 5}[this.muxk]; // K input selected
        // k = ["|col.K.io3:row.A.local.5"]; // The clock pips in the upper right, an unexpected location for this IOB.
      }
      // Convert all the pip configuration data to pips.
      this.kinpips = []; // The input pip for each IOB
      this.kpips = []; // Special corner pip selected by k mux
      this.opips = [];
      this.ipips = [];
      this.tpips = [];
      kin.forEach(p => this.kinpips.push(Iob.processIobPip(p, tile, pad + ".K")));
      k.forEach(p => this.kpips.push(Iob.processIobPip(p, tile, pad + ".K")));
      o.forEach(p => this.opips.push(Iob.processIobPip(p, tile, pad + ".O")));
      i.forEach(p => this.ipips.push(Iob.processIobPip(p, tile, pad + ".I")));
      t.forEach(p => this.tpips.push(Iob.processIobPip(p, tile, pad + ".T")));

      // Highlight pips that are selected by the mix
      if (tmux != undefined && tmux != null) {
        this.tpips[tmux][4] = true; // Select the appropriate pip
      }
      if (omux != undefined && omux != null) {
        this.opips[omux][4] = true; // Select the appropriate pip
      }
      if (this.kinpips && this.latch ) { // Set the clock input
        this.kinpips[0][4] = true;
      }
      if (kmux != undefined && kmux != null) {
        this.kpips[kmux][4] = true; // Select the appropriate pip
      }
      // Grab the x,y coordinates of the K pip; this is the origin for drawing the box
      this.x0 = this.kinpips[0][1] + xoff;
      this.y0 = this.kinpips[0][2] + yoff;
  }

  render(ctx) {
    if (debug) {
      ctx.strokeStyle = "white";
      ctx.beginPath();
      ctx.rect(this.x0, this.y0, this.W, this.H);
      ctx.stroke();
      ctx.fillStyle = "yellow";
      ctx.font = "5px arial";
      ctx.fillStyle = "red";
      ctx.fillText(this.info(), this.x0 - 5, this.y0);
    }
    drawPips(ctx, this.kpips, "gray");
    drawPips(ctx, this.kinpips, "gray");
    drawPips(ctx, this.opips, "blue");
    drawPips(ctx, this.ipips, "green");
    drawPips(ctx, this.tpips, "pink");
  }

  add(str, bit) {
    if (str == ".I PAD/Latched") {
      this.latch = bit;
    } else if (str == "") {
      this.muxt |= (bit << 0);
    } else {
      let m = str.match(/\.([OKT]) MuxBit: (\d+)/);
      if (m) {
        if (m[1] == 'K') {
          this.muxk |= (bit << parseInt(m[2]));
        } else if (m[1] == 'O') {
          this.muxo |= (bit << parseInt(m[2]));
        } else if (m[1] == 'T') {
          this.muxt |= (bit << parseInt(m[2]));
        } else {
          alert('Bad mux ' + str);
        }
      } else {
        alert('Bad mux2 ' + str);
      }
    }
    this.data.push(str + " " + bit);
  }

  /*
   * Finish the IOB decoding.
   */
  decode() {
    this.generateIobPips(this.pin, this.tile, this.style, this.pad);
  }

  isInside(x, y) {
    return x >= this.x0 && x < this.x0 + this.W && y >= this.y0 && y <= this.y0 + this.H;
  }

  info() {
    // return "IOB " + this.pin + " " + this.tile + " " + this.style + " " + this.pips + this.data.join(", ");
    return "o" + this.muxo + " t" + this.muxt + " k" + this.muxk + " " + (this.latch ? "Q" : "PAD") + " " + this.tmode;
  }


  // figure out connections from the IOB input
  routeFromInput()
  {
    var pathinfo = [];
    var destlist = [];

    // for pins 3/5/7/9 84/82/80/78/76: connect to A on logic block below (apips[6])
    // pin 11 connect to A and B bpips[9]
    // for pins 13/15/17/19/21/23/25/27/29: connect to B on adjacent block (8)
    // for pin 30: B on block JA
    // for pins 33/35/37/39/41 44/46/48/50/52: connect to C/D on logic block above

    //console.log(this);

    var tmp = this.ipips[0][0].split('G');
    var pathorigin = [parseInt(tmp[0]), parseInt(tmp[1])];

    if (this.style == 'topleft')
    {
      var clb = clbDecoders.get(this.tile);
      if (typeof clb != 'undefined')
      {
        if (clb.apips[6][4])
        {
          tmp = clb.apips[6][0].split('G');
          var destpip = [parseInt(tmp[0]), parseInt(tmp[1])];
          var origin = pathorigin[0]+'G'+(pathorigin[1]+3);
          var turn1 = pathorigin[0]+'G'+destpip[1];
          var turn3 = destpip[0]+'G'+(destpip[1]-2);
          var turn4 = (destpip[0]+1)+'G'+(destpip[1]-2);
          var end = (destpip[0]+1)+'G'+(destpip[1]-3);
          pathinfo.push([origin, turn1]);
          pathinfo.push([turn1, clb.apips[6][0]]);
          pathinfo.push([clb.apips[6][0], turn3]);
          pathinfo.push([turn3, turn4]);
          pathinfo.push([turn4, end]);
          destlist.push('CLB:'+clb.tile+':A');
        }

        if (clb.bpips[9][4])
        {
          tmp = clb.bpips[9][0].split('G');
          var destpip = [parseInt(tmp[0]), parseInt(tmp[1])];
          var origin = pathorigin[0]+'G'+(pathorigin[1]+3);
          var end = (destpip[0]+1)+'G'+destpip[1];
          if (this.pin == 'P11')
          {
            pathinfo.push([origin, clb.bpips[9][0]]);
            pathinfo.push([clb.bpips[9][0], end]);
          }
          else
          {
            var turn1 = pathorigin[0]+'G'+(pathorigin[1]-10);
            var turn2 = (pathorigin[0]-1)+'G'+(pathorigin[1]-10);
            pathinfo.push([origin, turn1]);
            pathinfo.push([turn1, turn2]);
            pathinfo.push([turn2, clb.bpips[9][0]]);
            pathinfo.push([clb.bpips[9][0], end]);
          }
          destlist.push('CLB:'+clb.tile+':B');
        }
      }
    }
    else if (this.style == 'leftlower')
    {
      var tile = (String.fromCharCode(this.tile.charCodeAt(0)-1)) + '' + this.tile[1];
      var clb = clbDecoders.get(tile);
      if (typeof clb != 'undefined')
      {
        if (clb.bpips[8][4])
        {
          tmp = clb.bpips[8][0].split('G');
          var destpip = [parseInt(tmp[0]), parseInt(tmp[1])];
          var origin = (pathorigin[0]-3)+'G'+pathorigin[1];
          var turn1 = (pathorigin[0]+11)+'G'+pathorigin[1];
          var end = (destpip[0]+2)+'G'+destpip[1];
          pathinfo.push([origin, turn1]);
          pathinfo.push([turn1, clb.bpips[8][0]]);
          pathinfo.push([clb.bpips[8][0], end]);
          destlist.push('CLB:'+clb.tile+':B');
        }
      }
    }
    else if (this.pin == 'P30')
    {
      var clb = clbDecoders.get(this.tile);
      if (typeof clb != 'undefined')
      {
        if (clb.bpips[8][4])
        {
          tmp = clb.bpips[8][0].split('G');
          var destpip = [parseInt(tmp[0]), parseInt(tmp[1])];
          var origin = (pathorigin[0]-3)+'G'+pathorigin[1];
          var turn1 = (pathorigin[0]+11)+'G'+pathorigin[1];
          var end = (destpip[0]+2)+'G'+destpip[1];
          pathinfo.push([origin, turn1]);
          pathinfo.push([turn1, clb.bpips[8][0]]);
          pathinfo.push([clb.bpips[8][0], end]);
          destlist.push('CLB:'+clb.tile+':B');
        }
      }
    }
    else if (this.style == 'bottomleft')
    {
      var tile = (String.fromCharCode(this.tile.charCodeAt(0)-1)) + '' + this.tile[1];
      var clb = clbDecoders.get(tile);
      if (typeof clb != 'undefined')
      {
        if (clb.cpips[7][4])
        {
          tmp = clb.cpips[7][0].split('G');
          var destpip = [parseInt(tmp[0]), parseInt(tmp[1])];
          var origin = pathorigin[0]+'G'+(pathorigin[1]-3);
          var end = (destpip[0]+1)+'G'+destpip[1];
          if (this.pin == 'P33')
          {
            pathinfo.push([origin, clb.cpips[7][0]]);
            pathinfo.push([clb.cpips[7][0], end]);
          }
          else
          {
            var turn1 = pathorigin[0]+'G'+(pathorigin[1]+10);
            var turn2 = (pathorigin[0]-1)+'G'+(pathorigin[1]+10);
            pathinfo.push([origin, turn1]);
            pathinfo.push([turn1, turn2]);
            pathinfo.push([turn2, clb.cpips[7][0]]);
            pathinfo.push([clb.cpips[7][0], end]);
          }
          destlist.push('CLB:'+clb.tile+':C');
        }
        if (clb.dpips[0][4])
        {
          tmp = clb.dpips[0][0].split('G');
          var destpip = [parseInt(tmp[0]), parseInt(tmp[1])];
          var origin = pathorigin[0]+'G'+(pathorigin[1]-3);
          var turn1 = pathorigin[0]+'G'+destpip[1];
          var end = destpip[0]+'G'+(destpip[1]+2);
          pathinfo.push([origin, turn1]);
          pathinfo.push([turn1, clb.dpips[0][0]]);
          pathinfo.push([clb.dpips[0][0], end]);
          destlist.push('CLB:'+clb.tile+':D');
        }
      }
    }

    if (this.pin == 'P11')
    {
      var clb = clbDecoders.get('CLK.AA.I');
      if (typeof clb != 'undefined')
      {
        if (clb.ipips[1][4])
        {
          tmp = clb.ipips[1][0].split('G');
          var destpip = [parseInt(tmp[0]), parseInt(tmp[1])];
          var origin = pathorigin[0]+'G'+(pathorigin[1]+3);
          var turn1 = pathorigin[0]+'G'+destpip[1];
          tmp = clb.ipips[2][0].split('G');
          var t2 = parseInt(tmp[1]);
          var turn2 = destpip[0]+'G'+t2;
          var turn3 = (destpip[0]-1)+'G'+t2;
          var turn4 = (destpip[0]-1)+'G'+(t2+1);
          pathinfo.push([origin, turn1]);
          pathinfo.push([turn1, clb.ipips[1][0]]);
          pathinfo.push([clb.ipips[1][0], turn2]);
          pathinfo.push([turn2, turn3]);
          pathinfo.push([turn3, turn4]);
          destlist.push('CLK:AA:I');
        }
      }
    }
    else if (this.pin == 'P13')
    {
      var clb = clbDecoders.get('CLK.AA.I');
      if (typeof clb != 'undefined')
      {
        if (clb.ipips[0][4])
        {
          tmp = clb.ipips[0][0].split('G');
          var destpip = [parseInt(tmp[0]), parseInt(tmp[1])];
          var origin = (pathorigin[0]-3)+'G'+pathorigin[1];
          var turn1 = destpip[0]+'G'+pathorigin[1];
          tmp = clb.ipips[2][0].split('G');
          var t2 = parseInt(tmp[1]);
          var turn2 = destpip[0]+'G'+t2;
          var turn3 = (destpip[0]-1)+'G'+t2;
          var turn4 = (destpip[0]-1)+'G'+(t2+1);
          pathinfo.push([origin, turn1]);
          pathinfo.push([turn1, clb.ipips[0][0]]);
          pathinfo.push([clb.ipips[0][0], turn2]);
          pathinfo.push([turn2, turn3]);
          pathinfo.push([turn3, turn4]);
          destlist.push('CLK:AA:I');
        }
      }
    }
    else if (this.pin == 'P53')
    {
      var clb = clbDecoders.get('CLK.KK.I');
      if (typeof clb != 'undefined')
      {
        if (clb.ipips[3][4])
        {
          tmp = clb.ipips[3][0].split('G');
          var destpip = [parseInt(tmp[0]), parseInt(tmp[1])];
          tmp = clb.ipips[0][0].split('G');
          var t2 = parseInt(tmp[1]);
          tmp = clb.ipips[6][0].split('G');
          var t3 = parseInt(tmp[0]);
          tmp = this.opips[0][0].split('G');
          var t4 = parseInt(tmp[1]);
          var origin = pathorigin[0]+'G'+(pathorigin[1]-1);
          var turn1 = pathorigin[0]+'G'+destpip[1];
          var turn2 = destpip[0]+'G'+t2;
          var turn3 = t3+'G'+t2;
          var turn4 = t3+'G'+t4;
          var turn5 = (t3-1)+'G'+t4;
          pathinfo.push([origin, turn1]);
          pathinfo.push([turn1, clb.ipips[3][0]]);
          pathinfo.push([clb.ipips[3][0], turn2]);
          pathinfo.push([turn2, turn3]);
          pathinfo.push([turn3, turn4]);
          pathinfo.push([turn4, turn5]);
          destlist.push('CLK:KK:I');
        }
      }
    }
    else if (this.pin == 'P56')
    {
      var clb = clbDecoders.get('CLK.KK.I');
      if (typeof clb != 'undefined')
      {
        if (clb.ipips[0][4])
        {
          tmp = clb.ipips[0][0].split('G');
          var destpip = [parseInt(tmp[0]), parseInt(tmp[1])];
          tmp = clb.ipips[6][0].split('G');
          var t3 = parseInt(tmp[0]);
          //tmp = iobDecoders.get('P53').opips[0][0].split('G');
          var t4 = 3;//parseInt(tmp[1]);
          var origin = pathorigin[0]+'G'+pathorigin[1];
          var turn1 = destpip[0]+'G'+pathorigin[1];
          var turn3 = t3+'G'+destpip[1];
          var turn4 = t3+'G'+t4;
          var turn5 = (t3-1)+'G'+t4;
          pathinfo.push([origin, turn1]);
          pathinfo.push([turn1, clb.ipips[0][0]]);
          pathinfo.push([clb.ipips[0][0], turn3]);
          pathinfo.push([turn3, turn4]);
          pathinfo.push([turn4, turn5]);
          destlist.push('CLK:KK:I');
        }
      }
    }


    {
      // topleft: 3- 4|
      // topright: 3- 3|
      // leftupper: 4| 1-
      // leftlower: 3| 2-
      // bottomleft: 3- 4|
      // bottomright: 3- 3|
      // rightupper: 3| 3-
      // rightlower: 4| 2-

      var cutoff;
      if (this.style == 'leftupper' || this.style == 'rightlower')
        cutoff = 4;
      else
        cutoff = 3;

      var dir1, dir2;
      if (this.style == 'topleft' || this.style == 'topright' || this.style == 'bottomleft' || this.style == 'bottomright')
      { dir1 = '-'; dir2 = '|'; }
      else
      { dir1 = '|'; dir2 = '-'; }

      // trace from all input PIPs
      for (var i = 0; i < this.ipips.length; i++)
      {
        var entry = this.ipips[i];
        var pip = pipDecoder.entries[entry[0]];
        if (typeof pip != 'undefined')
        {
          if (pip == 0)
          {
            var oldcount = pathinfo.length;

            //console.log('TRACING FROM PIP '+entry[0]);
            pipDecoder.traceFrom(entry[0], (i<cutoff)?dir1:dir2, destlist, pathinfo);
            //console.log('TRACEFROM DONE');

            if (pathinfo.length != oldcount)
            {
              // add first segments of path
              if (this.style == 'leftupper' || this.style == 'leftlower')
              {
                tmp = entry[0].split('G');
                var destpip = [parseInt(tmp[0]), parseInt(tmp[1])];
                var origin = (pathorigin[0]-(this.style=='leftlower'?3:0))+'G'+pathorigin[1];
                if (i < cutoff)
                {
                  pathinfo.push([origin, entry[0]]);
                }
                else
                {
                  var turn1 = destpip[0]+'G'+pathorigin[1];
                  pathinfo.push([origin, turn1]);
                  pathinfo.push([turn1, entry[0]]);
                }
              }
              else if (this.style == 'rightupper' || this.style == 'rightlower')
              {
                tmp = entry[0].split('G');
                var destpip = [parseInt(tmp[0]), parseInt(tmp[1])];
                var origin = (pathorigin[0]+(this.style=='rightupper'?2:0))+'G'+pathorigin[1];
                if (i < cutoff)
                {
                  pathinfo.push([origin, entry[0]]);
                }
                else
                {
                  var turn1 = destpip[0]+'G'+pathorigin[1];
                  pathinfo.push([origin, turn1]);
                  pathinfo.push([turn1, entry[0]]);
                }
              }
              else if (this.style == 'topleft' || this.style == 'topright')
              {
                tmp = entry[0].split('G');
                var destpip = [parseInt(tmp[0]), parseInt(tmp[1])];
                var origin = pathorigin[0]+'G'+(pathorigin[1]+(this.style=='topleft'?3:1));
                if (i < cutoff)
                {
                  pathinfo.push([origin, entry[0]]);
                }
                else
                {
                  var turn1 = pathorigin[0]+'G'+destpip[1];
                  pathinfo.push([origin, turn1]);
                  pathinfo.push([turn1, entry[0]]);
                }
              }
              else if (this.style == 'bottomleft' || this.style == 'bottomright')
              {
                tmp = entry[0].split('G');
                var destpip = [parseInt(tmp[0]), parseInt(tmp[1])];
                var origin = pathorigin[0]+'G'+(pathorigin[1]-(this.style=='bottomleft'?3:1));
                if (i < cutoff)
                {
                  pathinfo.push([origin, entry[0]]);
                }
                else
                {
                  var turn1 = pathorigin[0]+'G'+destpip[1];
                  pathinfo.push([origin, turn1]);
                  pathinfo.push([turn1, entry[0]]);
                }
              }
            }
          }
        }
      }
    }

    //console.log("ROUTE DONE");
    //console.log(pathinfo);
    //console.log(destlist);

    this.startPoint = 'IOB:'+this.pin+':I';
    this.pathInfo = pathinfo;
    this.destList = destlist;
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
