export const raiseError = (message?: string): never => {
  throw new Error(message ?? "Unhandled uknown error")
}

export type ApiErrorDetail = {
  message: string
  field?: string | null
  code?: string | null
}

export async function parseApiErrorDetail(error: unknown): Promise<ApiErrorDetail | null> {
  if (!(error instanceof Error) || !("response" in error)) return null
  const httpError = error as { response: Response }
  try {
    const errorData = (await httpError.response.clone().json()) as
      | {
          errors?: { message?: string; field?: string | null; code?: string | null }[]
          message?: string
        }
      | null
      | undefined

    if (errorData) {
      if (errorData.errors && errorData.errors.length > 0) {
        const firstError = errorData.errors[0]
        if (firstError?.message) {
          return {
            message: firstError.message,
            field: firstError.field,
            code: firstError.code,
          }
        }
      }
      if (errorData.message) {
        return { message: errorData.message }
      }
    }
  } catch {
    void 0
  }
  return null
}

export function errorWithApiDetail(detail: ApiErrorDetail): Error & {
  field?: string | null
  code?: string | null
} {
  const err = new Error(detail.message) as Error & { field?: string | null; code?: string | null }
  err.field = detail.field
  err.code = detail.code
  return err
}

export const extractErrorMessage = async (error: unknown): Promise<string> => {
  const fromBody = await parseApiErrorDetail(error)
  if (fromBody) return fromBody.message

  if (error instanceof Error && "response" in error) {
    const httpError = error as { response: Response }
    const status = httpError.response.status

    switch (status) {
      case 401:
        return "Invalid credentials."
      case 403:
        return "You don't have permission to perform this action."
      case 404:
        return "The requested resource was not found."
      case 422:
        return "The provided data is invalid. Please check your input."
      case 429:
        return "Too many requests. Please try again later."
      case 500:
      case 502:
      case 503:
      case 504:
        return "Server error. Please try again later."
      default:
        return httpError.response.statusText || "An unexpected error occurred"
    }
  }

  if (error instanceof Error) {
    const statusMatch = /status code (\d+)/.exec(error.message)
    if (statusMatch) {
      const status = Number.parseInt(statusMatch[1] ?? "0", 10)
      switch (status) {
        case 401:
          return "Invalid credentials."
        case 403:
          return "You don't have permission to perform this action."
        case 404:
          return "The requested resource was not found."
        case 422:
          return "The provided data is invalid. Please check your input."
        case 429:
          return "Too many requests. Please try again later."
        case 500:
        case 502:
        case 503:
        case 504:
          return "Server error. Please try again later."
      }
    }
    const msg = error.message.toLowerCase()
    if (msg === "failed to fetch" || msg.includes("network") || msg.includes("connection")) {
      return "Unable to connect. Please check your connection and try again."
    }
    return error.message
  }

  return "An unexpected error occurred"
}

export const labelToCode = (label: string): string =>
  label
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
