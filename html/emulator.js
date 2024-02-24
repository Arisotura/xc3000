
// define clock/inputs/outputs for the emulator here

// clock: divided in 8 periods
// P13 is NuBus clock with 75% duty cycle
// P11 is same clock but offset by 48ns (approximated to 50ns here)
var emuClocks = {
    'CLKIN0': {
        pins: 13,
        period: 8,
        offset: 0,
        duty: 6
    },
    'CLKIN1': {
        pins: 11,
        period: 8,
        offset: 4,
        duty: 6
    }
};

var emuInputs = {
    'AD0..23': {
        pins: [29, 28, 56, 58, 60, 62, 65, 67,
                69, 71, 76, 14, 16, 18, 20, 23,
                78, 80, 82, 84, 3, 5, 7, 9],
        invert: true,
        tri: true,
    },
    'TM0..1': {
        pins: [25, 37],
        select: ['00: write byte', '01: write h/w/b', '10: read byte', '11: read h/w/b'],
        tri: true,
    },
    'IDCHK': {
        pins: 27,
    },
    'START': {
        pins: 26,
    },
    /*'ACK': {
        pins: 40,
        dummy: 1,
    },*/
    'P2': {
        pins: 2,
    },
    'P51': {
        pins: 51,
    },
    'P52': {
        pins: 52,
    },
};

var emuOutputs = {
    'CLKOUT': {
        pins: 10,
    },
    'A0..23': {
        pins: [0, 0, 57, 59, 61, 63, 66, 68,
                70, 73, 75, 15, 17, 19, 21, 24,
                77, 79, 81, 83, 0, 4, 6, 8],
    },
    'TM0..1': {
        pins: [37, 25],
    },
    'ACK': {
        pins: 40,
    },
    'BUS_AL': {
        pins: 30,
    },
    'BUS_AH': {
        pins: 39,
    },
    'BUS_DATA': {
        pins: 41,
    },
    'BUS_DIR': {
        pins: 38,
    },
    'ROM_CE': {
        pins: 45,
    },
    'TLC_RD': {
        pins: 46,
    },
    'TLC_WR': {
        pins: 47,
    },
    'MONID_CE': {
        pins: 48,
    },
    'XC3_CLK': {
        pins: 50,
    },
    'P33': {
        pins: 33,
    },
    'P34': {
        pins: 34,
    },
    'P35': {
        pins: 35,
    },
    'P36': {
        pins: 36,
    },
    'P42': {
        pins: 42,
    },
    'P44': {
        pins: 44,
    },
    'P49': {
        pins: 49,
    },
    'P53': {
        pins: 53,
    },
}


var emuDirtyList = [];
var emuUpdateList = [];

function setInputPin(pin, val)
{
    var iob = iobDecoders.getFromPin('P'+pin);
    if (typeof iob != 'undefined')
        iob.setLevel('I', val);
}

function getOutputPin(pin)
{
    var iob = iobDecoders.getFromPin('P'+pin);
    if (typeof iob != 'undefined')
        return iob.getOutput();

    return 0;
}

function propagateLevel(dest, val)
{
    var v = dest.split(':');
    var o = undefined;

    switch (v[0])
    {
    case 'IOB':
        o = iobDecoders.getFromPin(v[1]);
        break;
    case 'CLB':
        o = clbDecoders.get(v[1]);
        emuDirtyList[v[1]] = true;
        break;
    case 'CLK':
        o = clbDecoders.get('CLK.'+v[1]+'.I');
        emuDirtyList['CLK.'+v[1]+'.I'] = true;
        break;
    }

    if (typeof o != 'undefined')
        o.setLevel(v[2], val);
}

function doUpdates()
{
    var iter = 0, updtotal = 0;

    //var updIOB = iobDecoders.update();
    //updtotal += updIOB;

    for (var i = 0; i < 1000; i++)
    {
        var updlist = [];

        var updIOB = iobDecoders.update();
        updtotal += updIOB;

        // do the clocks first
        if (emuDirtyList['CLK.AA.I'] && (!emuUpdateList['CLK.AA.I']))
            updlist.push('CLK.AA.I');
        if (emuDirtyList['CLK.KK.I'] && (!emuUpdateList['CLK.KK.I']))
            updlist.push('CLK.KK.I');

        for (var j = 0; j < 10; j++)
        {
            for (var k = 0; k < 10; k++)
            {
                var v = "ABCDEFGHIJ"[j]+"ABCDEFGHIJ"[k];
                if (emuDirtyList[v] && (!emuUpdateList[v]))
                    updlist.push(v);
            }
        }

        if (updlist.length==0) break;

        updlist.forEach(function(v)
        {
            clbDecoders.get(v).update();
            emuUpdateList[v] = true;

            updtotal++;
        });

        iter++;
    }

    console.log("-- Updates done: "+iter+" iterations, "+updtotal+" updates --");
}


var emuClockData = {};
var emuInputData = {};
var emuOutputData = {};
var emuLength = 8*8;


var num = 0;

function setInputPins(info)
{
    var val = info.val;
    
    if (typeof info.pins == 'number')
    {
        if (val != 2)
        {
            if (info.invert) val = ~val;
            val &= 1;
        }
        setInputPin(info.pins, val);
    }
    else
    {
        if (val == -1)
        {
            for (var i = 0; i < info.pins.length; i++)
            {
                setInputPin(info.pins[i], 2);
            }
        }
        else
        {
            if (info.invert) val = ~val;

            for (var i = 0; i < info.pins.length; i++)
            {
                setInputPin(info.pins[i], (val>>i)&1);
            }
        }
    }
}

function getOutputPins(info)
{
    var val = 0;

    if (typeof info.pins == 'number')
    {
        val = getOutputPin(info.pins);
        if (val == 2) return val;
    }
    else
    {
        for (var i = 0; i < info.pins.length; i++)
        {
            if (info.pins[i])
            {
                var b = getOutputPin(info.pins[i]);
                if (b == 2) return -1; 
                val |= (b << i);
            }
        }
    }

    if (info.invert) val = ~val;
    return val & info.mask;
}

function emuReset()
{
    emuDirtyList = [];
    emuUpdateList = [];

    iobDecoders.reset();
    clbDecoders.reset();

    num = 0;

    Object.entries(emuClocks).forEach(function([k, v])
    {
        v.pos = v.offset;
        v.val = ((v.pos % v.period) < v.duty) ? 1:0;

        setInputPins(v);

        emuClockData[k] = [];
        emuClockData[k][0] = v.val;
    });

    Object.entries(emuInputs).forEach(function([k, v])
    {
        if (typeof v.pins == 'number')
        {
            v.mask = 1;
            v.digits = 1;
            //v.val = 2;
        }
        else
        {
            v.mask = (1<<v.pins.length)-1;
            v.digits = (v.pins.length+3)>>2;
            //v.val = -1;
        }

        if (v.tri)
        {
            if (typeof v.pins == 'number')
                v.val = 2;
            else
                v.val = -1;
        }
        else
        {
            if (v.invert)
                v.val = 0;
            else
                v.val = v.mask;
        }

        setInputPins(v);

        emuInputData[k] = [];
        emuInputData[k][0] = v.val;
    });

    doUpdates();

    Object.entries(emuOutputs).forEach(function([k, v])
    {
        if (typeof v.pins == 'number')
        {
            v.mask = 1;
            v.digits = 1;
        }
        else
        {
            v.mask = (1<<v.pins.length)-1;
            v.digits = (v.pins.length+3)>>2;
        }

        v.val = getOutputPins(v);

        emuOutputData[k] = [];
        emuOutputData[k][0] = v.val;
    });
}

function emuStep()
{
    emuDirtyList = [];
    emuUpdateList = [];

    num++;

    Object.entries(emuClocks).forEach(function([k, v])
    {
        v.pos++;
        var oldval = v.val;
        v.val = ((v.pos % v.period) < v.duty) ? 1:0;

        if (v.val != oldval)
            setInputPins(v);

        emuClockData[k][num] = v.val;
    });

    Object.entries(emuInputs).forEach(function([k, v])
    {
        if (typeof emuInputData[k][num] != 'undefined')
        {
            v.val = emuInputData[k][num];
            setInputPins(v);
        }
    });

    doUpdates();

    Object.entries(emuOutputs).forEach(function([k, v])
    {
        v.val = getOutputPins(v);
        emuOutputData[k][num] = v.val;
    });
}

function emuRun()
{
    Object.entries(emuInputs).forEach(function([k, v])
    {
        if (v.dummy) return;

        var val = v.mask;
        var elemid = 'ctrl_'+k.replaceAll('.','_');
        if (typeof v.pins == 'number')
            val = $('#'+elemid).prop('checked') ? 1:0;
        else if (typeof v.select != 'undefined')
            val = parseInt($('#'+elemid).val());
        else
            val = parseInt($('#'+elemid).val(), 16);

        if (isNaN(val)) val = 0;
        if (typeof val != 'number') val = 0;

        emuInputData[k][8*1] = val;
        emuInputData[k][8*2] = emuInputData[k][0];
    });

    for (var i = 0; i < emuLength; i++)
    {
        emuStep();
    }
}



function emuDraw(ctx)
{
    const xmargin = 80;
    const yline = 32;
    const xstep = 10;
    const numrows = Object.keys(emuClocks).length + Object.keys(emuInputs).length + Object.keys(emuOutputs).length;
    const HEIGHT = (yline * numrows) + 10;
    const WIDTH = xmargin + (xstep*emuLength);
    ctx.canvas.height = HEIGHT;
    ctx.canvas.width = WIDTH;
    $("#container").css('height', HEIGHT + 'px');
    $("#container").css('width', WIDTH + 'px');
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.lineWidth = 1;
    ctx.lineCap = 'butt';
    ctx.strokeStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(xmargin, 0);
    ctx.lineTo(xmargin, HEIGHT);
    ctx.stroke();

    ctx.strokeStyle = '#ccc';
    ctx.beginPath();
    for (var i = 2; i < emuLength; i+=2)
    {
        ctx.moveTo(xmargin+(i*xstep), 0);
        ctx.lineTo(xmargin+(i*xstep), HEIGHT);
    }
    ctx.stroke();

    var ypos = 0;

    const lvls = [yline-2, 2, yline/2];

    ctx.strokeStyle = '#800';
    ctx.fillStyle = "#c00";

    Object.entries(emuClocks).forEach(function([k, v])
    {
        ctx.font = "14px arial";
        ctx.fillText(k, 3, ypos+14+((yline-14)/2));

        ctx.beginPath();
        var oval = emuClockData[k][0];
        var opos = 0;
        for (var i = 1; i < emuLength; i++)
        {
            var nval;

            if (typeof emuClockData[k][i] == 'undefined') 
            {
                if (i < (emuLength-1))
                    continue;
                else
                    nval = oval;
            }
            else
            {
                nval = emuClockData[k][i];
                if ((nval == oval) && (i < (emuLength-1)))
                    continue;
            }

            var npos = i*xstep;
            ctx.moveTo(xmargin+opos, ypos+lvls[oval]);
            ctx.lineTo(xmargin+npos, ypos+lvls[oval]);
            ctx.lineTo(xmargin+npos, ypos+lvls[nval]);

            opos = npos;
            oval = nval;
        }
        ctx.stroke();

        ypos += yline;
    });

    ypos += 5;

    ctx.strokeStyle = '#080';
    ctx.fillStyle = "#0c0";

    Object.entries(emuInputs).forEach(function([k, v])
    {
        ctx.fillStyle = "#0c0";
        ctx.font = "14px arial";
        ctx.fillText(k, 3, ypos+14+((yline-14)/2));

        if (typeof v.pins == 'number')
        {
            ctx.beginPath();
            var oval = emuInputData[k][0];
            var opos = 0;
            for (var i = 1; i < emuLength; i++)
            {
                var nval;

                if (typeof emuInputData[k][i] == 'undefined') 
                {
                    if (i < (emuLength-1))
                        continue;
                    else
                        nval = oval;
                }
                else
                {
                    nval = emuInputData[k][i];
                    if ((nval == oval) && (i < (emuLength-1)))
                        continue;
                }

                var npos = i*xstep;
                ctx.moveTo(xmargin+opos, ypos+lvls[oval]);
                ctx.lineTo(xmargin+npos, ypos+lvls[oval]);
                ctx.lineTo(xmargin+npos, ypos+lvls[nval]);

                opos = npos;
                oval = nval;
            }
            ctx.stroke();
        }
        else
        {
            var oval = emuInputData[k][0];
            var opos = 0;
            for (var i = 1; i < emuLength; i++)
            {
                var nval;

                if (typeof emuInputData[k][i] == 'undefined') 
                {
                    if (i < (emuLength-1))
                        continue;
                    else
                        nval = oval;
                }
                else
                {
                    nval = emuInputData[k][i];
                    if ((nval == oval) && (i < (emuLength-1)))
                        continue;
                }

                var npos = i*xstep;
                ctx.beginPath();
                ctx.moveTo(xmargin+opos, ypos+yline-4);
                ctx.lineTo(xmargin+npos, ypos+yline-4);
                ctx.lineTo(xmargin+npos, ypos+4);
                ctx.lineTo(xmargin+opos, ypos+4);
                ctx.stroke();

                ctx.font = "12px arial";
                ctx.fillStyle = '#080';
                var vallbl;
                if (oval == -1)
                    vallbl = ''.padStart(v.digits, 'x');
                else
                    vallbl = oval.toString(16).padStart(v.digits, '0').toUpperCase();
                ctx.fillText(vallbl, xmargin+opos+2, ypos+12+((yline-12)/2));

                opos = npos;
                oval = nval;
            }
        }

        ypos += yline;
    });

    ypos += 5;

    ctx.strokeStyle = '#008';
    ctx.fillStyle = "#00c";

    Object.entries(emuOutputs).forEach(function([k, v])
    {
        ctx.fillStyle = "#00c";
        ctx.font = "14px arial";
        ctx.fillText(k, 3, ypos+14+((yline-14)/2));

        if (typeof v.pins == 'number')
        {
            ctx.beginPath();
            var oval = emuOutputData[k][0];
            var opos = 0;
            for (var i = 1; i < emuLength; i++)
            {
                var nval;

                if (typeof emuOutputData[k][i] == 'undefined') 
                {
                    if (i < (emuLength-1))
                        continue;
                    else
                        nval = oval;
                }
                else
                {
                    nval = emuOutputData[k][i];
                    if ((nval == oval) && (i < (emuLength-1)))
                        continue;
                }

                var npos = i*xstep;
                ctx.moveTo(xmargin+opos, ypos+lvls[oval]);
                ctx.lineTo(xmargin+npos, ypos+lvls[oval]);
                ctx.lineTo(xmargin+npos, ypos+lvls[nval]);

                opos = npos;
                oval = nval;
            }
            ctx.stroke();
        }
        else
        {
            var oval = emuOutputData[k][0];
            var opos = 0;
            for (var i = 1; i < emuLength; i++)
            {
                var nval;

                if (typeof emuOutputData[k][i] == 'undefined') 
                {
                    if (i < (emuLength-1))
                        continue;
                    else
                        nval = oval;
                }
                else
                {
                    nval = emuOutputData[k][i];
                    if ((nval == oval) && (i < (emuLength-1)))
                        continue;
                }

                var npos = i*xstep;
                ctx.beginPath();
                ctx.moveTo(xmargin+opos, ypos+yline-4);
                ctx.lineTo(xmargin+npos, ypos+yline-4);
                ctx.lineTo(xmargin+npos, ypos+4);
                ctx.lineTo(xmargin+opos, ypos+4);
                ctx.stroke();

                ctx.font = "12px arial";
                ctx.fillStyle = '#008';
                var vallbl;
                if (oval == -1)
                    vallbl = ''.padStart(v.digits, 'x');
                else
                    vallbl = oval.toString(16).padStart(v.digits, '0').toUpperCase();
                ctx.fillText(vallbl, xmargin+opos+2, ypos+12+((yline-12)/2));

                opos = npos;
                oval = nval;
            }
        }

        ypos += yline;
    });
}
 
