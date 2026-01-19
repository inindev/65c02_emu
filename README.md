# W65C02S Emulator

A complete W65C02S (CMOS 6502) processor emulator written in JavaScript with an interactive trainer/debugger interface.

🚀 **[Try it live!](https://inindev.github.io/65c02_emu/)**

🧪 **[Klaus Dormann 6502 Test Suite](https://inindev.github.io/65c02_emu/kd_test/)**

## Features

- **Full W65C02S instruction set** - All 65C02 opcodes including CMOS-specific instructions
- **Interactive trainer/debugger** - Visual register inspector, memory viewer, single-step execution
- **Browser-based** - No installation required, runs entirely in the browser
- **Validation tested** - Passes Klaus Dormann's comprehensive 6502 functional test suite (~88M cycles)

## Quick Start

### Online Demo

Try the emulator immediately: **https://inindev.github.io/65c02_emu/**

### Local Development

1. **Start the Web Server**

```bash
sh http_server.sh
```

This starts a local HTTP server on port 8000.

2. **Open the Trainer**

Navigate to: **http://localhost:8000/**

## Project Structure

```
├── index.html          # Main trainer/debugger interface
├── w65c02s.js          # W65C02S CPU emulator core
├── ram.js              # Memory implementation
├── display.js          # UI and debugger logic
├── kd_test/            # Klaus Dormann test harness
│   ├── README.md       # Test suite documentation
│   ├── index.html      # Test runner interface
│   ├── test_harness.js # Test execution engine
│   └── test_ui.js      # Test UI controller
└── test/               # Legacy test interface
    ├── index.html
    └── tests.js
```

## Using the Trainer/Debugger

The main interface (`index.html`) provides:

### Register Inspector
- View and edit all CPU registers (PC, A, X, Y, SP)
- Monitor processor flags (N, V, B, D, I, Z, C)
- Click any value to edit directly

### Memory Viewer
- Hexadecimal memory dump
- Navigate to any address
- View disassembled instructions

### Execution Controls
- **Step** - Execute one instruction
- **Run** - Continuous execution
- **Stop** - Halt execution
- **Reset** - Reset CPU to initial state

### Code Entry
- Enter 6502 assembly code or hex bytes
- Load programs into memory
- Execute from any address

## Validation

This emulator has been validated against Klaus Dormann's comprehensive 6502 functional test suite, which exercises:
- All instruction opcodes and addressing modes
- Flag behavior (N, V, Z, C)
- Stack operations
- Interrupt handling

See [kd_test/README.md](kd_test/README.md) for details on running the test suite.

**Test Results:**
- ✅ 6502 Functional Test: **PASSED** (87,947,229 cycles)
- ✅ 65C02 Extended Opcodes: **PASSED**

## Architecture

### W65C02S Core (`w65c02s.js`)

The emulator implements:
- All 17 addressing modes (absolute, zero page, indexed, indirect, etc.)
- Complete instruction set including 65C02 extensions
- Accurate flag behavior and timing
- Stack operations with proper push/pull semantics

Key classes:
- `W65C02S` - Main CPU emulator
- `Register6502` - Register file (A, X, Y, PC, SP, flags)
- `Flags6502` - Processor status register

### Memory Model (`ram.js`)

- 64KB addressable memory space
- Read/write operations
- 16-bit word operations (little-endian)

### Display/Debugger (`display.js`)

- Real-time register updates
- Memory visualization
- Disassembly view
- Execution control

## Development

### Browser Compatibility

Works in all modern browsers with ES6 support:
- Chrome/Edge
- Firefox
- Safari

### Local Development

No build process required - pure JavaScript:

```bash
# Start local server
sh http_server.sh

# Or use Python's built-in server
python3 -m http.server 8000
```

## Technical Details

### W65C02S Specifications

- **Architecture**: 8-bit CMOS microprocessor
- **Address Space**: 64KB (16-bit addressing)
- **Registers**: A (accumulator), X, Y (index), PC (program counter), SP (stack pointer)
- **Flags**: N (negative), V (overflow), B (break), D (decimal), I (interrupt), Z (zero), C (carry)
- **Stack**: 256 bytes (0x0100-0x01FF), descending

### References

- [W65C02S Datasheet](http://www.wdesignc.com/wdc/documentation/w65c02s.pdf)
- [6502 Flag Tutorial](http://www.6502.org/tutorials/vflag_html)
- [Klaus Dormann Test Suite](https://github.com/Klaus2m5/6502_65C02_functional_tests)

## Known Bugs Fixed

- ✅ **PHP instruction** - Now correctly sets B flag when pushing status to stack
- ✅ **BRK instruction** - Now properly pushes PC+2 and status, sets flags, jumps to IRQ vector

## License

GNU General Public License v3.0

Copyright © 2018 John Clark

See [LICENSE](LICENSE) for full license text.

## Contributing

Bug reports and pull requests welcome! This emulator aims for cycle-accurate emulation of the W65C02S.

### Testing Changes

Always run the Klaus Dormann test suite after making changes:

```bash
# See kd_test/README.md for setup
cd kd_test
# Download test binaries (see README)
# Open http://localhost:8000/kd_test
# Load and run tests
```

## Credits

- **CPU Implementation**: John Clark
- **Test Suite**: Klaus Dormann ([6502_65C02_functional_tests](https://github.com/Klaus2m5/6502_65C02_functional_tests))
- **W65C02S Specifications**: Western Design Center ([Datasheet](https://www.westerndesigncenter.com/wdc/documentation/w65c02s.pdf))
