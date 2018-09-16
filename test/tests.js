//
//  W65C02S processor unit tests
//
//  Copyright 2018, John Clark
//
//  Released under the GNU General Public License
//  https://www.gnu.org/licenses/gpl.html
//
//  ref: http://www.wdesignc.com/wdc/documentation/w65c02s.pdf
//

const test = {
    and: {
        // AND mode 1 0x2d:  absolute:  a
        abs: {
            0x1000: [ 0, 0, 0xaf ],
            0x2000: [
                0xa9, 0xfa,        //  lda, #$fa
                0x3d, 0x02, 0x10,  //> and, $1002
                0xc9, 0xaa,        //  cmp, #$aa - (z & c set if pass)
            ]
        },
        // AND mode 3 0x3d:  absolute w/ x:  a,x
        abs_x: {
            0x1000: [ 0, 0, 0, 0, 0, 0xaf ],
            0x2000: [
                0xa9, 0xfa,        //  lda, #$fa
                0xa2, 0x03,        //  ldx, #$03
                0x3d, 0x02, 0x10,  //> and, $1002
                0xc9, 0xaa,        //  cmp, #$aa - (z & c set if pass)
            ]
        },
        // AND mode 4 0x39:  absolute w/ y:  a,y
        abs_y: {
            0x1000: [ 0, 0, 0, 0, 0, 0xaf ],
            0x2000: [
                0xa9, 0xfa,        //  lda, #$fa
                0xa0, 0x03,        //  ldy, #$03
                0x39, 0x02, 0x10,  //> and, $1002
                0xc9, 0xaa,        //  cmp, #$aa - (z & c set if pass)
            ]
        },
        // AND mode 7 0x29:  immediate:  #
        imm: {
            0x2000: [
                0xa9, 0xfa,   //  lda, #$fa
                0x29, 0xaf,   //> and, #$af
                0xc9, 0xaa,   //  cmp, #$aa - (z & c set if pass)
            ]
        },
        // AND mode 11 0x25:  zero page:  zp
        zp: {
            0x0000: [ 0, 0, 0, 0xaf ],
            0x2000: [
                0xa9, 0xfa,   //  lda, #$fa
                0x25, 0x03,   //> and, $03
                0xc9, 0xaa,   //  cmp, #$aa - (z & c set if pass)
            ]
        },
        // AND mode 12 0x21:  zero page w/ x indirect:  (zp,x)
        zp_x_ind: {
            0x0000: [ 0, 0, 0, 0, 0, 0x05, 0x10 ],
            0x1000: [ 0, 0, 0, 0, 0, 0xaf ],
            0x2000: [
                0xa9, 0xfa,   //  lda, #$fa
                0xa2, 0x02,   //  ldx, #$02
                0x21, 0x03,   //> and, $03
                0xc9, 0xaa,   //  cmp, #$aa - (z & c set if pass)
            ]
        },
        // AND mode 13 0x35:  zero page w/ x:  zp,x
        zp_x: {
            0x0000: [ 0, 0, 0, 0, 0, 0, 0, 0xaf ],
            0x2000: [
                0xa9, 0xfa,   //  lda, #$fa
                0xa2, 0x03,   //  ldx, #$03
                0x35, 0x04,   //> and, $04
                0xc9, 0xaa,   //  cmp, #$aa - (z & c set if pass)
            ]
        },
        // AND mode 15 0x32:  zero page indirect:  (zp)
        zp_ind: {
            0x0000: [ 0, 0, 0, 0, 0, 0x05, 0x10 ],
            0x1000: [ 0, 0, 0, 0, 0, 0xaf ],
            0x2000: [
                0xa9, 0xfa,   //  lda, #$fa
                0x32, 0x05,   //> and, $05
                0xc9, 0xaa,   //  cmp, #$aa - (z & c set if pass)
            ]
        },
        // AND mode 16 0x31:  zero page indirect w/ y:  (zp),y
        zp_ind_y: {
            0x0000: [ 0, 0, 0, 0, 0, 0x05, 0x10 ],
            0x1010: [ 0, 0, 0, 0, 0, 0xaf ],
            0x2000: [
                0xa9, 0xfa,   //  lda, #$fa
                0xa0, 0x10,   //  ldy, #$10
                0x31, 0x05,   //> and, $05
                0xc9, 0xaa,   //  cmp, #$aa - (z & c set if pass)
            ]
        },
    },

    dec: {
        // DEC mode 1 0xce:  absolute:  a
        abs: {
            0x2000: [
                0xa9, 0xfa,        //  lda, #$fa
                0xa2, 0xf9,        //  ldx, #$f9
                0x8d, 0x0f, 0x20,  //  sta, $200f
                0xce, 0x0f, 0x20,  //> dec, $200f
                0xec, 0x0f, 0x20,  //  cpx, $200f - (z & c set if pass)
            ]
        },
        // DEC mode 3 0xde:  absolute w/ x:  a,x
        abs_x: {
            0x2000: [
                0xa9, 0xfa,        //  lda, #$fa
                0xa2, 0x0f,        //  ldx, #$0f
                0xa0, 0xf9,        //  ldy, #$f9
                0x8d, 0x0f, 0x20,  //  sta, $200f
                0xde, 0x00, 0x20,  //> dec, $2000
                0xcc, 0x0f, 0x20,  //  cpy, $200f - (z & c set if pass)
            ]
        },
        // DEC mode 6 0x3a:  accumulator:  A
        accum: {
            0x2000: [
                0xa9, 0xfa,   //  lda, #$fa
                0x3a,         //> dec
                0xc9, 0xf9,   //  cmp, #$f9 - (z & c set if pass)
            ]
        },
        // DEC mode 11 0xc6:  zero page:  zp
        zp: {
            0x0000: [ 0, 0, 0, 0xfa ],
            0x2000: [
                0xa9, 0xf9,   //  lda, #$f9
                0xc6, 0x03,   //> dec, $03
                0xc5, 0x03,   //  cmp, $03 - (z & c set if pass)
            ]
        },
        // DEC mode 13 0xd6:  zero page w/ x:  zp,x
        zp_x: {
            0x0000: [ 0, 0, 0, 0, 0, 0, 0, 0xfa ],
            0x2000: [
                0xa9, 0xf9,   //  lda, #$f9
                0xa2, 0x03,   //  ldx, #$03
                0xd6, 0x04,   //> dec, $04
                0xc5, 0x07,   //  cmp, $07 - (z & c set if pass)
            ]
        },
    },

    jsr: {
        // JSR mode 1 0x20:  absolute:  a
        abs: {
            0x1000: [
                0xba,   //  tsx
                0x60    //  rts
            ],
            0x2000: [
                0xba,              //  tsx
                0xca,              //  dex
                0xca,              //  dex
                0x86, 0x03,        //  stx, $03
                0xa2, 0x00,        //  ldx, #$00
                0x20, 0x00, 0x10,  //> jsr
                0xe4, 0x03,        //  cpx, $03 - (z & c set if pass)
            ]
        },

    },

};


function load_test(ram, memdef) {
    for(const key in memdef) {
        const addr = parseInt(key);
        const arr = memdef[key];
        ram.apply(addr, arr);
    }
}
