import os
import sys

# Ensure project root is in sys.path when running standalone from scripts/
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from supervisor import route_user_request
from memory_manager import clear_memory

def start_sage_cli():
    print("=" * 60)
    print("      🧠 SAGE: SELF-ADAPTIVE LEARNING ENGINE (CLI)      ")
    print("=" * 60)
    print("Type your message or query below. Type 'exit' or 'quit' to stop.")
    print("Type 'clear' to reset conversation memory.\n")

    while True:
        try:
            user_input = input("You: ").strip()
            
            if not user_input:
                continue
                
            if user_input.lower() in ["exit", "quit"]:
                print("\nExiting SAGE. Happy learning!")
                break
                
            if user_input.lower() == "clear":
                clear_memory()
                continue

            # Route through Supervisor Engine
            response = route_user_request(user_input)
            print(f"\nSAGE:\n{response}\n")
            print("-" * 60)

        except KeyboardInterrupt:
            print("\nExiting SAGE. Happy learning!")
            sys.exit(0)

if __name__ == "__main__":
    start_sage_cli()