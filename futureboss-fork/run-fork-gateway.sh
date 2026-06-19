#!/usr/bin/env bash
# 自編 fork gateway 啟停/回滾腳本
# 用途：用「含 Telegram typing + 去 Markdown 修正」的自編 binary 取代官方 v1.20.0 來跑 gateway。
# binary：futureboss-fork/target/release/duduclaw（cargo build --release -p duduclaw-cli --bin duduclaw）
# home： ~/.duduclaw（沿用既有 agent/token/Telegram 設定）
# port： 127.0.0.1:18789
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN="$HERE/target/release/duduclaw"
OFFICIAL="duduclaw"                       # Homebrew/npm 安裝的官方 binary（PATH 內）
LOG="$HOME/.duduclaw/gateway-fork.log"
PORT=18789

# 自動載入專案根的 .env（不進版控）。讓 GOOGLE_OAUTH_CLIENT_ID/SECRET、各 channel
# token 等只要寫進 .env 就會被 gateway 讀到，不必另外手動 export。
if [ -f "$HERE/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$HERE/.env"
  set +a
fi

stop_current() {
  local pid parent
  pid="$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t 2>/dev/null || true)"
  if [ -n "$pid" ]; then
    parent="$(ps -o ppid= -p "$pid" 2>/dev/null | tr -d ' ' || true)"
    echo "stopping gateway pid=$pid (parent=$parent) …"
    kill -TERM $pid ${parent:-} 2>/dev/null || true
    for _ in $(seq 1 20); do
      lsof -nP -iTCP:$PORT -sTCP:LISTEN -t >/dev/null 2>&1 || break
      sleep 0.5
    done
  fi
  lsof -nP -iTCP:$PORT -sTCP:LISTEN -t >/dev/null 2>&1 && { echo "port $PORT 仍被占用"; return 1; } || echo "port $PORT 已釋放"
}

case "${1:-start}" in
  start)
    [ -x "$BIN" ] || { echo "找不到自編 binary：$BIN（先 build）"; exit 1; }
    stop_current
    echo "啟動自編 gateway：$BIN"
    nohup "$BIN" gateway > "$LOG" 2>&1 &
    disown || true
    sleep 3
    if lsof -nP -iTCP:$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
      echo "OK，監聽 127.0.0.1:$PORT，log: $LOG"
    else
      echo "啟動失敗，看 log: $LOG"; tail -20 "$LOG" || true; exit 1
    fi
    ;;
  stop)
    stop_current
    ;;
  rollback)
    # 停自編，改回官方 v1.20.0
    stop_current
    echo "啟動官方 gateway：$OFFICIAL"
    nohup "$OFFICIAL" gateway > "$HOME/.duduclaw/gateway.log" 2>&1 &
    disown || true
    sleep 3
    lsof -nP -iTCP:$PORT -sTCP:LISTEN 2>/dev/null && echo "已回滾到官方版" || { echo "回滾啟動失敗"; exit 1; }
    ;;
  build)
    # 重新編譯（含 metal 本地推論：加 --features metal）
    . "$HOME/.cargo/env"
    cd "$HERE"
    cargo build --release -p duduclaw-cli --bin duduclaw "${@:2}"
    ;;
  status)
    pid="$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t 2>/dev/null || true)"
    [ -n "$pid" ] && ps -o pid,command -p "$pid" || echo "gateway 未在 $PORT 上執行"
    ;;
  *)
    echo "用法：$0 {start|stop|rollback|build|status}"; exit 1;;
esac
