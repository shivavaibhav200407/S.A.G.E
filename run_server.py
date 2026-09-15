import os
import sys
import socket
import subprocess

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def get_network_ip():
    """Detects the primary LAN/Wi-Fi IPv4 address of this machine."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Doesn't need to be reachable, just used to query the active routing interface
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

def main():
    port = 8000
    local_ip = get_network_ip()

    print("=" * 72)
    print("  🚀 SAGE Self-Adaptive Educational Platform")
    print("=" * 72)
    print(f"  👉 Local Host Access:     http://localhost:{port}/")
    print(f"                            http://127.0.0.1:{port}/")
    print(f"  📱 Network Host Access:   http://{local_ip}:{port}/")
    print("     (Connect from any smartphone, tablet, or PC on this Wi-Fi/LAN)")
    print("=" * 72)
    print("  Press Ctrl+C to stop the server at any time.\n")

    python_executable = sys.executable
    cmd = [python_executable, "manage.py", "runserver", f"0.0.0.0:{port}"]
    
    try:
        subprocess.run(cmd)
    except KeyboardInterrupt:
        print("\n[INFO] SAGE Server stopped cleanly.")

if __name__ == "__main__":
    main()
