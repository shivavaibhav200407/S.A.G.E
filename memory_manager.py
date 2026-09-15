import sys
import json
import os
from typing import List, Dict

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

MEMORY_FILE = "conversation_memory.json"

def load_conversation_history() -> List[Dict[str, str]]:
    """Loads past conversation turns from disk."""
    if not os.path.exists(MEMORY_FILE):
        return []
    try:
        with open(MEMORY_FILE, "r") as f:
            return json.load(f)
    except Exception as e:
        print(f"[Memory Error] Could not read memory file: {e}")
        return []

def append_to_memory(role: str, content: str):
    """Appends a new turn (role: 'student' or 'sage') to memory file."""
    history = load_conversation_history()
    history.append({"role": role, "content": content})
    try:
        with open(MEMORY_FILE, "w") as f:
            json.dump(history, f, indent=2)
    except Exception as e:
        print(f"[Memory Error] Could not save memory: {e}")

def get_formatted_context(max_turns: int = 4) -> str:
    """Formats the last N conversation turns for LLM prompt context injection."""
    history = load_conversation_history()
    if not history:
        return "No prior context."
    
    recent_history = history[-max_turns:]
    formatted = []
    for turn in recent_history:
        role_label = "Student" if turn["role"] == "student" else "SAGE"
        formatted.append(f"{role_label}: {turn['content']}")
    
    return "\n".join(formatted)

def clear_memory():
    """Resets conversation history file."""
    if os.path.exists(MEMORY_FILE):
        os.remove(MEMORY_FILE)
        print("[Memory Manager]: Conversation history cleared.")

# --- STANDALONE TEST BLOCK ---
if __name__ == "__main__":
    print("=" * 60)
    print("      🧠 TESTING MEMORY MANAGER      ")
    print("=" * 60)
    
    # 1. Clear previous memory for clean test
    clear_memory()
    
    # 2. Append test turns
    print("\n1. Writing test interaction to memory...")
    append_to_memory("student", "Hi SAGE, what are Python decorators?")
    append_to_memory("sage", "Decorators allow you to modify the behavior of a function without changing its source code.")
    
    # 3. Read back context
    print("\n2. Retrieving formatted recent context:")
    print(get_formatted_context())
    print("\n" + "=" * 60)