export class ChatGPTMiddleware {
  static async getResponseFromPrompt (prompt) {
    const response = await fetch(buildChatGPTRequest(prompt));
    const responseBody = await response.json();
    if (response.status !== 200) {
      return new Response("Something has gone horribly wrong.", { status: 500 });
    }
    return new Response(responseBody.output.content.text, { status: 200 });
  }
}

function buildChatGPTRequest (prompt, model = "gpt-4.1") {
  let request = new Request('https://api.openai.com/v1/responses',
    {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: {
        "model": model,
        "input": prompt
      },
      method: 'POST'
    });
  return request
}
