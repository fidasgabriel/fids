import re
import sys
import subprocess
import tempfile
from pathlib import Path

def transpile(code: str) -> str:
    js_code = code

    # Replace print(...) with console.log(...)
    js_code = re.sub(r"\blog\s*\(", "console.log(", js_code)

    # Replace 'dec' with 'let'
    js_code = re.sub(r"\bdec\b", "let", js_code)

    # Replace 'func' with 'function'
    js_code = re.sub(r"\bfunc\b", "function", js_code)

    # Replace 'const' with 'const' 
    js_code = re.sub(r"\bconst\b", "const", js_code)

    # Replace 'if' with 'if' 
    js_code = re.sub(r"\bif\s*\(", "if(", js_code)

    # Replace 'else' with 'else' 
    js_code = re.sub(r"\belse\b", "else", js_code)

    # Replace 'return' with 'return' 
    js_code = re.sub(r"\breturn\b", "return", js_code)

    # Replace 'look' with 'switch' 
    js_code = re.sub(r"\blook\s*\(", "switch(", js_code)

    # Replace 'when' with 'case' 
    js_code = re.sub(r"\bwhen\b", "case", js_code)

    # Replace 'while' with 'while' 
    js_code = re.sub(r"\bwhile\b", "while", js_code)

    # Replace 'do while' with 'do while' 
    js_code = re.sub(r"\bdo\b", "do", js_code)

    # Replace 'for' with 'for' 
    js_code = re.sub(r"\bfor\b", "for", js_code)

    # Replace 'break' with 'break' 
    js_code = re.sub(r"\bbreak\b", "break", js_code)

    # Replace 'keep' with 'continue' 
    js_code = re.sub(r"\bkeep\b", "continue", js_code)
    
    # (Optional) More transformations will go here later
    return js_code

RESERVED = {
    "dec", "func", "const", "if", "else", "return",
    "look", "when", "while", "do", "for", "break", "keep", "log"
}


def validate(code: str):
    # Match identifiers (not numbers or symbols)
    tokens = re.findall(r"[a-zA-Z_][a-zA-Z0-9_]*", code)

    for token in tokens:
        if token in RESERVED:
            # Allow if it's being used as a keyword (e.g., "dec", "if") 
            # but forbid if it's being used as a variable name
            # simplest way: check if it's followed by = or ( in code
            if re.search(rf"\b{token}\b\s*=", code) or re.search(rf"\b{token}\b\s*\(", code):
                raise SyntaxError(f"Invalid use of reserved word '{token}' as identifier.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python index.py program.toy")
        sys.exit(1)

    fids_file = Path(sys.argv[1])
    if not fids_file.exists():
        print(f"File {fids_file} not found.")
        sys.exit(1)

    fids_code = fids_file.read_text()

    try:
        validate(fids_code)
    except SyntaxError as e:
        print("Syntax Error:", e)
        sys.exit(1)

    js = transpile(fids_code)
    print("Transpiled JS:\n", js)

    # Save to .js file with same name
    js_file = fids_file.with_suffix(".js")
    js_file.write_text(js)
    print(f"JavaScript written to {js_file}\n")

    # Run with Node.js
    try:
        output = subprocess.check_output(["node", str(js_file)], text=True)
        print("Program output:\n", output)
    except FileNotFoundError:
        print("Node.js not found, but transpilation works.")
