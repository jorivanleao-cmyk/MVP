import { Router, Request, Response } from 'express'
import { listAppointments, createAppointment } from './appointments.service'
import { requireAdminAuth } from '../../middleware/adminAuth'

const router = Router()

router.get('/', requireAdminAuth, async (_req: Request, res: Response) => {
  const appointments = await listAppointments()
  res.json({ appointments })
})

router.post('/', requireAdminAuth, async (req: Request, res: Response) => {
  const { clientId, serviceId, date, startTime, endTime, notes } = req.body
  if (!clientId || !serviceId || !date || !startTime || !endTime) {
    return res.status(400).json({ error: 'Dados obrigatórios ausentes.' })
  }

  try {
    const appointment = await createAppointment({
      clientId,
      serviceId,
      date,
      startTime,
      endTime,
      notes,
    })
    return res.status(201).json({ appointment })
  } catch (error: any) {
    return res.status(400).json({ error: error.message })
  }
})

export default router
