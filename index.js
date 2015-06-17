/*!
 *
 * popcorn - let's do this!
 * ------------------------
 */
 
var Arrangement = {
    lead: {
        notes:   [
            [2, 2, 0,    0, 2, null, -3, -3, -7,   -7, -3, -3, -10,  -10, null, null],
            [2, 2, 0,    0, 2, null, -3, -3, -7,   -7, -3, -3, -10,  -10, null, null],
            [2, 2, 4, null, 5, null,  4,  4,  5, null,  2,  2,   4, null,    2,    2],
            [4, 4, 0,    0, 2,    2,  0,  0, -3,   -3,  0,  0,   2,    2, null, null]
 
        ],
        measure: [
            [16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16],
            [16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16],
            [16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16],
            [16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16]
        ]
    }
};
 
var DAW = {
    constants : {
        bpm    : 120,                   // Tempo
        tuning : 440,                   // A4
        cent   : Math.pow(2, 1/12),     // ~1.059463; halfstep intervall
        tau    : 2 * Math.PI,
        bars   : (function() {          // Count bars for he sequencer
            var e, l, bars = 0;
            for (e in Arrangement) {
                if (Arrangement.hasOwnProperty(e)) {
                    l    = Arrangement[e].notes.length;
                    bars = (l > bars) ? l : bars;
                }
            }
            return bars;
        })()
    },
    state: {
        counter  : 0,
        bar      : 0,
        step     : 0,
        lastnote : null
    },
    note : function note(halfsteps, octave) {
        if(halfsteps === null) { return 0; }
        octave    = octave || 0;
        halfsteps = (octave * 12) + halfsteps;
        return DAW.constants.tuning * Math.pow(DAW.constants.cent, halfsteps);
    },
    clock : function clock(_t) {
        t  = _t;
        t *= (DAW.constants.bpm || 120) / 120;
        tt = DAW.constants.tau * t;
    },
    sequence : function sequence(measure, notes) {
        var seq = notes[DAW.state.bar];
        var pos = (t / measure / 2 | 0);
        if (DAW.state.counter === seq.length) {
            DAW.state.bar     = (DAW.state.bar + 1) % DAW.constants.bars;
            seq               = notes[DAW.state.bar];
            DAW.state.counter = 0;
            DAW.state.step    = 0;
            return notes[DAW.state.bar][notes[DAW.state.bar].length -1];
        }
        DAW.state.step = pos % seq.length;
 
 
        if (DAW.state.lastnote !== DAW.state.step) {
          DAW.state.lastnote = DAW.state.step;
          DAW.state.counter++;
        }
        return seq[DAW.state.step];
    },
};
 
var Synths = {
    arp : function arp(measure, x, y, z) {
        var ts = t / 2 % measure;
        return Math.sin(x * (Math.exp(-ts * y))) * Math.exp(-ts * z);
    },
    sin : function sin(freq, phase) {
        return Math.sin((t * freq + (2 - (phase || 0) / 2)) * DAW.constants.tau);
    },
    saw : function saw(freq) {
        return 1-2 * (t % (1 / freq)) * freq;
    },
    tri : function tri(freq) {
        return Math.abs(1 - (2 * t * freq) % 2) * 2 - 1;
    },
    sqr : function sqr(freq) {
        return Synths.sin(freq, t) > 0 ? 1 : -1;
    },
    noise : function noise() {
        return Math.random() * 2 - 1;
    }
};
 
 
// Global timer
var t, tt, ttt = 0;
 
// Reset
 
(function(){
  DAW.state = {
        counter  : 0,
        bar      : 0,
        step     : 0,
        lastnote : null
    };
})();
 
// Do eet!
function dsp(t) {
    DAW.clock(t);
 
 
    // Lead
    var lead_step = DAW.sequence(
        1 / Arrangement.lead.measure[DAW.state.bar][DAW.state.step],
        Arrangement.lead.notes
    );
    var lead_note = DAW.note(lead_step, 1);
    var lead      = Synths.sin(lead_note);
    var lead_sup  = Synths.sin(DAW.note(lead_step, 0), t/3);
 
    return 1 * (
        0.1 * lead
        + 0.01 * lead_sup
    );
}
