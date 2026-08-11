const API_URL = import.meta.env.VITE_API_URL;

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, options);
  const data: unknown =
    response.status === 204 ? undefined : await response.json();

  if (!response.ok) {
    const errorMessage =
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof data.error === "string"
        ? data.error
        : `Request failed with status ${response.status}`;

    throw new Error(errorMessage);
  }

  return data as T;
}
