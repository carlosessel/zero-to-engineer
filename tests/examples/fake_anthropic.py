"""A stand-in for the Anthropic Messages API, for testing chapter examples.

It runs on this machine and returns scripted replies in the same shape the
real API uses, including streaming. It lets the tests prove that an example's
SDK calls are valid and that the example handles replies correctly. It proves
nothing about what a real model would say.

Each scripted reply is a dict:
  {text: "..."}                       an ordinary answer
  {tool_use: {name: ..., input: {}}}  the model asks for a tool
  thinking: false                     leave out the leading thinking block
  stop_reason: "max_tokens"           report a different stop reason

It also answers token counting (an estimate of one token per four characters),
Message Batches (each batch ends at once, every request succeeding with the next
scripted reply), and prompt caching: a request with `cache_control` reports the
cacheable part as written to the cache the first time and read from it after.

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
        self.batches: dict[str, dict] = {}
        self.cached: set[str] = set()
        fake = self

        def make_message(body, n):
            reply = fake.replies.pop(0) if fake.replies else {"text": "OK."}
            content = []
            if reply.get("thinking", True):
                content.append({"type": "thinking", "thinking": "", "signature": "sig-test"})
            if "text" in reply:
                content.append({"type": "text", "text": reply["text"]})
            if "tool_use" in reply:
                content.append({"type": "tool_use", "id": f"toolu_test{n}", **reply["tool_use"]})
            usage = {"input_tokens": 25, "output_tokens": 40, "cache_creation_input_tokens": 0, "cache_read_input_tokens": 0}
            if "cache_control" in json.dumps(body):
                # Everything before the user's last message counts as the cached prefix.
                prefix = json.dumps({k: body.get(k) for k in ("tools", "system")}) + json.dumps(body["messages"][:-1])
                size = max(len(prefix) // 4, 1)
                if prefix in fake.cached:
                    usage["cache_read_input_tokens"] = size
                else:
                    fake.cached.add(prefix)
                    usage["cache_creation_input_tokens"] = size
            stop = reply.get("stop_reason") or ("tool_use" if "tool_use" in reply else "end_turn")
            return {
                "id": f"msg_test{n}", "type": "message", "role": "assistant", "model": body["model"],
                "content": content, "stop_reason": stop, "stop_sequence": None, "usage": usage,
            }

        def batch_object(batch_id):
            b = fake.batches[batch_id]
            return {
                "id": batch_id, "type": "message_batch", "processing_status": "ended",
                "request_counts": {"processing": 0, "succeeded": len(b), "errored": 0, "canceled": 0, "expired": 0},
                "created_at": "2026-11-12T10:00:00Z", "ended_at": "2026-11-12T10:01:00Z",
                "expires_at": "2026-11-13T10:00:00Z", "cancel_initiated_at": None, "archived_at": None,
                "results_url": f"{fake.url}/v1/messages/batches/{batch_id}/results",
            }

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *args):
                pass

            def do_POST(self):
                body = json.loads(self.rfile.read(int(self.headers["content-length"])))
                fake.requests.append(body)
                if self.path.startswith("/v1/messages/count_tokens"):
                    return self._json(200, {"input_tokens": max(len(json.dumps(body)) // 4, 1)})
                if self.path.startswith("/v1/messages/batches"):
                    batch_id = f"msgbatch_test{len(fake.batches) + 1}"
                    fake.batches[batch_id] = [
                        {"custom_id": r["custom_id"], "result": {"type": "succeeded", "message": make_message(r["params"], i)}}
                        for i, r in enumerate(body["requests"], start=1)
                    ]
                    return self._json(200, batch_object(batch_id))
                if not self.path.startswith("/v1/messages"):
                    return self._json(404, {"type": "error", "error": {"type": "not_found_error", "message": self.path}})
                bad = [k for k in ("temperature", "top_p", "top_k") if k in body]
                if bad:
                    # What the real API does for current models.
                    return self._json(400, {"type": "error", "error": {"type": "invalid_request_error", "message": f"{bad[0]}: not supported on this model"}})
                message = make_message(body, len(fake.requests))
                if body.get("stream"):
                    return self._stream(message)
                self._json(200, message)

            def do_GET(self):
                parts = self.path.split("?")[0].strip("/").split("/")
                # /v1/messages/batches/<id> and /v1/messages/batches/<id>/results
                if parts[:3] == ["v1", "messages", "batches"] and len(parts) >= 4 and parts[3] in fake.batches:
                    if len(parts) == 5 and parts[4] == "results":
                        data = "".join(json.dumps(r) + "\n" for r in fake.batches[parts[3]]).encode()
                        self.send_response(200)
                        self.send_header("content-type", "application/x-jsonl")
                        self.send_header("content-length", str(len(data)))
                        self.end_headers()
                        return self.wfile.write(data)
                    return self._json(200, batch_object(parts[3]))
                self._json(404, {"type": "error", "error": {"type": "not_found_error", "message": self.path}})

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
                event("message_delta", {"delta": {"stop_reason": message["stop_reason"], "stop_sequence": None}, "usage": {**message["usage"], "output_tokens": 40}})
                event("message_stop", {})

        self.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        self.url = f"http://127.0.0.1:{self.server.server_address[1]}"
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
