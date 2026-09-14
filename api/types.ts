export interface VercelRequest {
  query: Record<string, string | string[] | undefined>;
}

export interface VercelResponse {
  json(body: unknown): void;
  redirect(url: string): void;
  setHeader(name: string, value: string | string[]): void;
  status(statusCode: number): VercelResponse;
}
