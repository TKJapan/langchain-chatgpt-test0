import "dotenv/config";
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set");
}

const GraphAnnotation = Annotation.Root({
  input: Annotation<string>(),
  response: Annotation<string>(),
});

type GraphState = typeof GraphAnnotation.State;

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
});

async function callModel(state: GraphState) {
  try {
    const result = await model.invoke([
      new HumanMessage(state.input),
    ]);

    const content =
      typeof result.content === "string"
        ? result.content
        : JSON.stringify(result.content);

    return { response: content };
  } catch (err) {
    console.error("エラー:", err);
    throw err;
  }
}

const workflow = new StateGraph(GraphAnnotation)
  .addNode("llm", callModel)
  .addEdge(START, "llm")
  .addEdge("llm", END);

const app = workflow.compile();

async function run() {
  const result = await app.invoke({
    input: "LangGraphを一言で説明して",
  });

  console.log(result.response);
}

run();