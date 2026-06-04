import { google } from 'googleapis'
import { env } from '../../config/env'
import {
  getAuthenticatedOAuthClient,
  getGoogleAuthStatus,
} from '../auth/auth.service'
import { prisma } from '../../database/prisma'

interface CreateGoogleEventOptions {
  summary: string
  description: string
  startDateTime: string
  endDateTime: string
}

export async function isGoogleCalendarConnected() {
  return getGoogleAuthStatus()
}

export async function createGoogleEvent(options: CreateGoogleEventOptions) {
  try {
    const auth = await getAuthenticatedOAuthClient()
    const calendar = google.calendar({ version: 'v3', auth })

    const event = await calendar.events.insert({
      calendarId: env.googleCalendarId,
      requestBody: {
        summary: options.summary,
        description: options.description,
        start: {
          dateTime: options.startDateTime,
          timeZone: env.googleTimezone,
        },
        end: {
          dateTime: options.endDateTime,
          timeZone: env.googleTimezone,
        },
      },
    })

    return event.data.id ?? null
  } catch (error) {
    console.error('Falha ao criar evento no Google Calendar:', error)
    return null
  }
}

export async function listUpcomingEvents() {
  const auth = await getAuthenticatedOAuthClient()
  const calendar = google.calendar({ version: 'v3', auth })
  const response = await calendar.events.list({
    calendarId: env.googleCalendarId,
    maxResults: 15,
    singleEvents: true,
    orderBy: 'startTime',
    timeMin: new Date().toISOString(),
  })
  return response.data.items ?? []
}

export async function listUpcomingEventsWithAppointmentStatus() {
  const events = await listUpcomingEvents()
  const appointments = await prisma.appointment.findMany({
    where: { googleEventId: { not: null } },
    select: { id: true, googleEventId: true },
  })

  const eventMap = new Map(
    appointments.map((item) => [item.googleEventId, item.id]),
  )

  return events.map((event) => ({
    ...event,
    linked: Boolean(event.id && eventMap.has(event.id)),
    linkedAppointmentId: event.id ? (eventMap.get(event.id) ?? null) : null,
    eventId: event.id,
  }))
}

export async function reconcileOrphanEvents() {
  const events = await listUpcomingEvents()
  const appointments = await prisma.appointment.findMany({
    where: { status: { in: ['pending', 'confirmed'] } },
    include: { client: true, service: true },
  })

  const existingEventIds = new Set(
    appointments
      .filter((appointment) => appointment.googleEventId)
      .map((appointment) => appointment.googleEventId),
  )
  const orphanEvents = events.filter(
    (event) => event.id && !existingEventIds.has(event.id),
  )
  const orphanAppointments = appointments.filter(
    (appointment) => !appointment.googleEventId,
  )

  function normalize(text?: string) {
    return (text || '').toLowerCase()
  }

  function eventMatchesAppointment(event: any, appointment: any) {
    const summary = normalize(event.summary)
    const description = normalize(event.description)
    const serviceName = normalize(appointment.service.name)
    const clientName = normalize(appointment.client?.name)
    const clientPhone = normalize(appointment.client?.phone)

    const startsAt = event.start?.dateTime || event.start?.date
    const endsAt = event.end?.dateTime || event.end?.date
    if (!startsAt || !endsAt) {
      return false
    }

    const eventStart = new Date(startsAt).getTime()
    const eventEnd = new Date(endsAt).getTime()
    const appointmentStart = new Date(
      `${appointment.date.toISOString().slice(0, 10)}T${appointment.startTime}:00`,
    ).getTime()
    const appointmentEnd = new Date(
      `${appointment.date.toISOString().slice(0, 10)}T${appointment.endTime}:00`,
    ).getTime()

    const timeMatch =
      Math.abs(eventStart - appointmentStart) <= 5 * 60 * 1000 &&
      Math.abs(eventEnd - appointmentEnd) <= 5 * 60 * 1000
    const textMatch =
      summary.includes(serviceName) ||
      description.includes(serviceName) ||
      (clientName && summary.includes(clientName)) ||
      (clientName && description.includes(clientName)) ||
      (clientPhone && summary.includes(clientPhone)) ||
      (clientPhone && description.includes(clientPhone))

    return timeMatch && textMatch
  }

  let linkedCount = 0
  const matchedAppointments: number[] = []

  for (const event of orphanEvents) {
    const matched = orphanAppointments.find(
      (appointment) =>
        !matchedAppointments.includes(appointment.id) &&
        eventMatchesAppointment(event, appointment),
    )
    if (!matched || !event.id) {
      continue
    }

    await prisma.appointment.update({
      where: { id: matched.id },
      data: { googleEventId: event.id },
    })

    linkedCount += 1
    matchedAppointments.push(matched.id)
  }

  return { linkedCount, orphanEventCount: orphanEvents.length }
}
