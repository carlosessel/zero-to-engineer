"""A stand-in for the Anthropic Messages API, for testing chapter examples.

It runs on this machine and returns scripted replies in the same shape the
real API uses, including streaming. It lets the tests prove that an example's
SDK calls are valid and that the example handles replies correctly. It proves
nothing about what a real model would say.

Each scripted reply is a dict:
  {text: "..."}                       an ordinary answer
  {tool_use: {name: ..., input: {}}}  the model asks for a tool
  thinking: false                     leave out the leading thinking block

By default every reply starts with an empty `thinking` block, because current
models think before answering and return such a block. An example that reads
`content[0].text` therefore fails here, as it would against the real API.
"""
from __future__ import annotations

import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


class FakeAnthropic:
    def __init__(self):
        self.replies: list[dict] = []
        self.requests: list[dict] = []
        fake = self

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *args):
                pass

            def do_POST(self):
                body = json.loads(self.rfile.read(int(self.headers["content-length"])))
                fake.requests.append(body)
                if not self.path.startswith("/v1/messages"):
                    return self._json(404, {"type": "error", "error": {"type": "not_found_error", "message": self.path}})
                bad = [k for k in ("temperature", "top_p", "top_k") if k in body]
                if bad:
                    # What the real API does for current models.
                    return self._json(400, {"type": "error", "error": {"type": "invalid_request_error", "message": f"{bad[0]}: not supported on this model"}})
                reply = fake.replies.pop(0) if fake.replies else {"text": "OK."}
                content = []
                if reply.get("thinking", True):
                    content.append({"type": "thinking", "thinking": "", "signature": "sig-test"})
                if "text" in reply:
                    content.append({"type": "text", "text": reply["text"]})
                if "tool_use" in reply:
                    content.append({"type": "tool_use", "id": f"toolu_test{len(fake.requests)}", **reply["tool_use"]})
                message = {
                    "id": f"msg_test{len(fake.requests)}", "type": "message", "role": "assistant", "model": body["model"],
                    "content": content, "stop_reason": "tool_use" if "tool_use" in reply else "end_turn", "stop_sequence": None,
                    "usage": {"input_tokens": 25, "output_tokens": 40},
                }
                if body.get("stream"):
                    return self._stream(message)
                self._json(200, message)

            def _json(self, status, obj):
                data = json.dumps(obj).encode()
                self.send_response(status)
                self.send_header("content-type", "application/json")
                self.send_header("request-id", "req_test")
                self.send_header("content-length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)

            def _stream(self, message):
                self.send_response(200)
                self.send_header("content-type", "text/event-stream")
                self.send_header("request-id", "req_test")
                self.end_headers()

                def event(name, data):
                    self.wfile.write(f"event: {name}\ndata: {json.dumps({'type': name, **data})}\n\n".encode())
                    self.wfile.flush()

                event("message_start", {"message": {**message, "content": [], "stop_reason": None, "usage": {"input_tokens": 25, "output_tokens": 1}}})
                for i, block in enumerate(message["content"]):
                    if block["type"] == "text":
                        event("content_block_start", {"index": i, "content_block": {"type": "text", "text": ""}})
                        words = block["text"].split(" ")
                        for j, w in enumerate(words):
                            event("content_block_delta", {"index": i, "delta": {"type": "text_delta", "text": w + (" " if j < len(words) - 1 else "")}})
                    elif block["type"] == "thinking":
                        event("content_block_start", {"index": i, "content_block": {"type": "thinking", "thinking": "", "signature": ""}})
                        event("content_block_delta", {"index": i, "delta": {"type": "signature_delta", "signature": block["signature"]}})
                    else:
                        event("content_block_start", {"index": i, "content_block": {**block, "input": {}}})
                        event("content_block_delta", {"index": i, "delta": {"type": "input_json_delta", "partial_json": json.dumps(block["input"])}})
                    event("content_block_stop", {"index": i})
                event("message_delta", {"delta": {"stop_reason": message["stop_reason"], "stop_sequence": None}, "usage": {"output_tokens": 40}})
                event("message_stop", {})

        self.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        self.url = f"http://127.0.0.1:{self.server.server_address[1]}"
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
