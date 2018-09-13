//
//  W65C02S processor implementation in ECMAScript 6
//
//  Copyright 2018, John Clark
//
//  Released under the GNU General Public License
//  https://www.gnu.org/licenses/gpl.html
//
//  ref: http://www.wdesignc.com/wdc/documentation/w65c02s.pdf
//       http://www.6502.org/tutorials/vflag_html
//


// 17 address modes
//             1     2     3     4     5     6     7     8     9a   9b     10    11    12    13    14    15    16
//            abs ,absxi, absx, absy, absi, acum, imm , imp , rel ,zprel, rels,  zp , zpxi, zpx,  zpy , zpi , zpiy
const opdef = [
    [ "adc" , 0x6d,     , 0x7d, 0x79,     ,     , 0x69,     ,     ,     ,     , 0x65, 0x61, 0x75,     , 0x72, 0x71 ],
    [ "and" , 0x2d,     , 0x3d, 0x39,     ,     , 0x29,     ,     ,     ,     , 0x25, 0x21, 0x35,     , 0x32, 0x31 ],
    [ "asl" , 0x0e,     , 0x1e,     ,     , 0x0a,     ,     ,     ,     ,     , 0x06,     , 0x16,     ,     ,      ],
    [ "bbr0",     ,     ,     ,     ,     ,     ,     ,     ,     , 0x0f,     ,     ,     ,     ,     ,     ,      ],
    [ "bbr1",     ,     ,     ,     ,     ,     ,     ,     ,     , 0x1f,     ,     ,     ,     ,     ,     ,      ],
    [ "bbr2",     ,     ,     ,     ,     ,     ,     ,     ,     , 0x2f,     ,     ,     ,     ,     ,     ,      ],
    [ "bbr3",     ,     ,     ,     ,     ,     ,     ,     ,     , 0x3f,     ,     ,     ,     ,     ,     ,      ],
    [ "bbr4",     ,     ,     ,     ,     ,     ,     ,     ,     , 0x4f,     ,     ,     ,     ,     ,     ,      ],
    [ "bbr5",     ,     ,     ,     ,     ,     ,     ,     ,     , 0x5f,     ,     ,     ,     ,     ,     ,      ],
    [ "bbr6",     ,     ,     ,     ,     ,     ,     ,     ,     , 0x6f,     ,     ,     ,     ,     ,     ,      ],
    [ "bbr7",     ,     ,     ,     ,     ,     ,     ,     ,     , 0x7f,     ,     ,     ,     ,     ,     ,      ],
    [ "bbs0",     ,     ,     ,     ,     ,     ,     ,     ,     , 0x8f,     ,     ,     ,     ,     ,     ,      ],
    [ "bbs1",     ,     ,     ,     ,     ,     ,     ,     ,     , 0x9f,     ,     ,     ,     ,     ,     ,      ],
    [ "bbs2",     ,     ,     ,     ,     ,     ,     ,     ,     , 0xaf,     ,     ,     ,     ,     ,     ,      ],
    [ "bbs3",     ,     ,     ,     ,     ,     ,     ,     ,     , 0xbf,     ,     ,     ,     ,     ,     ,      ],
    [ "bbs4",     ,     ,     ,     ,     ,     ,     ,     ,     , 0xcf,     ,     ,     ,     ,     ,     ,      ],
    [ "bbs5",     ,     ,     ,     ,     ,     ,     ,     ,     , 0xdf,     ,     ,     ,     ,     ,     ,      ],
    [ "bbs6",     ,     ,     ,     ,     ,     ,     ,     ,     , 0xef,     ,     ,     ,     ,     ,     ,      ],
    [ "bbs7",     ,     ,     ,     ,     ,     ,     ,     ,     , 0xff,     ,     ,     ,     ,     ,     ,      ],
    [ "bcc" ,     ,     ,     ,     ,     ,     ,     ,     , 0x90,     ,     ,     ,     ,     ,     ,     ,      ],
    [ "bcs" ,     ,     ,     ,     ,     ,     ,     ,     , 0xb0,     ,     ,     ,     ,     ,     ,     ,      ],
    [ "beq" ,     ,     ,     ,     ,     ,     ,     ,     , 0xf0,     ,     ,     ,     ,     ,     ,     ,      ],
    [ "bit" , 0x2c,     , 0x3c,     ,     ,     , 0x89,     ,     ,     ,     , 0x24,     , 0x34,     ,     ,      ],
    [ "bmi" ,     ,     ,     ,     ,     ,     ,     ,     , 0x30,     ,     ,     ,     ,     ,     ,     ,      ],
    [ "bne" ,     ,     ,     ,     ,     ,     ,     ,     , 0xd0,     ,     ,     ,     ,     ,     ,     ,      ],
    [ "bpl" ,     ,     ,     ,     ,     ,     ,     ,     , 0x10,     ,     ,     ,     ,     ,     ,     ,      ],
    [ "bra" ,     ,     ,     ,     ,     ,     ,     ,     , 0x80,     ,     ,     ,     ,     ,     ,     ,      ],
    [ "brk" ,     ,     ,     ,     ,     ,     ,     ,     ,     ,     , 0x00,     ,     ,     ,     ,     ,      ],
    [ "bvc" ,     ,     ,     ,     ,     ,     ,     ,     , 0x50,     ,     ,     ,     ,     ,     ,     ,      ],
    [ "bvs" ,     ,     ,     ,     ,     ,     ,     ,     , 0x70,     ,     ,     ,     ,     ,     ,     ,      ],
    [ "clc" ,     ,     ,     ,     ,     ,     ,     , 0x18,     ,     ,     ,     ,     ,     ,     ,     ,      ],
    [ "cld" ,     ,     ,     ,     ,     ,     ,     , 0xd8,     ,     ,     ,     ,     ,     ,     ,     ,      ],
    [ "cli" ,     ,     ,     ,     ,     ,     ,     , 0x58,     ,     ,     ,     ,     ,     ,     ,     ,      ],
    [ "clv" ,     ,     ,     ,     ,     ,     ,     , 0xb8,     ,     ,     ,     ,     ,     ,     ,     ,      ],
    [ "cmp" , 0xcd,     , 0xdd, 0xd9,     ,     , 0xc9,     ,     ,     ,     , 0xc5, 0xc1, 0xd5,     , 0xd2, 0xd1 ],
    [ "cpx" , 0xec,     ,     ,     ,     ,     , 0xe0,     ,     ,     ,     , 0xe4,     ,     ,     ,     ,      ],
    [ "cpy" , 0xcc,     ,     ,     ,     ,     , 0xc0,     ,     ,     ,     , 0xc4,     ,     ,     ,     ,      ],
    [ "dec" , 0xce,     , 0xde,     ,     , 0x3a,     ,     ,     ,     ,     , 0xc6,     , 0xd6,     ,     ,      ],
    [ "dex" ,     ,     ,     ,     ,     ,     ,     , 0xca,     ,     ,     ,     ,     ,     ,     ,     ,      ],
    [ "dey" ,     ,     ,     ,     ,     ,     ,     , 0x88,     ,     ,     ,     ,     ,     ,     ,     ,      ],
    [ "eor" , 0x4d,     , 0x5d, 0x59,     ,     , 0x49,     ,     ,     ,     , 0x45, 0x41, 0x55,     , 0x52, 0x51 ],
    [ "inc" , 0xee,     , 0xfe,     ,     , 0x1a,     ,     ,     ,     ,     , 0xe6,     , 0xf6,     ,     ,      ],
    [ "inx" ,     ,     ,     ,     ,     ,     ,     , 0xe8,     ,     ,     ,     ,     ,     ,     ,     ,      ],
    [ "iny" ,     ,     ,     ,     ,     ,     ,     , 0xc8,     ,     ,     ,     ,     ,     ,     ,     ,      ],
    [ "jmp" , 0x4c, 0x7c,     ,     , 0x6c,     ,     ,     ,     ,     ,     ,     ,     ,     ,     ,     ,      ],
    [ "jsr" , 0x20,     ,     ,     ,     ,     ,     ,     ,     ,     ,     ,     ,     ,     ,     ,     ,      ],
    [ "lda" , 0xad,     , 0xbd, 0xb9,     ,     , 0xa9,     ,     ,     ,     , 0xa5, 0xa1, 0xb5,     , 0xb2, 0xb1 ],
    [ "ldx" , 0xae,     ,     , 0xbe,     ,     , 0xa2,     ,     ,     ,     , 0xa6,     ,     , 0xb6,     ,      ],
    [ "ldy" , 0xac,     , 0xbc,     ,     ,     , 0xa0,     ,     ,     ,     , 0xa4,     , 0xb4,     ,     ,      ],
    [ "lsr" , 0x4e,     , 0x5e,     ,     , 0x4a,     ,     ,     ,     ,     , 0x46,     , 0x56,     ,     ,      ],
    [ "nop" ,     ,     ,     ,     ,     ,     ,     , 0xea,     ,     ,     ,     ,     ,     ,     ,     ,      ],
    [ "ora" , 0x0d,     , 0x1d, 0x19,     ,     , 0x09,     ,     ,     ,     , 0x05, 0x01, 0x15,     , 0x12, 0x11 ],
    [ "pha" ,     ,     ,     ,     ,     ,     ,     ,     ,     ,     , 0x48,     ,     ,     ,     ,     ,      ],
    [ "php" ,     ,     ,     ,     ,     ,     ,     ,     ,     ,     , 0x08,     ,     ,     ,     ,     ,      ],
    [ "phx" ,     ,     ,     ,     ,     ,     ,     ,     ,     ,     , 0xda,     ,     ,     ,     ,     ,      ],
    [ "phy" ,     ,     ,     ,     ,     ,     ,     ,     ,     ,     , 0x5a,     ,     ,     ,     ,     ,      ],
    [ "pla" ,     ,     ,     ,     ,     ,     ,     ,     ,     ,     , 0x68,     ,     ,     ,     ,     ,      ],
    [ "plp" ,     ,     ,     ,     ,     ,     ,     ,     ,     ,     , 0x28,     ,     ,     ,     ,     ,      ],
    [ "plx" ,     ,     ,     ,     ,     ,     ,     ,     ,     ,     , 0xfa,     ,     ,     ,     ,     ,      ],
    [ "ply" ,     ,     ,     ,     ,     ,     ,     ,     ,     ,     , 0x7a,     ,     ,     ,     ,     ,      ],
    [ "rmb0",     ,     ,     ,     ,     ,     ,     ,     ,     ,     ,     , 0x07,     ,     ,     ,     ,      ],
    [ "rmb1",     ,     ,     ,     ,     ,     ,     ,     ,     ,     ,     , 0x17,     ,     ,     ,     ,      ],
    [ "rmb2",     ,     ,     ,     ,     ,     ,     ,     ,     ,     ,     , 0x27,     ,     ,     ,     ,      ],
    [ "rmb3",     ,     ,     ,     ,     ,     ,     ,     ,     ,     ,     , 0x37,     ,     ,     ,     ,      ],
    [ "rmb4",     ,     ,     ,     ,     ,     ,     ,     ,     ,     ,     , 0x47,     ,     ,     ,     ,      ],
    [ "rmb5",     ,     ,     ,     ,     ,     ,     ,     ,     ,     ,     , 0x57,     ,     ,     ,     ,      ],
    [ "rmb6",     ,     ,     ,     ,     ,     ,     ,     ,     ,     ,     , 0x67,     ,     ,     ,     ,      ],
    [ "rmb7",     ,     ,     ,     ,     ,     ,     ,     ,     ,     ,     , 0x77,     ,     ,     ,     ,      ],
    [ "rol" , 0x2e,     , 0x3e,     ,     , 0x2a,     ,     ,     ,     ,     , 0x26,     , 0x36,     ,     ,      ],
    [ "ror" , 0x6e,     , 0x7e,     ,     , 0x6a,     ,     ,     ,     ,     , 0x66,     , 0x76,     ,     ,      ],
    [ "rti" ,     ,     ,     ,     ,     ,     ,     ,     ,     ,     , 0x40,     ,     ,     ,     ,     ,      ],
    [ "rts" ,     ,     ,     ,     ,     ,     ,     ,     ,     ,     , 0x60,     ,     ,     ,     ,     ,      ],
    [ "sbc" , 0xed,     , 0xfd, 0xf9,     ,     , 0xe9,     ,     ,     ,     , 0xe5, 0xe1, 0xf5,     , 0xf2, 0xf1 ],
    [ "sec" ,     ,     ,     ,     ,     ,     ,     , 0x38,     ,     ,     ,     ,     ,     ,     ,     ,      ],
    [ "sed" ,     ,     ,     ,     ,     ,     ,     , 0xf8,     ,     ,     ,     ,     ,     ,     ,     ,      ],
    [ "sei" ,     ,     ,     ,     ,     ,     ,     , 0x78,     ,     ,     ,     ,     ,     ,     ,     ,      ],
    [ "smb0",     ,     ,     ,     ,     ,     ,     ,     ,     ,     ,     , 0x87,     ,     ,     ,     ,      ],
    [ "smb1",     ,     ,     ,     ,     ,     ,     ,     ,     ,     ,     , 0x97,     ,     ,     ,     ,      ],
    [ "smb2",     ,     ,     ,     ,     ,     ,     ,     ,     ,     ,     , 0xa7,     ,     ,     ,     ,      ],
    [ "smb3",     ,     ,     ,     ,     ,     ,     ,     ,     ,     ,     , 0xb7,     ,     ,     ,     ,      ],
    [ "smb4",     ,     ,     ,     ,     ,     ,     ,     ,     ,     ,     , 0xc7,     ,     ,     ,     ,      ],
    [ "smb5",     ,     ,     ,     ,     ,     ,     ,     ,     ,     ,     , 0xd7,     ,     ,     ,     ,      ],
    [ "smb6",     ,     ,     ,     ,     ,     ,     ,     ,     ,     ,     , 0xe7,     ,     ,     ,     ,      ],
    [ "smb7",     ,     ,     ,     ,     ,     ,     ,     ,     ,     ,     , 0xf7,     ,     ,     ,     ,      ],
    [ "sta" , 0x8d,     , 0x9d, 0x99,     ,     ,     ,     ,     ,     ,     , 0x85, 0x81, 0x95,     , 0x92, 0x91 ],
    [ "stp" ,     ,     ,     ,     ,     ,     ,     , 0xdb,     ,     ,     ,     ,     ,     ,     ,     ,      ],
    [ "stx" , 0x8e,     ,     ,     ,     ,     ,     ,     ,     ,     ,     , 0x86,     ,     , 0x96,     ,      ],
    [ "sty" , 0x8c,     ,     ,     ,     ,     ,     ,     ,     ,     ,     , 0x84,     , 0x94,     ,     ,      ],
    [ "stz" , 0x9c,     , 0x9e,     ,     ,     ,     ,     ,     ,     ,     , 0x64,     , 0x74,     ,     ,      ],
    [ "tax" ,     ,     ,     ,     ,     ,     ,     , 0xaa,     ,     ,     ,     ,     ,     ,     ,     ,      ],
    [ "tay" ,     ,     , 0xbc,     ,     ,     ,     , 0xab,     ,     ,     ,     ,     ,     ,     ,     ,      ],
    [ "trb" , 0x1c,     , 0x5e,     ,     ,     ,     ,     ,     ,     ,     , 0x14,     ,     ,     ,     ,      ],
    [ "tsb" , 0x0c,     ,     ,     ,     ,     ,     ,     ,     ,     ,     , 0x04,     ,     ,     ,     ,      ],
    [ "tsx" ,     ,     , 0x1d,     ,     ,     ,     , 0xba,     ,     ,     ,     ,     ,     ,     ,     ,      ],
    [ "txa" ,     ,     ,     ,     ,     ,     ,     , 0x8a,     ,     ,     ,     ,     ,     ,     ,     ,      ],
    [ "txs" ,     ,     ,     ,     ,     ,     ,     , 0x9a,     ,     ,     ,     ,     ,     ,     ,     ,      ],
    [ "tya" ,     ,     ,     ,     ,     ,     ,     , 0x98,     ,     ,     ,     ,     ,     ,     ,     ,      ],
    [ "wai" ,     ,     ,     ,     ,     ,     ,     , 0xcb,     ,     ,     ,     ,     ,     ,     ,     ,      ]
];


class RAM
{
    constructor(bytes) {
        this.u8a = new Uint8Array(bytes || 0x10000);
    }

    read(addr) {
        return this.u8a[addr & 0xffff];
    }

    write(addr, val) {
        this.u8a[addr & 0xffff] = val;
    }

    reset() {
        this.u8a.fill(0);
    }
}


class Flags6502
{
    constructor() {
        this._n = false;
        this._v = false;
        this._b = false;
        this._d = false;
        this._i = false;
        this._z = false;
        this._c = false;
    }

    get n() { return this._n; };
    set n(val) { this._n = (val!=0); };
    get v() { return this._v; };
    set v(val) { this._v = (val!=0); };
    get b() { return this._b; };
    set b(val) { this._b = (val!=0); };
    get d() { return this._d; };
    set d(val) { this._d = (val!=0); };
    get i() { return this._i; };
    set i(val) { this._i = (val!=0); };
    get z() { return this._z; };
    set z(val) { this._z = (val!=0); };
    get c() { return this._c; };
    set c(val) { this._c = (val!=0); };

    get value() {
        return (this.n ? 0x80 : 0x00) |
               (this.v ? 0x40 : 0x00) |
                         0x20         |
               (this.b ? 0x10 : 0x00) |
               (this.d ? 0x08 : 0x00) |
               (this.i ? 0x04 : 0x00) |
               (this.z ? 0x02 : 0x00) |
               (this.c ? 0x01 : 0x00) ;
    }
    set value(val) {
        this.n = val & 0x80;
        this.v = val & 0x40;
        this.b = val & 0x10;
        this.d = val & 0x08;
        this.i = val & 0x04;
        this.z = val & 0x02;
        this.c = val & 0x01;
    }

    // overflow and carry calculations require the raw unclamped result
    test_n(val)     { this.n = (val & 0x80); }
    test_v(a, b, r) { this.v = (a<0x80 != r<0x80) && (b<0x80 != r<0x80); } // <-- if both operands have the same sign, then the result
    test_z(val)     { this.z = (val & 0xff) == 0; }                        //     needs to share that same sign (or it is a sign overflow)
    test_c(val)     { this.c = (val & 0xf00); }                            //     BCD requires < 0x80 rather than & 0x80 for sign detection
                                                                           //       e.g. BCD 40 + 60 = 100 and 0x100 has no sign bit at b7
    reset() {
        this._n = false;
        this._v = false;
        this._b = false;
        this._d = false;
        this._i = false;
        this._z = false;
        this._c = false;
    }
}


class Register6502
{
    constructor() {
        this._a = 0;
        this._x = 0;
        this._y = 0;
        this._pc = 0;
        this._sp = 0;
        this._flags = new Flags6502();
    }
    get a() { return this._a; }
    set a(val) {
        this._a = (val & 0xff);
        this._flags.test_n(val);
        this._flags.test_z(val);
    }
    get x() { return this._x; }
    set x(val) {
        this._x = (val & 0xff);
        this._flags.test_n(val);
        this._flags.test_z(val);
    }
    get y() { return this._y; }
    set y(val) {
        this._y = (val & 0xff);
        this._flags.test_n(val);
        this._flags.test_z(val);
    }
    get pc() { return this._pc; }
    set pc(val) { this._pc = (val & 0xffff); }
    get sp() { return this._sp; }
    set sp(val) { this._sp = (val & 0xff); }
    get flag() { return this._flags; }

    reset() {
        this._a = 0;
        this._x = 0;
        this._y = 0;
        this._pc = 0;
        this._sp = 0;
        this._flags.reset();
    }
}


class W65C02S
{
    constructor(ram) {
        this.ram = ram || new RAM();
        this.reg = new Register6502();
        this.init();
    }

    get register() { return this.reg; }


    //                                            n v b d i z c
    // ADC   a + m + c -> a, c                    + + - - - + +
    //
    adc(memfn) {
        const a = memfn.read();
        const b = this.reg.a;
        let res = this.reg.flag.c ? 1 : 0;

        if(this.reg.flag.d) {  // bcd
            res += (a & 0x0f) + (b & 0x0f);
            if(res > 0x09) res += 0x06;
            res += (a & 0xf0) + (b & 0xf0);
            if(res > 0x99) res += 0x60;
        } else {
            res += a + b;
        }

        this.reg.a = res; // n & z tests are automatic
        this.reg.flag.test_v(a, b, res);
        this.reg.flag.test_c(res);
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // AND   a & m -> a                           + - - - - + -
    //
    and(memfn) {
        this.reg.a &= memfn.read(); // n & z tests are automatic
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // ASL   c <- [76543210] <- 0                 + - - - - + +
    //
    asl(memfn) {
        const val = memfn.read();
        const res = val << 1;
        memfn.write(res);

        this.reg.flag.test_n(res);
        this.reg.flag.test_z(res);
        this.reg.flag.test_c(res);
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // BBRb   branch on bit b reset               - - - - - - -
    //
    bbr(b, memfn) {
        const val = memfn.read();
        const offs = memfn.offset();
        if(!((val >> b) & 0x01)) {
            memfn.branch(offs);
            return memfn.cycles + memfn.branch_extra_cycles;
        }
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // BBSb   branch on bit b set                 - - - - - - -
    //
    bbs(b, memfn) {
        const val = memfn.read();
        const offs = memfn.offset();
        if((val >> b) & 0x01) {
            memfn.branch(offs);
            return memfn.cycles + memfn.branch_extra_cycles;
        }
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // BCC   branch on carry clear (c = 0)        - - - - - - -
    //
    bcc(memfn) {
        const offs = memfn.offset();
        if(!this.reg.flag.c) {
            memfn.branch(offs);
            return memfn.cycles + memfn.branch_extra_cycles;
        }
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // BCS   branch on carry set (c = 1)          - - - - - - -
    //
    bcs(memfn) {
        const offs = memfn.offset();
        if(this.reg.flag.c) {
            memfn.branch(offs);
            return memfn.cycles + memfn.branch_extra_cycles;
        }
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // BEQ   branch on result zero (z = 1)        - - - - - - -
    //
    beq(memfn) {
        const offs = memfn.offset();
        if(this.reg.flag.z) {
            memfn.branch(offs);
            return memfn.cycles + memfn.branch_extra_cycles;
        }
        return memfn.cycles;
    }

    //                                            n  v  b d i z c
    // BIT   a & m -> z, m7 -> n, m6 -> v         m7 m6 - - - - -
    //
    bit(memfn) {
        const val = memfn.read();

        // a & m -> z
        this.reg.flag.test_z(val & this.reg.a);
        // m7 -> n
        this.reg.flag.n = (val & 0x80);
        // m6 -> v
        this.reg.flag.v = (val & 0x40);

        return memfn.cycles;
    }

    //                                            n v b d i z c
    // BMI   branch on result minus (n = 1)       - - - - - - -
    //
    bmi(memfn) {
        const offs = memfn.offset();
        if(this.reg.flag.n) {
            memfn.branch(offs);
            return memfn.cycles + memfn.branch_extra_cycles;
        }
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // BNE   branch on result not zero (z = 0)    - - - - - - -
    //
    bne(memfn) {
        const offs = memfn.offset();
        if(!this.reg.flag.z) {
            memfn.branch(offs);
            return memfn.cycles + memfn.branch_extra_cycles;
        }
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // BPL   branch on result plus (n = 0)        - - - - - - -
    //
    bpl(memfn) {
        const offs = memfn.offset();
        if(!this.reg.flag.n) {
            memfn.branch(offs);
            return memfn.cycles + memfn.branch_extra_cycles;
        }
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // BRA   branch always                        - - - - - - -
    //
    bra(memfn) {
        const offs = memfn.offset();
        memfn.branch(offs);
        return memfn.cycles + memfn.branch_extra_cycles;
    }

// TODO: clear decimal?  interrupt & push pc / sr?
    //                                            n v b d i z c
    // BRK   break                                - - 1 - 1 - -
    //
    brk(memfn) {
        this.reg.flag.b = true;
        this.reg.flag.i = true;
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // BVC   branch on overflow clear (v = 0)     - - - - - - -
    //
    bvc(memfn) {
        const offs = memfn.offset();
        if(!this.reg.flag.v) {
            memfn.branch(offs);
            return memfn.cycles + memfn.branch_extra_cycles;
        }
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // BVS   branch on overflow set (v = 1)       - - - - - - -
    //
    bvs(memfn) {
        const offs = memfn.offset();
        if(this.reg.flag.v) {
            memfn.branch(offs);
            return memfn.cycles + memfn.branch_extra_cycles;
        }
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // CLC   c -> 0                               - - - - - - 0
    //
    clc(memfn) {
        this.reg.flag.c = false;
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // CLD   d -> 0                               - - - 0 - - -
    //
    cld(memfn) {
        this.reg.flag.d = false;
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // CLI   i -> 0                               - - - - 0 - -
    //
    cli(memfn) {
        this.reg.flag.i = false;
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // CLV   v -> 0                               - 0 - - - - -
    //
    clv(memfn) {
        this.reg.flag.v = false;
        return memfn.cycles;
    }


    cmp(memfn) {
    }

    //                                            n v b d i z c
    // CMP   a-m                                  + - - - - + +
    //
    cmp(memfn) {
        const val = memfn.read();
        const diff = (this.reg.a + (val ^ 0xff) + 1);

        this.reg.flag.test_n(diff);
        this.reg.flag.test_z(diff);
        this.reg.flag.test_c(diff);
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // CPX   x-m                                  + - - - - + +
    //
    cpx(memfn) {
        const val = memfn.read();
        const diff = (this.reg.x + (val ^ 0xff) + 1);

        this.reg.flag.test_n(diff);
        this.reg.flag.test_z(diff);
        this.reg.flag.test_c(diff);
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // CPY   y-m                                  + - - - - + +
    //
    cpy(memfn) {
        const val = memfn.read();
        const diff = (this.reg.y + (val ^ 0xff) + 1);

        this.reg.flag.test_n(diff);
        this.reg.flag.test_z(diff);
        this.reg.flag.test_c(diff);
        return memfn.cycles;
    }

    dec(memfn) {
    }

    dex(memfn) {
    }

    dey(memfn) {
    }

    eor(memfn) {
    }

    inc(memfn) {
    }

    inx(memfn) {
    }

    iny(memfn) {
    }

    jmp(memfn) {
    }

    jsr(memfn) {
    }

    //                                            n v b d i z c
    // LDA   m -> a                               + - - - - + -
    //
    lda(memfn) {
        this.reg.a = memfn.read();  // n & z tests are automatic
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // LDX   m -> x                               + - - - - + -
    //
    ldx(memfn) {
        this.reg.x = memfn.read(); // n & z tests are automatic
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // LDY   m -> y                               + - - - - + -
    //
    ldy(memfn) {
        this.reg.y = memfn.read(); // n & z tests are automatic
        return memfn.cycles;
    }

    lsr(memfn) {
    }

    nop(memfn) {
    }

    //                                            n v b d i z c
    // ORA   a | m -> a                           + - - - - + -
    //
    ora(memfn) {
        this.reg.a |= memfn.read(); // n & z tests are automatic
        return memfn.cycles;
    }

    pha(memfn) {
    }

    php(memfn) {
    }

    phx(memfn) {
    }

    phy(memfn) {
    }

    pla(memfn) {
    }

    plp(memfn) {
    }

    plx(memfn) {
    }

    ply(memfn) {
    }

    rmb0(memfn) {
    }

    rmb1(memfn) {
    }

    rmb2(memfn) {
    }

    rmb3(memfn) {
    }

    rmb4(memfn) {
    }

    rmb5(memfn) {
    }

    rmb6(memfn) {
    }

    rmb7(memfn) {
    }

    rol(memfn) {
    }

    ror(memfn) {
    }

    rti(memfn) {
    }

    rts(memfn) {
    }

    sbc(memfn) {
    }

    //                                            n v b d i z c
    // SEC   1 -> c                               - - - - - - 1
    //
    sec(memfn) {
        this.reg.flag.c = true;
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // SED   1 -> d                               - - - 1 - - -
    //
    sed(memfn) {
        this.reg.flag.d = true;
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // SEI   1 -> d                               - - - - 1 - -
    //
    sei(memfn) {
        this.reg.flag.i = true;
        return memfn.cycles;
    }

    smb(b, memfn) {
    }

    sta(memfn) {
    }

    stp(memfn) {
    }

    stx(memfn) {
    }

    sty(memfn) {
    }

    stz(memfn) {
    }

    tax(memfn) {
    }

    tay(memfn) {
    }

    trb(memfn) {
    }

    tsb(memfn) {
    }

    tsx(memfn) {
    }

    txa(memfn) {
    }

    txs(memfn) {
    }

    tya(memfn) {
    }

    wai(memfn) {
    }

    // step one instruction
    // returns cycles used for the operation
    step() {
        return op.step();
    }

    init() {
        // addressing modes, pp.15-20
        //     1: absolute                 a       Absolute
        //     2: absolute_x_indirect      (a,x)   Absolute Indexed Indirect
        //     3: absolute_x               a,x     Absolute Indexed with X
        //     4: absolute_y               a,y     Absolute Indexed with Y
        //     5: absolute_indirect        (a)     Absolute Indirect
        //     6: accumulator              A       Accumulator
        //     7: immediate                #       Immediate Addressing
        //     8: implied                  i       Implied
        //    9a: relative_pc              r       Program Counter Relative
        //    9b: zero_page_relative_pc    zp,r    Zero Page Program Counter Relative
        //    10: relative_stack           s       Stack
        //    11: zero_page                zp      Zero Page
        //    12: zero_page_x_indirect     (zp,x)  Zero Page Indexed Indirect
        //    13: zero_page_x              zp,x    Zero Page Indexed with X
        //    14: zero_page_y              zp,y    Zero Page Indexed with Y
        //    15: zero_page_indirect       (zp)    Zero Page Indirect
        //    16: zero_page_indirect_y     (zp),y  Zero Page Indirect Indexed with Y

        const advance_byte = () => { return this.ram.read(this.reg.pc++); };
        const advance_word = () => { return this.advance_byte() | this.advance_byte()<<8; };

        const addr_mode = [
            {// 1. Absolute  a
                type: 1,
                name: "absolute",
                read: () => { return this.ram.read(advance_word()); },
                write: (val) => { this.ram.write(advance_word(), val); },
                bytes: 3,
                cycles: 4,
                write_extra_cycles: 2
            },
            {// 2. Absolute Indexed Indirect  (a,x)  (used for jmp)
                type: 2,
                name: "absolute_x_indirect",
                read: () => { return this.ram.read_word(advance_word() + this.reg.x); },
                bytes: 3,
                cycles: 5,
                write_extra_cycles: 0
            },
            {// 3. Absolute Indexed with X  a,x
                type: 3,
                name: "absolute_x",
                read: () => { return this.ram.read(advance_word() + this.reg.x); },
                write: (val) =>    { this.ram.write(advance_word() + this.reg.x, val); },
                bytes: 3,
                cycles: 4,
                write_extra_cycles: 2
                // TODO: +1 cycle for page boundary
            },
            {// 4. Absolute Indexed with Y  a,y
                type: 4,
                name: "absolute_y",
                read: () => { return this.ram.read(advance_word() + this.reg.y); },
                //write: (val) =>    { this.ram.write(advance_word() + this.reg.y, val); },
                bytes: 3,
                cycles: 4,
                write_extra_cycles: 0
                // TODO: +1 cycle for page boundary
            },
            {// 5. Absolute Indirect  (a)   (used for jmp)
                type: 5,
                name: "absolute_indirect",
                read: () => { return read_word(advance_word()); },
                bytes: 3,
                cycles: 4,
                write_extra_cycles: 2
            },
            {// 6. Accumulator  A
                type: 6,
                name: "accumulator",
                read: () => { return this.reg.a; },
                write: (val) => { this.reg.a = (val & 0xff); },
                bytes: 1,
                cycles: 2,
                write_extra_cycles: 0
            },
            {// 7. Immediate  #
                type: 7,
                name: "immediate",
                read: advance_byte,
                bytes: 2,
                cycles: 2,
                write_extra_cycles: 0
            },
            {// 8. Implied  i
                type: 8,
                name: "implied",
                bytes: 1,
                cycles: 2,
                write_extra_cycles: 0
            },
            {// 9a. Program Counter Relative  r
                type: 9,
                name: "relative_pc",
                offset: advance_byte,
                branch: (offs) => { this.reg.pc += (offs & 0xff); if(offs & 0x80) this.reg.pc -= 0x100; },
                bytes: 2,
                cycles: 2,
                branch_extra_cycles: 1
            },
            {// 9b. Zero Page Program Counter Relative  zp,r
                //     note: not explicity described in the w65c02s datasheet
                //           but applies to BBRb zp,offs and BBSb zp,offs operations
                //           BBRb and BBSb are three byte operations
                type: 9,
                name: "zero_page_relative_pc",
                read: () => { return this.ram.read(advance_byte()); },
                offset: advance_byte,
                branch: (offs) => { this.reg.pc += (offs & 0xff); if(offs & 0x80) this.reg.pc -= 0x100; },
                bytes: 3,
                cycles: 2,
                branch_extra_cycles: 1
            },
            {// 10. Stack  s
                type: 10,
                name: "relative_stack",
                bytes: 1,  // TODO: up to +3 stack bytes
                cycles: 3,
                write_extra_cycles: 0
                // TODO: +4 cycles possible 
            },
            {// 11. Zero Page  zp
                type: 11,
                name: "zero_page",
                read: () => { return this.ram.read(advance_byte()); },
                write: (val) => { this.ram.write(advance_byte(), val); },
                bytes: 2,
                cycles: 3,
                write_extra_cycles: 2
            },
            {// 12. Zero Page Indexed Indirect  (zp,x)
                type: 12,
                name: "zero_page_x_indirect",
                read: () => { return this.ram.read(read_word((advance_byte() + this.reg.x) & 0xff)); },
                write: (val) => { this.ram.write(read_word((advance_byte() + this.reg.x) & 0xff), val); },
                bytes: 2,
                cycles: 6,
                write_extra_cycles: 0
            },
            {// 13. Zero Page Indexed with X  zp,x
                type: 13,
                name: "zero_page_x",
                read: () => { return this.ram.read((advance_byte() + this.reg.x) & 0xff); },
                write: (val) => { this.ram.write(((advance_byte() + this.reg.x) & 0xff), val); },
                bytes: 2,
                cycles: 4,
                write_extra_cycles: 2
            },
            {// 14. Zero Page Indexed with Y  zp,y
                type: 14,
                name: "zero_page_y",
                read: () => { return this.ram.read((advance_byte() + this.reg.y) & 0xff); },
                write: (val) => { this.ram.write(((advance_byte() + this.reg.y) & 0xff), val); },
                bytes: 2,
                cycles: 4,  // TODO: +2 on write
                write_extra_cycles: 0
            },
            {// 15. Zero Page Indirect  (zp)
                type: 15,
                name: "zero_page_indirect",
                read: () => { return this.ram.read(read_word(advance_byte())); },
                write: (val) => { this.ram.write(read_word(advance_byte()), val); },
                bytes: 2,
                cycles: 5,
                write_extra_cycles: 0
            },
            {// 16. Zero Page Indirect Indexed with Y  (zp),y
                type: 16,
                name: "zero_page_indirect_y",
                read: () => { return this.ram.read((read_word(advance_byte()) + this.reg.y) & 0xffff); },
                write: (val) => { this.ram.write(((read_word(advance_byte()) + this.reg.y) & 0xffff), val); },
                bytes: 2,
                cycles: 5,
                write_extra_cycles: 0
            }
        ];

        this.op = [ ];
        this.step = () => { return this.op[advance_byte()](); };
        for(let i=0; i<opdef.length; i++) {
            const opentry = opdef[i];        // the whole line: [ "adc" , 0x6d...
            const opname = opentry[0];       // the name: "adc"
            for(let j=0; j<18; j++) {        // enum address modes for the entry
                const opnum = opentry[j+1];  // op num for addr mode: 0x6d
                if(opnum) {                  // op supports this address mode?
                    const memfn = addr_mode[j];
                    if(opname.length > 3) {
                        // digit 4 is the bit num
                        const fp = this[opname.substr(0, 3)];
                        const b = parseInt(opname[3]);
                        this.op[opnum] = () => { return fp.call(this, b, memfn); };
                    } else {
                        const fp = this[opname];
                        this.op[opnum] = () => { return fp.call(this, memfn); };
                    }
                }
            }
        }
    }

    reset() {
        this.ram.reset();
        this.reg.reset();
    }

}

const ram = new RAM();
const cpu = new W65C02S(ram);

