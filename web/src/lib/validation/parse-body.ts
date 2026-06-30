import { z } from "zod";

export type FieldErrors = Record<string, string[]>;

export function formatFieldErrors(error: z.ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};

  if (typeof error.flatten === "function") {
    const flattened = error.flatten();
    for (const [key, messages] of Object.entries(flattened.fieldErrors)) {
      if (Array.isArray(messages) && messages.length > 0) {
        fieldErrors[key] = messages;
      }
    }
    if (Object.keys(fieldErrors).length > 0) {
      return fieldErrors;
    }
  }

  for (const issue of error.issues) {
    const path = issue.path.length > 0 ? issue.path.join(".") : "body";
    if (!fieldErrors[path]) fieldErrors[path] = [];
    fieldErrors[path].push(issue.message);
  }

  return fieldErrors;
}

export function validationErrorResponse(error: z.ZodError): Response {
  return Response.json(
    {
      error: "Validation failed",
      fieldErrors: formatFieldErrors(error),
    },
    { status: 400 },
  );
}

export function invalidJsonResponse(): Response {
  return Response.json(
    {
      error: "Invalid JSON body",
      fieldErrors: {},
    },
    { status: 400 },
  );
}

type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; response: Response };

export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<ParseResult<T>> {
  let json: unknown;

  try {
    json = await request.json();
  } catch {
    return { success: false, response: invalidJsonResponse() };
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    return { success: false, response: validationErrorResponse(result.error) };
  }

  return { success: true, data: result.data };
}
