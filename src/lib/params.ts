import { ApiError } from "./errors";

export function getParam(params: Record<string, string | string[]>, name: string): string {
  const value = params[name];
  if (typeof value !== "string") {
    throw new ApiError(400, `Invalid ${name} parameter.`);
  }
  return value;
}
