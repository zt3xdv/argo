import { Client, MessageFlags, MessageContextMenuCommandInteraction } from "discord.js";
import { TextDisplay } from "../../utils/component.ts";
import { getEmoji } from "../../utils/emojis.ts";

export default {
  category: "utility",
  data: {
    options: [{ type: 3, name: "prompt", description: "Prompt", required: true }],
    name: "ai",
    description: "Ask a question to the AI",
    type: 1,
    messageContext: {
      name: "Ask AI",
    }
  },
  async execute(interaction: any, client: Client) {
    await interaction.deferReply();
    const isContextInteraction = interaction instanceof MessageContextMenuCommandInteraction;
    const prompt = isContextInteraction ? interaction.options.getMessage("message").content.trim() : interaction.options?.getString("prompt").trim();
    const history: any[] = [
      { role: "system", content: `You are Nexa, a efficient Discord bot. Always maintain your persona as an AI assistant integrated into a chat server.

# TOOL USAGE DEFINITION
- You are fully authorized to make multiple, consecutive tool requests whenever necessary, Just when necessary.
- If you lack information, require data verification, or need to complete a complex task, execute the appropriate tools immediately, For example if user asks "What day is celebrated today?" use date tool and web search to investigate.
- Do NOT use tools if you have the info already, just when user asks for them. Do NOT use tools when the user says Hello for example.
- If you dont find the information after 5 rounds, maybe there isnt a info for that, just reply briefly.

# RESPONSE STYLE AND LENGHT
- Default to short, punchy, and concise replies suitable for a fast-paced Discord chat environment.
- Only provide long, detailed, or comprehensive explanations if the user explicitly asks for them, or if the complexity of the topic absolutely requires it.
- Use clean Markdown formatting (bolding, lists, code blocks) to ensure high scannability in chat channels.

# LANGUAGE AND GENDER NEUTRALITY
- You must use gender-neutral pronouns and inclusive language at all times (e.g., in English use "they/them", in Spanish use neutral formulations or inclusive endings where appropriate).
- Avoid assuming the gender of any user or third party mentioned in the chat context.` },
      { role: "user", content: prompt }
    ];

    const tools = [
      {
        type: "function",
        function: {
          name: "webSearch",
          description: "Search the web for current information, news, or general knowledge.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The search query to look up on the web."
              }
            },
            required: ["query"]
          },
          execute: async (args: { query: string }) => {
            try {
              const response = await fetch("https://api.tavily.com/search", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.TAVILY_TOKEN}` },
                body: JSON.stringify({
                  query: args.query,
                  include_answer: "basic",
                  max_results: 3
                })
              });
    
              const data = await response.json();
              
              return JSON.stringify(data) || "Info not found.";
            } catch (error: any) {
              return `Search failed: ${error.message}`;
            }
          },
          formatArgs: (args: { query: string }) => {
            return args.query;
          }
        }
      },
      {
        type: "function",
        function: {
          name: "date",
          description: "Get the actual time and date",
          parameters: {
            type: "object",
            properties: {},
            required: []
          },
          execute: async () => {
            return (new Date().toLocaleString());
          },
          formatArgs: () => {
            return "";
          }
        }
      }
    ];

    const cleanToolsPayload = tools.map(({ type, function: { name, description, parameters } }) => ({ 
      type, 
      function: { name, description, parameters } 
    }));

    try {
      let runOrchestrator = true;
      let finalContent = "";
      let toolCalls = [];
      let model = "openai/gpt-oss-120b";

      while (runOrchestrator) {
        await interaction.editReply({ 
          components: [new TextDisplay({ content: `${getEmoji("forum")} Executing...` })], 
          flags: MessageFlags.IsComponentsV2 
        });

        const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NVIDIA_TOKEN}`,
          },
          body: JSON.stringify({
            model,
            messages: history,
            tools: cleanToolsPayload,
            temperature: 0.7,
          }),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const message = data.choices[0].message;
        
        history.push(message);

        if (message.tool_calls?.length > 0) {
          toolCalls = [...toolCalls, message.tool_calls];
          for (const toolCall of message.tool_calls) {
            const targetTool = tools.find(t => t.function.name === toolCall.function.name);
            if (!targetTool) continue;

            const parsedArgs = JSON.parse(toolCall.function.arguments);
            await interaction.editReply({ 
              components: [new TextDisplay({ content: `${message.reasoning ? "-# " + message.reasoning + "\n" : ""}${getEmoji("oauth2")} Executing...\n    ${getEmoji("text1")} \`${toolCall.function.name}\` **${targetTool.function.formatArgs(parsedArgs)}**` })], 
              flags: MessageFlags.IsComponentsV2 
            });

            const result = await targetTool.function.execute(parsedArgs);

            history.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: toolCall.function.name,
              args: parsedArgs,
              content: result,
            });
          }
        } else {
          finalContent = message.content;
          runOrchestrator = false;
        }
      }

      await interaction.editReply({ 
        components: [new TextDisplay({ content: `${finalContent}\n-# ${toolCalls.length} tool calls • ${model}` })], 
        flags: MessageFlags.IsComponentsV2 
      });

    } catch (error) {
      console.error(error);
      await interaction.editReply({ 
        components: [new TextDisplay({ content: `${getEmoji("wrong")} An **error** occurred while processing your request.` })], 
        flags: MessageFlags.IsComponentsV2 
      });
    }
  },
};
