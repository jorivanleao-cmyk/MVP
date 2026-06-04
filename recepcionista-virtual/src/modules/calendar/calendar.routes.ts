import { Router, Request, Response } from 'express'
import { requireAdminAuth } from '../../middleware/adminAuth'
import {
  isGoogleCalendarConnected,
  listUpcomingEventsWithAppointmentStatus,
  createGoogleEvent,
  reconcileOrphanEvents,
} from './calendar.service'

const router = Router()
router.use(requireAdminAuth)

router.get('/status', async (_req: Request, res: Response) => {
  const connected = await isGoogleCalendarConnected()
  res.json({ connected })
})

router.get('/events', async (_req: Request, res: Response) => {
  try {
    const events = await listUpcomingEventsWithAppointmentStatus()
    res.json({ events })
  } catch (error: any) {
    res
      .status(500)
      .json({
        error: error.message || 'Falha ao listar eventos do Google Calendar.',
      })
  }
})

router.post('/reconcile', async (_req: Request, res: Response) => {
  try {
    const result = await reconcileOrphanEvents()
    res.json(result)
  } catch (error: any) {
    res
      .status(500)
      .json({ error: error.message || 'Falha ao reconciliar eventos órfãos.' })
  }
})

router.post('/events', async (req: Request, res: Response) => {
  try {
    const { summary, description, date, startTime, endTime } = req.body
    if (!summary || !date || !startTime || !endTime) {
      return res.status(400).json({ error: 'Dados de evento incompletos.' })
    }

    const eventId = await createGoogleEvent({
      summary,
      description,
      startDateTime: `${date}T${startTime}:00`,
      endDateTime: `${date}T${endTime}:00`,
    })

    if (!eventId) {
      return res
        .status(500)
        .json({ error: 'Falha ao criar evento no Google Calendar.' })
    }

    res.json({ eventId })
  } catch (error: any) {
    res
      .status(500)
      .json({
        error: error.message || 'Falha ao criar evento no Google Calendar.',
      })
  }
})

export default router
