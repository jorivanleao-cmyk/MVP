import { Router, Request, Response } from 'express'
import { requireAdminAuth } from '../../middleware/adminAuth'
import {
  getConversations,
  getConversationById,
  takeOverConversation,
  releaseConversation,
  replyToConversation,
} from './human.service'

const router = Router()
router.use(requireAdminAuth)

router.get('/', async (_req: Request, res: Response) => {
  const conversations = await getConversations()
  res.json({ conversations })
})

router.get('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const conversation = await getConversationById(id)
  if (!conversation) {
    return res.status(404).json({ error: 'Conversa não encontrada.' })
  }

  res.json({ conversation })
})

router.patch('/:id/takeover', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const conversation = await takeOverConversation(id)
  res.json({ conversation })
})

router.patch('/:id/release', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const conversation = await releaseConversation(id)
  res.json({ conversation })
})

router.post('/:id/reply', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const { message } = req.body
  if (!message) {
    return res.status(400).json({ error: 'Mensagem obrigatória.' })
  }

  const reply = await replyToConversation(id, String(message))
  res.status(201).json({ reply })
})

export default router
