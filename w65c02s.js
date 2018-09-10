//
//  W65C02S processor implementation in javascript
//
//  Copyright 2018, John Clark
//
//  Released under the GNU General Public License
//  https://www.gnu.org/licenses/gpl.html
//
//  ref: http://www.wdesignc.com/wdc/documentation/w65c02s.pdf
//       http://www.6502.org/tutorials/vflag_html
//


function W65C02S()
{
    'use strict';

    const mem = new Uint8Array(0x10000); // 64k

    let r_a = 0x00;
    let r_x = 0x00;
    let r_y = 0x00;
    let r_pc = 0x0000;
    let r_sp = 0xff;
    let r_flags = 0x20;

    const flag_n = 0x80;
    const flag_v = 0x40;
    const flag_b = 0x10;
    const flag_d = 0x08;
    const flag_i = 0x04;
    const flag_z = 0x02;
    const flag_c = 0x01;


    //                                         n v . b  d i z c
    // ADC   A + M + C -> A, C                 + + 1 -  - - + +
    //
    function adc(memfn) {
        const n1 = memfn.read();
        const n2 = r_a;
        let sum = (r_flags & flag_c);

        if(r_flags & flag_d) {  // bcd
            sum += (n1 & 0x0f) + (n2 & 0x0f);
            if(sum > 0x09) sum += 0x06;
            sum += (n1 & 0xf0) + (n2 & 0xf0);
            if(sum > 0x99) sum += 0x60;

            const sn1 = (n1 > 0x7f);
            const sn2 = (n2 > 0x7f);
            const ssum = (sum > 0x7f);
            r_flags = ((sn1^ssum) & (sn2^ssum)) ? (r_flags | flag_v) : (r_flags & ~flag_v);
        } else {
            sum += n1 + n2;
            r_flags = (((n1^sum) & (n2^sum)) & 0x80) ? (r_flags | flag_v) : (r_flags & ~flag_v);
        }
        r_a = (sum & 0xff);

        r_flags = (r_a & 0x80) ? (r_flags | flag_n) : (r_flags & ~flag_n);
        r_flags = (r_a ==0) ? (r_flags | flag_z) : (r_flags & ~flag_z);
        r_flags = (sum > 0xff) ? (r_flags | flag_c) : (r_flags & ~flag_c);
        return memfn.cycles;
    }

    //                                         n v . b  d i z c
    // AND   A & M -> A                        + - 1 -  - - + -
    //
    function and(memfn) {
        r_a &= memfn.read();
        r_flags = (r_a & 0x80) ? (r_flags | flag_n) : (r_flags & ~flag_n);
        r_flags = (r_a ==0) ? (r_flags | flag_z) : (r_flags & ~flag_z);
        return memfn.cycles;
    }

    //                                         n v . b  d i z c
    // ASL   C <- [76543210] <- 0              + - 1 -  - - + +
    //
    function asl(memfn) {
        const val = memfn.read();
        const res = val << 1;
        memfn.write(res);
        r_flags = (res & 0x80) ? (r_flags | flag_n) : (r_flags & ~flag_n);
        r_flags = (res ==0) ? (r_flags | flag_z) : (r_flags & ~flag_z);
        r_flags = (val & 0x80) ? (r_flags | flag_c) : (r_flags & ~flag_c);
        return memfn.cycles;
    }

    //                                         n v . b  d i z c
    // BBRb   Branch on bit b reset            - - 1 -  - - - -
    //
    function bbr(b) {
        return {["bbr"+b]: (memfn) => {
            const val = memfn.read();
            const offs = memfn.offset();
            if(!((val >> b) & 0x01)) memfn.write(offs);
            return memfn.cycles;
        }}["bbr"+b];
    };

    //                                         n v . b  d i z c
    // BBSb   Branch on bit b set              - - 1 -  - - - -
    //
    function bbs(b) {
        return {["bbs"+b]: (memfn) => {
            const val = memfn.read();
            const offs = memfn.offset();
            if((val >> b) & 0x01) memfn.write(offs);
            return memfn.cycles;
        }}["bbs"+b];
    };

// TODO: clear decimal?  interrupt & push pc / sr?
    //                                         n v . b  d i z c
    // BRK   Break                             - - 1 1  - 1 - -
    //
    function brk(memfn) {
        r_flags = (r_flags | flag_b);
//        r_flags = (r_flags | flag_i);
        return memfn.cycles;
    }

    //                                         n v . b  d i z c
    // CLC   C -> 0                            - - - - - 0
    //
    function clc(memfn) {
        r_flags = (r_flags & ~flag_c);
        return memfn.cycles;
    }

    //                                         n v . b  d i z c
    // CLD   D -> 0                            - - 1 -  0 - - -
    //
    function cld(memfn) {
        r_flags = (r_flags & ~flag_d);
        return memfn.cycles;
    }

    //                                         n v . b  d i z c
    // CLI   I -> 0                            - - 1 -  - 0 - -
    //
    function cli(memfn) {
        r_flags = (r_flags & ~flag_i);
        return memfn.cycles;
    }

    //                                         n v . b  d i z c
    // LDA   M -> A                            + - 1 -  - - + -
    //
    function lda(memfn) {
        r_a = memfn.read();
        r_flags = (r_a & 0x80) ? (r_flags | flag_n) : (r_flags & ~flag_n);
        r_flags = (r_a ==0) ? (r_flags | flag_z) : (r_flags & ~flag_z);
        return memfn.cycles;
    }

    //                                         n v . b  d i z c
    // ORA   A | M -> A                        + - 1 -  - - + -
    //
    function ora(memfn) {
        r_a |= memfn.read();
        r_flags = (r_a & 0x80) ? (r_flags | flag_n) : (r_flags & ~flag_n);
        r_flags = (r_a ==0) ? (r_flags | flag_z) : (r_flags & ~flag_z);
        return memfn.cycles;
    }

    //                                         n v . b  d i z c
    // SEC   1 -> C                            - - 1 -  - - - 1
    //
    function sec(memfn) {
        r_flags = (r_flags | flag_c);
        return memfn.cycles;
    }

    //                                         n v . b  d i z c
    // SED   1 -> D                            - - 1 -  1 - - -
    //
    function sed(memfn) {
        r_flags = (r_flags | flag_d);
        return memfn.cycles;
    }


    // addressing modes, pp.15-20
    //     1: absolute              // a       Absolute
    //     2: absolute_x_indirect   // (a,x)   Absolute Indexed Indirect
    //     3: absolute_x            // a,x     Absolute Indexed with X
    //     4: absolute_y            // a,y
    //     5: absolute_indirect,    // (a)     Absolute Indirect
    //     6: accumulator,          // A       Accumulator
    //     7: immediate,            // #       Immediate Addressing
    //     8: implied,              // i       Implied
    //     9: relative_pc,          // r       Program Counter Relative
    //    10: relative_stack,       // s       Stack
    //    11: zero_page,            // zp      Zero Page
    //    12: zero_page_x_indirect, // (zp,x)  Zero Page Indexed Indirect
    //    13: zero_page_x,          // zp,x    Zero Page Indexed with X
    //    14: zero_page_y,          // zp,y    Zero Page Indexed with Y
    //    15: zero_page_indirect,   // (zp)    Zero Page Indirect
    //    16: zero_page_indirect_y  // (zp),y  Zero Page Indirect Indexed with Y
    const am = {
        // 1. Absolute  a
        absolute: {
            read:  () => { return read_byte(pc_pop_word()); },
            write: (val) =>    { write_byte(pc_pop_word(), val); },
            cycles: 3
        },
        // 2. Absolute Indexed Indirect  (a,x)   (used for jmp)
        absolute_x_indirect: {
            read:  () => { return read_word(pc_pop_word() + r_x); },
            cycles: 3
        },
        // 3. Absolute Indexed with X  a,x
        absolute_x: {
            read:  () => { return read_byte(pc_pop_word() + r_x); },
            write: (val) =>    { write_byte(pc_pop_word() + r_x, val); },
            cycles: 3
        },
        // 4. Absolute Indexed with Y  a,y
        absolute_y: {
            read:  () => { return read_byte(pc_pop_word() + r_y); },
            write: (val) =>    { write_byte(pc_pop_word() + r_y, val); },
            cycles: 3
        },
        // 5. Absolute Indirect  (a)   (used for jmp)
        absolute_indirect: {
            read:  () => { return read_word(pc_pop_word()); },
            cycles: 3
        },
        // 6. Accumulator  A
        accumulator: {
            read:  () => { return r_a; },
            write: (val) => { r_a = (val & 0xff); },
            cycles: 1
        },
        // 7. Immediate  #
        immediate: {
            read: pc_pop_byte,
            cycles: 2
        },
        // 8. Implied  i
        implied: {
            cycles: 1
        },
        // 9. Program Counter Relative  r
        relative_pc: {
            read: () => { return read_byte(pc_pop_byte()); },
            offset: pc_pop_byte,
            write: (offs) => { r_pc += (offs & 0x80) ? (offs & 0xff) - 0x100 : (offs & 0xff) },
            cycles: 2
        },
        // 10. Stack  s
        relative_stack: {
            cycles: 1 // TODO: 1-4            
        },
        // 11. Zero Page  zp
        zero_page: {
            read:  () => { return read_byte(pc_pop_byte()); },
            write: (val) =>    { write_byte(pc_pop_byte(), val); },
            cycles: 2
        },
        // 12. Zero Page Indexed Indirect  (zp,x)
        zero_page_x_indirect: {
            read:  () => { return read_byte(read_word((pc_pop_byte() + r_x) & 0xff)); },
            write: (val) =>    { write_byte(read_word((pc_pop_byte() + r_x) & 0xff), val); },
            cycles: 2
        },
        // 13. Zero Page Indexed with X  zp,x
        zero_page_x: {
            read:  () => { return read_byte((pc_pop_byte() + r_x) & 0xff); },
            write: (val) =>   { write_byte(((pc_pop_byte() + r_x) & 0xff), val); },
            cycles: 2
        },
        // 14. Zero Page Indexed with Y  zp,y
        zero_page_y: {
            read:  () => { return read_byte((pc_pop_byte() + r_y) & 0xff); },
            write: (val) =>   { write_byte(((pc_pop_byte() + r_y) & 0xff), val); },
            cycles: 2
        },
        // 15. Zero Page Indirect  (zp)
        zero_page_indirect: {
            read:  () => { return read_byte(read_word(pc_pop_byte())); },
            write: (val) =>    { write_byte(read_word(pc_pop_byte()), val); },
            cycles: 2
        },
        // 16. Zero Page Indirect Indexed with Y  (zp),y
        zero_page_indirect_y: {
            read:  () => { return read_byte((read_word(pc_pop_byte()) + r_y) & 0xffff); },
            write: (val) =>   { write_byte(((read_word(pc_pop_byte()) + r_y) & 0xffff), val); },
            cycles: 2
        }
    };


    const opmap = {
        0x6d: [adc, am.absolute],
        0x7d: [adc, am.absolute_x],
        0x79: [adc, am.absolute_y],
        0x69: [adc, am.immediate],
        0x65: [adc, am.zero_page],
        0x61: [adc, am.zero_page_x_indirect],
        0x75: [adc, am.zero_page_x],
        0x72: [adc, am.zero_page_indirect],
        0x71: [adc, am.zero_page_indirect_y],

        0x2d: [and, am.absolute],
        0x3d: [and, am.absolute_x],
        0x39: [and, am.absolute_y],
        0x29: [and, am.immediate],
        0x25: [and, am.zero_page],
        0x21: [and, am.zero_page_x_indirect],
        0x35: [and, am.zero_page_x],
        0x32: [and, am.zero_page_indirect],
        0x31: [and, am.zero_page_indirect_y],

        0x0e: [asl, am.absolute],
        0x1e: [asl, am.absolute_x],
        0x0a: [asl, am.accumulator],
        0x06: [asl, am.zero_page],
        0x16: [asl, am.zero_page_x],

        0x0f: [bbr(0), am.relative_pc],
        0x1f: [bbr(1), am.relative_pc],
        0x2f: [bbr(2), am.relative_pc],
        0x3f: [bbr(3), am.relative_pc],
        0x4f: [bbr(4), am.relative_pc],
        0x5f: [bbr(5), am.relative_pc],
        0x6f: [bbr(6), am.relative_pc],
        0x7f: [bbr(7), am.relative_pc],

        0x8f: [bbs(0), am.relative_pc],
        0x9f: [bbs(1), am.relative_pc],
        0xaf: [bbs(2), am.relative_pc],
        0xbf: [bbs(3), am.relative_pc],
        0xcf: [bbs(4), am.relative_pc],
        0xdf: [bbs(5), am.relative_pc],
        0xef: [bbs(6), am.relative_pc],
        0xff: [bbs(7), am.relative_pc],

        0x00: [brk, am.relative_stack],

        0x18: [clc, am.implied],
        0xd8: [cld, am.implied],
        0x58: [cli, am.implied],

        0xad: [lda, am.absolute],
        0xbd: [lda, am.absolute_x],
        0xb9: [lda, am.absolute_y],
        0xa9: [lda, am.immediate],
        0xa5: [lda, am.zero_page],
        0xa1: [lda, am.zero_page_x_indirect],
        0xb5: [lda, am.zero_page_x],
        0xb2: [lda, am.zero_page_indirect],
        0xb1: [lda, am.zero_page_indirect_y],

        0x0d: [ora, am.absolute],
        0x1d: [ora, am.absolute_x],
        0x19: [ora, am.absolute_y],
        0x09: [ora, am.immediate],
        0x05: [ora, am.zero_page],
        0x01: [ora, am.zero_page_x_indirect],
        0x15: [ora, am.zero_page_x],
        0x12: [ora, am.zero_page_indirect],
        0x11: [ora, am.zero_page_indirect_y],

        0x38: [sec, am.implied],
        0xf8: [sed, am.implied],
    };


    // memory helpers
    function read_byte(addr) {
        return mem[addr & 0xffff];
    }
    function write_byte(addr, val) {
        mem[addr & 0xffff] = val & 0xff;
    }

    function read_word(addr) {
        return read_byte(addr+1)<<8 | read_byte(addr);
    }

    function pc_pop_byte() {
        return mem[r_pc++ & 0xffff];
    }
    function pc_pop_word() {
        return pc_pop_byte() | pc_pop_byte()<<8;
    }

    function get_regs() {
        return {
            a: r_a,
            x: r_x,
            y: r_y,
            pc: r_pc,
            sp: r_sp,
            flags: r_flags
        };
    }

    function set_pc(pc) {
        if(pc) r_pc = pc;
    }

    // step one instruction
    // return values
    //   >0  cycles for the operation
    //    0  stop execution
    //   <0  error
    function step(pc) {
        if(pc) r_pc = pc;

        const opcode = pc_pop_byte();
        const opentry = opmap[opcode];
        if(!opentry) return -1;

        const opfn = opentry[0];
        const memfn = opentry[1];
        return opfn(memfn);
    }

    function reset() {
        r_a = 0x00;
        r_x = 0x00;
        r_y = 0x00;
        r_pc = 0x0000;
        r_sp = 0xff;
        r_flags = 0x20;
    }

    const self = {
        get_regs: get_regs,
        set_pc: set_pc,
        step: step,
        reset: reset,
        mem: mem
    };
    return self;
}

