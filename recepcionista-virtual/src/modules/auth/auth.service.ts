import fs from 'fs/promises'
import path from 'path'
import { google } from 'googleapis'
import { env } from '../../config/env'

const TOKEN_PATH = path.join(process.cwd(), '.google-token.json')

function getOAuthClient() {
  return new google.auth.OAuth2(
    env.googleClientId,
    env.googleClientSecret,
    env.googleRedirectUri,
  )
}

export function getGoogleAuthUrl() {
  const oAuth2Client = getOAuthClient()
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
  })
}

async function saveToken(tokens: any) {
  await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2), 'utf8')
}

async function loadToken() {
  try {
    const content = await fs.readFile(TOKEN_PATH, 'utf8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

export async function handleGoogleCallback(code: string) {
  const oAuth2Client = getOAuthClient()
  const { tokens } = await oAuth2Client.getToken(code)
  oAuth2Client.setCredentials(tokens)
  await saveToken(tokens)
  return tokens
}

export async function getGoogleAuthStatus() {
  const token = await loadToken()
  return Boolean(token?.access_token)
}

export async function getAuthenticatedOAuthClient() {
  const token = await loadToken()
  if (!token) {
    throw new Error('Google Calendar não está conectado.')
  }

  const client = getOAuthClient()
  client.setCredentials(token)
  return client
}
