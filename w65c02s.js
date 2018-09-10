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


    //                                            n v b d i z c
    // ADC   a + m + c -> a, c                    + + - - - + +
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
        r_flags = (r_a == 0) ? (r_flags | flag_z) : (r_flags & ~flag_z);
        r_flags = (sum > 0xff) ? (r_flags | flag_c) : (r_flags & ~flag_c);
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // AND   a & m -> a                           + - - - - + -
    //
    function and(memfn) {
        r_a &= memfn.read();
        r_flags = (r_a & 0x80) ? (r_flags | flag_n) : (r_flags & ~flag_n);
        r_flags = (r_a == 0) ? (r_flags | flag_z) : (r_flags & ~flag_z);
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // ASL   c <- [76543210] <- 0                 + - - - - + +
    //
    function asl(memfn) {
        const val = memfn.read();
        const res = val << 1;
        memfn.write(res);
        r_flags = (res & 0x80) ? (r_flags | flag_n) : (r_flags & ~flag_n);
        r_flags = (res == 0) ? (r_flags | flag_z) : (r_flags & ~flag_z);
        r_flags = (val & 0x80) ? (r_flags | flag_c) : (r_flags & ~flag_c);
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // BBRb   branch on bit b reset               - - - - - - -
    //
    function bbr(b) {
        return {["bbr"+b]: (memfn) => {
            const val = memfn.read();
            const offs = memfn.offset();
            if(!((val >> b) & 0x01)) {
                memfn.branch(offs);
                return memfn.cycles + 1;
            }
            return memfn.cycles;
        }}["bbr"+b];
    };

    //                                            n v b d i z c
    // BBSb   branch on bit b set                 - - - - - - -
    //
    function bbs(b) {
        return {["bbs"+b]: (memfn) => {
            const val = memfn.read();
            const offs = memfn.offset();
            if((val >> b) & 0x01) {
                memfn.branch(offs);
                return memfn.cycles + 1;
            }
            return memfn.cycles;
        }}["bbs"+b];
    };


    //                                            n v b d i z c
    // BCC   branch on carry clear (c = 0)        - - - - - - -
    //
    function bcc(memfn) {
        const offs = memfn.offset();
        if(!(r_flags & flag_c)) {
            memfn.branch(offs);
            return memfn.cycles + 1;
        }
        return memfn.cycles;
    };
    //                                            n v b d i z c
    // BCS   branch on carry set (c = 1)          - - - - - - -
    //
    function bcs(memfn) {
        const offs = memfn.offset();
        if(r_flags & flag_c) {
            memfn.branch(offs);
            return memfn.cycles + 1;
        }
        return memfn.cycles;
    };
    //                                            n v b d i z c
    // BEQ   branch on result zero (z = 1)        - - - - - - -
    //
    function beq(memfn) {
        const offs = memfn.offset();
        if(r_flags & flag_z) {
            memfn.branch(offs);
            return memfn.cycles + 1;
        }
        return memfn.cycles;
    };

    //                                            n  v  b d i z c
    // BIT   a & m -> z, m7 -> n, m6 -> v         m7 m6 - - - - -
    //
    function bit(memfn) {
        const val = memfn.read();
        // a & m -> z
        r_flags = (val & r_a) ? (r_flags | flag_z) : (r_flags & ~flag_z);
        // m7 -> n
        r_flags = (val & r_flags.n) ? (r_flags | flag_n) : (r_flags & ~flag_n);
        // m6 -> v
        r_flags = (val & r_flags.v) ? (r_flags | flag_v) : (r_flags & ~flag_v);
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // BMI   branch on result minus (n = 1)       - - - - - - -
    //
    function bmi(memfn) {
        const offs = memfn.offset();
        if(r_flags & flag_n) {
            memfn.branch(offs);
            return memfn.cycles + 1;
        }
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // BNE   branch on result not zero (z = 0)    - - - - - - -
    //
    function bne(memfn) {
        const offs = memfn.offset();
        if(!(r_flags & flag_z)) {
            memfn.branch(offs);
            return memfn.cycles + 1;
        }
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // BPL   branch on result plus (n = 0)        - - - - - - -
    //
    function bpl(memfn) {
        const offs = memfn.offset();
        if(!(r_flags & flag_n)) {
            memfn.branch(offs);
            return memfn.cycles + 1;
        }
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // BRA   branch always                        - - - - - - -
    //
    function bra(memfn) {
        const offs = memfn.offset();
        memfn.branch(offs);
        return memfn.cycles + 1;
    }


// TODO: clear decimal?  interrupt & push pc / sr?
    //                                            n v b d i z c
    // BRK   Break                                - - 1 - 1 - -
    //
    function brk(memfn) {
        r_flags = (r_flags | flag_b);
        r_flags = (r_flags | flag_i);
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // CLC   C -> 0                               - - - - - - 0
    //
    function clc(memfn) {
        r_flags = (r_flags & ~flag_c);
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // CLD   D -> 0                               - - - 0 - - -
    //
    function cld(memfn) {
        r_flags = (r_flags & ~flag_d);
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // CLI   I -> 0                               - - - - 0 - -
    //
    function cli(memfn) {
        r_flags = (r_flags & ~flag_i);
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // LDA   M -> A                               + - - - - + -
    //
    function lda(memfn) {
        r_a = memfn.read();
        r_flags = (r_a & 0x80) ? (r_flags | flag_n) : (r_flags & ~flag_n);
        r_flags = (r_a == 0) ? (r_flags | flag_z) : (r_flags & ~flag_z);
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // ORA   A | M -> A                           + - - - - + -
    //
    function ora(memfn) {
        r_a |= memfn.read();
        r_flags = (r_a & 0x80) ? (r_flags | flag_n) : (r_flags & ~flag_n);
        r_flags = (r_a == 0) ? (r_flags | flag_z) : (r_flags & ~flag_z);
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // SEC   1 -> C                               - - - - - - 1
    //
    function sec(memfn) {
        r_flags = (r_flags | flag_c);
        return memfn.cycles;
    }

    //                                            n v b d i z c
    // SED   1 -> D                               - - - 1 - - -
    //
    function sed(memfn) {
        r_flags = (r_flags | flag_d);
        return memfn.cycles;
    }


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
    const am = {
        // 1. Absolute  a
        absolute: {
            read:  () => { return read_byte(pc_pop_word()); },
            write: (val) =>    { write_byte(pc_pop_word(), val); },
            bytes: 2,
            cycles: 4  // TODO: +2 on write
        },
        // 2. Absolute Indexed Indirect  (a,x)   (used for jmp)
        absolute_x_indirect: {
            read:  () => { return read_word(pc_pop_word() + r_x); },
            bytes: 2,
            cycles: 5
        },
        // 3. Absolute Indexed with X  a,x
        absolute_x: {
            read:  () => { return read_byte(pc_pop_word() + r_x); },
            write: (val) =>    { write_byte(pc_pop_word() + r_x, val); },
            bytes: 2,
            cycles: 4  // TODO: +1 page boundary, +2 on write
        },
        // 4. Absolute Indexed with Y  a,y
        absolute_y: {
            read:  () => { return read_byte(pc_pop_word() + r_y); },
            //write: (val) =>    { write_byte(pc_pop_word() + r_y, val); },
            bytes: 2,
            cycles: 4  // TODO: +1 page boundary
        },
        // 5. Absolute Indirect  (a)   (used for jmp)
        absolute_indirect: {
            read:  () => { return read_word(pc_pop_word()); },
            bytes: 2,
            cycles: 4  // TODO: +2 on write
        },
        // 6. Accumulator  A
        accumulator: {
            read:  () => { return r_a; },
            write: (val) => { r_a = (val & 0xff); },
            bytes: 0,
            cycles: 2
        },
        // 7. Immediate  #
        immediate: {
            read: pc_pop_byte,
            bytes: 1,
            cycles: 2
        },
        // 8. Implied  i
        implied: {
            bytes: 0,
            cycles: 2
        },
        // 9a. Program Counter Relative  r
        relative_pc: {
            offset: pc_pop_byte,
            branch: (offs) => { r_pc += (offs & 0xff); if(offs & 0x80) r_pc -= 0x100; },
            bytes: 1,
            cycles: 2  // +1 if branch
        },
        // 9b. Zero Page Program Counter Relative  r
        //     note: not explicity described in the w65c02s datasheet
        //           but applies to BBRb zp,offs and BBSb zp,offs operations
        //           BBRb and BBSb are three byte operations
        zero_page_relative_pc: {
            read: () => { return read_byte(pc_pop_byte()); },
            offset: pc_pop_byte,
            branch: (offs) => { r_pc += (offs & 0xff); if(offs & 0x80) r_pc -= 0x100; },
            bytes: 2,
            cycles: 2  // +1 if branch
        },
        // 10. Stack  s
        relative_stack: {
            bytes: 0,  // TODO: up to +3 stack bytes
            cycles: 3  // TODO: +4 possible 
        },
        // 11. Zero Page  zp
        zero_page: {
            read:  () => { return read_byte(pc_pop_byte()); },
            write: (val) =>    { write_byte(pc_pop_byte(), val); },
            bytes: 1,
            cycles: 3  // TODO: +2 on write
        },
        // 12. Zero Page Indexed Indirect  (zp,x)
        zero_page_x_indirect: {
            read:  () => { return read_byte(read_word((pc_pop_byte() + r_x) & 0xff)); },
            write: (val) =>    { write_byte(read_word((pc_pop_byte() + r_x) & 0xff), val); },
            bytes: 1,
            cycles: 6
        },
        // 13. Zero Page Indexed with X  zp,x
        zero_page_x: {
            read:  () => { return read_byte((pc_pop_byte() + r_x) & 0xff); },
            write: (val) =>   { write_byte(((pc_pop_byte() + r_x) & 0xff), val); },
            bytes: 1,
            cycles: 4  // TODO: +2 on write
        },
        // 14. Zero Page Indexed with Y  zp,y
        zero_page_y: {
            read:  () => { return read_byte((pc_pop_byte() + r_y) & 0xff); },
            write: (val) =>   { write_byte(((pc_pop_byte() + r_y) & 0xff), val); },
            bytes: 1,
            cycles: 4  // TODO: +2 on write
        },
        // 15. Zero Page Indirect  (zp)
        zero_page_indirect: {
            read:  () => { return read_byte(read_word(pc_pop_byte())); },
            write: (val) =>    { write_byte(read_word(pc_pop_byte()), val); },
            bytes: 1,
            cycles: 5
        },
        // 16. Zero Page Indirect Indexed with Y  (zp),y
        zero_page_indirect_y: {
            read:  () => { return read_byte((read_word(pc_pop_byte()) + r_y) & 0xffff); },
            write: (val) =>   { write_byte(((read_word(pc_pop_byte()) + r_y) & 0xffff), val); },
            bytes: 1,
            cycles: 5
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

        0x0f: [bbr(0), am.zero_page_relative_pc],
        0x1f: [bbr(1), am.zero_page_relative_pc],
        0x2f: [bbr(2), am.zero_page_relative_pc],
        0x3f: [bbr(3), am.zero_page_relative_pc],
        0x4f: [bbr(4), am.zero_page_relative_pc],
        0x5f: [bbr(5), am.zero_page_relative_pc],
        0x6f: [bbr(6), am.zero_page_relative_pc],
        0x7f: [bbr(7), am.zero_page_relative_pc],

        0x8f: [bbs(0), am.zero_page_relative_pc],
        0x9f: [bbs(1), am.zero_page_relative_pc],
        0xaf: [bbs(2), am.zero_page_relative_pc],
        0xbf: [bbs(3), am.zero_page_relative_pc],
        0xcf: [bbs(4), am.zero_page_relative_pc],
        0xdf: [bbs(5), am.zero_page_relative_pc],
        0xef: [bbs(6), am.zero_page_relative_pc],
        0xff: [bbs(7), am.zero_page_relative_pc],

        0x90: [bcc, am.relative_pc],
        0xb0: [bcs, am.relative_pc],
        0xf0: [beq, am.relative_pc],

        0x2c: [bit, am.absolute],
        0x3c: [bit, am.absolute_x],
        0x89: [bit, am.immediate],
        0x24: [bit, am.zero_page],
        0x34: [bit, am.zero_page_x],

        0x30: [bmi, am.relative_pc],
        0xd0: [bne, am.relative_pc],
        0x10: [bpl, am.relative_pc],
        0x80: [bra, am.relative_pc],

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

