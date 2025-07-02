/**
 * クライアント側API呼び出し用のユーティリティ
 * レート制限対応とエラーハンドリングを統合
 */

import { rateLimitAwareFetch } from "@/lib/utils/rate-limit-handler";

/**
 * API呼び出し用の統一されたクライアント
 */
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
  }

  /**
   * GETリクエスト
   */
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = this.baseUrl + endpoint;
    const response = await rateLimitAwareFetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new ApiError(response.status, `GET ${endpoint} failed`);
    }

    return response.json();
  }

  /**
   * POSTリクエスト
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> {
    const url = this.baseUrl + endpoint;
    const response = await rateLimitAwareFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    if (!response.ok) {
      throw new ApiError(response.status, `POST ${endpoint} failed`);
    }

    return response.json();
  }

  /**
   * PUTリクエスト
   */
  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> {
    const url = this.baseUrl + endpoint;
    const response = await rateLimitAwareFetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    if (!response.ok) {
      throw new ApiError(response.status, `PUT ${endpoint} failed`);
    }

    return response.json();
  }

  /**
   * DELETEリクエスト
   */
  async delete<T = void>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = this.baseUrl + endpoint;
    const response = await rateLimitAwareFetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new ApiError(response.status, `DELETE ${endpoint} failed`);
    }

    // DELETEは空のレスポンスの場合がある
    const text = await response.text();
    return text ? JSON.parse(text) : (undefined as T);
  }
}

/**
 * API エラークラス
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public response?: Response
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isRateLimit(): boolean {
    return this.status === 429;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }

  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }
}

/**
 * デフォルトのAPIクライアント
 */
export const apiClient = new ApiClient();

/**
 * レート制限対応のシンプルなfetch関数
 * 既存のfetch呼び出しを簡単に置き換え可能
 */
export const fetchWithRetry = rateLimitAwareFetch;
