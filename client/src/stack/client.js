import { StackClientApp } from "@stackframe/react";
import { useNavigate } from "react-router-dom";

const projectId = process.env.REACT_APP_STACK_PROJECT_ID;
const publishableClientKey = process.env.REACT_APP_STACK_PUBLISHABLE_CLIENT_KEY;

export const stackClientApp = new StackClientApp({
  tokenStore: "cookie",
  projectId,
  publishableClientKey,
  redirectMethod: {
    useNavigate,
  },
});
