import subprocess
import time

PORT = 3001

# 查找占用端口的 PID
result = subprocess.run(
    f"netstat -ano | findstr :{PORT}",
    shell=True, capture_output=True, text=True
)

if result.stdout:
    for line in result.stdout.split('\n'):
        parts = line.split()
        if len(parts) >= 5:
            pid = parts[-1]
            try:
                subprocess.run(f"taskkill /F /PID {pid}", shell=True, capture_output=True)
                print(f"已清理 PID {pid}")
            except:
                pass

# 等待端口释放
time.sleep(2)
