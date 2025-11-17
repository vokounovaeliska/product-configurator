import { getCookie } from "@/utils/cookies"

export const getAuthCookies = async () => {
  const sessionToken = (await getCookie("better-auth.session_token"))?.value ?? ""
  const dontRemember = (await getCookie("better-auth.dont_remember"))?.value ?? ""

  const cookieHeader = [
    `better-auth.session_token=${sessionToken}`,
    `better-auth.dont_remember=${dontRemember}`,
  ].join(";")

  return cookieHeader
}
