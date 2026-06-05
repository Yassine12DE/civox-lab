export async function connectSse(url, options = {}) {
  const {
    headers = {},
    onMessage,
    onOpen,
    onError,
    onClose,
    signal,
  } = options;

  const controller = new AbortController();
  let closed = false;

  if (signal) {
    signal.addEventListener(
      "abort",
      () => {
        closed = true;
        controller.abort();
      },
      { once: true }
    );
  }

  const run = async () => {
    try {
      const response = await fetch(url, {
        headers,
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`SSE stream failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error("SSE stream is not available in this browser");
      }

      onOpen?.();

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let eventName = "message";
      let dataLines = [];

      const dispatch = () => {
        if (!dataLines.length) {
          eventName = "message";
          return;
        }

        const rawData = dataLines.join("\n");
        let parsedData = rawData;

        try {
          parsedData = JSON.parse(rawData);
        } catch {
          // Keep the raw payload if the server sends plain text.
        }

        onMessage?.({
          event: eventName || "message",
          data: parsedData,
          rawData,
        });

        eventName = "message";
        dataLines = [];
      };

      const consumeLine = (line) => {
        if (line === "") {
          dispatch();
          return;
        }

        if (line.startsWith(":")) {
          return;
        }

        const separatorIndex = line.indexOf(":");
        const field = separatorIndex === -1 ? line : line.slice(0, separatorIndex);
        let value = separatorIndex === -1 ? "" : line.slice(separatorIndex + 1);
        if (value.startsWith(" ")) {
          value = value.slice(1);
        }

        switch (field) {
          case "event":
            eventName = value;
            break;
          case "data":
            dataLines.push(value);
            break;
          case "id":
          case "retry":
            break;
          default:
            break;
        }
      };

      while (!closed) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          consumeLine(line);
        }
      }

      if (buffer) {
        consumeLine(buffer);
      }
      dispatch();

      if (!closed) {
        onClose?.();
      }
    } catch (error) {
      if (!closed) {
        onError?.(error);
      }
    }
  };

  run();

  return {
    close() {
      closed = true;
      controller.abort();
      onClose?.();
    },
  };
}
