#!/usr/bin/env python3
"""用无头 Chrome 的 DevTools Protocol 在真实浏览器里验证 H5 行为。

项目没有前端单测设施，而 dev 模式是否生效、localStorage 里存了什么、
请求头带没带 —— 这些都只在浏览器里才说得清。本机有一个开着 CDP 的
HeadlessChrome（默认 127.0.0.1:9222），这个脚本用它来跑真实校验。

用法：
    # 打开页面、等 JS 跑完、执行表达式并打印结果
    .venv-lineart/bin/python dev/cdp-check.py --url 'http://localhost:5173/?env=dev' \\
        --eval 'JSON.stringify(Object.keys(localStorage))'

    # 连开多个 URL 做对比
    .venv-lineart/bin/python dev/cdp-check.py --url A --url B --eval '...'
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.parse
import urllib.request

import websocket

CDP_HOST = "http://127.0.0.1:9224"   # 无头 Chrome 的调试端口（见 README 的启动命令）


def new_tab(url: str) -> str:
    """新建标签页并返回它的 websocket 调试地址。"""
    request = urllib.request.Request(f"{CDP_HOST}/json/new?{urllib.parse.quote(url, safe='')}", method="PUT")
    with urllib.request.urlopen(request, timeout=10) as response:
        return json.loads(response.read())["webSocketDebuggerUrl"]


def close_tab(ws_url: str) -> None:
    target_id = ws_url.rsplit("/", 1)[-1]
    try:
        request = urllib.request.Request(f"{CDP_HOST}/json/close/{target_id}", method="PUT")
        urllib.request.urlopen(request, timeout=5).read()
    except Exception:
        pass


class Session:
    def __init__(self, ws_url: str) -> None:
        self.ws = websocket.create_connection(ws_url, timeout=30)
        self.counter = 0

    def call(self, method: str, **params):
        self.counter += 1
        self.ws.send(json.dumps({"id": self.counter, "method": method, "params": params}))
        while True:
            message = json.loads(self.ws.recv())
            if message.get("id") == self.counter:
                if "error" in message:
                    raise RuntimeError(message["error"])
                return message.get("result", {})

    def evaluate(self, expression: str):
        result = self.call(
            "Runtime.evaluate",
            expression=expression,
            returnByValue=True,
            awaitPromise=True,
        )
        if "exceptionDetails" in result:
            raise RuntimeError(result["exceptionDetails"].get("text", "evaluate failed"))
        return result.get("result", {}).get("value")

    def close(self) -> None:
        self.ws.close()


def check(url: str, expression: str, settle: float, clear: bool = False) -> dict:
    ws_url = new_tab(url)
    try:
        session = Session(ws_url)
        session.call("Runtime.enable")
        session.call("Page.enable")
        time.sleep(settle)
        if clear:
            # 三个用例同源，localStorage 会互相污染；先清空再重载，保证从零开始
            session.evaluate("localStorage.clear(); sessionStorage.clear(); 'cleared'")
            session.call("Page.reload", ignoreCache=False)
            time.sleep(settle)
        value = session.evaluate(expression)
        session.close()
        return {"url": url, "value": value}
    finally:
        close_tab(ws_url)


STORAGE_EXPR = """(() => {
  const out = {};
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    out[key] = localStorage.getItem(key);
  }
  return JSON.stringify(out);
})()"""


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", action="append", required=True)
    parser.add_argument("--eval", dest="expression", default=STORAGE_EXPR)
    parser.add_argument("--settle", type=float, default=3.0, help="打开后等待秒数，默认 3")
    parser.add_argument("--clear", action="store_true", help="先清空 localStorage 再重载，避免同源用例互相污染")
    args = parser.parse_args()

    for url in args.url:
        try:
            outcome = check(url, args.expression, args.settle, args.clear)
            print(f"URL : {outcome['url']}")
            raw = outcome["value"]
            try:
                print("结果:", json.dumps(json.loads(raw), ensure_ascii=False, indent=2))
            except (TypeError, json.JSONDecodeError):
                print("结果:", raw)
        except Exception as error:  # noqa: BLE001 - 诊断脚本，直接打印原因
            print(f"URL : {url}\n失败: {error}", file=sys.stderr)
        print("-" * 60)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
