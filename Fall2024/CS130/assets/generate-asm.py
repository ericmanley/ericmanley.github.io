# Made by Evan Scherrer 11/05/2024

# INSTRUCTIONS
# 1. Write a MIPS program in Mars and assemble it
# 2. In Mars, go to File > Dump Memory (or Ctrl-D)
# 3. Ensure the proper Memory Segment is selected from the program you wrote
# 4. Change the Dump Format to "Hexadecimal Text"
# 5. Click "Dump To File", enter a filename, and Save
# 6. Move that file to the location of this script
# 7. Change the INPUT_ASM_FILE variable below to the name of that file
# 8. Change the OUTPUT_ASM_FILE variable below to whatever you like
# 9. Run the script
# 10. Import the output file into Logisim:
# 10a. Select your ROM component
# 10b. Under the Properties tab (lower left), select Contents > "(click to edit)"
# 10c. In the new window that just opened, click "Open...", and select the file you just generated
# 10d. Click "Close Window"
# 11. Done! Run your CPU as usual.

INPUT_ASM_FILE = "mipstest.in"
OUTPUT_ASM_FILE = "mipstest.out"

def main():
    # read all the instructions from the input file - each line is one instruction
    with open(INPUT_ASM_FILE, 'r') as inp:
        instructions: list[str] = inp.read().splitlines()
    
    # this is the header of the logisim files - not sure why, but I put it in to be safe
    OUTPUT_STR = "v3.0 hex words addressed\n"

    # counts up for each group of four instructions
    ctr = hex_counter()
    # each line has four instructions on it - we keep track of those here
    line_group = []

    for i, instruction in enumerate(instructions, 1):
        # individual bytes of the instruction
        # `zip` goes through the instruction, gathering pairs of characters
        # `map` takes the tuple returned by `zip`, and puts the elements in a string
        bytes = list(map(lambda t: f'{t[0]}{t[1]}', zip(instruction[::2], instruction[1::2])))

        # add the instruction to the line group
        line_group.append(' '.join(reversed(bytes)))

        # put every four instructions on a new line
        if i % 4 == 0 or i == len(instructions):
            # if we've run out of instructions, fill the rest of the line with zeros
            line_group = line_group + ['00 00 00 00'] * (4 - len(line_group))

            # format it as 4-digit hex value left-padded by zeros
            line = f'{next(ctr):04x}: '
            line += ' '.join(line_group) + '\n'

            line_group = []

            OUTPUT_STR += line
    
    # save to a file
    with open(OUTPUT_ASM_FILE, 'w') as output:
        output.write(OUTPUT_STR)

# generator that counts up in hex - see https://wiki.python.org/moin/Generators
def hex_counter():
    count = 0x0000
    while True:
        yield count
        count += 0x0010

if __name__ == '__main__':
    main()