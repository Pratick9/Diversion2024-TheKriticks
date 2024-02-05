import { Ai } from "@cloudflare/ai";
import { Hono } from "hono";

import template from "./template.html";
import streamingTemplate from "./template-streaming.html";

const app = new Hono();

let loading = false;

//app.get("/", (c) => c.html(streamingTemplate));
app.get("/", (c) => c.html(template));

app.get("/stream", async (c) => {
  const ai = new Ai(c.env.AI);

  const query = c.req.query("query");
  const question = query || "What is the square root of 9?";
  const res = await fetch(query);
  const blob = await res.arrayBuffer();
  const input = {
    audio: [...new Uint8Array(blob)],
    };
  const systemPrompt = `You are a helpful assistant.`;
  const response = await ai.run("@cf/openai/whisper", input);

    return Response.json({ input: { audio: [] }, response });
});

app.post("/", async (c) => {
  const ai = new Ai(c.env.AI);

  const body = await c.req.json();
  const question = body.query || "What is the square root of 9?";
  const res = await fetch(body.query);
  
  const systemPrompt = `You are a helpful assistant.`;
  const blob = await res.arrayBuffer();
  const input = {
    image: [...new Uint8Array(blob)],
    };
 const response = await ai.run("@cf/microsoft/resnet-50", input);

    return Response.json(response);

});

app.post("/translate", async (c) => {
  loading = true;
  const ai = new Ai(c.env.AI);

  const body = await c.req.json();
  const text = body.text || "I'll have an order of the moule frites";
  const sourceLang = body.sourceLang || "english";
  const targetLang = body.targetLang || "hindi";

  const response = await ai.run("@cf/meta/m2m100-1.2b", {
    text,
    source_lang: sourceLang,
    target_lang: targetLang,
  });
  loading = false;
  return c.json(response);
});
app.post("/chat", async (c) => {
  loading = true;
  const ai = new Ai(c.env.AI);

  const body = await c.req.json();
  const question = body.query;

  const systemPrompt = `You are a helpful assistant.`;

  const { response: answer } = await ai.run(
    "@cf/meta/llama-2-7b-chat-int8",
    {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
    },
  );
  const ChatAnswer = answer;
  loading = false;
  return c.text(answer);
});
app.onError((err, c) => {
  return c.text(err);
});

export default app;