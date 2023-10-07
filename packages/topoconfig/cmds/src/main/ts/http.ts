// https://developer.mozilla.org/en-US/docs/Web/API/fetch
// https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch

export const http = async (url: any, opts?: any)=> {
  const res = await fetch(url, opts)
  const code = res.status
  const headers = Object.fromEntries(res.headers)
  const body = await res.text()

  return {
    res,
    headers,
    body,
    code
  }
}
