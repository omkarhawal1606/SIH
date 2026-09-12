import { NextRequest, NextResponse } from "next/server";
import { routeChatMessage } from "@/services/agents/orchestrator";

export const maxDuration = 45;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await request.json();
    const { context, messages = [], question, language = "en", stream = true } = body;

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return NextResponse.json({ error: "A question is required." }, { status: 400 });
    }

    // Route dynamically to the single most relevant agent among the 4 agents
    const result = await routeChatMessage({
      question: question.trim(),
      context,
      messages,
      language,
    });

    const duration = Date.now() - startTime;
    console.log(
      `[Chat Router] Query handled by ${result.agentName} (${result.agentUsed}) in ${duration}ms`
    );

    const replyText = result.response.trim();

    if (stream) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(replyText));
          controller.close();
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
          "Cache-Control": "no-cache, no-transform",
          "X-Agent-Used": result.agentUsed,
          "X-Agent-Name": encodeURIComponent(result.agentName),
        },
      });
    }

    return NextResponse.json({
      success: true,
      reply: replyText,
      agentUsed: result.agentUsed,
      agentName: result.agentName,
      reason: result.reason,
      durationMs: duration,
    });
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    const isTcpAbort =
      errMsg.includes("wsarecv") ||
      errMsg.includes("stream reading error") ||
      errMsg.includes("connection was aborted");
    if (isTcpAbort) {
      console.warn("[Chat Router] TCP connection dropped by client (normal on Windows).");
    } else {
      console.error("Chat Router API Error:", errMsg);
    }
    return NextResponse.json(
      {
        error: "Your travel AI assistant could not answer right now. Please try again.",
        details: errMsg,
      },
      { status: 500 }
    );
  }
}