import subprocess
import sys
import time
import os

# 自动获取脚本所在目录
BOT_DIR = os.path.dirname(os.path.abspath(__file__))
NODE_CMD = ["node", "app.js"]

def restart_sequence():
    print("**" * 40)
    print("  [Python] 正在执行重启序列...")
    print("**" * 40)
    
    log_file = os.path.join(BOT_DIR, "restart_log.txt")
    
    # 获取从 Node.js 传过来的旧进程 PID
    old_pid = sys.argv[1] if len(sys.argv) > 1 else None
    
    try:
        with open(log_file, "w", encoding="utf-8") as f:
            f.write("=== 启动重启序列 ===\n")
            f.write(f"旧进程 PID: {old_pid}\n")
            f.write("即将查杀旧进程...\n")
        
        # 1. 核心：查杀旧的 Node.js 进程，释放端口
        if old_pid:
            print(f"  [Python] 正在关闭旧进程 (PID: {old_pid})...")
            # 强制结束旧进程
            kill_cmd = ["taskkill", "/f", "/pid", old_pid]
            subprocess.run(kill_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            time.sleep(1) # 等待 1 秒，确保端口完全释放

        with open(log_file, "a", encoding="utf-8") as f:
            f.write("旧进程查杀完毕，准备启动新窗口...\n")

        # 2. 启动新窗口
        print("  [Python] 正在发射新的机器人窗口...")
        process = subprocess.Popen(
            NODE_CMD,
            cwd=BOT_DIR,
            creationflags=subprocess.CREATE_NEW_CONSOLE
        )
        
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"新窗口已启动，PID: {process.pid}\n")

        print("  [Python] 新窗口已弹出！本窗口将在 3 秒后自动消失...")
        time.sleep(3)
        sys.exit(0)

    except Exception as e:
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"异常错误: {e}\n")
        print(f"  [错误] {e}")
        input("  发生异常，按回车键退出...")

if __name__ == "__main__":
    restart_sequence()
