export async function request<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  try {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken && url !== "/api/signin" && url !== "/api/signup") {
      window.location.href = "/signin";
      throw "Не авторизован";
    }
    const response = await fetch(`${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...options.headers,
      },
    });
    if (!response.ok) {
      let errorMessage: string = "Что-то пошло не так :(";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (jsonError) {
        errorMessage = response.statusText || errorMessage;
      }
      if (
        response.status === 401 &&
        url !== "/api/signin" &&
        url !== "/api/signup"
      ) {
        try {
          const newToken = await renewToken();

          return await request<T>(url, {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${newToken}`,
            },
          });
        } catch (err) {
          window.location.href = "/signin";
          throw err;
        }
      }
      throw `${errorMessage}`;
    }
    const contentType = response.headers.get("Content-Type");
    if (!contentType || !contentType.includes("application/json")) {
      return {} as T;
    }

    return (await response.json()) as T;
  } catch (err) {
    throw err;
  }
}

async function renewToken(): Promise<string> {
  try {
    const response = await fetch(`/api/renewal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
      },
    });

    if (!response.ok) {
      throw new Error("Не удалось обновить токен");
    }

    const data = await response.json();
    const newToken = data.accessToken;
    localStorage.setItem("access_token", newToken);
    return newToken;
  } catch (err) {
    throw err;
  }
}
