// Helper for safely fetching JSON from API endpoints without crashing on non-JSON HTML responses (like Vercel 404 pages)

export async function safeFetchJson<T = any>(response: Response): Promise<{ success: boolean; data?: T; error?: string; [key: string]: any }> {
  try {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      // If response text is HTML or non-JSON
      if (text.trim().startsWith('<') || text.includes('<!DOCTYPE') || text.includes('The page could not be found')) {
        return {
          success: false,
          error: `Backend API unavailable or returned static page (${response.status} ${response.statusText}).`
        };
      }
      try {
        const parsed = JSON.parse(text);
        return { success: response.ok, ...parsed };
      } catch {
        return {
          success: false,
          error: `Non-JSON response received from server (${response.status}).`
        };
      }
    }

    const data = await response.json();
    if (typeof data === 'object' && data !== null) {
      return { success: response.ok && data.success !== false, ...data };
    }
    return { success: response.ok, data };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to parse server response.'
    };
  }
}
