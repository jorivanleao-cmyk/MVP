import { Router, Request, Response } from 'express'
import { requireAdminAuth } from '../../middleware/adminAuth'
import { createClient, listClients } from './clients.service'

const router = Router()
router.use(requireAdminAuth)

router.get('/', async (_req: Request, res: Response) => {
  const clients = await listClients()
  res.json({ clients })
})

router.post('/', async (req: Request, res: Response) => {
  const { phone, name, email } = req.body
  if (!phone) {
    return res
      .status(400)
      .json({ error: 'O telefone do cliente é obrigatório.' })
  }

  const client = await createClient({ phone, name, email })
  res.status(201).json({ client })
})

export default router
